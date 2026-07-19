# 026news Developer Guide

## Quick Start

### Installation
```bash
git clone <repo>
cd 026news-nextjs
npm install
npm run dev
```

### Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Architecture Overview

### Roles & Access Control

#### Reader
- Browse articles
- Save/like articles
- Leave comments
- Follow journalists
- View profile (dashboard, saved, liked, comments tabs)
- Can apply to become journalist

#### Journalist
- Create & publish articles
- View analytics (views, earnings, followers)
- Track earnings and payouts
- View profile (dashboard, saved, liked, comments tabs)
- Cannot access admin features

#### Admin
- Manage all articles
- Manage users and journalist applications
- View platform analytics
- Configure platform settings
- Cannot access journalist earning features
- Profile shows admin dashboard only

### File Structure
```
026news-nextjs/
├── app/
│   ├── profile/          # User profile page
│   ├── journalist/       # Journalist dashboard
│   ├── admin/            # Admin panel
│   ├── (auth)/           # Authentication routes
│   └── api/              # API endpoints
├── components/           # Reusable components
├── lib/
│   ├── supabase/        # Supabase client & server
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
├── public/              # Static assets
└── app/globals.css      # Design system & animations
```

## Design System

### CSS Custom Properties (Color Space: oklch)

#### Semantic Colors
```css
--primary: oklch(45% 0.12 175)        /* Blue - Primary actions */
--accent: oklch(65% 0.18 55)          /* Red - Highlights */
--success: oklch(65% 0.12 145)        /* Green - Success */
--warning: oklch(72% 0.13 80)         /* Gold - Warnings */
--error: oklch(65% 0.14 25)           /* Red - Errors */
```

#### Background Colors
```css
--bg-base: #f7f9f9 (light) / oklch(15.5% 0.016 175) (dark)
--bg-surface: #ffffff (light) / oklch(19.5% 0.016 175) (dark)
--bg-elevated: #ffffff (light) / oklch(23% 0.016 175) (dark)
--bg-inset: #eef2f3 (light) / oklch(15.5% 0.013 175) (dark)
--bg-muted: #eef2f3 (light) / oklch(21% 0.013 175) (dark)
```

#### Text Colors
```css
--text-primary: #0c1116 (light) / oklch(95% 0.007 175) (dark)
--text-secondary: #3d4a52 (light) / oklch(76% 0.008 175) (dark)
--text-tertiary: #59636b (light) / oklch(62% 0.008 175) (dark)
--text-muted: #6b7780 (light) / oklch(52% 0.008 175) (dark)
```

### Typography System

#### Font Families
```css
--font-display: 'Space Grotesk'      /* Headings, UI */
--font-ui: 'Space Grotesk'           /* Interface */
--font-body: 'Newsreader'            /* Articles, body text */
--font-mono: 'SF Mono', 'Menlo'      /* Code */
```

#### Sizes
- H1: 2rem (32px) - Section headings
- H2: 1.5rem (24px) - Card titles
- H3: 1.25rem (20px) - Subsections
- Body: 0.95rem-1rem (15-16px)
- Small: 0.875rem (14px) - Captions
- Tiny: 0.75rem (12px) - Labels

### Spacing Scale
```css
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
```

### Border Radius
```
Buttons: 8px
Cards: 14-16px
Containers: 16-20px
Full: 999px (pills)
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1)
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1)
--shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1)
--card-shadow: 0 0 0 1px #eff3f4
--card-hover-shadow: 0 4px 12px rgba(0,0,0,0.1)
```

## Common Patterns

### Card Component
```jsx
<div style={{
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 1px 3px var(--card-shadow)',
  transition: 'all 0.3s var(--ease-out-expo)'
}}>
  {/* Content */}
</div>
```

### Button Component
```jsx
<button style={{
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  fontWeight: '600',
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
}} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
  Click Me
</button>
```

### Stat Card
```jsx
<div className="hover-lift" style={{
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '14px',
  padding: '20px',
  boxShadow: '0 1px 3px var(--card-shadow)'
}}>
  <div className="flex justify-between items-center mb-3">
    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>
      LABEL
    </span>
    <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px' }}>
      Icon
    </span>
  </div>
  <div style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)' }}>
    Value
  </div>
</div>
```

