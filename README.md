# 026connet! — Next.js + Supabase Platform

A full-stack news platform with freelance journalism, content moderation, and monetization. Built with **Next.js 16**, **TailwindCSS v4**, and **Supabase**.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, SSR, TypeScript) |
| Styling | TailwindCSS v4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email, OAuth, magic links) |
| Storage | Supabase Storage (images) |
| State | React Query (@tanstack/react-query) |
| Payments | Stripe / M-Pesa (configured in .env) |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Project Structure

```
026connet!-nextjs/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── login/page.tsx              # Auth page
│   ├── article/[slug]/page.tsx     # Article page
│   ├── journalist/
│   │   ├── layout.tsx              # Journalist layout w/ sidebar
│   │   ├── dashboard/page.tsx      # Journalist dashboard
│   │   └── create/page.tsx         # Create post editor
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout w/ sidebar
│   │   ├── dashboard/page.tsx      # Admin dashboard
│   │   └── review/[id]/page.tsx    # Article review page
│   └── api/
│       ├── articles/route.ts        # GET/POST articles
│       ├── articles/review/route.ts # POST review action
│       ├── auth/login/route.ts      # POST login
│       ├── auth/signup/route.ts     # POST signup
│       └── analytics/route.ts       # GET analytics
├── components/
│   ├── layout/   Navbar, Sidebar, Footer, Topbar
│   ├── news/     ArticleCard
│   └── ui/       Badge, StatCard, BarChart
├── lib/
│   ├── supabase/
│   │   ├── client.ts    # Browser Supabase client
│   │   ├── server.ts    # Server Supabase client + admin client
│   │   ├── middleware.ts # Auth session refresh
│   │   └── types.ts     # Full DB type definitions
│   ├── mock-data.ts     # Demo data (replace with Supabase queries)
│   └── utils.ts         # cn, formatDate, slugify, etc.
├── supabase/
│   └── migrations/001_initial_schema.sql  # Full DB schema + RLS
└── middleware.ts        # Route protection
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and API keys from **Settings → API**

### 3. Configure environment variables

Copy `.env.example` and fill in your values:
```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=your-project-ref
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# M-Pesa / Daraja
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORTCODE=123456
MPESA_PASSKEY=your-mpesa-passkey

# Optional analytics / monitoring
NEXT_PUBLIC_ADSENSE_ID=ca-pub-...
SENTRY_DSN=
LOGFLARE_SOURCE_TOKEN=
```

Use environment variables securely in Vercel or GitHub Actions; do not commit secrets to source control.

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo (without Supabase)

The app runs fully on mock data out of the box. Demo login shortcuts are on the login page, or navigate directly:

| URL | Page |
|---|---|
| `/` | Homepage |
| `/login` | Login / Signup |
| `/article/solar-technology-breakthrough` | Article page |
| `/journalist/dashboard` | Journalist dashboard |
| `/journalist/create` | Create article |
| `/admin/dashboard` | Admin dashboard |
| `/admin/review/3` | Review pending article |

## Connecting Supabase

Each API route has a commented block showing the Supabase query to replace the mock data. Search for `// When Supabase is configured` across the codebase.

Example in `app/api/articles/route.ts`:
```ts
// Replace mock with:
const supabase = await createClient()
const { data, error } = await supabase
  .from('articles')
  .select('*, author:users(...), category:categories(name)')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
```

## Authentication Flow

1. User signs in via `/login` → Supabase Auth issues JWT
2. Middleware refreshes session on every request
3. `/journalist/*` and `/admin/*` routes are protected — unauthenticated users are redirected to `/login`
4. Role-based access is enforced via Supabase RLS policies in the migration file

## Database Schema

9 tables with full RLS policies:
- **users** — admin, journalist, reader roles
- **articles** — full workflow (draft → under_review → published/rejected)
- **categories** — Politics, Business, Tech, Science, Entertainment, Sports, Freelance
- **comments** — reader engagement with moderation states
- **earnings** — per-article revenue tracking
- **review_workflow** — admin audit trail for every review action
- **subscriptions** — Stripe/M-Pesa subscription management
- **sources** — RSS feed integrations (Reuters, BBC, CNN)
- **analytics** — views, likes, shares, comment counts per article

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## CI/CD with GitHub Actions

This repo includes a GitHub Actions workflow in `.github/workflows/deploy.yml` that:
- runs ESLint and TypeScript checks
- installs dependencies and builds the Next.js app
- optionally pushes Supabase migrations using `supabase db push`
- deploys previews for pull requests and production on `main`

Configure the following secrets in GitHub:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_REF`
- `NEXT_PUBLIC_APP_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

For secure M-Pesa or payment storage, use Vercel environment variables or Supabase secrets rather than checked-in files.

Add your environment variables in **Vercel Dashboard → Settings → Environment Variables**.

Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL.

## Payments

### Stripe
Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`.
Use Stripe's subscription API for premium/pro plans.

### M-Pesa (East Africa)
Set `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, and `MPESA_PASSKEY`.
Use the Daraja API for STK push payments.

## License

MIT
