import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/categories — public list of categories
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('category_id, name, slug')
      .order('name')
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/admin/categories]', err)
    return NextResponse.json([], { status: 500 })
  }
}
