# Deploy Migration to Supabase - Quick Guide

## ✅ Status
Your migration is ready: `supabase/migrations/20240711_schema_enhancements.sql` (373 lines)

---

## 🚀 Deploy Now (3 Methods)

### Method 1: Dashboard SQL Editor (FASTEST - 2 minutes) ⭐

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select project: **026news**

2. **Navigate to SQL Editor**
   - Left sidebar → **SQL Editor**

3. **Create New Query**
   - Click **+ New Query** button

4. **Copy & Paste Migration**
   - Open file: `supabase/migrations/20240711_schema_enhancements.sql`
   - Copy all content
   - Paste into SQL Editor

5. **Execute**
   - Click **Execute** button (or press `Ctrl+Enter`)
   - Wait ~5-10 seconds for completion

6. ✅ **Done!**
   - See success message
   - Check tables created in **Database → Tables**

---

### Method 2: Create Migration in Dashboard

1. Go to **Migrations** tab
2. Click **+ New Migration**
3. Paste SQL content
4. Click **Deploy**

---

### Method 3: Use Supabase CLI (If authenticated)

```bash
cd c:\Users\samtech\Downloads\026news-nextjs
supabase db push
```

**Note:** If you get permission error, use Method 1 instead.

---

## 📋 Verification Checklist

After deployment, verify all tables exist:

### New Tables (Check in Dashboard → Database → Tables)
- [ ] `audit_log`
- [ ] `api_rate_limits`
- [ ] `article_likes`
- [ ] `user_follows`
- [ ] `article_versions`
- [ ] `article_tags`
- [ ] `article_tag_mappings`
- [ ] `content_moderation`
- [ ] `email_templates`

### Updated Existing Tables (Check columns)
- [ ] `articles` has: `like_count`, `share_count`, `save_count`, `reading_time_minutes`
- [ ] `users` has: `follower_count`, `following_count`, `article_count`
- [ ] `comments` has: `like_count`

### New Views (Check in Dashboard → Database → Views)
- [ ] `v_trending_articles`
- [ ] `v_top_journalists`

### Functions (Check in Dashboard → Database → Functions)
- [ ] `increment_article_likes`
- [ ] `decrement_article_likes`
- [ ] `update_user_follow_counts`
- [ ] `create_article_version`
- [ ] `cleanup_rate_limits`

---

## 🧪 Quick Test After Deploy

### Test Article Likes
```sql
-- Check table exists
SELECT COUNT(*) FROM public.article_likes;

-- Should return: 0 (empty table)
```

### Test Trending Articles View
```sql
-- Check view exists
SELECT * FROM public.v_trending_articles LIMIT 1;

-- Should return column names (may be empty initially)
```

### Test Top Journalists View
```sql
-- Check view exists
SELECT * FROM public.v_top_journalists LIMIT 1;

-- Should return column names (may be empty initially)
```

### Test RLS Policies Fixed
```sql
-- Check saved_articles table has correct columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'saved_articles'
ORDER BY ordinal_position;

-- Should include: save_id, user_id, article_id, created_at
```

---

## 🔍 Common Issues

### Issue: "Permission Denied" Error
**Solution:** Use Supabase Dashboard SQL Editor instead of CLI

### Issue: "Table Already Exists"
**Solution:** The migration already ran. Check `supabase.migrations` table:
```sql
SELECT * FROM supabase.migrations WHERE name = '20240711_schema_enhancements';
```

### Issue: "Migration Failed" with specific error
**Solution:** Review the error message and check:
- Do referenced tables exist? (users, articles, comments, saved_articles, categories)
- Is there a syntax error in the migration?
- Run migration line-by-line to isolate issue

### Issue: RLS Error on saved_articles
**Solution:** Migration fixes this! If you still get errors after deployment, the RLS policies were successfully updated.

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **SQL Editor Help:** Dashboard → SQL Editor → ? button
- **Migration File:** `supabase/migrations/20240711_schema_enhancements.sql`
- **Technical Docs:** `SCHEMA_ENHANCEMENTS.md`

---

## ✨ What Gets Deployed

**Summary:**
- ✅ Fixes critical bug in `saved_articles` RLS policies
- ✅ Adds 9 new tables for engagement tracking, admin auditing, and content moderation
- ✅ Adds engagement columns to existing tables
- ✅ Creates 5 helper functions for automatic updates
- ✅ Creates 3 triggers for denormalized count maintenance
- ✅ Creates 2 views for trending content and top journalists
- ✅ Enables realtime for 4 new tables

**Total Time:** ~5-10 seconds to execute

---

**Ready to deploy? Follow Method 1 above!** 🚀
