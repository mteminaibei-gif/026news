# 🎯 Production Readiness Checklist

## CRITICAL (Do First) - 20-25 hours

### ✅ Rate Limiting
- [ ] Sign up for Upstash Redis or enable Vercel KV
- [ ] Create Redis client in `lib/redis.ts`
- [ ] Update `/api/articles`, `/api/comments`, `/api/messages` with Redis rate limiting
- [ ] Add rate limit headers to responses
- [ ] Test with multiple concurrent requests
- [ ] Add environment variables to Vercel

**Status**: 🔴 Not Started | ⏱️ **2-3 hours**

---

### ✅ Payment Integration
- [ ] **M-Pesa**:
  - [ ] Get Daraja API credentials from Safaricom
  - [ ] Implement `/api/mpesa/stk-push` endpoint
  - [ ] Create `mpesa_transactions` database table
  - [ ] Implement `/api/mpesa/callback` webhook
  - [ ] Add retry logic for failed payments
  - [ ] Test with M-Pesa simulator
  
- [ ] **Stripe**:
  - [ ] Create Premium/Pro price objects in Stripe Dashboard
  - [ ] Complete `/api/stripe/create-checkout`
  - [ ] Add webhook handler for subscription updates
  - [ ] Verify subscription status flow
  - [ ] Test with Stripe test cards

- [ ] **Verification**:
  - [ ] Process real test payments
  - [ ] Verify webhook callbacks
  - [ ] Test error scenarios

**Status**: 🔴 Partially Implemented | ⏱️ **5-7 hours**

---

### ✅ Input Validation
- [ ] Install Zod: `npm install zod`
- [ ] Create validation schemas in `lib/validation.ts`:
  - [ ] `createArticleSchema`
  - [ ] `loginSchema`
  - [ ] `commentSchema`
  - [ ] `mpesaPaymentSchema`
  - [ ] `emailSchema`
  - [ ] `phoneSchema`
- [ ] Add schema validation to API routes:
  - [ ] `/api/articles` POST
  - [ ] `/api/auth/login`
  - [ ] `/api/auth/signup`
  - [ ] `/api/comments` POST
  - [ ] `/api/mpesa/stk-push`
  - [ ] `/api/admin/*` routes
- [ ] Return proper 400 errors with validation details
- [ ] Test validation error messages

**Status**: 🔴 Not Started | ⏱️ **4-6 hours**

---

### ✅ Error Recovery & Retry Logic
- [ ] Create `job_queue` table in Supabase
- [ ] Implement `lib/queue.ts` with retry logic
- [ ] Add exponential backoff calculation
- [ ] Update RSS feed fetcher to use queue
- [ ] Add notification system for failed jobs
- [ ] Create `/api/cron/process-queue` endpoint
- [ ] Configure Vercel cron job
- [ ] Test retry scenarios (simulate failures)

**Status**: 🔴 Not Started | ⏱️ **3-4 hours**

---

### ✅ Database Transactions
- [ ] Create `process_payout()` stored procedure
- [ ] Update payout logic to use transaction
- [ ] Add transaction logging table
- [ ] Test concurrent payout scenarios
- [ ] Verify rollback on failure

**Status**: 🔴 Not Started | ⏱️ **2-3 hours**

---

## IMPORTANT (Do Second) - 12-16 hours

### ✅ Error Monitoring (Sentry)
- [ ] Sign up for Sentry.io
- [ ] Create new Sentry project
- [ ] Install: `npm install @sentry/nextjs`
- [ ] Configure `sentry.*.config.ts` files
- [ ] Update `next.config.ts` with Sentry config
- [ ] Wrap error handling in API routes
- [ ] Set up alerts for critical errors
- [ ] Test error capture
- [ ] Add performance monitoring

**Status**: 🟡 Partial Setup | ⏱️ **1-2 hours**

---

### ✅ GDPR Data Export
- [ ] Create `/api/user/export` endpoint
- [ ] Fetch all user data (articles, comments, earnings, etc.)
- [ ] Format as JSON with metadata
- [ ] Add download capability
- [ ] Add to user settings page
- [ ] Test with real user data

**Status**: 🔴 Not Started | ⏱️ **1-2 hours**

---

### ✅ Comment Moderation Workflow
- [ ] Add bulk moderation endpoint `/api/admin/comments` PATCH
- [ ] Implement actions: hide, flag, delete, approve
- [ ] Add moderation queue to admin dashboard
- [ ] Create email notifications for flagged comments
- [ ] Add bulk actions UI
- [ ] Test moderation flow

**Status**: 🔴 Not Started | ⏱️ **1-2 hours**

---

### ✅ Content Versioning
- [ ] Create `article_versions` table
- [ ] Add version number tracking
- [ ] Create `/api/articles/[id]/versions` endpoint
- [ ] Add revert functionality
- [ ] Update article editor to save versions
- [ ] Add version history UI (optional)

**Status**: 🔴 Not Started | ⏱️ **2-3 hours**

---

### ✅ Performance Tuning
- [ ] Enable query result caching on Supabase
- [ ] Add database connection pooling
- [ ] Optimize image sizes (WebP/AVIF)
- [ ] Enable static export for static pages
- [ ] Add ISR (Incremental Static Regeneration) to article pages
- [ ] Compress JSON responses
- [ ] Run Lighthouse audit
- [ ] Target: >90 on all metrics

