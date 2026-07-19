# 026news UI/UX Visual Guide

## Profile Page - Visual Breakdown

### Header Section (Top)
```
┌─────────────────────────────────────────────────────────┐
│  ┌───────────┐  Username                          BADGE │
│  │           │  @username · Member since Jan 2025       │
│  │  Avatar   │  Bio or description text here...         │
│  │ (Gradient)│  [Settings] [Analytics/Admin Panel]      │
│  └───────────┘                                          │
└─────────────────────────────────────────────────────────┘
```

**Styling Details:**
- Avatar: 32x32px with gradient (primary → accent)
- Role Badge: Small pill with color coding
- Action buttons: Hover effects, 44px+ min height
- Padding: 32px around all content
- Shadow: Subtle card shadow
- Border-radius: 20px

### Tab Navigation
```
┌─────────────────────────────────────────────────────────┐
│ [Dashboard] [Saved] [Liked] [Comments] [✍️ Write]       │
│     ▔▔▔▔▔▔▔  ▔▔▔▔▔▔▔ ▔▔▔▔▔▔ ▔▔▔▔▔▔▔   ▔▔▔▔▔▔▔ ← Active   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Icons + labels for clarity
- Animated underline on active tab
- Role-based tab visibility
- Smooth transitions (0.2s)

### Dashboard Content (Main Area)

#### Reader Dashboard
```
┌──────────────────────────────────────────────────────┐
│ Stat Cards (2×2 grid on tablet, 1×4 on desktop)    │
├─────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐               │
│ │ 📖 Articles    │ │ 📌 Saved       │               │
│ │ Read           │ │                │               │
│ │ 234            │ │ 45             │               │
│ └────────────────┘ └────────────────┘               │
│ ┌────────────────┐ ┌────────────────┐               │
│ │ 👥 Following   │ │ 💬 Comments    │               │
│ │                │ │                │               │
│ │ 12             │ │ 8              │               │
│ └────────────────┘ └────────────────┘               │
├─────────────────────────────────────────────────────┤
│ [Browse Articles →]                                 │
└─────────────────────────────────────────────────────┘
```

#### Journalist Dashboard
```
┌──────────────────────────────────────────────────────┐
│ Stat Cards                                           │
├─────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐               │
│ │ ✍️ Published   │ │ 👥 Followers   │               │
│ │ 24             │ │ 342            │               │
│ └────────────────┘ └────────────────┘               │
├─────────────────────────────────────────────────────┤
│ [✍️ New Article] [My Articles] [Earnings] [Analytics]│
└──────────────────────────────────────────────────────┘
```

#### Admin Dashboard
```
┌──────────────────────────────────────────────────────┐
│ Stat Cards                                           │
├─────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐               │
│ │ 📰 Articles    │ │ 👤 Active Users│               │
│ │ 1,234          │ │ 5,678          │               │
│ └────────────────┘ └────────────────┘               │
├─────────────────────────────────────────────────────┤
│ [Manage Articles] [Manage Users] [Journalists] etc.  │
└──────────────────────────────────────────────────────┘
```

### Empty States

```
Saved Articles Tab (Empty):
┌──────────────────────────────────────────────────────┐
│                                                      │
│                    📌 (Icon - 40px)                  │
│            No Saved Articles Yet                    │
│   Save articles to read them later...              │
│                                                      │
│         [Start Exploring →]                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Sidebar Widgets

```
RIGHT SIDEBAR (Desktop only)
┌────────────────────────────────┐
│ Notifications                  │
├────────────────────────────────┤
│ 🔔 No new notifications        │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Messages                       │
├────────────────────────────────┤
│ 💬 No messages                 │
│                                │
│ [View Inbox →]                 │
└────────────────────────────────┘

┌────────────────────────────────┐
│ Following                      │
├────────────────────────────────┤
│ 👥 Not following anyone        │
└────────────────────────────────┘
```

---

## Color Palette Reference

### Primary Colors
```
Primary: oklch(45% 0.12 175) = #1d9bf0 (Cyan/Blue)
├─ Light:  oklch(70% 0.18 175) (light hover)
├─ Muted:  oklch(25% 0.04 175) (background)
└─ Used for: Buttons, links, active states

Accent: oklch(65% 0.18 55) = #f4212e (Red/Orange)
├─ Light:  oklch(80% 0.20 55)
├─ Muted:  oklch(25% 0.06 55)
└─ Used for: Highlights, alerts, accents

Success: oklch(65% 0.12 145) = #00ba7c (Green)
└─ Used for: Positive actions, confirmations

Warning: oklch(72% 0.13 80) = #ffad1f (Gold)
└─ Used for: Warnings, cautions

Error: oklch(65% 0.14 25) = #f4212e (Red)
└─ Used for: Errors, destructive actions
```

