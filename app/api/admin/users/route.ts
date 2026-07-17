import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

const COLUMNS =
  'user_id, name, email, role, status, created_at, profile_image, article_count, total_views'

const VALID_ROLES = ['admin', 'journalist', 'reader']
const VALID_STATUSES = ['active', 'inactive', 'banned']

// GET /api/admin/users?q=&role=&status=&page=&limit=
// Returns paginated, filtered user list with unfiltered stats.
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const role = searchParams.get('role') ?? 'all'
  const status = searchParams.get('status') ?? 'all'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25))
  const offset = (page - 1) * limit

  try {
    const supabase = await createAdminClient()

    // Unfiltered stats query (for the stats strip)
    const { data: allUsers } = await supabase
      .from('users')
      .select('role, status')
    const allRows = (allUsers ?? []) as Array<{ role: string; status: string }>
    const stats = {
      total: allRows.length,
      admins: allRows.filter(u => u.role === 'admin').length,
      journalists: allRows.filter(u => u.role === 'journalist').length,
      readers: allRows.filter(u => u.role === 'reader').length,
      active: allRows.filter(u => u.status === 'active').length,
    }

    // Filtered + paginated query
    let countQuery = supabase.from('users').select('*', { count: 'exact', head: true })
    let dataQuery = supabase.from('users').select(COLUMNS).order('created_at', { ascending: false })

    if (role !== 'all') {
      countQuery = (countQuery as any).eq('role', role)
      dataQuery = (dataQuery as any).eq('role', role)
    }
    if (status !== 'all') {
      countQuery = (countQuery as any).eq('status', status)
      dataQuery = (dataQuery as any).eq('status', status)
    }
    if (q) {
      const filterStr = `%${q}%`
      countQuery = (countQuery as any).or(`name.ilike.${filterStr},email.ilike.${filterStr}`)
      dataQuery = (dataQuery as any).or(`name.ilike.${filterStr},email.ilike.${filterStr}`)
    }

    const { count } = await countQuery
    const { data, error } = await dataQuery.range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      stats,
    })
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
