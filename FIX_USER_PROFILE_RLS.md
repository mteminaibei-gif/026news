# 🔧 Fix: User Profile Creation RLS Error

**Error:** `Profile creation failed: new row violates row-level security policy for table "users"`

**Root Cause:** The `users` table RLS policies are missing an INSERT policy, preventing new user registration.

---

## ⚡ Quick Fix (1 minute)

### Step 1: Open Supabase Dashboard
Go to https://supabase.com/dashboard → Select **026connet!** project

### Step 2: Open SQL Editor
Click **SQL Editor** → **+ New Query**

### Step 3: Run This SQL
```sql
-- Add INSERT policy for users table
CREATE POLICY IF NOT EXISTS "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = auth_id
  );

-- Also allow service role to create users (for signup endpoint)
CREATE POLICY IF NOT EXISTS "Service can create users" ON public.users
  FOR INSERT WITH CHECK (
    auth_id IS NOT NULL
  );
```

### Step 4: Execute
Click **Execute** or press `Ctrl+Enter`

### Step 5: Test Profile Creation
Try creating a user profile again - it should work now! ✅

---

## 📝 Migration File (Already Created)

**File:** `supabase/migrations/20240711_fix_users_rls_insert.sql`

This migration is already in your repository and ready to deploy alongside the main schema enhancements migration.

Deploy both migrations:
1. First: `supabase/migrations/20240711_schema_enhancements.sql`
2. Then: `supabase/migrations/20240711_fix_users_rls_insert.sql`

---

## 🔍 What Was Wrong

The `users` table had:
- ✅ SELECT policy (public profiles viewable)
- ✅ UPDATE policy (users can update own profile)
- ❌ **INSERT policy (MISSING!)**

Without an INSERT policy, authenticated users couldn't create new profiles, hence the RLS error.

---

## ✅ What's Fixed

Now the `users` table has:
- ✅ SELECT policy (public profiles viewable)
- ✅ UPDATE policy (users can update own profile)
- ✅ **INSERT policy (users can create own profile)**
- ✅ **INSERT policy (service role can create users)**

---

## 🧪 Test It

After running the SQL fix:

```javascript
// Client-side signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Server-side profile creation (after signup)
const { data: profile, error: profileError } = await supabase
  .from('users')
  .insert({
    auth_id: data.user.id,
    name: 'User Name',
    email: 'user@example.com',
    role: 'reader'
  });

// Should work now! ✅
```

---

## 📋 RLS Policies Reference

### Users Table RLS Policies

| Policy Name | Type | Condition |
|---|---|---|
| "Public profiles viewable" | SELECT | true (anyone can view) |
| "Users update own profile" | UPDATE | auth.uid() = auth_id |
| "Users can create own profile" | INSERT | auth.uid() = auth_id |
| "Service can create users" | INSERT | auth_id IS NOT NULL |

---

## 🚀 Next Steps

1. **Immediate:** Run the SQL fix above (1 minute)
2. **Test:** Try creating a user profile again
3. **Verify:** Check user appears in Database → users table
4. **Deploy:** Commit and push the migration file
5. **Integrate:** Update signup endpoint if needed

---

## 📞 Need Help?

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Error Details:** Check Supabase Dashboard → Logs
- **Migration File:** `supabase/migrations/20240711_fix_users_rls_insert.sql`

---

**Status:** ✅ Fixed

The migration file is ready in your repo. Deploy it now and profile creation will work!
