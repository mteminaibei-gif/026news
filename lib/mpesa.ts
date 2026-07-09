import { Buffer } from 'buffer';

const MPESA_BASE_URL = process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

function getTimestamp(): string {
  const date = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY ?? '';
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET ?? '';
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const resp = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`MPesa token request failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  return data.access_token;
}

interface STKPushParams {
  phone: string; // in E.164 without +, e.g., 2547xxxxxxx
  amount: number; // KES
  reference: string; // your internal reference, e.g., subscription ID
}

export async function initiateSTKPush({ phone, amount, reference }: STKPushParams) {
  const accessToken = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE ?? '';
  const passkey = process.env.MPESA_PASSKEY ?? '';
  const timestamp = getTimestamp();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const callbackUrl = process.env.MPESA_CALLBACK_URL ?? '';

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: reference,
    TransactionDesc: `Subscription payment ${reference}`,
  };

  const resp = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`MPesa STK push failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  return data; // contains CheckoutRequestID etc.
}
