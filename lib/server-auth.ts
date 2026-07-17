import { createClient } from '@/lib/supabase/server'

export type SessionUser = {
  id: string
  userId: number | null
  email: string
  role: string
  name: string | null
}

// Returns the current session user (from Supabase auth + public.users),
// or null if not signed in / no profile. Safe on the server only.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rawProfile } = await supabase
    .from('users')
    .select('user_id, role, name, email')
    .eq('email', user.email ?? '')
    .single()

  const profile = rawProfile as
    | { user_id: number; role: string; name: string | null; email: string }
    | null
  if (!profile) return null

  return {
    id: user.id,
    userId: profile.user_id,
    email: user.email ?? profile.email,
    role: profile.role,
    name: profile.name,
  }
}

// Returns the user only if they are an admin, otherwise null.
export async function getCurrentAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return user
}
