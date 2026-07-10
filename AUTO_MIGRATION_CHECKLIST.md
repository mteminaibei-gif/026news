# Auto-Migration Setup Checklist

Follow this checklist to get auto-migration working in 5 minutes.

---

## ✅ Pre-Setup Verification

- [ ] You're in the project root directory
- [ ] You have git installed
- [ ] You have Node.js installed

Run:
```powershell
git --version
node --version
```

---

## ✅ Installation

### 1. Install Supabase CLI

- [ ] Open PowerShell or Terminal
- [ ] Run: `npm install -g supabase`
- [ ] Verify: `supabase --version`

**Expected output:** `supabase version X.X.X`

### 2. Link Your Supabase Project

- [ ] Run: `supabase link --project-ref dvvbafgpluxvaieguiwm`
- [ ] Enter your Supabase database password
  - Find it at: Supabase Dashboard → Settings → Database
  - Or use your access token

**Expected output:** Connected to project

### 3. Verify Connection

- [ ] Run: `supabase status`
- [ ] You should see your project information

**Expected output:** Project details and connection status

---

## ✅ Git Configuration

- [ ] Git hooks are in `.git/hooks/`
- [ ] Hooks are executable (auto-handled)
- [ ] Git is configured to use hooks

Run:
```powershell
git config core.hooksPath
```

**Expected output:** `.git/hooks` (or empty, which is fine)

---

## ✅ Test the Hooks

### Create a Test Migration

- [ ] Create file: `supabase/migrations/20240711_test.sql`
- [ ] Add content:
```sql
-- Test migration
SELECT 1;
```

### Commit and Test

- [ ] Run: `git add supabase/migrations/20240711_test.sql`
- [ ] Run: `git commit -m "Test auto-migration"`

**Expected output:**
```
[Supabase] Validating SQL migrations...
[Supabase] ✓ Validated: 20240711_test.sql
[Supabase] Pushing migrations to Supabase...
[Supabase] Migration preview successful
Apply migrations? (y/n)
```

### Confirm Application

- [ ] Press: `y`

**Expected output:**
```
[Supabase] ✓ Migrations applied successfully
```

---

## ✅ Real-World Test

### Create a Real Migration

- [ ] Create file: `supabase/migrations/20240711_real.sql`
- [ ] Add a real migration:
```sql
-- Add a test column
ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS test_col TEXT;
```

### Apply It

- [ ] Stage: `git add supabase/migrations/20240711_real.sql`
- [ ] Commit: `git commit -m "Add test column"`
- [ ] Confirm: Press `y` when asked

### Verify It Worked

- [ ] Check logs: `cat supabase-migration.log`
- [ ] Check database: `supabase status`

---

## ✅ Clean Up

### Remove Test Migrations

You can either:

**Option A: Keep them** (no action needed)

**Option B: Remove test files**
```powershell
git rm supabase/migrations/20240711_test.sql
git rm supabase/migrations/20240711_real.sql
git commit -m "Remove test migrations"
```

**Option C: Revert in Supabase**
- Manually in Supabase Dashboard → SQL Editor
- Or create a rollback migration

---

## ✅ Production Ready

Your setup is complete and ready to use when:

- [x] Supabase CLI installed and verified
- [x] Project linked and connected
- [x] Git hooks in place
- [x] Test migration applied successfully
- [x] You can see migration in logs

---

## ✅ Ongoing Usage

For every database migration:

1. [ ] Create migration file in `supabase/migrations/`
2. [ ] Add valid SQL with comments
3. [ ] Stage: `git add supabase/migrations/*.sql`
4. [ ] Commit: `git commit -m "description"`
5. [ ] Confirm when prompted: Press `y`
6. [ ] Done! Database is updated

---

## ✅ Troubleshooting Checklist

### Problem: Supabase CLI not found

- [ ] Run: `npm install -g supabase`
- [ ] Run: `supabase --version`
- [ ] Still not working? Try restarting PowerShell/Terminal

### Problem: Project not linked

- [ ] Run: `supabase link --project-ref dvvbafgpluxvaieguiwm`
- [ ] Enter your database password
- [ ] Run: `supabase status`

### Problem: Hooks not running

- [ ] Check `.git/hooks/` directory exists
- [ ] Check files `pre-commit` and `post-commit` exist
- [ ] Try restarting git: `git init` (or close/reopen terminal)

### Problem: Migration validation fails

- [ ] Check SQL syntax is valid
- [ ] Ensure migration file is not empty
- [ ] Ensure migration file name matches: `YYYYMMDDHHMMSS_description.sql`

### Problem: Database connection error

- [ ] Verify project is linked: `supabase status`
- [ ] Check database password is correct
- [ ] Check internet connection
- [ ] Check Supabase status: https://status.supabase.com

---

## ✅ Common Tasks

### Skip Migration for One Commit

```powershell
git commit --no-verify -m "Bypass hooks"
```

### Migrate Manually

```powershell
supabase db push --dry-run    # Preview
supabase db push              # Apply
```

### View Migration History

```powershell
supabase migration list
```

### Disable Hooks Temporarily

```powershell
Rename-Item .git/hooks/post-commit .git/hooks/post-commit.bak
# Then re-enable later:
Rename-Item .git/hooks/post-commit.bak .git/hooks/post-commit
```

---

## ✅ Documentation Files

Quick reference:
- **Quick Start:** `AUTO_MIGRATION_QUICK_START.md` (5 min)
- **Detailed:** `SUPABASE_AUTO_MIGRATION_SETUP.md` (comprehensive)
- **Overview:** `GIT_HOOKS_SETUP_COMPLETE.md` (summary)

---

## ✅ Success Indicators

You're all set when:

✅ `npm install -g supabase` works  
✅ `supabase status` shows your project  
✅ Committing migrations triggers hooks  
✅ You see preview before applying  
✅ Database updates after confirmation  

---

## ✅ Final Status

**Setup Complete?** → Check all boxes above

**Ready to Use?** → Yes! Commit migration files and they'll auto-apply.

**Need Help?** → Read `AUTO_MIGRATION_QUICK_START.md`

---

**That's it! You're ready to use automatic Supabase migrations.** 🎉

Every time you commit a migration file, it will:
1. ✓ Validate the SQL
2. ✓ Show you what will change
3. ✓ Ask for confirmation
4. ✓ Apply to Supabase automatically

Happy coding! 🚀
