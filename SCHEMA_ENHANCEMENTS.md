# 026news Database Schema Enhancements

**Migration Date:** July 11, 2024  
**Version:** 1.0.0  
**Status:** Ready for Deployment

## Overview

This document outlines comprehensive database schema enhancements including bug fixes, new tables, helper functions, and views to support all implemented features in the 026news platform.

---

## 🔧 Part 1: Critical Bug Fixes

### Fixed: `saved_articles` RLS Policy Bug

**Issue:** Row-Level Security policies referenced a nonexistent `user_email` column, making it impossible for users to save articles.

**Fix:** Updated all RLS policies to use the correct `auth_id` → `user_id` relationship:

```sql
CREATE POLICY "Users can view their own saved articles"
  ON public.saved_articles
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT auth_id FROM public.users WHERE user_id = saved_articles.user_id
    )
  );
```

**Impact:** Users can now properly save/unsave articles and view their saved collection.

---

## 📊 Part 2: New Tables

### 1. `audit_log` - Admin Action Tracking

Tracks all administrative actions for compliance and debugging.

| Column | Type | Description |
|--------|------|-------------|
| `log_id` | BIGSERIAL | Primary key |
| `admin_id` | BIGINT | FK to users |
| `action` | TEXT | What was done (e.g., 'delete_article', 'ban_user') |
| `table_name` | TEXT | Affected table |
| `record_id` | BIGINT | ID of affected record |
| `old_data` | JSONB | Previous values |
| `new_data` | JSONB | New values |
| `ip_address` | TEXT | Admin's IP |
| `user_agent` | TEXT | Admin's browser |
| `created_at` | TIMESTAMPTZ | When action occurred |

**Indexes:**
- `idx_audit_log_admin` — Find actions by admin
- `idx_audit_log_table` — Find actions on specific table
- `idx_audit_log_created` — Time-based queries

**RLS Policy:** Only admins can read audit logs

---

### 2. `api_rate_limits` - API Throttling

Tracks API request counts per user/endpoint to enforce rate limiting.

| Column | Type | Description |
|--------|------|-------------|
| `limit_id` | BIGSERIAL | Primary key |
| `user_id` | BIGINT | FK to users (nullable for IP-based limits) |
| `endpoint` | TEXT | API endpoint path |
| `ip_hash` | TEXT | Hashed IP address (nullable for user-based limits) |
| `request_count` | INT | Current window request count |
| `window_start` | TIMESTAMPTZ | Window start time |
| `window_end` | TIMESTAMPTZ | Window end time |
| `created_at` | TIMESTAMPTZ | Record creation |

**Maintenance:** Old records auto-expire via `cleanup_rate_limits()` function

**Usage:**
```sql
-- Check if user hit rate limit
SELECT * FROM api_rate_limits 
WHERE user_id = 123 
AND endpoint = '/api/articles'
AND window_end > NOW()
AND request_count >= 100;
```

---

### 3. `article_likes` - Granular Engagement Tracking

Tracks individual article likes for social features and engagement metrics.

| Column | Type | Description |
|--------|------|-------------|
| `like_id` | BIGSERIAL | Primary key |
| `article_id` | BIGINT | FK to articles |
| `user_id` | BIGINT | FK to users |
| `created_at` | TIMESTAMPTZ | When liked |

**Unique Constraint:** One like per user per article

**RLS Policies:**
- Public read (everyone sees who liked)
- Authenticated users can like/unlike

**Auto-Updates:** Trigger maintains denormalized `articles.like_count`

---

### 4. `user_follows` - Social Relationships

Tracks followers/following relationships between users (journalist subscriptions, reader connections).

| Column | Type | Description |
|--------|------|-------------|
| `follow_id` | BIGSERIAL | Primary key |
| `follower_id` | BIGINT | FK to users (person doing following) |
| `following_id` | BIGINT | FK to users (person being followed) |
| `created_at` | TIMESTAMPTZ | When relationship created |

**Constraints:**
- Unique per follower/following pair
- Self-follows prevented via CHECK constraint

**RLS Policies:**
- Public read (everyone sees relationships)
- Authenticated users can follow/unfollow

**Auto-Updates:** Trigger maintains `users.follower_count` and `users.following_count`

---

### 5. `article_versions` - Revision History

Tracks article revisions, drafts, and version history for content management.

| Column | Type | Description |
|--------|------|-------------|
| `version_id` | BIGSERIAL | Primary key |
| `article_id` | BIGINT | FK to articles |
| `title` | TEXT | Article title at this version |
| `content` | TEXT | Article content at this version |
| `excerpt` | TEXT | Summary at this version |
| `featured_image` | TEXT | Featured image URL at this version |
| `version_number` | INT | Sequential version (1, 2, 3...) |
| `status` | TEXT | 'draft' or 'published' |
| `change_summary` | TEXT | What changed (e.g., "Fixed typo", "Updated data") |
| `author_id` | BIGINT | FK to users |
| `created_at` | TIMESTAMPTZ | When version created |

