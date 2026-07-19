import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { moderateContent, ModerationResult } from '@/lib/ai/unified'

// POST /api/moderation/check
// Body: { text: string, content_type?: 'article' | 'comment', content_id?: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, content_type, content_id } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Run moderation
    const result = await moderateContent(text.trim())

    // If flagged and we have content_id/type, log to moderation queue
    if (result.flagged && content_id && content_type) {
      try {
        const supabase = await createAdminClient()
        await supabase.from('content_moderation').insert({
          content_type: content_type as 'article' | 'comment',
          content_id: Number(content_id),
          flagged_by: null,
          severity: result.recommendedAction === 'reject' ? 'critical' : 'high',
          status: 'pending',
          reason: `Auto-flagged: ${result.flaggedCategories.join(', ')}`,
          metadata: {
            scores: result.scores,
            flagged_categories: result.flaggedCategories,
            recommended_action: result.recommendedAction,
          },
        } as any)
      } catch (logError) {
        console.error('Failed to log moderation:', logError)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Moderation Check]', error)
    return NextResponse.json({ error: 'Moderation check failed' }, { status: 500 })
  }
}