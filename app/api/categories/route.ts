import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/categories — public, returns all categories sorted by name
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, name')
      .order('name')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/categories]', err)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
