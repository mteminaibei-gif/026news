# 026connet! — Digital News & Freelance Journalism Platform

Kenya's full-stack news platform with freelance journalism, content moderation, monetization, and real-time social features. Built with **Next.js 16**, **React 19**, **Supabase**, and **TailwindCSS v4**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack, TypeScript) |
| UI | React 19, TailwindCSS v4, oklch color system |
| Styling | Glassmorphism design system, Space Grotesk + Newsreader fonts |
| Database | Supabase (PostgreSQL 15, 30+ tables, full RLS) |
| Auth | Supabase Auth (email/password, OAuth, magic links) |
| Storage | Supabase Storage (profile images, article media) |
| State | React Query (@tanstack/react-query v5) |
| Editor | TipTap rich text editor with AI enhancement |
| AI | Groq API (article enhancement, SEO analysis, content moderation) |
| Payments | M-Pesa Daraja (STK push, C2B, B2C payouts) |
| Realtime | Supabase Realtime (live feeds, notifications, presence) |
| Push | Web Push API with VAPID keys |
| Email | Gmail API integration (admin inbox) |
| Analytics | Vercel Analytics, custom per-article analytics |
| Monitoring | Sentry error tracking |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Features

### Core Platform
- **Landing page** — hero slideshow, trending stories, features grid, visitor-only
- **Social feed** (`/social`) — main hub for logged-in users with posts, compose, reactions
- **News feed** (`/news`) — categorized news with breaking news ticker and banner
- **Explore** (`/explore`) — discover content by category, trending, and recommendations
- **Articles** (`/articles`) — most popular longform articles
- **Radio** (`/radio`) — live radio stations with persistent player widget
- **TV** (`/tv`) — live TV streams with HLS playback and viewer metrics

### User Features
- **Profile** (`/profile`) — personal dashboard with Quick Links, stats, about
- **Settings** (`/settings`) — 6-tab settings (Account, Profile, Notifications, Privacy, Online Status, Danger)
- **Notifications** (`/notifications`) — real-time notifications with filters
- **Messages** (`/inbox`) — real-time messaging with conversation threads
- **Saved** (`/saved`) — bookmarked articles
- **Communities** (`/communities`) — topic-based communities
- **People** (`/people`) — user discovery with online status indicators
- **Search** (`/search`) — full-text search across articles, people, topics
- **Leaderboard** (`/leaderboard`) — top contributors ranking
- **Rankings** (`/rankings`) — journalist rankings by category

### Author/Journalist Features
- **Author apply** (`/author-apply`) — 3-step application for existing readers
- **Studio** (`/journalist`) — dashboard with 7 tabs (Overview, Articles, Analytics, Earnings, Followers, Subscribers, Profile)
- **Write article** (`/journalist/create`) — TipTap editor with AI enhance, SEO analyzer, category/tag management
- **Edit article** (`/journalist/edit/[id]`) — edit existing articles
- **Journalist profiles** (`/journalists/[id]`) — public journalist profiles

### Admin Features
- **Dashboard** (`/admin`) — overview with live feeds, stats, article management
- **Articles** (`/admin/articles`) — full article management with filters
- **Authors** (`/admin/journalists`) — journalist management and approvals
- **Users** (`/admin/users`) — user management table
- **Reviews** (`/admin/reviews`) — article review queue
- **Analytics** (`/admin/analytics`) — platform analytics dashboard
- **Earnings** (`/admin/earnings`) — revenue and payout tracking
- **Sources** (`/admin/sources`) — RSS feed management
- **Categories** (`/admin/categories`) — content category management
- **Notifications** (`/admin/notifications`) — admin notification center
- **Settings** (`/admin/settings`) — platform configuration
- **Write article** (`/admin/write`) — admin article creation
- **Gmail** (`/admin/gmail`) — integrated email inbox

### Technical Features
- **Auto-collapsing sidebar** — icons-only by default, expands on hover
- **Mobile-responsive** — off-canvas drawer sidebar, bottom tab bar
- **Dark/light themes** — oklch color system with CSS variables
- **Glassmorphism UI** — backdrop blur, glass layers, glow effects
- **Realtime presence** — online user indicators with heartbeat
- **SEO** — per-page metadata, OpenGraph, Twitter cards, sitemap, robots.txt
- **PWA** — web manifest, push notifications, service worker
- **Cookie consent** — GDPR-compliant consent banner
- **Error boundaries** — graceful error handling with retry

