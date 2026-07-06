import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / 200)
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-amber-100 text-amber-800',
    under_review: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    free: 'bg-emerald-100 text-emerald-800',
    paywall: 'bg-purple-100 text-purple-800',
    sponsored: 'bg-amber-100 text-amber-800',
    ad: 'bg-sky-100 text-sky-800',
    active: 'bg-emerald-100 text-emerald-800',
    inactive: 'bg-gray-100 text-gray-600',
    banned: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
