# 🎓 Journalist Dashboard Access Guide

## Quick Start

### 1. Create a Journalist Account (Supabase)

Go to your Supabase project → **Authentication** → **Users** → **+ Create New User**

```
Email: journalist@026connet!.com (or your custom email)
Password: [Create a strong password]
```

### 2. Set the Role in Database

Go to **SQL Editor** → **New Query** and run:

```sql
INSERT INTO public.users (email, name, role)
VALUES ('journalist@026connet!.com', 'Your Name', 'journalist')
ON CONFLICT (email) DO UPDATE SET role = 'journalist';
```

### 3. Login and Access Dashboard

**URL**: `http://localhost:3000/login`
- Email: `journalist@026connet!.com`
- Password: [Yumy]

After login, you'll be automatically redirected to: `/journalist/dashboard`

---

## Dashboard Features

### 📰 Articles
**Path**: `/journalist/articles`

- View all your published articles
- See engagement metrics (views, comments, shares)
- Filter by date, category, status
- Search articles

### ✍️ Create Article
**Path**: `/journalist/create`

- Rich text editor (Markdown support)
- Upload featured image
- Set category and tags
- Schedule publication
- Add SEO metadata
- Preview before publishing

### 💰 Earnings
**Path**: `/journalist/earnings`

- Track revenue from your articles
- View by article, date range, category
- Payment history
- Withdrawal requests
- Monthly earnings charts

### 📊 Analytics
**Path**: `/journalist/analytics`

- Article views and engagement
- Reader demographics
- Traffic sources
- Performance trends
- Top performing articles

### 👥 Subscribers
**Path**: `/journalist/subscribers`

- List of subscribers to your newsletter
- Growth over time
- Export subscriber list
- Subscriber engagement metrics

### 👤 Profile
**Path**: `/journalist/profile`

- Edit your profile information
- Upload profile picture
- Add bio and social links
- Manage email preferences
- View public profile link

---

## Authentication & Security

### Role-Based Access Control

The journalist dashboard is protected by:

1. **Middleware Protection**
   - Checks if user is authenticated
   - Verifies role in database is `'journalist'`
   - Redirects unauthorized users to login

2. **Database Role**
   - Must have `role = 'journalist'` in `public.users` table
   - Role is verified on every protected page

3. **Session Management**
   - Supabase session tokens
   - Automatic logout after inactivity
   - Local storage of session state

### What Happens If...

| Scenario | Behavior |
|----------|----------|
| Not logged in | Redirected to `/login?redirect=/journalist/dashboard&error=login_required` |
| Logged in as reader | Redirected to `/login?error=unauthorized` |
| User profile deleted | Redirected to `/login?error=profile_not_found` |
| Session expired | Redirected to login, can resume work after re-auth |
| Wrong password | Login fails with error message |

---

## Features by Role

### Journalist-Only
- ✅ Create and edit articles
- ✅ View personal earnings
- ✅ Access personal analytics
- ✅ Manage subscriber list
- ✅ Edit personal profile
- ✅ Schedule articles

### Reader Access (Everyone)
- ✅ Read published articles
- ✅ View public journalist profiles
- ✅ Comment on articles
- ✅ Subscribe to journalists

### Admin-Only
- ✅ Review/approve articles
- ✅ Manage all users
- ✅ View platform analytics
- ✅ Manage content sources
- ✅ Handle payouts
- ✅ System settings

---

## Common Tasks

### Publishing Your First Article

1. Go to `/journalist/create`
2. Write your article in the editor
3. Add title, category, featured image
4. Click **Preview** to check formatting
5. Click **Publish Now** or **Schedule for Later**
6. View live at `/article/[your-slug]`

### Checking Your Earnings

1. Go to `/journalist/earnings`
2. Select date range
3. View breakdown by article
4. Request payout if applicable
5. Track payment status

### Growing Your Audience

1. Go to `/journalist/profile`
2. Update your bio with your background
3. Add social media links
4. Upload a professional profile photo
5. Share your profile link: `/journalists/[your-id]`

---

## Troubleshooting

### "Login failed"
- ✓ Check email and password are correct
- ✓ Verify account exists in Supabase Authentication
- ✓ Ensure password doesn't contain special characters that need escaping

### "Unauthorized" error
- ✓ Verify your `role` is set to `'journalist'` in the `public.users` table
- ✓ Check that the email matches in both auth and database
- ✓ Try logging out and back in

### "Profile not found"
- ✓ Create an entry in `public.users` table using the SQL insert above
- ✓ Ensure the email matches your authentication email exactly

### Dashboard loads but shows no data
- ✓ Check your Supabase connection in `.env.local`
- ✓ Verify the database tables have proper RLS policies
- ✓ Check browser console for API errors
- ✓ Ensure your user_id is correctly set in the `users` table

### Can't upload images
- ✓ Check file size (max 5MB)
- ✓ Verify file format (JPG, PNG, WebP)
- ✓ Check Supabase storage buckets are accessible
- ✓ Verify RLS policies allow uploads for authenticated users

---

## Database Requirements

Your Supabase `public.users` table must have:

```sql
-- Required fields
- id: bigint (primary key)
- email: text (unique)
- name: text
- role: text (must be 'journalist' for dashboard access)
- profile_image: text (nullable, URL to image)

-- Optional fields for enhanced features
- bio: text
- social_links: jsonb
- website: text
- created_at: timestamp
- updated_at: timestamp
```

---

## API Endpoints for Journalists

### Get Your Articles
```
GET /api/articles?journalist_id=YOUR_ID
```

### Create Article
```
POST /api/articles
Body: {
  title: string
  content: string
  category_id: number
  featured_image: string
  slug: string
  is_published: boolean
}
```

### Get Your Earnings
```
GET /api/journalist/earnings?user_id=YOUR_ID&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

### Get Your Analytics
```
GET /api/journalist/analytics?user_id=YOUR_ID
```

### Update Profile
```
POST /api/journalist/profile
Body: {
  name: string
  bio: string
  profile_image: string
  social_links: object
}
```

---

## Best Practices

### 📝 Writing Articles
- Use clear, descriptive titles
- Add relevant tags (max 5)
- Include a featured image
- Write compelling meta description
- Break content into sections with headers
- Proofread before publishing

### 📊 Growing Your Audience
- Publish consistently (2-3x per week recommended)
- Engage with comments
- Cross-promote on social media
- Share your profile link
- Build email list through newsletter
- Collaborate with other journalists

### 💰 Maximizing Earnings
- Focus on evergreen content
- Publish in high-demand categories
- Engage readers in comments
- Build a loyal subscriber base
- Offer exclusive content to subscribers
- Optimize for SEO

---

## Support

For issues or questions:

1. **Check TESTING.md** for setup issues
2. **Review CHANGES.md** for recent updates
3. **Check your browser console** for error messages
4. **Verify .env.local** has correct Supabase credentials
5. **Check Supabase logs** for database errors

---

**Last Updated**: 2026-07-10  
**Version**: 1.0  
**Status**: ✅ Production Ready