### Backgrounds
```
Light Mode:
├─ Base:     #f7f9f9 (page background)
├─ Surface:  #ffffff (cards, surfaces)
├─ Elevated: #ffffff (modals, overlays)
├─ Inset:    #eef2f3 (input backgrounds)
└─ Muted:    #eef2f3 (subtle backgrounds)

Dark Mode:
├─ Base:     oklch(15.5% 0.016 175) (darkest)
├─ Surface:  oklch(19.5% 0.016 175) (default bg)
├─ Elevated: oklch(23% 0.016 175) (lifted)
├─ Inset:    oklch(15.5% 0.013 175)
└─ Muted:    oklch(21% 0.013 175)
```

### Text Colors
```
Light Mode:
├─ Primary:    #0c1116 (main text)
├─ Secondary:  #3d4a52 (secondary text)
├─ Tertiary:   #59636b (tertiary text)
└─ Muted:      #6b7780 (placeholder, disabled)

Dark Mode:
├─ Primary:    oklch(95% 0.007 175) (bright text)
├─ Secondary:  oklch(76% 0.008 175)
├─ Tertiary:   oklch(62% 0.008 175)
└─ Muted:      oklch(52% 0.008 175)
```

---

## Typography Hierarchy

### Sizes
```
H1: 2rem (32px)     ← Page title (Profile name)
    Weight: 700     
    Letter-spacing: -0.02em
    
H2: 1.5rem (24px)   ← Card titles, sections
    Weight: 600
    
H3: 1.25rem (20px)  ← Subsections
    Weight: 600
    
Body: 0.95-1rem     ← Main text content
      Weight: 400-500
      Line-height: 1.6
      
Small: 0.875rem     ← Captions, secondary info
       Weight: 500
       
Tiny: 0.75rem       ← Labels, badges
      Weight: 600
      Text-transform: uppercase
      Letter-spacing: 0.05em
```

### Font Families
```
Space Grotesk (UI)
├─ Headers & titles
├─ Buttons & labels
├─ Tab navigation
└─ General interface

Newsreader (Editorial)
├─ Article titles
├─ Body text
├─ Descriptions
└─ Content reading
```

---

## Spacing Reference

```
Component Padding:
├─ Card: 20px (internal content)
├─ Button: 10px vertical, 16px horizontal
├─ Input: 10px vertical, 14px horizontal
├─ Header: 32px (32px for profile header)
└─ Container: 24px-36px padding, 40px margins

Gap Patterns:
├─ Cards: 16px gap between
├─ Grid items: 16px gap
├─ Button groups: 8px gap
├─ Components: 24px between major sections
└─ Sidebar: 24px between widgets
```

---

## Responsive Grid Layout

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────────────┐
│                      HEADER (Full Width)                    │
├──────────────────────────────────┬──────────────────────────┤
│                                  │                          │
│          MAIN CONTENT            │      SIDEBAR (340px)     │
│          (2/3 width)             │    ┌──────────────────┐  │
│                                  │    │ Notifications    │  │
│  - Stat Cards                    │    ├──────────────────┤  │
│  - Dashboard                     │    │ Messages         │  │
│  - Tabs Content                  │    ├──────────────────┤  │
│                                  │    │ Following        │  │
│                                  │    └──────────────────┘  │
├──────────────────────────────────┴──────────────────────────┤
│                      FOOTER (if applicable)                 │
└─────────────────────────────────────────────────────────────┘
```

### Tablet (640px - 1024px)
```
┌─────────────────────────────────────────────────────┐
│              HEADER (Full Width)                    │
├──────────────────────────────────┬─────────────────┤
│                                  │   SIDEBAR       │
│      MAIN CONTENT                │  (Collapsed or  │
│      (Primary focus)             │   Smaller)      │
│                                  │                 │
├──────────────────────────────────┴─────────────────┤
│                      FOOTER                         │
└─────────────────────────────────────────────────────┘
```

### Mobile (< 640px)
```
┌──────────────────────────┐
│   HEADER (Full Width)    │
├──────────────────────────┤
│   MAIN CONTENT           │
│   (Full width, stacked)  │
│                          │
│   - All content in       │
│     single column        │
│   - Full width cards     │
│   - Sidebar below or     │
│     hidden               │
├──────────────────────────┤
│   FOOTER                 │
├──────────────────────────┤
│  BOTTOM TAB BAR (Fixed)  │ ← Home, Explore, etc
└──────────────────────────┘
```

---

## Animation & Motion

### Entrance Animations
```
fadeUp: 
  From: opacity 0, transform translateY(24px)
  To:   opacity 1, transform translateY(0)
  Duration: 0.5s
  Easing: var(--ease-out-expo)
  
slideInLeft:
  From: opacity 0, transform translateX(-32px)
  To:   opacity 1, transform translateX(0)
  Duration: 0.6s
  Easing: var(--ease-out-expo)
