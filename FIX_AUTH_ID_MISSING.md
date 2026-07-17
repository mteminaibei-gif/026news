# 🔧 Fix: Column "auth_id" Does Not Exist

**Error:** `ERROR: column "auth_id" does not exist`

**Root Cause:** The initial migrations created the `users` table without the `auth_id` column, but later migrations try to reference it in RLS policies.

---

## ⚡ Quick Fix

You need to add the `auth_id` column to the `users` table.

### Step 1: Open Supabase Dashboard
Go to https://supabase.com/dashboard → Select **026connet!** project

### Step 2: Open SQL Editor
Click **SQL Editor** → **+ New Query**

### Step 3: Run This SQL

```sql
-- Add auth_id column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
```

### Step 4: Execute
Click **Execute** or press `Ctrl+Enter`

✅ Done! The column is added.

---

## 📋 Deployment Order

When deploying all migrations, they should run in this order:

1. **Initial schema** (creates base tables)
2. **Add auth_id** ← **DO THIS FIRST** (adds missing column)
   - `supabase/migrations/20240711_add_auth_id_to_users.sql`
3. **Other migrations** (can now reference auth_id safely)
4. **Schema enhancements** (our new migration)
5. **Fix users RLS** (our RLS policy additions)

---

## 🔍 What Was Wrong

**Timeline of the Problem:**

1. Initial migrations created `users` table WITHOUT `auth_id` column
2. Later migrations (20240701) tried to use `auth_id` in RLS policies
3. RLS policies failed because column didn't exist

**Solution:**
Add the missing `auth_id` column early in the migration sequence.

---

## ✅ What auth_id Is Used For

`auth_id` is a **UUID** column that links to Supabase Auth:

```sql
-- RLS policies use it like this:
CREATE POLICY "check_user" ON users
  FOR UPDATE USING (auth.uid() = auth_id);
  
-- User creation uses it like this:
INSERT INTO users (auth_id, name, email, role)
VALUES (auth.uid(), 'John', 'john@example.com', 'reader');
```

---

## 📊 Column Details

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
```

- **Type:** UUID (matches Supabase auth.uid() return type)
- **Unique:** Yes (one-to-one with Supabase Auth user)
- **Nullable:** Yes (for systems that don't use auth)
- **Purpose:** Link app users to Supabase authentication

---

## 🧪 Verify It Works

After adding the column:

```sql
-- Check column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'auth_id';

-- Should return: auth_id
```

---

## 📁 Migration File

Already created and pushed:
- `supabase/migrations/20240711_add_auth_id_to_users.sql`

This migration is in your repository and ready to deploy.

---

## 🚀 Full Deployment Sequence

When you deploy everything, run in this order:

```
1. supabase/migrations/20240711_add_auth_id_to_users.sql         ← Do this FIRST
2. supabase/migrations/20240711_schema_enhancements.sql
3. supabase/migrations/20240711_fix_users_rls_insert.sql
```

---

**Status:** ✅ Ready to fix. Run the SQL above immediately.
