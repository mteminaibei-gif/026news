# RSS Feeds Deployment Checklist
**Quick reference for deploying RSS feeds changes to production**

---

## Pre-Deployment ✓

- [x] All 32 feeds verified working
- [x] Migration file created
- [x] Homepage code updated
- [x] Build tested (0 errors)
- [x] Documentation complete

**Status:** Ready to deploy ✅

---

## Deployment Steps

### Step 1: Apply Database Migration
**Estimated Time:** 2-3 minutes

```bash
# Option A: Using Supabase CLI (Recommended)
cd c:\Users\samtech\Downloads\026connet!-nextjs
supabase db push

# Option B: Manual deployment
# 1. Go to: https://supabase.io → Dashboard → SQL Editor
# 2. Open file: supabase/migrations/20240711_fix_rss_feeds.sql
# 3. Copy all contents
# 4. Paste into Supabase SQL Editor
# 5. Click "Run"
```

**Verify Success:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as total_feeds, 
       SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active
FROM public.rss_feeds;
-- Expected: total_feeds: 32, active: 32
```

✓ Check: Migration applied successfully

---

### Step 2: Test Feed Fetching
**Estimated Time:** 5-10 minutes

```bash
# Method A: Using curl (command line)
curl -X POST http://localhost:3000/api/admin/fetch-feeds \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Method B: Using Postman
# 1. POST to: http://localhost:3000/api/admin/fetch-feeds
# 2. Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
# 3. Send request

# Expected Response:
# {
#   "ok": true,
#   "feeds": 32,
#   "inserted": <number>,
#   "skipped": <number>,
#   "errors": 0,
#   "timestamp": "2024-07-11T..."
# }
```

✓ Check: All 32 feeds fetched successfully

---

### Step 3: Verify Homepage Display
**Estimated Time:** 2-3 minutes

```bash
# Start development server (if not running)
npm run dev

# Visit homepage
# http://localhost:3000
```

**Visual Checks:**
- [ ] Kenya news appears in hero carousel first
- [ ] Kenya articles appear first in main grid
- [ ] Africa articles appear after Kenya
- [ ] International articles appear last
- [ ] Sidebar "Trending Now" shows Kenya sources primarily
- [ ] No console errors

✓ Check: Homepage displays Kenya news first

---

### Step 4: Verify Admin Dashboard
**Estimated Time:** 2-3 minutes

Navigate to `/admin/sources` or relevant admin panel:

```bash
# http://localhost:3000/admin/sources
```

**Check:**
- [ ] All 32 feeds listed as active
- [ ] Feeds sorted by priority available
- [ ] Categories assigned correctly
- [ ] Last fetched timestamps recent

✓ Check: Admin dashboard shows all feeds

---

### Step 5: Enable Daily Cron Job
**Estimated Time:** 1-2 minutes

**Current Setup:**
- Cron job runs at: `/api/cron/fetch-feeds`
- Frequency: Daily (configure as needed)
- Runs: Automatically

**Verify Cron Running:**
```bash
# Check logs for successful cron runs
# Logs location depends on your hosting provider
# Look for: "Feed fetch completed" or similar

# Or test manually:
curl http://YOUR_SITE.com/api/cron/fetch-feeds
```

✓ Check: Cron job enabled and working

---

## Post-Deployment Verification

### Immediate (First Hour)
- [ ] No 500 errors on homepage
- [ ] Articles loading correctly
- [ ] Hero carousel showing Kenya news
- [ ] No console errors

### First Day
- [ ] New articles appearing from all tiers
- [ ] Kenya feeds providing content
- [ ] Africa feeds providing content
- [ ] Trending sidebar updated
- [ ] No feed errors

### First Week
- [ ] Daily articles from Kenya sources
- [ ] Article quality appropriate
- [ ] User engagement normal
- [ ] No spike in errors

### Ongoing
- [ ] Monitor feed performance
- [ ] Check last_fetched timestamps
- [ ] Review trending content
- [ ] Adjust priorities if needed

---

## Troubleshooting

### Problem: No articles appearing
**Solution:**
1. Check feed fetch succeeded: `SELECT last_fetched FROM rss_feeds WHERE is_active = true`
2. Check for feed errors: `SELECT last_error FROM rss_feeds WHERE last_error IS NOT NULL`
3. Manually run fetch: POST to `/api/admin/fetch-feeds`
4. Check articles table: `SELECT COUNT(*) FROM articles WHERE is_aggregated = true`

### Problem: International news appearing first
**Solution:**
1. Verify priority column exists: `SELECT * FROM rss_feeds LIMIT 1`
2. Check priorities set: `SELECT DISTINCT priority FROM rss_feeds`
3. Verify homepage code: Check `app/page.tsx` sorting logic
4. Rebuild: `npm run build`

### Problem: Kenya feeds not fetching
**Solution:**
1. Check feed URLs: `SELECT name, feed_url FROM rss_feeds WHERE priority >= 90`
2. Test URLs manually in browser
3. Check for URL encoding issues
4. Review `/api/admin/fetch-feeds` response for specific errors

### Problem: Duplicate articles
**Solution:**
1. Check content_hash system: `SELECT COUNT(DISTINCT content_hash) FROM articles`
2. Verify is_aggregated flags
3. System automatically deduplicates - check last_fetched times

---

## Rollback Procedure

If critical issues occur:

### Option A: Revert Homepage Code Only
```bash
# This keeps the database migration but reverts the homepage display logic
git checkout HEAD~1 app/page.tsx
npm run build
```

### Option B: Full Rollback (Database + Code)
```bash
# Revert homepage code
git checkout HEAD~1 app/page.tsx

# Revert database - in Supabase SQL Editor:
ALTER TABLE public.rss_feeds DROP COLUMN IF EXISTS priority;
ALTER TABLE public.rss_feeds DROP COLUMN IF EXISTS regions;

npm run build
```

---

## Success Criteria

✅ **Deployment Successful If:**
- Migration applied without errors
- All 32 feeds showing as active
- Feed fetch returns 32 feeds processed
- Homepage displays Kenya news first
- No console errors
- Admin dashboard shows all feeds
- Daily cron job running

---

## Support Documents

| Document | Use When |
|----------|----------|
| `RSS_FEEDS_QUICK_START.md` | Need quick overview |
| `RSS_FEEDS_AUDIT.md` | Need detailed feed info |
| `RSS_FEEDS_IMPLEMENTATION_GUIDE.md` | Need full deployment guide |
| This file | Need step-by-step checklist |

---

## Timeline

**Before Deployment:**
- [ ] Review `RSS_FEEDS_QUICK_START.md`
- [ ] Ensure Supabase access ready
- [ ] Have admin token available

**Deployment (30 minutes total):**
- [ ] Apply migration (3 min)
- [ ] Test feed fetch (10 min)
- [ ] Verify homepage (5 min)
- [ ] Check admin dashboard (5 min)
- [ ] Enable cron (2 min)
- [ ] Final verification (5 min)

**Post-Deployment:**
- [ ] Monitor first 24 hours
- [ ] Weekly check-ins
- [ ] Monthly performance review

---

## Emergency Contact

**If Something Goes Wrong:**
1. Check troubleshooting section above
2. Review relevant documentation file
3. Check Supabase logs for errors
4. Review feed URLs in migration file
5. Consider rollback procedure

---

## Deployment Notes

**Date Deployed:** _______________  
**Deployed By:** _______________  
**Status:** _______________  
**Issues:** _______________  

---

✅ **READY FOR PRODUCTION DEPLOYMENT**

**Next Step:** Apply migration to Supabase
