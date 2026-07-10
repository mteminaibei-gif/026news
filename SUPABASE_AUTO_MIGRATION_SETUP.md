# Supabase Auto-Migration Setup Guide
**Automatic database migrations on git commits**

---

## What This Does

When you commit migration files to git, the system will:
1. Validate the SQL syntax
2. Show a preview of changes
3. Ask for confirmation
4. Apply migrations to your Supabase database
5. Log all activity

This keeps your database schema in sync with your code.

---

## Prerequisites

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### 2. Link Your Supabase Project

Get your project reference from `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://dvvbafgpluxvaieguiwm.supabase.co
                                  ^^^^^^^^^^^^^^^^^^^^
                                  This is your project ref
```

Link your project:
```bash
supabase link --project-ref dvvbafgpluxvaieguiwm
```

When prompted for password:
- Use your Supabase project password (from Dashboard → Settings → Database)
- OR use your access token from Project Settings

### 3. Verify Link
```bash
supabase status
```

You should see your project information.

---

## How It Works

### File Structure
```
.git/
├── hooks/
│   ├── pre-commit        # Validates SQL before commit
│   ├── pre-commit.bat    # Windows version
│   ├── post-commit       # Runs migrations after commit
│   └── post-commit.bat   # Windows version
```

### Workflow

1. **You make a change** to a migration file in `supabase/migrations/`
2. **You stage the file**: `git add supabase/migrations/20240711_fix_rss_feeds.sql`
3. **You commit**: `git commit -m "Add RSS feeds"`
4. **Hook activates** (pre-commit):
   - ✓ Validates SQL syntax
   - ✓ Checks file format
   - Blocks commit if errors found
5. **Hook activates** (post-commit):
   - Shows migration preview
   - Asks for confirmation
   - Applies to Supabase if confirmed
   - Logs results

---

## Usage Examples

### Example 1: Create a New Migration

```bash
# Create migration file
echo "-- Add new column
ALTER TABLE articles ADD COLUMN IF NOT EXISTS new_field TEXT;" \
  > supabase/migrations/20240711_add_column.sql

# Stage it
git add supabase/migrations/20240711_add_column.sql

# Commit (hooks run automatically)
git commit -m "Add new_field to articles table"

# You'll see:
# [Supabase] Validating SQL migrations...
# [Supabase] ✓ Validated: 20240711_add_column.sql
# [Supabase] Pushing migrations to Supabase...
# [Supabase] Migration preview successful
# Apply migrations? (y/n)

# Press 'y' to apply to Supabase
# [Supabase] ✓ Migrations applied successfully
```

### Example 2: Multiple Migrations

```bash
# Create multiple migration files
echo "-- Update 1" > supabase/migrations/20240711_update1.sql
echo "-- Update 2" > supabase/migrations/20240711_update2.sql

# Stage all
git add supabase/migrations/

# Commit (all will be validated and applied)
git commit -m "Multiple database updates"
```

### Example 3: Skip Migration

If you want to commit without applying:
- Answer "n" to the confirmation prompt
- Migration will be skipped but commit will succeed
- Apply manually later: `supabase db push`

---

## Configuration

### Disable Auto-Migration

To disable hooks temporarily:
```bash
# Rename hooks
mv .git/hooks/post-commit .git/hooks/post-commit.bak
mv .git/hooks/pre-commit .git/hooks/pre-commit.bak

# Run migration manually
supabase db push
```

### Re-enable Auto-Migration

```bash
# Restore hooks
mv .git/hooks/post-commit.bak .git/hooks/post-commit
mv .git/hooks/pre-commit.bak .git/hooks/pre-commit
```

### Disable Confirmation Prompt

Edit `.git/hooks/post-commit` and change:
```bash
# From:
read -p "Apply migrations? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then

# To:
# Always apply without asking (uncomment to enable):
# REPLY="y"
```

---

## Troubleshooting

### Error: "Supabase CLI not found"

**Solution:** Install Supabase CLI
```bash
npm install -g supabase
supabase --version  # Verify
```

### Error: "Project not linked"

**Solution:** Link your project
```bash
supabase link --project-ref dvvbafgpluxvaieguiwm
```

### Error: "Migration preview failed"

**Check:**
1. Is your project linked? `supabase status`
2. Is the SQL valid? Run manually: `supabase db push --dry-run`
3. Are there database permission issues?

### Hooks not running at all

**Windows:** Git might not execute shell scripts
- Use `.bat` files instead (already provided)
- Or use: `git config core.hooksPath .git/hooks`

**Git configuration:**
```bash
# Make sure hooks are enabled
git config core.hooksPath .git/hooks

# Verify
git config core.hooksPath  # Should show: .git/hooks
```

### "Migration file is empty"

