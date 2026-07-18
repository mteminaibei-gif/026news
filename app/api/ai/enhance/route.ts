import { NextRequest, NextResponse } from 'next/server'
import { analyzeArticle, rewriteArticle, type EnhanceMode } from '@/lib/ai/enhance'
import { OpenAIUnconfiguredError } from '@/lib/ai/provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/enhance — grammar/style/cohesion analysis + rewrite/paraphrase
export async function POST(req: NextRequest) {
  try {
    let body: {
      action?: 'analyze' | 'rewrite'
      title?: string
      content?: string
      mode?: EnhanceMode
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
      const result = await rewriteArticle({ title, content, mode })
      return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
    }

    const analysis = await analyzeArticle({ title, content, mode })
    return NextResponse.json(analysis, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    if (err instanceof OpenAIUnconfiguredError) {
      return NextResponse.json(
        { error: 'AI is not configured. Set OPENAI_API_KEY in the server environment.' },
        { status: 503 },
      )
    }
    console.error('[POST /api/ai/enhance]', err)
    return NextResponse.json({ error: 'Enhancement failed' }, { status: 500 })
  }
}