**Unique Constraint:** One version number per article

**RLS Policy:** Authors and admins can read versions

**Automatic Trigger:** `trg_article_version` creates version when article is updated

---

### 6. `article_tags` - Tag Management

Centralized tag registry with usage statistics.

| Column | Type | Description |
|--------|------|-------------|
| `tag_id` | BIGSERIAL | Primary key |
| `tag_name` | TEXT | Human-readable tag name |
| `tag_slug` | TEXT | URL-friendly slug |
| `usage_count` | BIGINT | How many articles use this tag |
| `created_at` | TIMESTAMPTZ | When tag was created |
| `updated_at` | TIMESTAMPTZ | Last update |

**Indexes:** On tag_name and tag_slug for fast lookups

---

### 7. `article_tag_mappings` - Article-Tag Relationships

Many-to-many relationship between articles and tags.

| Column | Type | Description |
|--------|------|-------------|
| `mapping_id` | BIGSERIAL | Primary key |
| `article_id` | BIGINT | FK to articles |
| `tag_id` | BIGINT | FK to article_tags |
| `created_at` | TIMESTAMPTZ | When mapping created |

**Unique Constraint:** One mapping per article/tag pair

---

### 8. `content_moderation` - Moderation Queue

Tracks flagged content and moderation actions.

| Column | Type | Description |
|--------|------|-------------|
| `moderation_id` | BIGSERIAL | Primary key |
| `content_type` | TEXT | 'article', 'comment', or 'message' |
| `content_id` | BIGINT | ID of flagged content |
| `flagged_by` | BIGINT | FK to users (who flagged) |
| `reason` | TEXT | Why flagged (spam, offensive, misinformation, etc.) |
| `severity` | TEXT | 'low', 'medium', 'high', 'critical' |
| `status` | TEXT | 'pending', 'reviewed', 'resolved', 'dismissed' |
| `admin_notes` | TEXT | Admin decision notes |
| `resolved_by` | BIGINT | FK to users (admin who resolved) |
| `resolved_at` | TIMESTAMPTZ | When resolved |
| `created_at` | TIMESTAMPTZ | When flagged |
| `updated_at` | TIMESTAMPTZ | Last modified |

**RLS Policy:** Only admins view moderation queue

**Indexes:** On content_type, status, and severity for efficient filtering

---

### 9. `email_templates` - Configurable Emails

Store email templates for notifications, making them configurable without code changes.

| Column | Type | Description |
|--------|------|-------------|
| `template_id` | BIGSERIAL | Primary key |
| `template_name` | TEXT | Human-readable name |
| `template_slug` | TEXT | Code identifier (e.g., 'new_follower') |
| `subject` | TEXT | Email subject line |
| `body` | TEXT | Email HTML body |
| `variables` | TEXT[] | Template variables (e.g., {{author}}, {{article_title}}) |
| `is_active` | BOOLEAN | Enable/disable template |
| `created_at` | TIMESTAMPTZ | When created |
| `updated_at` | TIMESTAMPTZ | Last updated |

**Usage:**
```sql
-- Get welcome email template
SELECT * FROM email_templates 
WHERE template_slug = 'welcome' AND is_active = true;
```

---

## 🎯 Part 3: New Columns Added to Existing Tables