## Pages (60+ routes)

```
/                           Landing page (visitor-only)
/login                      Sign in (split-panel design)
/signup                     Create account (reader-only)
/onboarding                 Multi-step onboarding (5 steps)
/verify-email               Email verification
/forgot-password            Password reset

/social                     Social feed (main hub for logged-in users)
/explore                    Content discovery
/news                       News feed with categories
/articles                   Popular articles
/radio                      Live radio
/tv                         Live TV

/profile                    Personal dashboard
/settings                   Account settings (6 tabs)
/notifications              Notification center
/inbox                      Messages
/saved                      Bookmarked articles
/communities                Topic communities
/people                     User discovery
/search                     Full-text search
/leaderboard                Top contributors
/rankings                   Journalist rankings
/stats                      Personal reading stats
/activity                   Activity history

/article/[slug]             Article view with engagement
/category/[slug]            Category page
/authors/[id]               Journalist public profile

/author-apply               Become a writer (3-step form)
/journalist                 Studio dashboard (7 tabs)
/journalist/create          Write article
/journalist/edit/[id]       Edit article

/admin                      Admin dashboard
/admin/articles             Article management
/admin/journalists          Author management
/admin/users                User management
/admin/reviews              Article review queue
/admin/analytics            Platform analytics
/admin/earnings             Revenue tracking
/admin/sources              RSS feed management
/admin/categories           Category management
/admin/notifications        Admin notifications
/admin/settings             Platform settings
/admin/write                Admin article creation
/admin/gmail                Gmail inbox
/admin/edit/[id]            Edit article (admin)

/about                      About page
/contact                    Contact page
/privacy                    Privacy policy
/terms                      Terms of service
/moderation                 Content moderation
/rss-admin                  RSS feed admin
/mpesa-withdrawal           M-Pesa withdrawals
/subscribe                  Subscription plans
/chat                       Live chat
/audio-player               Audio player
/editorial/write            Editorial write
```

## Database Schema

30+ tables with full RLS policies:

| Table | Purpose |
|---|---|
| `users` | User accounts (admin, journalist, reader roles) with online status |
| `articles` | Content with full lifecycle (draft → review → published/rejected) |
| `categories` | Content categories (Politics, Business, Tech, etc.) |
| `comments` | Threaded comments with moderation states |
| `post_comments` | Social feed comments |
| `post_likes` | Social feed reactions |
| `posts` | Social feed posts |
| `thread_posts` | Discussion thread posts |
| `likes` / `article_likes` | Article engagement tracking |
| `analytics` | Per-article view/like/share/comment metrics |
| `earnings` | Per-article revenue tracking |
| `review_workflow` | Admin audit trail for review actions |
| `reviews` | Article review records |
| `subscriptions` | M-Pesa subscription management |
| `sources` | RSS feed integrations (Reuters, BBC, CNN) |
| `rss_feeds` | RSS feed configuration |
| `messages` | Direct messages between users |
| `threads` / `thread_members` | Conversation threads |
| `chat_rooms` / `chat_room_members` / `chat_messages` | Real-time chat |
| `notifications` | User notifications with actor metadata |
| `push_subscriptions` | Web push notification subscriptions |
| `saved_articles` | Bookmarked articles |
| `user_follows` | User follow relationships |
| `journalists` | Journalist profiles and applications |
| `journalist_badges` | Author badge system |
| `journalist_rankings` | Author ranking scores |
| `article_tags` / `article_tag_mappings` | Article tagging system |
| `article_versions` | Article version history |
| `article_reads` | Reading history |
| `article_regions` / `regions` | Geographic content targeting |
| `article_revenue` / `payout_records` / `payout_requests` | Payment tracking |
| `podcasts` | Podcast content |
| `recently_played` / `listen_history` / `watch_history` | Media consumption history |
| `site_settings` | Platform configuration (key-value) |
| `gmail_integration` | Gmail OAuth tokens |
| `email_templates` | Email template storage |
| `content_moderation` | AI moderation results |
| `password_reset_tokens` | Password reset tokens |
| `audit_log` | System audit trail |
| `api_rate_limits` | API rate limiting |

## Project Structure

