# 🚀 Critical Fixes Implementation Guide

## Overview

This guide walks through implementing the 5 critical fixes for 026news production readiness. All code has been created and is ready to integrate.

---

## What Was Created

### 1. **Rate Limiting System** ✅
- **File**: `lib/rate-limit.ts`
- **Features**:
  - Vercel KV-based rate limiting (Redis fallback for local dev)
  - Preset limits for different endpoints
  - HTTP headers for rate limit info

### 2. **Input Validation Schemas** ✅
- **File**: `lib/validation.ts`
- **Features**:
  - Zod schemas for all API endpoints
  - Type-safe validation
  - Detailed error formatting
  - Coverage: articles, auth, comments, payments, categories, admin actions

### 3. **Job Queue System** ✅
- **File**: `lib/queue.ts`
- **Features**:
  - Exponential backoff retry logic
  - Support for RSS feeds, notifications, payouts, emails, SMS
  - Admin alert system
  - Cron endpoint: `/api/cron/process-queue`

### 4. **M-Pesa Integration** ✅
- **Files**: 
  - `lib/mpesa-stk.ts` (Daraja API)
  - `app/api/mpesa/stk-push/route.ts` (STK push endpoint)
  - `app/api/mpesa/callback/route.ts` (Callback handler)
- **Features**:
  - Complete STK push implementation
  - Callback handling
  - Payment status tracking
  - Error recovery

### 5. **Database Migrations** ✅
- **File**: `supabase/migrations/002_critical_fixes.sql`
- **Features**:
  - `job_queue` table with indexes
  - `mpesa_transactions` table
  - `article_versions` table (content versioning)
  - `transaction_logs` table (audit trail)
  - `process_payout()` stored procedure (atomic transactions)
  - Auto-versioning trigger

### 6. **Updated API Routes** ✅
- **File**: `app/api/articles/route.ts` (updated)
- **Features**:
  - Vercel KV rate limiting
  - Zod schema validation
  - Improved error handling
  - Rate limit headers

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd c:\Users\samtech\Downloads\026news-nextjs

# Install required packages
npm install zod @vercel/kv

# Optionally (for future features)
npm install @sentry/nextjs axios twilio
```

**Status**: Ready to run ✅

---

### Step 2: Set Up Environment Variables

1. **Get Vercel KV credentials**:
   - Go to [vercel.com](https://vercel.com)
   - Project → Storage → Create Database (KV)
   - Copy connection strings to `.env.local` and Vercel dashboard

2. **Get M-Pesa credentials** (Sandbox first):
   - Visit [Safaricom Daraja](https://developer.safaricom.co.ke/)
   - Create app and copy credentials:
     - `MPESA_CONSUMER_KEY`
     - `MPESA_CONSUMER_SECRET`
     - `MPESA_SHORTCODE`
     - `MPESA_PASSKEY`

3. **Configure other services**:
   ```env
   CRON_SECRET=generate-random-secret-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
   ```

4. **In Vercel Dashboard** → Settings → Environment Variables:
   - Add all secrets (KV_*, MPESA_*, STRIPE_*, etc.)
   - Add `CRON_SECRET` for job queue

---

### Step 3: Run Database Migrations

1. **Go to Supabase SQL Editor**:
   - https://app.supabase.com → Project → SQL Editor

2. **Create new query and paste**:
   - Copy content from `supabase/migrations/002_critical_fixes.sql`
   - Click "Run"

3. **Verify tables created**:
   - Check Tables: `job_queue`, `mpesa_transactions`, `article_versions`, `transaction_logs`
   - Check Stored Procedures: `process_payout`

---

### Step 4: Build and Test Locally

```bash
# Build the project
npm run build

# Should complete with 0 errors
```

**Expected Output**:
```
✓ Build successful
  Total size: X.XXmb (gzip: X.XXmb)
```

**If build fails**:
- Check for TypeScript errors: `npx tsc --noEmit`
- Missing imports: Run `npm ls` to verify packages

---

### Step 5: Test Rate Limiting Locally

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test GET endpoint** (should fallback to in-process):
   ```bash
   # Terminal 1: Start server
   npm run dev

   # Terminal 2: Make requests
   for i in {1..65}; do curl http://localhost:3000/api/articles; done
   
   # Request 61-65 should return 429 (rate limited)
   ```

3. **Expected responses**:
   - Requests 1-60: `200 OK`
   - Request 61+: `429 Too Many Requests`
   - Headers: `Retry-After: 60`, `X-RateLimit-*`

---

### Step 6: Test M-Pesa Integration (Sandbox)

1. **Get sandbox phone number**:
   - Visit [Daraja Sandbox](https://sandbox.safaricom.co.ke/)
   - Use test credentials

2. **Test STK push**:
   ```bash
   curl -X POST http://localhost:3000/api/mpesa/stk-push \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "254712345678",
       "amount": 100,
       "orderId": "550e8400-e29b-41d4-a716-446655440000",
       "description": "Test payment"
     }'
   ```

3. **Expected response**:
   ```json
   {
     "success": true,
     "checkoutRequestID": "ws_CO_...",
     "message": "Success. Request accepted for processing",
     "data": {
       "CheckoutRequestID": "...",
       "ResponseCode": "0",
       "ResponseDescription": "Success. Request accepted for processing"
     }
   }
   ```

4. **Check database**:
   - Supabase → mpesa_transactions
   - Should have one record with status: `pending`

---

### Step 7: Test Job Queue Locally

1. **Verify table exists**:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM job_queue LIMIT 1;
   ```

