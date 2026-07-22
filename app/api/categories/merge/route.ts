import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

// POST /api/categories/merge — admin only, merge source category into target
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createAdminClient()
    const { source_id, target_id } = await req.json()

    if (!source_id || !target_id) {
      return NextResponse.json({ error: 'source_id and target_id are required' }, { status: 400 })
    }
    if (source_id === target_id) {
      return NextResponse.json({ error: 'Cannot merge a category into itself' }, { status: 400 })
    }

    // Verify both categories exist
    const { data: sourceCat } = await supabase
      .from('categories').select('category_id, name').eq('category_id', source_id).maybeSingle()
    if (!sourceCat) return NextResponse.json({ error: 'Source category not found' }, { status: 404 })

    const { data: targetCat } = await supabase
      .from('categories').select('category_id, name').eq('category_id', target_id).maybeSingle()
    if (!targetCat) return NextResponse.json({ error: 'Target category not found' }, { status: 404 })

    // Count affected articles
    const { count: articleCount } = await supabase
      .from('articles').select('*', { count: 'exact', head: true })
      .eq('category_id', source_id)

    // Move articles from source to target
    const { error: updateArticlesErr } = await supabase
      .from('articles').update({ category_id: target_id } as never).eq('category_id', source_id)
    if (updateArticlesErr) {
      console.error('[MERGE] articles update error:', updateArticlesErr)
      return NextResponse.json({ error: 'Failed to move articles' }, { status: 500 })
    }

    // Move RSS feeds from source to target (ignore errors if table doesn't exist)
    await supabase
      .from('rss_feeds').update({ category_id: target_id } as never).eq('category_id', source_id)

    // Delete the source category
    const { error: deleteErr } = await supabase
      .from('categories').delete().eq('category_id', source_id)
    if (deleteErr) {
      console.error('[MERGE] category delete error:', deleteErr)
      return NextResponse.json({ error: 'Failed to delete source category' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      articlesMoved: articleCount ?? 0,
      sourceName: sourceCat.name,
      targetName: targetCat.name,
    })
  } catch (err) {
    console.error('[POST /api/categories/merge]', err)
    return NextResponse.json({ error: 'Merge failed' }, { status: 500 })
  }
}
