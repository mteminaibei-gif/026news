# Manual Migration Deployment Guide
**For applying RSS feeds migration to Supabase manually**

---

## Why Manual?

The Supabase CLI requires project linking. Since you're working locally, the fastest way is to copy-paste the SQL directly into Supabase's SQL Editor.

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Sign in to your account
3. Select project: `dvvbafgpluxvaieguiwm` (from your .env.local)
4. Click: **SQL Editor** (left sidebar)
5. Click: **New Query**

---

## Step 2: Copy the Migration SQL

**File to copy:** `supabase/migrations/20240711_fix_rss_feeds.sql`

The file is located in your project at:
```
026connet!-nextjs/supabase/migrations/20240711_fix_rss_feeds.sql
```

---

## Step 3: Paste into Supabase

1. In Supabase SQL Editor, clear any default text
2. Copy all contents of `20240711_fix_rss_feeds.sql`
3. Paste into the SQL Editor
4. Click: **Run** (bottom right, or Ctrl+Enter)

---

## Step 4: Verify Success

After running, you should see:
```
Query executed successfully
```

To verify the migration was applied:

```sql
-- Run this query in a new SQL Editor tab:
SELECT COUNT(*) as total_feeds, 
       SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_feeds,
       SUM(CASE WHEN priority >= 90 THEN 1 ELSE 0 END) as premium_kenya
FROM public.rss_feeds;

-- Expected results:
-- total_feeds: 32 (or more if you had previous feeds)
-- active_feeds: 32
-- premium_kenya: 12
```

---

## Step 5: Check Column Addition

Verify the new columns were added:

```sql
-- Run this query to verify:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rss_feeds' 
ORDER BY ordinal_position;

-- You should see:
-- ... existing columns ...
-- priority | integer
-- regions | text[]
```

---

## Next Steps After Migration

### 1. Test Feed Fetching (5 min)

Run the feed fetch endpoint:
```bash
curl -X POST http://localhost:3000/api/admin/fetch-feeds \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "ok": true,
  "feeds": 32,
  "inserted": <number>,
  "skipped": <number>,
  "errors": 0
}
```

### 2. Verify Homepage Display (5 min)

Visit `http://localhost:3000`:
- [ ] Kenya news appears in hero carousel first
- [ ] Kenya articles appear first in main grid
- [ ] Africa articles appear next
- [ ] International articles appear last

### 3. Check Admin Dashboard (2 min)

If you have an admin dashboard for feeds:
- [ ] All 32 feeds showing as active
- [ ] Feeds sorted by priority available

---

## Troubleshooting

### Problem: "relation does not exist"
**Solution:** Make sure you're running the migration in the correct Supabase project. Check that the project URL in your .env.local matches.

### Problem: "column already exists"
**Solution:** The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run again. It will skip already-existing columns.

### Problem: "syntax error"
**Solution:** 
1. Copy the entire migration file carefully
2. Make sure all quotes and semicolons are included
3. Check for any corrupted characters during copy-paste

### Problem: Feeds didn't insert
**Solution:**
1. Check if categories exist:
```sql
SELECT * FROM public.categories WHERE slug IN ('kenya', 'business', 'tech', 'africa', 'politics', 'sports', 'health', 'entertainment', 'science', 'news');
```

2. If categories missing, create them:
```sql
INSERT INTO public.categories (name, slug, description)
VALUES
  ('Kenya', 'kenya', 'Kenya news'),
  ('Africa', 'africa', 'African news'),
  ('Business', 'business', 'Business news'),
  ('Tech', 'tech', 'Technology news'),
  ('Politics', 'politics', 'Political news'),
  ('Sports', 'sports', 'Sports news'),
  ('Health', 'health', 'Health news'),
  ('Entertainment', 'entertainment', 'Entertainment'),
  ('Science', 'science', 'Science news'),
  ('News', 'news', 'General news')
ON CONFLICT (slug) DO NOTHING;
```

---

## Verification Queries

Run these after migration to verify everything:

### Check all feeds
```sql
SELECT name, feed_url, priority, is_active
FROM public.rss_feeds
WHERE is_active = true
ORDER BY priority DESC
LIMIT 10;
```

### Count by tier
```sql
SELECT 
  CASE 
    WHEN priority >= 90 THEN 'Tier 1: Premium Kenya'
    WHEN priority >= 80 THEN 'Tier 2: Quality Kenya'
    WHEN priority >= 50 THEN 'Tier 3: East Africa/Pan-Africa'
    WHEN priority >= 30 THEN 'Tier 4: International'
    ELSE 'Tier 5: Specialty/Tech'
  END as tier,
  COUNT(*) as count
FROM public.rss_feeds
WHERE is_active = true
GROUP BY tier
ORDER BY MIN(priority) DESC;
```

### Check Kenya feeds specifically
```sql
SELECT name, priority
FROM public.rss_feeds
WHERE priority >= 90
ORDER BY priority DESC;
```

---

## Success Indicators

✅ Migration applied successfully when:
- No error messages in Supabase SQL Editor
- Query executed successfully message appears
- Verification queries return expected results
- 32 active feeds show in database

---

## Time Estimate

- Copy migration SQL: 2 minutes
- Paste into Supabase: 1 minute
- Run query: 10-30 seconds
- Verify success: 2 minutes
- **Total: 5-10 minutes**

---

## Next: Test Feed Fetching

After migration is applied, test the feed fetch:

```bash
# In your project directory:
npm run dev

# Then in another terminal:
curl -X POST http://localhost:3000/api/admin/fetch-feeds \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Need Help?

If you encounter issues:

1. Check the full migration file: `supabase/migrations/20240711_fix_rss_feeds.sql`
2. Review: `DEPLOYMENT_CHECKLIST.md`
3. Read: `RSS_FEEDS_IMPLEMENTATION_GUIDE.md`

---

**Migration Status:** Ready to apply ✓  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (uses IF NOT EXISTS for safety)
