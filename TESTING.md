# Testing Guide for 026connet!

## Setting Up Test Accounts

### Prerequisites
- Access to the Supabase dashboard (https://app.supabase.com)
- Your project URL and credentials (stored in `.env.local`)

### Creating Test Accounts via Supabase

1. **Navigate to Authentication**
   - Go to your Supabase project dashboard
   - Click **Authentication** → **Users**
   - Click the **+ Create New User** button

2. **Create Admin Account**
   - Email: `admin@026connet!.com`
   - Password: (create a secure password and store it safely)
   - Click **Create User**

3. **Create Journalist Accounts**
   - Email: `journalist@026connet!.com` (or any custom email)
   - Password: (create a secure password)
   - Click **Create User**
   - Repeat for additional journalists

4. **Create Reader Account**
   - Email: `reader@026connet!.com`
   - Password: (create a secure password)
   - Click **Create User**

### Setting User Roles

After creating authentication users, you must set their roles in the database:

1. **Navigate to SQL Editor**
   - Go to your Supabase project
   - Click **SQL Editor** (on the left sidebar)
   - Click **New Query**

2. **Insert User Records**
   - Run this SQL to set roles for your test accounts:

```sql
-- Set admin role
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
WHERE email = 'admin@026connet!.com';

-- Insert into users table with admin role
INSERT INTO public.users (email, name, role)
VALUES ('admin@026connet!.com', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Insert journalist role
INSERT INTO public.users (email, name, role)
VALUES ('journalist@026connet!.com', 'Journalist User', 'journalist')
ON CONFLICT (email) DO UPDATE SET role = 'journalist';

-- Insert reader role
INSERT INTO public.users (email, name, role)
VALUES ('reader@026connet!.com', 'Reader User', 'reader')
ON CONFLICT (email) DO UPDATE SET role = 'reader';
```

### Testing Access

**Admin Dashboard**
- Navigate to `/admin/dashboard`
- Log in with `admin@026connet!.com` and your chosen password
- You should see the admin analytics and management panels

**Journalist Dashboard**
- Navigate to `/journalist/dashboard`
- Log in with `journalist@026connet!.com` and your chosen password
- You should see the journalist articles, earnings, and analytics panels

**Reader**
- Any account can read articles and browse publicly
- Visit `/profile` after logging in as a reader

## Accessing Journalist Dashboard

### Direct Access
- Once logged in as a journalist, visit: `http://localhost:3000/journalist/dashboard`
- Full access to:
  - Articles: View and create articles
  - Earnings: Track revenue from your content
  - Analytics: View article performance metrics
  - Subscribers: Manage your subscriber list
  - Profile: Edit your journalist profile

### Role-Based Protection
- The journalist routes are protected by middleware
- Only users with `role: 'journalist'` in the `users` table can access
- Attempting to access with a reader account will redirect to login

## Removing Test Accounts

To remove test accounts when moving to production:

1. Go to **Authentication** → **Users**
2. Click the user to delete
3. Click the **Delete** button
4. Delete corresponding records from the `public.users` table via SQL:

```sql
DELETE FROM public.users WHERE email = 'test-email@example.com';
```

## Environment Setup

Ensure these variables are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

For details, see `.env.example`.

## Troubleshooting

**"Login failed" error**
- Verify the user exists in both `auth.users` and `public.users`
- Check that the role is correctly set in the `public.users` table

**"Unauthorized" error**
- Confirm the user's role matches the route requirement
- Admin routes require `role: 'admin'`
- Journalist routes require `role: 'journalist'`

**"Profile not found" error**
- The user exists in authentication but not in the `public.users` database table
- Add the user record using the SQL insert commands above

## Next Steps

For production deployment:
1. Set strong, unique passwords for admin and journalist accounts
2. Use your organization's email addresses instead of @example.com
3. Implement two-factor authentication (2FA) for admin accounts
4. Consider using Supabase Auth integrations (OAuth, SAML) for enterprise accounts
5. Set up proper email verification for all accounts
