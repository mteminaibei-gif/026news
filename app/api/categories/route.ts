import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'
import { slugify } from '@/lib/utils'

// GET /api/categories — public, returns all categories sorted by name
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, name, slug, description, icon')
      .order('name')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories — admin only, create a new category
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createAdminClient()

    const { name, description, icon } = await req.json()
    const trimmed = String(name ?? '').trim()
    if (!trimmed || trimmed.length < 2) {
      return NextResponse.json({ error: 'Category name is required (min 2 chars)' }, { status: 400 })
    }
    if (trimmed.length > 50) {
      return NextResponse.json({ error: 'Category name too long (max 50 chars)' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('categories').select('category_id').eq('name', trimmed).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }

    const slug = slugify(trimmed)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid category name' }, { status: 400 })
    }

    const { data: cat, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: trimmed,
        slug,
        description: String(description ?? '').trim() || null,
        icon: String(icon ?? '').trim() || null,
      } as never)
      .select()
      .single()
    if (insertError) {
      console.error('[POST /api/categories] insert error:', insertError)
      return NextResponse.json({ error: insertError.message || 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(cat, { status: 201 })
  } catch (err) {
    console.error('[POST /api/categories]', err)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PATCH /api/categories?id=X — admin only, update name/description/icon.
// Renames keep the existing slug so article category_id FKs stay valid.
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createAdminClient()

    const id = Number(new URL(req.url).searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}

    if (typeof body.name === 'string') {
      const trimmed = body.name.trim()
      if (trimmed.length < 2) return NextResponse.json({ error: 'Category name too short (min 2 chars)' }, { status: 400 })
      if (trimmed.length > 50) return NextResponse.json({ error: 'Category name too long (max 50 chars)' }, { status: 400 })
      const { data: existing } = await supabase
        .from('categories').select('category_id').eq('name', trimmed).neq('category_id', id).maybeSingle()
      if (existing) return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
      updates.name = trimmed
    }
    if (body.description !== undefined) {
      updates.description = String(body.description ?? '').trim() || null
    }
    if (body.icon !== undefined) {
      updates.icon = String(body.icon ?? '').trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: cat, error: updateError } = await supabase
      .from('categories')
      .update(updates as never)
      .eq('category_id', id)
      .select()
      .single()
    if (updateError) {
      console.error('[PATCH /api/categories] update error:', updateError)
      return NextResponse.json({ error: updateError.message || 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json(cat)
  } catch (err) {
    console.error('[PATCH /api/categories]', err)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/categories?id=X — admin only, delete a category
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createAdminClient()

    const id = Number(new URL(req.url).searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error: deleteError } = await supabase
      .from('categories').delete().eq('category_id', id)
    if (deleteError) {
      console.error('[DELETE /api/categories] delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message || 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/categories]', err)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
