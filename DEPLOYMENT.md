# 026connet! — Deployment Guide

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Vercel](https://vercel.com) account
- GitHub repository connected to Vercel

---

## 1. Supabase Setup

### Apply the database schema

```bash
# Option A — Supabase SQL Editor
# Paste the contents of supabase/schema.sql and run it.

# Option B — Supabase CLI
supabase db push --project-ref <your-project-ref>
```

### Seed demo accounts and RSS feeds

```bash
# Install dependencies first
npm install

# Seed admin, journalist, and bot accounts
npx tsx --env-file=.env.local seed.ts

# Seed Kenya & Africa media RSS feeds
npx tsx --env-file=.env.local seed-kenya-feeds.ts
```

### Required Supabase tables

The schema creates all these automatically:
- `users` — all platform users
- `articles` — published and draft articles
- `categories` — news categories
- `rss_feeds` — RSS feed sources (seeded with 30 feeds)
- `analytics` — per-article view/like/share stats
- `review_workflow` — editorial approval audit log
- `earnings`, `payout_records`, `payout_requests` — monetization
- `journalist_badges`, `journalist_rankings` — gamification

---

## 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the **required** variables:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `NEXT_PUBLIC_APP_URL` | Your production URL |
| `ADMIN_SIGNUP_SECRET` | Any secure random string |
| `CRON_SECRET` | Any secure random string |

---

## 3. Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mteminaibei-gif/026connet!)

### Manual deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Vercel environment variables

Set all variables from `.env.example` in:
**Vercel Dashboard → Project → Settings → Environment Variables**

The following are used at build time:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

---

## 4. Vercel Cron Job

The cron job fetches RSS feeds every 3 hours. It's already configured in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/fetch-feeds", "schedule": "0 */3 * * *" }]
}
```

Set `CRON_SECRET` in Vercel and optionally add it to the cron job's Authorization header via Vercel Cron configuration.

To fetch manually, go to `/admin/sources` → **⚡ Fetch All Now**.

---

## 5. GitHub Actions CI/CD

Set these secrets in **GitHub → Repo → Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | Your production URL |
| `SUPABASE_PROJECT_REF` | Your Supabase project ref (e.g. `rywyqushsk...`) |
| `VERCEL_TOKEN` | Vercel → Account → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account Settings → General |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General |

The pipeline runs automatically:
- On push to `main` → lint → build → deploy production
- On pull request to `main` → lint → build → deploy preview URL

---

## 6. Admin Access

After seeding:

| Role | Email | Password | URL |
|---|---|---|---|
| Admin | `admin@026connet!.com` | `Admin026!` | `/admin/dashboard` |
| Journalist | `journalist@026connet!.com` | `Journalist026!` | `/journalist/dashboard` |

**Change these passwords immediately after first login.**

---

## 7. Post-deployment checklist

- [ ] Supabase schema applied
- [ ] Demo accounts seeded
- [ ] Kenya RSS feeds seeded (`seed-kenya-feeds.ts`)
- [ ] All env vars set in Vercel
- [ ] GitHub Actions secrets set
- [ ] First RSS fetch triggered from `/admin/sources`
- [ ] Admin password changed
- [ ] Custom domain configured in Vercel (optional)
- [ ] Google Search Console — submit `sitemap.xml`
- [ ] Verify `/robots.txt` is accessible
- [ ] Test M-Pesa callback URL if using mobile payments
