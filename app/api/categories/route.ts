import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
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
    const supabase = await createAdminClient()

    const { name, description } = await req.json()
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
      .insert({ name: trimmed, slug, description: String(description ?? '').trim() || null } as never)
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

// DELETE /api/categories?id=X — admin only, delete a category
export async function DELETE(req: NextRequest) {
  try {
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
