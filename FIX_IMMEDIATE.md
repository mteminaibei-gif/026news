# ✅ User Profile RLS Fix - Correct SQL

**Error:** `syntax error at or near "NOT"`

**Root Cause:** Supabase PostgreSQL doesn't support `IF NOT EXISTS` with `CREATE POLICY`. We need to drop and recreate.

---

## ⚡ Correct SQL Fix

Copy and paste **exactly this**:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Service can create users" ON public.users;

-- Create new INSERT policies
CREATE POLICY "Users can create own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Service can create users" ON public.users
  FOR INSERT WITH CHECK (auth_id IS NOT NULL);
```

---

## 🚀 How to Apply

1. Open https://supabase.com/dashboard
2. Select **026connet!** project
3. Click **SQL Editor** → **+ New Query**
4. **Paste the SQL above** (exactly as shown)
5. Click **Execute**
6. ✅ Done! Profile creation should work now.

---

## 🧪 Test It

Try creating a user:

```javascript
const { data, error } = await supabase
  .from('users')
  .insert({
    auth_id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'reader'
  });

// Should work now - no RLS error!
```

---

## 📝 What Changed

**Before (Wrong):**
```sql
CREATE POLICY IF NOT EXISTS "..." -- ❌ Not supported
```

**After (Correct):**
```sql
DROP POLICY IF EXISTS "...";     -- ✅ Drop first
CREATE POLICY "...";              -- ✅ Then create
```

---

**Status:** ✅ Ready to deploy. Use the corrected SQL above.
