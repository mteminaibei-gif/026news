import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

const COLUMNS =
  'user_id, name, email, role, status, created_at, profile_image, article_count, total_views'

const VALID_ROLES = ['admin', 'journalist', 'reader']
const VALID_STATUSES = ['active', 'inactive', 'banned']

// GET /api/admin/users?q=&role=&status=
// Returns the full user list (admin only). Used by the realtime
// user-management panels.
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const role = searchParams.get('role') ?? 'all'
  const status = searchParams.get('status') ?? 'all'

  try {
    const supabase = await createAdminClient()
    let query = supabase
      .from('users')
      .select(COLUMNS)
      .order('created_at', { ascending: false })

    if (role && role !== 'all') query = query.eq('role', role)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    let rows = (data ?? []) as Array<{ name?: string | null; email?: string | null }>
    if (q) {
      rows = rows.filter(
        u =>
          (u.name ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q)
      )
    }
    return NextResponse.json({ users: rows })
  } catch (err) {
    console.error('[GET /api/admin/users]', err)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

// PATCH /api/admin/users
// Update a user's role and/or status (admin only).
export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { user_id?: number; role?: string; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const user_id = Number(body.user_id)
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.role) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    update.role = body.role
  }
  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    update.status = body.status
  }
  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('users')
      .update(update as never)
      .eq('user_id', user_id)
      .select(COLUMNS)
      .single()

    if (error) throw error

    // Best-effort audit log (fails silently if table missing).
    try {
      const { data: me } = (await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', admin.id)
        .maybeSingle()) as { data: { user_id: number } | null | undefined }
      await supabase.from('audit_log').insert({
        admin_id: me?.user_id ?? null,
        action: `Updated user #${user_id} → role=${body.role ?? '-'}, status=${body.status ?? '-'}`,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        created_at: new Date().toISOString(),
      } as never)
    } catch {
      /* no-op */
    }

    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('[PATCH /api/admin/users]', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
