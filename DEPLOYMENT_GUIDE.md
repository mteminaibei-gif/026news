# Migration Deployment Guide

The schema enhancement migration is ready to deploy. Choose one of the methods below:

## ✅ Method 1: Supabase Dashboard (Recommended - No CLI Required)

**Fastest method - works immediately:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **026connet!**
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open file: `supabase/migrations/20240711_schema_enhancements.sql`
6. Copy all SQL content
7. Paste into the SQL Editor
8. Click **Execute** (or `Ctrl+Enter`)
9. Wait for completion (should complete in ~5 seconds)

**Expected Output:**
```
Executed successfully
```

---

## ✅ Method 2: Supabase CLI (Recommended if you have CLI auth)

If you have Supabase CLI installed and authenticated:

```bash
# Navigate to project directory
cd c:\Users\samtech\Downloads\026connet!-nextjs

# Link to your Supabase project (if not already linked)
supabase link --project-ref dvvbafgpluxvaieguiwm

# Push the migration
supabase db push
```

---

## ✅ Method 3: Create Migration Manually (Alternative)

If neither method above works:

1. Go to Supabase Dashboard → **Migrations** (left sidebar)
2. Click **New Migration**
3. Copy the SQL from `supabase/migrations/20240711_schema_enhancements.sql`
4. Paste into the migration editor
5. Review and confirm
6. Deploy

---

## 📋 Migration Contents

**File:** `supabase/migrations/20240711_schema_enhancements.sql`

**Changes:**
- ✅ Fix `saved_articles` RLS policies (critical bug fix)
- ✅ Add 9 new tables (audit_log, api_rate_limits, article_likes, user_follows, article_versions, article_tags, article_tag_mappings, content_moderation, email_templates)
- ✅ Add engagement columns (like_count, share_count, save_count, reading_time_minutes, follower_count, following_count, article_count)
- ✅ Create helper functions (5 total)
- ✅ Add automatic triggers (3 total)
- ✅ Create database views (v_trending_articles, v_top_journalists)
- ✅ Enable realtime for new tables

**Total Lines:** 373  
**Estimated Execution Time:** 5-10 seconds

---

## ✔️ Verification Checklist

After deployment, verify in Supabase Dashboard:

- [ ] New tables appear in **Database** → **Tables**:
  - [ ] audit_log
  - [ ] api_rate_limits
  - [ ] article_likes
  - [ ] user_follows
  - [ ] article_versions
  - [ ] article_tags
  - [ ] article_tag_mappings
  - [ ] content_moderation
  - [ ] email_templates

- [ ] New columns appear in existing tables:
  - [ ] users: follower_count, following_count, article_count
  - [ ] articles: like_count, share_count, save_count, reading_time_minutes
  - [ ] comments: like_count

- [ ] Functions created in **Database** → **Functions**:
  - [ ] increment_article_likes
  - [ ] decrement_article_likes
  - [ ] update_user_follow_counts
  - [ ] create_article_version
  - [ ] cleanup_rate_limits

- [ ] Views created in **Database** → **Views**:
  - [ ] v_trending_articles
  - [ ] v_top_journalists

- [ ] RLS policies updated for saved_articles

---

## 🚀 Post-Deployment Steps

### 1. Update TypeScript Types

Add new types to `lib/types.ts`:

```typescript
// New table types
export interface ArticleLike {
  like_id: number;
  article_id: number;
  user_id: number;
  created_at: string;
}

export interface UserFollow {
  follow_id: number;
  follower_id: number;
  following_id: number;
  created_at: string;
}

export interface ArticleVersion {
  version_id: number;
  article_id: number;
  title: string;
  content: string;
  version_number: number;
  status: 'draft' | 'published';
  created_at: string;
}

// Add to existing Article type
export interface Article {
  // ... existing fields
  like_count: number;
  share_count: number;
  save_count: number;
  reading_time_minutes?: number;
}

// Add to existing User type
export interface User {
  // ... existing fields
  follower_count: number;
  following_count: number;
  article_count: number;
}
```

### 2. Test New Features

```bash
# Create an article like
curl -X POST https://dvvbafgpluxvaieguiwm.supabase.co/rest/v1/article_likes \
  -H "apikey: sb_publishable_tfsQgzHibN5XjoizGa5ssg_wapjZ_OV" \
  -H "Content-Type: application/json" \
  -d '{"article_id": 1, "user_id": 1}'

# View trending articles
curl https://dvvbafgpluxvaieguiwm.supabase.co/rest/v1/v_trending_articles \
  -H "apikey: sb_publishable_tfsQgzHibN5XjoizGa5ssg_wapjZ_OV"
```

### 3. Test RLS Policies

Verify saved_articles RLS works:
```bash
# Try to save an article (should work now)
curl -X POST https://dvvbafgpluxvaieguiwm.supabase.co/rest/v1/saved_articles \
  -H "apikey: sb_publishable_tfsQgzHibN5XjoizGa5ssg_wapjZ_OV" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"article_id": 1, "user_id": 1}'
```

---

## 🆘 Troubleshooting

### Error: "Permission denied"
→ Ensure your Supabase token has sufficient permissions (Service Role key required)

### Error: "Table already exists"
→ Migration already ran. Check `supabase.migrations` table.

### Error: "Migration validation failed"
→ Copy the migration file path correctly: `supabase/migrations/20240711_schema_enhancements.sql`

### Queries timeout
→ The SQL is large (373 lines) but should complete in <10 seconds. If timeout occurs, try running via SQL Editor instead of CLI.

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs
- **Schema Docs:** See `SCHEMA_ENHANCEMENTS.md`
- **Migration File:** `supabase/migrations/20240711_schema_enhancements.sql`

---

**Status:** ✅ Ready to Deploy  
**Date:** July 11, 2024  
**Build:** Verified (0 errors, 65 routes)
