---
inclusion: auto
---

# 026Newsblog Refactoring Context

This document provides context about the recent comprehensive refactoring of 026Newsblog completed to improve maintainability, reduce duplication, and establish a cohesive design system.

## What Changed

### Component Library
All UI components follow a consistent pattern using CSS variables and Tailwind utilities. Import from `@/components/ui`:
- TabNav, Toggle, StatCard, Card, Button, Input, FormField, EmptyState

### Settings Pattern
Settings pages (both user and admin) use `@/components/settings`:
- SettingsLayout (sidebar navigation)
- SettingsSection (grouped content)
- SettingRow (individual settings)

### Data Fetching
Import data hooks from `@/lib/hooks`:
- useUserSettings, useAdminSettings, useUserProfile, useReaderStats, useRSSFeeds

## Design System

### Colors (CSS Variables)
Always use CSS variables, not hex colors:
```tsx
style={{ color: 'var(--text-primary)' }}
style={{ background: 'var(--primary)' }}
style={{ borderColor: 'var(--border)' }}
```

### Spacing
Use the spacing scale with CSS variables:
```tsx
style={{ padding: 'var(--space-lg)', gap: 'var(--space-md)' }}
```

Or Tailwind classes:
```tsx
className="p-lg gap-md"
```

### Animations
Use predefined easing functions and animations:
```tsx
style={{ transition: 'all 0.2s' }} // Uses CSS variables
```

## Key Pages Structure

### Settings Pages
```tsx
<SettingsLayout tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
  <SettingsSection title="..." description="...">
    <Card>
      <SettingRow label="..." action={<Toggle />} />
    </Card>
  </SettingsSection>
</SettingsLayout>
```

### Profile/Stats Pages
```tsx
<Card variant="elevated" padding="lg">
  <StatCard label="..." value={value} icon={icon} change={change} />
</Card>
```

## Adding New Features

### New Settings
1. Add to the appropriate settings page (user or admin)
2. Use SettingsSection + SettingRow components
3. Add corresponding hook for data fetching
4. Follow the tab structure pattern

### New Pages
1. Use reusable components from `@/components/ui` and `@/components/settings`
2. Extract data fetching to custom hooks
3. Follow CSS variable conventions
4. Test light/dark modes

### New Components
1. Keep components small and focused
2. Use CSS variables for styling
3. Export from appropriate index.ts
4. Document with JSDoc comments

## Common Patterns

### Form Input
```tsx
<Input
  value={value}
  onChange={e => setValue(e.target.value)}
  label="Field Label"
  placeholder="..."
/>
```

### Toggle/Switch
```tsx
<Toggle
  checked={enabled}
  onChange={setEnabled}
  size="md"
/>
```

### Button
```tsx
<Button
  variant="primary" | "secondary" | "danger" | "ghost"
  size="sm" | "md" | "lg"
  onClick={handler}
>
  Label
</Button>
```

### Card Container
```tsx
<Card variant="default" | "elevated" | "filled" padding="sm" | "md" | "lg">
  Content
</Card>
```

## Color Usage

**Always use semantic colors:**
- Primary actions: `var(--primary)`
- Destructive: `var(--error)`
- Success: `var(--success)`
- Warnings: `var(--warning)`
- Text: `var(--text-primary)`, `var(--text-secondary)`, etc.
- Backgrounds: `var(--bg-surface)`, `var(--bg-base)`, etc.

## Documentation
- See `STYLING_GUIDE.md` for complete design system
- See `REFACTOR_SUMMARY.md` for refactoring overview
- See components `index.ts` for export references
