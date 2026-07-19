import axios from 'axios'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * M-Pesa Daraja API Integration
 * Handles STK push, payment status queries, and callbacks
 */

const SANDBOX_URL = 'https://sandbox.safaricom.co.ke'
const PRODUCTION_URL = 'https://api.safaricom.co.ke'

interface STKPushRequest {
  phoneNumber: string
  amount: number
  orderId: string
  description: string
}

interface AccessTokenResponse {
  access_token: string
  expires_in: number
}

interface STKPushResponse {
  ResponseCode: string
  ResponseDescription: string
  CheckoutRequestID: string
  CustomerMessage: string
}

interface STKCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value: string | number
        }>
      }
    }
  }
}

/**
 * Get access token from M-Pesa
 */
async function getAccessToken(): Promise<string> {
  try {
    const key = process.env.MPESA_CONSUMER_KEY
    const secret = process.env.MPESA_CONSUMER_SECRET

    if (!key || !secret) {
      throw new Error('M-Pesa credentials not configured')
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64')
    const env = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : SANDBOX_URL

    const response = await axios.get<AccessTokenResponse>(
      `${env}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 10000,
      }
    )

    return response.data.access_token
  } catch (error) {
    console.error('Failed to get M-Pesa access token:', error)
    throw new Error('M-Pesa authentication failed')
  }
}

/**
 * Initiate STK push (prompt user to enter M-Pesa PIN on phone)
 */
export async function initiateSTKPush({
  phoneNumber,
  amount,
  orderId,
  description,
}: STKPushRequest): Promise<STKPushResponse> {
  try {
    const token = await getAccessToken()
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)

    const shortcode = process.env.MPESA_SHORTCODE
    const passkey = process.env.MPESA_PASSKEY

    if (!shortcode || !passkey) {
      throw new Error('M-Pesa configuration incomplete')
    }

    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64')
    const env = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : SANDBOX_URL

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber, // Customer phone
      PartyB: shortcode, // Business short code
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
      AccountReference: orderId, // Order ID
      TransactionDesc: description,
    }

    const response = await axios.post<STKPushResponse>(
      `${env}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    )

    // Save transaction record
    const supabase = await createAdminClient()
    await supabase.from('mpesa_transactions').insert({
      phone_number: phoneNumber,
      amount: amount,
      status: 'pending',
      checkout_request_id: response.data.CheckoutRequestID,
      merchant_request_id: response.data.CheckoutRequestID.slice(0, 20),
      order_id: orderId,
      description: description,
      initiated_at: new Date().toISOString(),
    } as any)

    return response.data
  } catch (error) {
    console.error('STK Push failed:', error)
    throw error
  }
}

/**
 * Query payment status
 */
export async function queryPaymentStatus(checkoutRequestId: string): Promise<any> {
  try {
    const token = await getAccessToken()
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14)

    const shortcode = process.env.MPESA_SHORTCODE
    const passkey = process.env.MPESA_PASSKEY

    if (!shortcode || !passkey) {
      throw new Error('M-Pesa configuration incomplete')
    }

    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64')
    const env = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : SANDBOX_URL

    const response = await axios.post(
      `${env}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      }
    )

    return response.data
  } catch (error) {
    console.error('Query payment status failed:', error)
    throw error
  }
}

/**
 * Handle M-Pesa callback
 */
export async function handleMpesaCallback(callbackData: STKCallbackData) {
  try {
    const supabase = await createAdminClient()
    const callback = callbackData.Body.stkCallback

    const resultCode = callback.ResultCode
    const checkoutRequestId = callback.CheckoutRequestID

    // Get receipt number and amount from callback
    const items = callback.CallbackMetadata?.Item || []
    const mpesaReceiptNumber = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value
    const amount = items.find(i => i.Name === 'Amount')?.Value
    const phoneNumber = items.find(i => i.Name === 'PhoneNumber')?.Value

    // Update transaction status
    const status = resultCode === 0 ? 'completed' : 'failed'
    const errorMsg = resultCode !== 0 ? callback.ResultDesc : null

    const updateData: any = {
      status,
      merchant_request_id: callback.MerchantRequestID,
      mpesa_receipt_number: mpesaReceiptNumber?.toString(),
      completed_at: new Date().toISOString(),
    }

    if (errorMsg) {
      updateData.error = errorMsg
    }

    await supabase
      .from('mpesa_transactions')
      .update(updateData as never)
      .eq('checkout_request_id', checkoutRequestId)

    // If payment successful, activate subscription
    if (resultCode === 0) {
      // Get transaction to find order_id
      const { data: transaction } = await supabase
        .from('mpesa_transactions')
        .select('order_id, amount, phone_number')
        .eq('checkout_request_id', checkoutRequestId)
        .single()

      if (transaction) {
        const txn = transaction as any
        // Find corresponding subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('reference_id', txn.order_id)
          .single()

        if (subscription) {
          const subData = subscription as any
          // Update subscription
          const endDate = new Date()
          if (subData.plan === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1)
          } else {
            endDate.setFullYear(endDate.getFullYear() + 1)
          }

          const updatePayload: any = {
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: endDate.toISOString(),
          }

          await supabase
            .from('subscriptions')
            .update(updatePayload as never)
            .eq('id', subData.id)

          // Send confirmation email
          const { data: user } = await supabase
            .from('users')
            .select('email, name')
            .eq('user_id', subData.user_id)
            .single()

          if (user) {
            const userData = user as any
            console.log(`Payment confirmed for ${userData.email}: KES ${txn.amount}`)
          }
        }
      }
    }

    return { success: true, status }
  } catch (error) {
    console.error('Error handling M-Pesa callback:', error)
    throw error
  }
}

/**
 * Database migration SQL
 */
export const MPESA_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_request_id TEXT NOT NULL UNIQUE,
  merchant_request_id TEXT,
  mpesa_receipt_number TEXT UNIQUE,
  order_id UUID NOT NULL,
  description TEXT,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_mpesa_phone ON public.mpesa_transactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_mpesa_status ON public.mpesa_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mpesa_checkout ON public.mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_order ON public.mpesa_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_created ON public.mpesa_transactions(created_at);

ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage mpesa transactions" ON public.mpesa_transactions
  USING (true) WITH CHECK (true);
`