```

### Interaction Animations
```
Hover Effects:
├─ hover-lift: translate(-2px) + shadow enhancement
├─ scale-105: scale(1.05) on button click
├─ opacity-90: Subtle fade on disabled state
└─ color-transition: 0.2s color change on hover

Active States:
├─ Button: Background color change
├─ Tab: Underline animation (transform scaleX)
├─ Card: Border color change + shadow
└─ Link: Color change + underline appears
```

### Loading Animation
```
Spinner:
  ┌─────────────────┐
  │                 │
  │    ⟲ (Spin)     │ ← Rotates 360°
  │                 │     Duration: 0.8s
  │                 │     Infinite
  └─────────────────┘
  
  Border: 3px solid var(--primary-light)
  Border-top: 3px solid var(--primary)
  Border-radius: 50%
```

---

## State Indicators

### Button States
```
Default:
  Background: var(--bg-surface)
  Border: 1px solid var(--border)
  Color: var(--text-secondary)
  
Hover:
  Background: var(--primary-light)
  Border: 1px solid var(--primary)
  Color: var(--primary)
  
Active:
  Background: var(--primary)
  Border: 1px solid var(--primary)
  Color: white
  
Disabled:
  Background: var(--bg-inset)
  Border: 1px solid var(--border-subtle)
  Color: var(--text-muted)
  Opacity: 0.6
  Cursor: not-allowed
```

### Form States
```
Input Default:
  Background: var(--bg-elevated)
  Border: 1px solid var(--border)
  Color: var(--text-primary)
  
Input Focus:
  Background: var(--bg-elevated)
  Border: 1px solid var(--primary)
  Box-shadow: 0 0 0 3px var(--primary) / 0.12
  
Input Error:
  Border: 1px solid var(--error)
  Background: var(--error-light)
  
Input Success:
  Border: 1px solid var(--success)
  Background: var(--success-light)
```

---

## Component Specifications

### Card Component
```
Border-radius: 14-16px
Padding: 20px
Border: 1px solid var(--border-subtle)
Background: var(--bg-surface)
Box-shadow: 0 1px 3px var(--card-shadow)
Hover: transform translateY(-2px), enhanced shadow
Transition: all 0.3s var(--ease-out-expo)
```

### Button Component
```
Height: 44px (mobile), 40px (desktop)
Padding: 10px vertical, 16px horizontal
Border-radius: 8px
Font-weight: 600
Font-size: 0.85rem
Cursor: pointer
Transition: all 0.2s
```

### Input Component
```
Height: 40px
Padding: 10px 14px
Border-radius: 8px
Border: 1px solid var(--border)
Background: var(--bg-elevated)
Font-size: 0.88rem
Transition: border-color 0.2s, box-shadow 0.2s
```

### Badge Component
```
Padding: 4px 12px
Border-radius: 12px (pill shape)
Font-size: 0.75rem
Font-weight: 700
Text-transform: uppercase
Letter-spacing: 0.05em
```

---

## Dark Mode Implementation

### Automatic Switching
The app automatically detects:
- System preference (`prefers-color-scheme`)
- User selection (stored in localStorage)
- Manual toggle in settings

### CSS Custom Properties
```css
/* Light mode (default) */
--bg-base: #f7f9f9
--text-primary: #0c1116

/* Dark mode */
@media (prefers-color-scheme: dark) {
  --bg-base: oklch(15.5% 0.016 175)
  --text-primary: oklch(95% 0.007 175)
}

/* Manual dark mode class */
html.dark {
  --bg-base: oklch(15.5% 0.016 175)
  --text-primary: oklch(95% 0.007 175)
}
```

---

## Accessibility Features

### Focus States
```
:focus-visible {
  outline: 2px solid var(--primary)
  outline-offset: 2px
  border-radius: 6px
}
```

### Color Contrast
```
Light Mode:
- Primary text on white: WCAG AAA (21:1)
- Secondary text on white: WCAG AA (7:1)
- Links: WCAG AA+ (10:1)

Dark Mode:
- Primary text on dark: WCAG AAA (20:1)
- Secondary text on dark: WCAG AA (8:1)
```

### Touch Targets
```
Minimum: 44x44px
Recommended: 48x48px
Spacing: At least 8px between targets
Icons: Paired with text for clarity
```

---

## Performance Optimizations

### Animation Performance
- Hardware acceleration (transform, opacity)
- CSS animations (not JavaScript)
- 60fps target (smooth transitions)
- Reduced motion support (@prefers-reduced-motion)

### Image Optimization
- WebP format (with fallback)
- Responsive sizes
- Lazy loading
- Optimized file sizes

### Loading Performance
- Code splitting
- Dynamic imports
- Caching strategies
- CDN delivery

---

*This visual guide provides a comprehensive reference for the 026news UI/UX design. Use this as a template for new components and pages.*
