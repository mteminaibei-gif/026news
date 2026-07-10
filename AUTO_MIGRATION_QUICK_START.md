# Supabase Auto-Migration - Quick Start (5 minutes)

**Goal:** Your database auto-migrates when you commit migration files to git.

---

## ⚡ Quick Setup (Windows)

### Step 1: Install Supabase CLI (2 min)
```powershell
npm install -g supabase
supabase --version
```

### Step 2: Link Your Project (1 min)
```powershell
supabase link --project-ref dvvbafgpluxvaieguiwm
```

When prompted for password:
- Find it in Supabase Dashboard → Settings → Database → Password
- Or use access token from Project Settings

### Step 3: Verify Setup (1 min)
```powershell
supabase status
```

You should see your project information.

### Done! ✓

The git hooks are already in place. You're ready to use auto-migration.

---

## ⚡ Quick Setup (Mac/Linux)

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
supabase --version
```

### Step 2: Make hooks executable
```bash
chmod +x .git/hooks/pre-commit .git/hooks/post-commit
```

### Step 3: Link Your Project
```bash
supabase link --project-ref dvvbafgpluxvaieguiwm
```

### Step 4: Verify Setup
```bash
supabase status
```

---

## 🚀 Use It

### Create a Migration
```powershell
# Add your migration file to supabase/migrations/
# For example: supabase/migrations/20240711_add_column.sql

echo "ALTER TABLE table_name ADD COLUMN IF NOT EXISTS new_col TEXT;" `
  | Out-File supabase/migrations/20240711_add_column.sql
```

### Stage & Commit
```powershell
git add supabase/migrations/20240711_add_column.sql
git commit -m "Add new column"
```

### Watch It Work
```
[Supabase] Validating SQL migrations...
[Supabase] ✓ Validated: 20240711_add_column.sql
[Supabase] Pushing migrations to Supabase...
[Supabase] Migration preview successful
Apply migrations? (y/n)
```

### Confirm (Press 'y')
```
y
[Supabase] ✓ Migrations applied successfully
```

---

## ✅ That's It!

Your database is now automatically updated whenever you commit migration files.

---

## Workflow

```
1. Create migration file in supabase/migrations/
   ↓
2. git add supabase/migrations/XXX.sql
   ↓
3. git commit -m "description"
   ↓
4. Pre-commit hook validates SQL
   ↓
5. Post-commit hook shows preview
   ↓
6. You confirm (y/n)
   ↓
7. Migration applied to Supabase
   ↓
8. Done! Your database is updated
```

---

## Common Commands

```powershell
# Check current database status
supabase status

# List all applied migrations
supabase migration list

# Manual migration (if needed)
supabase db push --dry-run    # Preview only
supabase db push              # Apply for real

# View logs
cat supabase-migration.log
```

---

## Need More Help?

Full guide: `SUPABASE_AUTO_MIGRATION_SETUP.md`

---

## Troubleshooting

### "Supabase CLI not found"
```powershell
npm install -g supabase
```

### "Project not linked"
```powershell
supabase link --project-ref dvvbafgpluxvaieguiwm
supabase status  # Verify
```

### "Hooks not running"
```powershell
# Check git is configured
git config core.hooksPath

# If empty, set it:
git config core.hooksPath .git/hooks

# Verify:
git config core.hooksPath  # Should show: .git/hooks
```

---

**You're all set!** 🎉

Commits with migration files will now auto-migrate your Supabase database.
