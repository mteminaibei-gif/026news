# ⚡ QUICK DEPLOY - 2 Minutes

## 🎯 Deploy Your Schema Migration in 2 Minutes

### Step 1: Open Supabase Dashboard
**Link:** https://supabase.com/dashboard

Log in and select your project: **026connet!**

---

### Step 2: Navigate to SQL Editor
In the left sidebar, click **SQL Editor** (should show a little SQL icon)

---

### Step 3: Create New Query
Click the **+ New Query** button at the top

---

### Step 4: Copy the Migration SQL
The migration file is ready at:
```
supabase/migrations/20240711_schema_enhancements.sql
```

**Copy ALL of it** (373 lines of SQL)

---

### Step 5: Paste into SQL Editor
- Paste into the SQL editor window
- You should see the SQL highlighted with syntax colors

---

### Step 6: Execute!
Click the **Execute** button (or press `Ctrl+Enter`)

Wait ~5-10 seconds...

---

### Step 7: Verify Success ✅
You should see: `Executed successfully` at the bottom

---

## 🔍 Verify It Worked

### Check Tables Created
Go to **Database** → **Tables** in sidebar
Look for these new tables:
- `audit_log`
- `api_rate_limits`
- `article_likes`
- `user_follows`
- `article_versions`
- `article_tags`
- `article_tag_mappings`
- `content_moderation`
- `email_templates`

### Check Views Created
Go to **Database** → **Views**
Look for:
- `v_trending_articles`
- `v_top_journalists`

### Run Quick Test
Go back to **SQL Editor** and run:
```sql
SELECT COUNT(*) FROM article_likes;
```

Should return: `0` (empty table, which is correct)

---

## 🆘 If It Fails

### Error: "Table already exists"
→ The migration already ran. Check `supabase.migrations` table:
```sql
SELECT * FROM supabase.migrations 
WHERE name LIKE '%20240711%';
```

### Error: "Permission denied"
→ Make sure you're logged in with the right account
→ Check your Supabase organization permissions

### Error: "Syntax error"
→ Try running the migration in smaller chunks
→ Go to **SQL Editor** → copy first half, execute, then second half

### Other Error
→ Copy the error message
→ Paste in the SQL editor to see full details
→ Google the error or check Supabase docs

---

## 📞 Need Help?

**Files in your repo:**
- `SCHEMA_ENHANCEMENTS.md` — Full technical documentation
- `DEPLOYMENT_GUIDE.md` — Detailed deployment guide
- `deploy-to-supabase.ps1` — PowerShell automation script

**External Help:**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.io

---

## ✨ What Gets Deployed

**All of this in one go:**
- ✅ Fixes RLS bug in `saved_articles` (users can now save articles!)
- ✅ Adds 9 new tables for engagement tracking
- ✅ Adds engagement columns (like_count, share_count, save_count, etc.)
- ✅ Adds 5 helper functions
- ✅ Adds 3 automatic triggers
- ✅ Creates 2 analytics views
- ✅ Enables realtime for 4 tables

**Total size:** 373 lines  
**Execution time:** ~5-10 seconds  
**Reversible:** Yes (via Supabase rollback in dashboard)

---

**Ready? Go to https://supabase.com/dashboard and follow the 7 steps above!** 🚀