### `users` table additions

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS follower_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS following_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS article_count BIGINT NOT NULL DEFAULT 0;
```

These columns are automatically maintained by triggers and aggregates.

### `articles` table additions

```sql
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS share_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS save_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS reading_time_minutes INT DEFAULT NULL;
```

- `like_count`: Denormalized from `article_likes` table
- `share_count`: Incremented when article is shared socially
- `save_count`: Denormalized from `saved_articles` table
- `reading_time_minutes`: Calculated from content length (e.g., 300 words ≈ 1 min)

### `comments` table additions

```sql
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;
```

---

## 🔧 Part 4: Helper Functions

### 1. `increment_article_likes(p_article_id BIGINT)`

Safely increments article like count.

```sql
SELECT public.increment_article_likes(42);
```

### 2. `decrement_article_likes(p_article_id BIGINT)`

Safely decrements article like count (prevents going below 0).

```sql
SELECT public.decrement_article_likes(42);
```

### 3. `update_user_follow_counts(p_user_id BIGINT)`

Recalculates follower/following counts for a user.

```sql
SELECT public.update_user_follow_counts(123);
```

### 4. `create_article_version(p_article_id BIGINT, p_change_summary TEXT)`

Creates a snapshot version of an article.

```sql
SELECT public.create_article_version(42, 'Fixed typo in intro paragraph');
```

### 5. `cleanup_rate_limits()`

Removes expired rate limit records. Called daily via cron.

```sql
SELECT public.cleanup_rate_limits();
```

---

## ⚡ Part 5: Automatic Triggers

### `trg_article_version` (Before Update on articles)

**When:** Article title, content, or status changes  
**Action:** Automatically creates version snapshot

Allows you to roll back to previous versions if needed.

### `trg_article_like_count` (After Insert/Delete on article_likes)

**When:** User likes or unlikes an article  
**Action:** Updates denormalized `articles.like_count`

Keeps counts in sync without extra queries.

### `trg_follow_count` (After Insert/Delete on user_follows)

**When:** User follows or unfollows someone  
**Action:** Updates `follower_count` and `following_count` for both users

Maintains accurate social metrics.

---

## 📈 Part 6: Database Views

### `v_trending_articles`

Returns articles ranked by engagement score (popularity).

**Columns:**
- `article_id`, `title`, `slug`, `excerpt`, `featured_image`
- `views`, `like_count`, `share_count`, `save_count`
- `author_name`, `category_name`
- `engagement_score` — Weighted: views×0.1 + likes×1 + shares×2 + saves×1.5

**Usage:**
```sql
-- Get top 10 trending articles
SELECT * FROM v_trending_articles LIMIT 10;
```

### `v_top_journalists`

Returns journalists ranked by followers and engagement.

**Columns:**
- `user_id`, `name`, `profile_image`, `bio`
- `follower_count`, `article_count`
- `published_count`, `total_likes`

**Usage:**
```sql
-- Get top 20 journalists
SELECT * FROM v_top_journalists LIMIT 20;
```

---

## 🔌 Part 7: Realtime Subscriptions

The following tables are enabled for Supabase Realtime, allowing real-time updates in the UI:

- `article_likes` — Real-time like counts
- `user_follows` — Real-time follow/unfollow notifications
- `article_versions` — Real-time version history updates
- `content_moderation` — Real-time moderation status

**Example subscription in React:**
```typescript
const subscription = supabase
  .channel('article_likes:42')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'article_likes', filter: 'article_id=eq.42' },
    (payload) => console.log('Like changed:', payload)
  )
  .subscribe();
```

---

## 📋 Deployment Checklist

- [ ] Review migration SQL for any custom configurations
- [ ] Test migration in staging environment
- [ ] Backup production database
- [ ] Run migration: `supabase db push` or paste in SQL Editor
- [ ] Verify tables created via Supabase Dashboard
- [ ] Test RLS policies with sample queries
- [ ] Verify triggers firing (check version history after article update)
- [ ] Test realtime subscriptions
- [ ] Update API endpoints to use new tables
- [ ] Update TypeScript types in `lib/types.ts`

---

## 🔄 Breaking Changes & Migrations

### 1. `saved_articles` RLS Policies

**Before:** Broken (referenced nonexistent `user_email`)  
**After:** Fixed (uses `auth_id` → `user_id` relationship)

**Action Required:** None — automatic fix in migration

**Testing:** Try to save an article in staging

### 2. Article Engagement Tracking

**Before:** Only `views` counted  
**After:** `like_count`, `share_count`, `save_count` tracked separately

**Migration Path:**
- New articles start with 0 counts
- Existing articles: manually aggregate from `article_likes` and `saved_articles`

```sql
-- Backfill like counts for existing articles
UPDATE articles a SET like_count = (
  SELECT COUNT(*) FROM article_likes WHERE article_id = a.article_id
);
```

---

## 📚 Usage Examples

### Track Article Engagement

```typescript
// Add like
const { error } = await supabase
  .from('article_likes')
  .insert({ article_id: 42, user_id: currentUser.id });

// Get trending articles
const { data: trending } = await supabase
  .from('v_trending_articles')
  .select('*')
  .limit(10);
```

### Manage Social Relationships

```typescript
// Follow a journalist
await supabase
  .from('user_follows')
  .insert({ follower_id: myId, following_id: journalistId });

// Get followers
const { data: followers } = await supabase
  .from('user_follows')
  .select('follower_id')
  .eq('following_id', journalistId);
```

### Version Control Articles

```typescript
// Auto-versioning happens on article update
// View version history
const { data: versions } = await supabase
  .from('article_versions')
  .select('*')
  .eq('article_id', 42)
  .order('version_number', { ascending: false });

// Rollback to previous version
const version = versions[0]; // Get previous version
await supabase
  .from('articles')
  .update({
    title: version.title,
    content: version.content,
    excerpt: version.excerpt
  })
  .eq('article_id', 42);
```

---

## 🚀 Performance Considerations

1. **Indexes Created:** All foreign keys and common query filters have indexes
2. **Denormalization:** Engagement counts are denormalized for fast reads (updated via triggers)
3. **Partitioning:** Consider partitioning `audit_log` and `article_likes` tables by date if they grow large
4. **Rate Limiting:** Auto-cleanup runs to prevent `api_rate_limits` from bloating

---

## 📞 Support & Questions

For issues or questions about the schema:
1. Check Supabase Dashboard → "Editor" → "Schema"
2. Review migration file: `supabase/migrations/20240711_schema_enhancements.sql`
3. Test RLS policies: Supabase Dashboard → "SQL Editor"

---

**Last Updated:** July 11, 2024  
**Next Review:** October 2024
