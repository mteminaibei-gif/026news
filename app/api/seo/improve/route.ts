import { NextRequest, NextResponse } from 'next/server'
import { analyzeAndImprove } from '@/lib/seo/improver'

// POST /api/seo/improve — analyze and improve article content
export async function POST(req: NextRequest) {
  try {
    let body: { title?: string; content?: string; excerpt?: string; tags?: string[] }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { title, content, excerpt, tags } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const analysis = analyzeAndImprove({ title, content, excerpt, tags })

    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[POST /api/seo/improve]', err)
    return NextResponse.json({ error: 'Improvement analysis failed' }, { status: 500 })
  }
}