**Status**: 🟡 Partial | ⏱️ **3-4 hours**

---

## NICE-TO-HAVE (Do If Time) - 10-15 hours

### 📱 SMS Notifications
- [ ] Install Twilio: `npm install twilio`
- [ ] Get Twilio phone number
- [ ] Create `lib/sms.ts` helper
- [ ] Implement `/api/sms/send` endpoint
- [ ] Add SMS option to notification preferences
- [ ] Test SMS delivery
- [ ] Add fallback to web push

**Status**: 🔴 Not Started | ⏱️ **2-3 hours**

---

### 🤖 Recommendation Engine
- [ ] Analyze user reading history
- [ ] Implement collaborative filtering
- [ ] Create `/api/recommendations` endpoint
- [ ] Add recommendations to homepage
- [ ] Cache recommendations (1 hour)
- [ ] A/B test recommendation quality
- [ ] Monitor CTR

**Status**: 🔴 Not Started | ⏱️ **3-4 hours**

---

### 🔗 Blockchain Integration
- [ ] Research Ethereum/Polygon integration
- [ ] Choose identity layer (Ceramic/IPFS)
- [ ] Implement article hash on-chain
- [ ] Add token rewards system
- [ ] Create blockchain explorer UI

**Status**: 🔴 Not Started | ⏱️ **1-2 weeks**

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] Validation schemas: zod tests
- [ ] Rate limiting: verify limits enforced
- [ ] Payment logic: test STK push, Stripe
- [ ] Error recovery: verify retries work

### Integration Tests
- [ ] End-to-end article creation → publishing
- [ ] User signup → article creation
- [ ] Payment flow (test mode)
- [ ] Comment moderation
- [ ] Job queue processing

### Load Testing
- [ ] Simulate 1000 concurrent users
- [ ] Test rate limiter at limits
- [ ] Verify Redis handles load
- [ ] Check database connection limits
- [ ] Monitor memory/CPU usage

### Security Testing
- [ ] Validate all inputs (Zod)
- [ ] Test SQL injection prevention
- [ ] Verify RLS policies enforced
- [ ] Check CORS headers
- [ ] Test authentication bypass attempts

---

## 📊 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All critical fixes completed
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Load testing passed
- [ ] Environment variables set in Vercel
- [ ] Database backups configured
- [ ] Monitoring (Sentry) active
- [ ] Staging environment tested

### Deployment Steps
```bash
# 1. Build locally
npm run build

# 2. Run tests
npm run test

# 3. Deploy to staging
vercel --scope=026news --prod --target=staging

# 4. Smoke tests on staging
# - Create article
# - Process payment
# - Check error monitoring
# - Verify rate limiting

# 5. Deploy to production
vercel --scope=026news --prod

# 6. Monitor for 1 hour
# - Check error rate
# - Monitor API latency
# - Verify payment processing
```

### Post-Deployment
- [ ] Monitor error rate (should be <0.1%)
- [ ] Check API response times (p95 < 500ms)
- [ ] Verify payment webhooks firing
- [ ] Monitor database CPU/memory
- [ ] Check Sentry for new errors
- [ ] Verify real-time features (messages, notifications)
- [ ] Test mobile responsiveness

---

## 📋 MONITORING & OPERATIONS

### Daily Checks
- [ ] Zero critical errors in Sentry
- [ ] Payment processing working
- [ ] RSS feeds updating
- [ ] Database backups completed

### Weekly Checks
- [ ] Review API performance metrics
- [ ] Check error trends
- [ ] Verify payment success rate
- [ ] Review user feedback

### Monthly
- [ ] Database optimization
- [ ] Security audit
- [ ] Performance review
- [ ] Dependency updates

---

## 💬 QUICK REFERENCE

### Critical Paths
**Fastest to Production**: Rate Limiting → Payments → Testing → Deploy
**Highest Impact**: Payments → Error Recovery → Rate Limiting
**Easiest to Implement**: Input Validation → GDPR Export → Error Monitoring

### Decision Points
- **Use Redis or KV?** → Use Vercel KV for simplicity, Upstash for flexibility
- **Deploy to staging first?** → YES, always test with real services first
- **Stripe vs M-Pesa first?** → M-Pesa (target market), then add Stripe

### Rollback Plan
- Keep previous version deployable with one command
- Database migrations are one-way; test extensively
- Secrets managed separately; can be rotated without redeployment

---

## ✅ SIGN-OFF CRITERIA

**Ready to launch when:**
- ✅ All 5 critical fixes implemented & tested
- ✅ Input validation 100% coverage
- ✅ Error monitoring active & configured
- ✅ Payment processing tested with real transactions
- ✅ Rate limiting tested across multiple instances
- ✅ Database transactions verified atomic
- ✅ GDPR compliance confirmed
- ✅ Security audit passed
- ✅ Load testing met targets
- ✅ Team signed off on readiness

---

**Current Status**: 🟡 **75% Ready**
**Target**: 🟢 **Ready** in **3-4 weeks**
**Last Updated**: 2026-07-19

---

## 📞 SUPPORT CONTACTS

- **Payments**: M-Pesa (Safaricom Daraja), Stripe support
- **Hosting**: Vercel support, Supabase support
- **Monitoring**: Sentry support
- **Infrastructure**: AWS/Vercel docs, Supabase docs

---

**Print this checklist and track progress!** 🚀
