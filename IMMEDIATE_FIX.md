# 🚨 IMMEDIATE FIX - User Profile RLS Error

**Error You're Getting:**
```
Profile creation failed: new row violates row-level security policy for table "users"
```

**Fix Time:** 1 minute

---

## ⚡ Quick Fix Right Now

### Copy This SQL:
```sql
CREATE POLICY IF NOT EXISTS "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY IF NOT EXISTS "Service can create users" ON public.users
  FOR INSERT WITH CHECK (auth_id IS NOT NULL);
```

### Run It:
1. Open https://supabase.com/dashboard
2. Select **026connet!** project
3. Go to **SQL Editor** → **+ New Query**
4. **Paste the SQL above**
5. Click **Execute**

### Done! ✅
Try creating a user profile - it should work now.

---

## 📋 What Happened?

The `users` table was missing an **INSERT policy** in its RLS configuration.

**Was:**
- ✅ Can SELECT (read profiles)
- ✅ Can UPDATE (edit own profile)
- ❌ Cannot INSERT (create new profile) ← **THIS WAS THE PROBLEM**

**Now:**
- ✅ Can SELECT (read profiles)
- ✅ Can UPDATE (edit own profile)
- ✅ Can INSERT (create own profile) ← **FIXED**

---

## 📁 Permanent Fix

Migration file already created and pushed:
- `supabase/migrations/20240711_fix_users_rls_insert.sql`

This will be deployed with your other migrations.

**Deployment order:**
1. `20240711_schema_enhancements.sql` (main migration)
2. `20240711_fix_users_rls_insert.sql` (RLS fix)

---

## 🧪 Test

After applying the fix:

```javascript
// Try this in your app
const { data, error } = await supabase
  .from('users')
  .insert({
    auth_id: 'user-uuid-here',
    name: 'Test User',
    email: 'test@example.com',
    role: 'reader'
  });

// Should work now! No RLS error.
```

---

## 📞 Questions?

See `FIX_USER_PROFILE_RLS.md` for detailed explanation and troubleshooting.

---

**Status:** ✅ Can deploy immediately to fix this issue.
