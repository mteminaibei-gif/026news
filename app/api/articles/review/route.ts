import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Profile = { user_id: number; role: string }
type ReviewRecord = { article_id: number; admin_id: number; review_notes: string | null; action: string; reviewed_at: string }

// POST /api/articles/review
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch profile — cast via unknown to bypass generated-type mismatch
    const { data: rawProfile } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('email', user.email ?? '')
      .single()
    const profile = rawProfile as unknown as Profile | null

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { id, action, notes, feature_homepage } = await req.json()
    if (!id || !action) {
      return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
    }

    const newStatus =
      action === 'approve' ? 'published' :
      action === 'reject'  ? 'rejected'  :
      'under_review'

    const reviewAction =
      action === 'approve' ? 'approved' :
      action === 'reject'  ? 'rejected' :
      'revision_requested'

    // 1. Update article status
    const { error: articleError } = await supabase
      .from('articles')
      .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
      .eq('article_id', id)
    if (articleError) throw articleError

    // 2. Upsert review workflow record
    const reviewRecord: ReviewRecord = {
      article_id:   id,
      admin_id:     profile.user_id,
      review_notes: notes ?? null,
      action:       reviewAction,
      reviewed_at:  new Date().toISOString(),
    }
    const { error: reviewError } = await supabase
      .from('review_workflow')
      .upsert(reviewRecord as never, { onConflict: 'article_id' })
    if (reviewError) throw reviewError

    console.log(`Article ${id} ${reviewAction} by admin ${profile.user_id}. Featured: ${feature_homepage}`)

    return NextResponse.json({ success: true, article_id: id, status: newStatus, action: reviewAction })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('PUBLISH_LIMIT_REACHED')) {
      return NextResponse.json(
        { error: 'In-house publish limit reached. Ask an admin to raise the limit in the dashboard Publish Limits card.' },
        { status: 429 },
      )
    }
    console.error('[POST /api/articles/review]', err)
    return NextResponse.json({ error: 'Failed to process review' }, { status: 500 })
  }
}

// GET /api/articles/review — list pending articles for admin
export async function GET() {
  try {
    const supabase = await createClient()

    // ── Auth check ───────────────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: rawProfileGet } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email ?? '')
      .single()
    const profileGet = rawProfileGet as unknown as { role: string } | null

    if (!profileGet || profileGet.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('articles')
      .select('*, author:users(user_id,name,profile_image,bio), category:categories(name), review:review_workflow(review_notes,action,reviewed_at)')
      .eq('status', 'under_review')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/articles/review]', err)
    return NextResponse.json({ error: 'Failed to fetch pending articles' }, { status: 500 })
  }
}
