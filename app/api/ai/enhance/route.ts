import { NextRequest, NextResponse } from 'next/server'
import { analyzeSEO, enhanceContent, GroqUnconfiguredError } from '@/lib/ai/unified'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/enhance — grammar/style/cohesion analysis + rewrite/paraphrase
export async function POST(req: NextRequest) {
  try {
    let body: {
      action?: 'analyze' | 'rewrite'
      title?: string
      content?: string
      mode?: 'grammar' | 'style' | 'cohesion' | 'paraphrase' | 'full'
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { action = 'analyze', title, content, mode = 'full' } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    if (action === 'rewrite') {
      const result = await enhanceContent({ title, content, mode: body.mode })
      return NextResponse.json({
        html: result.enhancedContent,
        summary: result.summary,
        changes: result.changes.map(c => `${c.type}: ${c.reason}`),
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const analysis = await analyzeSEO({ title, content })
    return NextResponse.json({
      score: analysis.score,
      readability: analysis.readability,
      summary: analysis.contentQuality.strengths.join('; ') + ' | ' + analysis.contentQuality.weaknesses.join('; '),
      suggestions: analysis.recommendations.map(r => ({
        type: r.category,
        category: r.category,
        message: r.issue,
        suggestion: r.suggestion,
        priority: r.priority,
      })),
      optimizedContent: analysis.optimizedContent?.content,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (err instanceof Error && err.message.includes('Groq API not configured')) {
      return NextResponse.json(
        { error: 'AI is not configured. Set GROQ_API_KEY in the server environment.' },
        { status: 503 },
      )
    }
    console.error('[POST /api/ai/enhance]', err)
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 })
  }
}
