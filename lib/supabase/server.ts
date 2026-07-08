import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

// Returns true when the required env vars are present
export function supabaseConfigured() {
  return !!SUPABASE_URL && !!SUPABASE_ANON
}

// Server-side Supabase client (Server Components, Route Handlers, Server Actions)
// Safe to call even when env vars are missing — queries will simply return empty data.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    SUPABASE_URL  || 'https://placeholder.supabase.co',
    SUPABASE_ANON || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — safe to ignore
          }
        },
      },
    }
  )
}

// Admin client that bypasses RLS — server-only
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_SVC || SUPABASE_ANON || 'placeholder-service-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
