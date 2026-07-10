# ✅ Git Hooks Auto-Migration Setup - COMPLETE

**Your project is now configured for automatic Supabase database migrations on git commits.**

---

## What You Get

### 🔄 Automatic Workflow

When you commit migration files:

```
1. You create/edit migration file
2. git add supabase/migrations/*.sql
3. git commit -m "description"
   ↓
4. Pre-commit hook validates SQL ✓
5. Post-commit hook applies to Supabase ✓
6. Database is updated automatically ✓
```

### ✨ Features

- ✅ **Automatic validation** - SQL syntax checked before commit
- ✅ **Preview before apply** - See what will change
- ✅ **Confirmation required** - You control when to apply
- ✅ **Logging** - All migrations logged to `supabase-migration.log`
- ✅ **Error handling** - Won't block commits if migration fails
- ✅ **Cross-platform** - Works on Windows, Mac, and Linux

---

## Files Installed

### Git Hooks
```
.git/hooks/
├── pre-commit       # Validates SQL syntax before commit
├── pre-commit.bat   # Windows version
├── post-commit      # Applies migrations after commit
└── post-commit.bat  # Windows version
```

### Setup & Documentation
```
├── SUPABASE_AUTO_MIGRATION_SETUP.md    # Full guide (detailed)
├── AUTO_MIGRATION_QUICK_START.md       # Quick start (5 min)
├── GIT_HOOKS_SETUP_COMPLETE.md         # This file
├── setup-supabase-hooks.ps1            # PowerShell setup script
└── setup-supabase-hooks.sh             # Bash setup script
```

---

## Next Steps (5 minutes)

### Step 1: Install Supabase CLI

**Windows (PowerShell):**
```powershell
npm install -g supabase
supabase --version
```

**Mac/Linux (Bash):**
```bash
npm install -g supabase
supabase --version
```

### Step 2: Link Your Supabase Project

```powershell
# Windows
supabase link --project-ref dvvbafgpluxvaieguiwm

# Mac/Linux
supabase link --project-ref dvvbafgpluxvaieguiwm
```

When prompted, enter your Supabase database password.

### Step 3: Verify Setup

```powershell
supabase status
```

You should see your project information and connection status.

### Done! ✓

The hooks are ready. You can now commit migration files and they'll automatically apply to Supabase.

---

## Using Auto-Migration

### Example: Add a New Column

```powershell
# Create migration file
echo "-- Add priority column to rss_feeds
ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS priority INT DEFAULT 50;" `
  | Out-File supabase/migrations/20240711_add_priority.sql

# Stage it
git add supabase/migrations/20240711_add_priority.sql

# Commit (hooks run automatically)
git commit -m "Add priority column to RSS feeds"
```

### Hook Output

```
[Supabase] Validating SQL migrations...
[Supabase] ✓ Validated: 20240711_add_priority.sql
[Supabase] Pushing migrations to Supabase...
[Supabase] Migration preview successful
Apply migrations? (y/n)
```

### Apply or Skip

**To apply migration:**
```
y
[Supabase] ✓ Migrations applied successfully
```

**To skip:**
```
n
[Supabase] Migration skipped by user
```

---

## Troubleshooting

### Problem: "Supabase CLI not found"

**Solution:**
```powershell
npm install -g supabase
supabase --version
```

### Problem: "Project not linked"

**Solution:**
```powershell
supabase link --project-ref dvvbafgpluxvaieguiwm
supabase status
```

### Problem: Hooks not running

**Windows (PowerShell):**
```powershell
git config core.hooksPath
# If empty, run:
git config core.hooksPath .git/hooks
```

**Mac/Linux (Bash):**
```bash
git config core.hooksPath
# If empty, run:
git config core.hooksPath .git/hooks
```

### Problem: Authentication error

**Solution:** Get your password from:
1. Supabase Dashboard
2. Select project: dvvbafgpluxvaieguiwm
3. Settings → Database → Password
4. Copy and paste when prompted

---

## Configuration Options

### Disable Hooks Temporarily

```powershell
# Commit without running hooks
git commit --no-verify -m "Bypass hooks for this commit"