### Tab Navigation
```jsx
<div style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '2px' }}>
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      style={{
        padding: '12px 20px',
        fontSize: '0.85rem',
        fontWeight: '600',
        color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
        borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {tab.label}
    </button>
  ))}
</div>
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login with demo account bypass
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/apply-journalist` - Submit journalist application

### Profile
- `GET /api/profile` - Get current user profile
- `PATCH /api/profile` - Update profile
- `POST /api/profile/ensure` - Ensure profile exists
- `PATCH /api/profile/avatar` - Upload avatar

### Articles
- `GET /api/articles` - Get articles list
- `POST /api/articles` - Create article (journalist only)
- `PATCH /api/articles/[id]` - Update article
- `DELETE /api/articles/[id]` - Delete article

### Admin
- `GET /api/admin/users` - List users (admin only)
- `GET /api/admin/articles` - List all articles (admin only)
- `GET /api/admin/journalists` - List journalist applications
- `PATCH /api/admin/journalists/[id]` - Approve/decline application

### Messages
- `GET /api/messages` - Get conversations
- `GET /api/messages/[id]` - Get conversation messages
- `POST /api/messages` - Send message

## Hooks

### useUser
```jsx
const { data: user } = useUser()
// Returns auth user with auth_id, email, user_metadata
```

### useProfile
```jsx
const { data: profile } = useProfile(userEmail)
// Returns user profile from DB: user_id, name, role, bio, etc.
```

### useRealtime
```jsx
const { onlineUsers } = useRealtime()
// Returns array of online user_ids
```

## Common Tasks

### Adding a New Page
1. Create file in `app/[route]/page.tsx`
2. Wrap with `'use client'` for interactive components
3. Fetch data in useEffect hooks
4. Apply consistent styling using CSS variables
5. Test responsive design

### Creating a Role-Protected Route
```jsx
// In layout.tsx
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

const { data: profile } = await supabase.from('users')
  .select('role').eq('auth_id', user.id).single()

if (profile.role !== 'admin') {
  redirect('/login?error=unauthorized')
}
```

### Adding Animations
Use CSS keyframes from `app/globals.css`:
```jsx
style={{ animation: 'fadeUp 0.5s var(--ease-out-expo) both' }}
```

Available animations:
- `fadeUp` - Fade in + slide up
- `fadeIn` - Pure fade in
- `slideInLeft` - Slide from left
- `slideInRight` - Slide from right
- `scaleIn` - Scale from 0
- `spin` - Rotate 360°
- `bounce-in` - Bounce entrance
- `float` - Floating motion

## Performance Tips

1. **Images**
   - Use Next.js `Image` component for optimization
   - Provide width/height for proper sizing
   - Add `unoptimized` only when necessary

2. **Data Fetching**
   - Use `useEffect` for client-side data
   - Implement proper error handling
   - Add loading states
   - Use `maybeSingle()` for optional queries

3. **Animations**
   - Use CSS animations, not JS
   - Prefer `transform` and `opacity` for 60fps
   - Avoid animating `width`/`height`
   - Use `will-change` sparingly

4. **Bundle Size**
   - Tree-shake unused imports
   - Use dynamic imports for heavy components
   - Keep components small and focused

## Debugging

### Common Issues

**Hydration Mismatch**
- Don't use `Math.random()` or `Date.now()` during SSR
- Use `useEffect` for client-only code
- Wrap in `suppressHydrationWarning`

**Supabase Auth**
- Check `.env.local` variables are set
- Verify RLS policies allow the action
- Check user role in `users` table

**Styling Issues**
- Ensure CSS variables are defined
- Check theme mode (light vs dark)
- Verify Tailwind/CSS class application

## Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
git push origin main
# Automatic deployment triggered
```

### Environment Variables
Set in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL` (production URL)

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

*Last Updated: 2026-07-19*
*Keep this guide updated as the project evolves*