2. **Enqueue test job** (in Node):
   ```typescript
   import { enqueueJob } from '@/lib/queue'

   await enqueueJob('email', {
     userId: 1,
     subject: 'Test',
     message: 'Hello'
   })
   ```

3. **Trigger processing**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/process-queue \
     -H "Authorization: Bearer your-cron-secret"
   ```

4. **Expected response**:
   ```json
   {
     "success": true,
     "message": "Queue processing completed",
     "processed": 1,
     "failed": 0,
     "total": 1
   }
   ```

---

### Step 8: Deploy to Vercel

1. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add critical production fixes (rate limiting, payments, validation, job queue)"
   git push origin main
   ```

2. **Vercel auto-deploys** (if connected)
   - Check: vercel.com → Project → Deployments
   - Should complete in 2-3 minutes

3. **Verify deployment**:
   ```bash
   # Test production endpoint
   curl https://your-vercel-domain.vercel.app/api/articles
   
   # Check rate limit headers
   curl -v https://your-vercel-domain.vercel.app/api/articles
   ```

---

### Step 9: Configure Vercel Cron

1. **Create `vercel.json`** (if not exists):
   ```json
   {
     "crons": [{
       "path": "/api/cron/process-queue",
       "schedule": "*/5 * * * *"
     }]
   }
   ```

2. **Set CRON_SECRET**:
   - Vercel Dashboard → Settings → Environment Variables
   - Add `CRON_SECRET` with random value

3. **Deploy**:
   ```bash
   git add vercel.json
   git commit -m "config: add cron job for queue processing"
   git push
   ```

4. **Verify cron is active**:
   - Vercel Dashboard → Crons tab
   - Should show job scheduled

---

## Testing Checklist

### Unit Tests
- [ ] Rate limiter blocks after limit exceeded
- [ ] Rate limiter returns correct headers
- [ ] Zod schemas validate correct data
- [ ] Zod schemas reject invalid data
- [ ] Job queue calculates backoff correctly
- [ ] M-Pesa STK push formats request correctly

### Integration Tests
- [ ] Create article with valid data
- [ ] Create article fails with invalid data
- [ ] M-Pesa callback updates transaction status
- [ ] Job queue processes and completes jobs
- [ ] Job queue retries on failure

### Production Tests
- [ ] Rate limiting works across requests
- [ ] M-Pesa sandbox payments complete
- [ ] Cron job executes every 5 minutes
- [ ] Error monitoring (if Sentry configured)

---

## Troubleshooting

### Rate Limiting Not Working
```
❌ Error: UPSTASH_REDIS_REST_URL is not set
```
**Fix**: Set up Vercel KV and add environment variables

### M-Pesa Returns 401
```
❌ Error: Invalid consumer key or secret
```
**Fix**: Verify credentials from Daraja API portal

### Job Queue Not Processing
```
❌ Error: Table job_queue doesn't exist
```
**Fix**: Run SQL migration in Supabase

### Build Fails with Type Errors
```
❌ Error: Cannot find module 'zod'
```
**Fix**: Run `npm install zod @vercel/kv`

---

## Configuration Files

### Environment Variables (.env.local)
```
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# NEW: Rate Limiting
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# NEW: M-Pesa
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NEW: Cron
CRON_SECRET=...
```

### Vercel Configuration (vercel.json)
```json
{
  "crons": [{
    "path": "/api/cron/process-queue",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## What's Next?

After successful deployment of critical fixes:

1. **Week 2**: Add error monitoring (Sentry)
2. **Week 2**: Implement GDPR data export
3. **Week 2**: Add comment moderation workflow
4. **Week 3**: Content versioning UI
5. **Week 3**: Performance optimization

See `PRODUCTION_READINESS_RECOMMENDATIONS.md` for full roadmap.

---

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs: Dashboard → Logs
3. Enable verbose logging: Add `DEBUG=*` before command
4. Review error in Sentry (if configured)

---

## Success Criteria ✅

When complete:
- ✅ Build passes with 0 errors
- ✅ Rate limiting returns 429 after limit
- ✅ M-Pesa STK push returns CheckoutRequestID
- ✅ Job queue table populated and processing
- ✅ Vercel cron executing every 5 minutes
- ✅ All environment variables set
- ✅ Production deployment successful

---

**Status**: Ready to deploy 🚀
**Timeline**: 1-2 hours for full setup + testing
**Last Updated**: 2026-07-19