# Hooks will run again for next commit
```

### Disable Confirmation Prompt

Edit `.git/hooks/post-commit` and uncomment the line:
```bash
# Always apply without asking (uncomment to enable):
# REPLY="y"
```

### Disable Hooks Permanently

```powershell
# Rename hooks
Rename-Item .git/hooks/post-commit .git/hooks/post-commit.bak
Rename-Item .git/hooks/pre-commit .git/hooks/pre-commit.bak

# Migrate manually when needed
supabase db push
```

---

## Common Commands

```powershell
# Check database status
supabase status

# List applied migrations
supabase migration list

# Manual migration (dry-run first)
supabase db push --dry-run
supabase db push

# View migration logs
cat supabase-migration.log

# Force re-link project
supabase link --project-ref dvvbafgpluxvaieguiwm
```

---

## Workflow Best Practices

### ✓ Do This

```powershell
# One change per migration file
supabase/migrations/20240711_add_column.sql
supabase/migrations/20240711_update_constraints.sql

# Include descriptive comments
-- Add priority system to RSS feeds
-- Purpose: Homepage prioritization
-- Author: Your Name

# Use idempotent operations
ALTER TABLE table ADD COLUMN IF NOT EXISTS col TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON table(col);

# Commit after reviewing preview
```

### ✗ Don't Do This

```powershell
# Multiple unrelated changes in one file
-- Avoid mixing business logic changes

# No comments
-- Always explain what and why

# Non-idempotent operations
ALTER TABLE table ADD COLUMN col TEXT;  -- Will fail if column exists
CREATE INDEX idx_name ON table(col);    -- Will fail if index exists
```

---

## Integration with CI/CD

For automatic deployment via GitHub Actions:

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

## Monitoring

### Check Logs

```powershell
# View migration log
cat supabase-migration.log

# Follow log in real-time (PowerShell)
Get-Content supabase-migration.log -Tail 20 -Wait
```

### Check Database

```powershell
# View migration status
supabase status

# View applied migrations
supabase migration list
```

### Verify in Supabase Dashboard

1. Go to: https://app.supabase.com
2. Select project: dvvbafgpluxvaieguiwm
3. SQL Editor
4. Run: `SELECT * FROM pg_migrations ORDER BY name DESC;`

---

## Rollback

If a migration causes issues:

```powershell
# Revert commit
git revert <commit-hash>

# This creates a new commit that undoes changes
# You can then commit a fix or alternative migration
```

---

## Documentation

| Document | Read This When |
|----------|---|
| `AUTO_MIGRATION_QUICK_START.md` | You want to get started in 5 minutes |
| `SUPABASE_AUTO_MIGRATION_SETUP.md` | You want detailed setup instructions |
| `GIT_HOOKS_SETUP_COMPLETE.md` | You want an overview (this file) |

---

## Quick Reference

```powershell
# Setup (do once)
npm install -g supabase
supabase link --project-ref dvvbafgpluxvaieguiwm
supabase status

# Usage (every migration)
# 1. Create migration file in supabase/migrations/
# 2. git add supabase/migrations/XXX.sql
# 3. git commit -m "description"
# 4. Press 'y' when asked
# 5. Done! Database updated.

# Manual (if hooks don't work)
supabase db push --dry-run
supabase db push
```

---

## Summary

✅ **Hooks are installed and ready**
- Pre-commit validates SQL before commit
- Post-commit applies migrations to Supabase

✅ **Setup is simple (5 minutes)**
- Install Supabase CLI
- Link your project
- You're done!

✅ **Usage is automatic**
- Commit migration files
- Hooks handle the rest

✅ **Fully documented**
- Quick start guide
- Detailed setup guide
- Troubleshooting included

---

## Next Action

**Read:** `AUTO_MIGRATION_QUICK_START.md` (5 minutes)

Then you'll be ready to use auto-migration!

---

## Questions?

All answers are in the documentation files. Check:
- `AUTO_MIGRATION_QUICK_START.md` - for quick answers
- `SUPABASE_AUTO_MIGRATION_SETUP.md` - for detailed info
- `.git/hooks/pre-commit` - to see validation logic
- `.git/hooks/post-commit` - to see migration logic

---

**Status:** ✅ Ready to use  
**Installed:** 4 hooks + 3 documentation files  
**Next:** Follow quick start guide  

🚀 **Automatic Supabase migrations on every git commit!**
