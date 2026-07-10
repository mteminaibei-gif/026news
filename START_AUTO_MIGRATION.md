# 🚀 START HERE - Automatic Supabase Migrations

**Your project is now set up for automatic database migrations on git commits.**

---

## ⚡ Get Started in 5 Minutes

### Step 1: Install Supabase CLI (2 minutes)

```powershell
npm install -g supabase
supabase --version
```

You should see: `supabase version X.X.X`

### Step 2: Link Your Project (2 minutes)

```powershell
supabase link --project-ref dvvbafgpluxvaieguiwm
```

When prompted, enter your database password:
- Find at: Supabase Dashboard → Settings → Database → Password
- Or use your access token

### Step 3: Verify Connection (1 minute)

```powershell
supabase status
```

You should see your project information and "Connected" status.

### ✅ Done!

Your auto-migration is now active and ready to use.

---

## 🔄 How It Works

### Every time you commit migration files:

```
Your action:           git commit supabase/migrations/*.sql
                              ↓
Pre-commit hook:       ✓ Validates SQL syntax
                              ↓
Post-commit hook:      ✓ Shows preview of changes
                              ↓
You confirm:           Press 'y' to apply OR 'n' to skip
                              ↓
Result:                ✓ Database updated automatically
```

---

## 📝 Use It Now

### Create a Migration

```powershell
# Create a new migration file
echo "-- Add test column
ALTER TABLE rss_feeds ADD COLUMN IF NOT EXISTS status TEXT;" `
  | Out-File supabase/migrations/20240711_add_status.sql

# Or use your editor to create:
# supabase/migrations/20240711_add_status.sql
```

### Commit It

```powershell
# Stage the file
git add supabase/migrations/20240711_add_status.sql

# Commit (hooks run automatically)
git commit -m "Add status column to RSS feeds"
```

### Watch the Magic

```
[Supabase] Validating SQL migrations...
[Supabase] ✓ Validated: 20240711_add_status.sql
[Supabase] Pushing migrations to Supabase...
[Supabase] Migration preview successful
Apply migrations? (y/n)
```

### Confirm

Press **`y`** to apply the migration to your Supabase database.

```
[Supabase] ✓ Migrations applied successfully
```

### 🎉 Done!

Your database is automatically updated. That's it!

---

## 📚 Documentation

| Doc | Read When | Time |
|-----|-----------|------|
| `AUTO_MIGRATION_QUICK_START.md` | You want quick setup | 5 min |
| `SUPABASE_AUTO_MIGRATION_SETUP.md` | You want details | 15 min |
| `AUTO_MIGRATION_CHECKLIST.md` | You want step-by-step | 10 min |
| `GIT_HOOKS_SETUP_COMPLETE.md` | You want full overview | 10 min |

---

## ✨ Key Features

✅ **Automatic Validation**
- SQL syntax checked before commit
- Prevents invalid migrations

✅ **Preview Before Apply**
- See what will change
- Review before committing to database

✅ **Confirmation Required**
- You control when to apply
- Not forced to apply if you say 'n'

✅ **Full Logging**
- All migrations logged to `supabase-migration.log`
- Easy to track what happened

✅ **Error Handling**
- Won't block your commits
- Can apply manually if hooks fail

✅ **Cross-Platform**
- Works on Windows, Mac, Linux
- Git hooks + batch scripts included

---

## 🆘 Troubleshooting

### "Supabase CLI not found"
```powershell
npm install -g supabase
supabase --version
```

### "Project not linked"
```powershell
supabase link --project-ref dvvbafgpluxvaieguiwm
supabase status
```

### "Hooks not running"
- Restart your terminal
- Check: `ls .git/hooks/` (should show pre-commit and post-commit)

### "SQL validation failed"
- Check your SQL syntax
- Make sure the file isn't empty
- Use idempotent operations: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`

---

## 💡 Pro Tips

### Skip Hooks for One Commit
```powershell
git commit --no-verify -m "Skip migration check"
```

### Migrate Manually
```powershell
supabase db push --dry-run    # Preview only
supabase db push              # Apply for real
```

### View Migration History
```powershell
supabase migration list
```

### Check Database Status
```powershell
supabase status
```

---

## 🎯 Workflow

### For Every Database Change:

1. **Create migration file**
   ```powershell
   supabase/migrations/YYYYMMDDHHMMSS_description.sql
   ```

2. **Add your SQL**
   ```sql
   -- Descriptive comment about what this does
   ALTER TABLE table_name ADD COLUMN ...;
   ```

3. **Commit the file**
   ```powershell
   git add supabase/migrations/YYYYMMDDHHMMSS_description.sql
   git commit -m "Describe the change"
   ```

4. **Confirm the migration**
   ```
   Press 'y' when asked
   ```

5. **Done!**
   ```
   Database is automatically updated
   ```

---

## ✅ Checklist

Before using, ensure you have:

- [ ] Supabase CLI installed: `supabase --version`
- [ ] Project linked: `supabase status` shows your project
- [ ] Connection verified: Can see project info and "Connected"
- [ ] Git hooks in place: `.git/hooks/pre-commit` and `post-commit` exist

---

## 🎓 Best Practices

### ✓ Do This

- ✅ Use descriptive migration names: `20240711_add_priority_system.sql`
- ✅ Include comments in SQL: `-- Add priority column for homepage sorting`
- ✅ Use idempotent operations: `ALTER TABLE IF EXISTS`, `CREATE IF NOT EXISTS`
- ✅ One change per migration file
- ✅ Review the preview before applying

### ✗ Don't Do This

- ❌ Don't create empty migration files
- ❌ Don't mix multiple unrelated changes
- ❌ Don't skip validation (use hooks!)
- ❌ Don't use non-idempotent operations

---

## 🔧 Configuration

### Disable Hooks Temporarily
```powershell
git commit --no-verify -m "Bypass hooks"
```

### Disable Confirmation Prompt
Edit `.git/hooks/post-commit` and uncomment the line that says:
```bash
# REPLY="y"  # Uncomment to always apply without asking
```

### Disable Hooks Permanently
```powershell
Rename-Item .git/hooks/post-commit .git/hooks/post-commit.bak
Rename-Item .git/hooks/pre-commit .git/hooks/pre-commit.bak
```

---

## 📊 Common Commands

```powershell
# Check status
supabase status

# List all migrations
supabase migration list

# Manual migration (preview)
supabase db push --dry-run

# Manual migration (apply)
supabase db push

# View logs
cat supabase-migration.log

# Link project (if needed)
supabase link --project-ref dvvbafgpluxvaieguiwm
```

---

## 🚀 Ready?

Everything is set up. You just need to:

1. Read this file (✓ Done!)
2. Install Supabase CLI: `npm install -g supabase`
3. Link your project: `supabase link --project-ref dvvbafgpluxvaieguiwm`
4. Verify: `supabase status`
5. Start committing migration files!

---

## 📞 Need Help?

**Quick answer?**
- Check: `AUTO_MIGRATION_QUICK_START.md`

**Step-by-step guide?**
- Read: `AUTO_MIGRATION_CHECKLIST.md`

**Detailed information?**
- Read: `SUPABASE_AUTO_MIGRATION_SETUP.md`

**Full overview?**
- Read: `GIT_HOOKS_SETUP_COMPLETE.md`

---

## 🎉 You're All Set!

Your Supabase database will now automatically migrate whenever you commit migration files.

**Happy coding!** 🚀
