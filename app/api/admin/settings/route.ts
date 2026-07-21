import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = await createAdminClient()
    const { data: rows, error } = await adminDb
      .from('site_settings')
      .select('key, value, updated_at')

    if (error) throw error

    const map: Record<string, any> = {}
    rows?.forEach((r: { key: string; value: any; updated_at?: string }) => {
      map[r.key] = { ...r.value, _updated_at: r.updated_at }
    })

    return NextResponse.json({ settings: map })
  } catch (err) {
    console.error('[GET /api/admin/settings]', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { key, value } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 })
    }
    if (value === undefined || value === null || typeof value !== 'object') {
      return NextResponse.json({ error: 'Setting value must be a valid object' }, { status: 400 })
    }

    const adminDb = await createAdminClient()

    const payload = {
      key,
      value,
      updated_at: new Date().toISOString(),
    }

    const { error } = await adminDb
      .from('site_settings')
      .upsert(payload, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ ok: true, key })
  } catch (err) {
    console.error('[POST /api/admin/settings]', err)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    const adminDb = await createAdminClient()
    const now = new Date().toISOString()

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value as any,
      updated_at: now,
    }))

    const { error } = await adminDb
      .from('site_settings')
      .upsert(rows, { onConflict: 'key' })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/admin/settings]', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