**Solution:** Ensure migration file has content
```bash
# Don't create empty files
git add supabase/migrations/INVALID.sql  # This will fail

# Create with content
echo "-- Add table
CREATE TABLE test (id SERIAL PRIMARY KEY);" \
  > supabase/migrations/20240711_create_test.sql
```

---

## Manual Migration (Without Hooks)

If hooks aren't working, migrate manually:

```bash
# Validate first
supabase db push --dry-run

# Apply
supabase db push

# Check status
supabase status
```

---

## Monitoring & Logs

### View Migration Logs

```bash
# Logs are saved to supabase-migration.log
cat supabase-migration.log

# Follow logs in real-time
tail -f supabase-migration.log
```

### Check Database Status

```bash
# Show current schema version
supabase status

# Show applied migrations
supabase migration list
```

### View Supabase Dashboard

Go to: https://app.supabase.com → dvvbafgpluxvaieguiwm → SQL Editor

View migrations:
```sql
SELECT * FROM pg_migrations ORDER BY name DESC;
```

---

## Best Practices

### 1. One Migration Per Change
```bash
# Good: Separate migrations for separate changes
supabase/migrations/20240711_add_priority_column.sql
supabase/migrations/20240711_update_feed_urls.sql

# Avoid: Multiple unrelated changes in one file
```

### 2. Include Comments
```sql
-- File: supabase/migrations/20240711_fix_rss_feeds.sql
-- Purpose: Add priority system to RSS feeds
-- Author: Your Name
-- Date: 2024-07-11

ALTER TABLE public.rss_feeds ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 50;
```

### 3. Use Idempotent Operations
```sql
-- Good: Safe to run multiple times
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- Avoid: Will fail if run twice
ALTER TABLE table_name ADD COLUMN column_name TEXT;
CREATE INDEX idx_name ON table_name(column);
```

### 4. Test Before Committing
```bash
# Test migration locally (if using Docker)
supabase db push --dry-run

# Or test via SQL Editor in Supabase dashboard
```

### 5. Wait for Confirmation
Don't skip the confirmation prompt:
- Review the changes
- Verify they're correct
- Press 'y' to apply
- Press 'n' to skip

---

## Workflow Example

### Step 1: Create Migration
```bash
# Write your migration
echo "ALTER TABLE rss_feeds ADD COLUMN priority INT DEFAULT 50;" \
  > supabase/migrations/20240711_rss_priority.sql
```

### Step 2: Stage File
```bash
git add supabase/migrations/20240711_rss_priority.sql
```

### Step 3: Commit
```bash
git commit -m "Add priority to RSS feeds"
```

### Step 4: Hook Validates
```
[Supabase] Validating SQL migrations...
[Supabase] ✓ Validated: 20240711_rss_priority.sql
```

### Step 5: Preview Changes
```
[Supabase] Pushing migrations to Supabase...
[Supabase] Migration preview successful
Apply migrations? (y/n)
```

### Step 6: Confirm
```
y
[Supabase] ✓ Migrations applied successfully
```

### Step 7: Verify
```bash
# Check it applied
supabase status
```

---

## Continuous Integration (CI/CD)

For automated deployments (GitHub Actions, etc.):

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Supabase
        run: npm install -g supabase
      
      - name: Link Project
        run: supabase link --project-ref dvvbafgpluxvaieguiwm
      
      - name: Apply Migrations
        run: supabase db push
        env:
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

## Disabling Hooks Temporarily

If you need to commit without triggering migrations:

```bash
# Skip hooks for one commit
git commit --no-verify -m "Temp commit"

# Re-enable for next commit
git commit -m "Normal commit with migrations"
```

---

## Removing Hooks

To remove auto-migration:

```bash
# Delete hook files
rm .git/hooks/post-commit
rm .git/hooks/pre-commit
rm .git/hooks/post-commit.bat
rm .git/hooks/pre-commit.bat

# Migrations will no longer auto-run
# Migrate manually: supabase db push
```

---

## Summary

✅ **Setup:**
1. Install Supabase CLI: `npm install -g supabase`
2. Link project: `supabase link --project-ref dvvbafgpluxvaieguiwm`
3. Hooks are ready to use

✅ **Usage:**
1. Create/modify migration files in `supabase/migrations/`
2. Commit with git: `git commit -m "..."`
3. Hooks validate and ask to apply
4. Press 'y' to apply to Supabase

✅ **Benefits:**
- Automatic validation before commit
- Database stays in sync with code
- Easy rollback (git revert)
- Audit trail in git history
- Prevents SQL syntax errors

---

## Need Help?

Run migrations manually:
```bash
supabase db push --dry-run    # Preview
supabase db push              # Apply
supabase status               # Check status
supabase migration list       # List all migrations
```

Check project:
```bash
supabase link --project-ref dvvbafgpluxvaieguiwm
supabase status
```

---

**Setup Complete!** Your Supabase database will now auto-migrate when you commit migration files. 🚀
