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
          } catch (err) {
            // In Route Handlers cookies().set() works — log failures instead of swallowing
            console.error('[Supabase] Failed to set cookies:', err)
          }
        },
      },
    }
  )
}

// Admin client that bypasses RLS — server-only
// Does NOT pass cookies so service role key is used instead of user JWT
export async function createAdminClient() {
  if (!SUPABASE_SVC) {
    console.error('[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set — admin operations will fail')
    throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  if (!SUPABASE_URL) {
    console.error('[Supabase] NEXT_PUBLIC_SUPABASE_URL is not set')
    throw new Error('Server configuration error: NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_SVC,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}