```
026connet!-nextjs/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page (visitor-only)
│   ├── layout.tsx                # Root layout with global providers
│   ├── globals.css               # Design system (3400+ lines)
│   ├── social/page.tsx           # Social feed (main hub)
│   ├── news/page.tsx             # News feed
│   ├── explore/page.tsx          # Content discovery
│   ├── article/[slug]/page.tsx   # Article view
│   ├── journalist/               # Author studio
│   ├── admin/                    # Admin panel (14 pages)
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth (login, signup, onboard, apply)
│   │   ├── articles/             # Article CRUD + review
│   │   ├── payments/             # M-Pesa payments
│   │   ├── presence/             # Online status heartbeat
│   │   ├── settings/             # User settings
│   │   ├── shares/               # Share tracking
│   │   └── ...                   # 20+ API routes
│   └── ...                       # 60+ page routes
├── components/
│   ├── layout/                   # Navbar, AppSidebar, MobileTabBar, Footer
│   ├── news/                     # ArticleCard, HeroSlideshow, Comments, etc.
│   ├── social/                   # PostCard, compose box
│   ├── admin/                    # Admin dashboards, tables, charts
│   ├── landing/                  # Landing hero slideshow, reveal sections
│   ├── ui/                       # 20+ reusable UI components
│   ├── settings/                 # Settings layout components
│   ├── inbox/                    # Messaging components
│   ├── radio/                    # Radio player widget
│   ├── tv/                       # TV player widget
│   ├── providers/                # Theme, Query, Realtime, Push providers
│   ├── seo/                      # SEO analyzer
│   └── authors/                  # Author management
├── lib/
│   ├── supabase/                 # Client, server, types, middleware
│   ├── hooks/                    # 25+ custom React hooks
│   ├── ai/                       # Groq AI integration
│   ├── rss/                      # RSS feed parser + classifier
│   ├── push/                     # Push notification sender
│   ├── gmail/                    # Gmail API integration
│   ├── tv/                       # TV station config + HLS
│   ├── radio/                    # Radio station config
│   ├── seo/                      # SEO analysis tools
│   ├── services/                 # Business logic services
│   ├── constants/                # App, navigation, SEO constants
│   └── utils.ts                  # Utility functions
├── supabase/
│   └── migrations/               # 60+ SQL migration files
├── public/                       # Static assets
├── middleware.ts                  # Route protection + session refresh
└── package.json                  # Dependencies and scripts
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/migrations/20240101000000_initial_schema.sql`
3. Run subsequent migrations in order (or use `supabase db push`)
4. Copy your project URL and API keys from **Settings → API**

### 3. Configure environment variables

Copy `.env.example` and fill in your values:
```bash
cp .env.example .env.local
```

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# AI (free tier at console.groq.com)
GROQ_API_KEY=

# M-Pesa (optional)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/payments/mpesa/callback

# Gmail integration (optional)
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REDIRECT_URI=https://your-domain.vercel.app/api/gmail/callback
GMAIL_ENCRYPTION_SECRET=
```

Use environment variables securely in Vercel or GitHub Actions; never commit secrets.

### 4. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Authentication Flow

1. User signs up via `/signup` → creates reader account
2. Onboarding (`/onboarding`) collects interests, follows, notification prefs
3. Email verification via `/verify-email`
4. Login via `/login` → Supabase Auth issues JWT
5. Middleware refreshes session on every request
6. `/journalist/*` and `/admin/*` routes are role-protected
7. Admins access via `/admin`, journalists via `/journalist`
8. Readers can apply to become authors via `/author-apply`

## Styling System

The platform uses a custom glassmorphism design system built on oklch color space:

- **Light theme**: White glass panels with subtle blur
- **Dark theme**: Dark glass panels with enhanced blur and glow
- **Fonts**: Space Grotesk (headings/UI), Newsreader (body/article text)
- **Components**: Auto-collapsing sidebar, glass cards, gradient buttons, glow effects
- **Responsive**: Desktop sidebar + mobile off-canvas drawer + bottom tab bar

## Deployment

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Environment Variables (Vercel Dashboard)
Set all required variables in **Settings → Environment Variables**.

### Database
Run migrations via Supabase SQL Editor or `supabase db push`.

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
- ESLint + TypeScript checks
- Next.js build verification
- Supabase migration push
- Preview deployments for PRs
- Production deployment on `main`

## License

026connect!
