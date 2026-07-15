import { NextRequest, NextResponse } from 'next/server'
import { analyzeSEO } from '@/lib/seo/analyzer'

// POST /api/seo/analyze — analyze article SEO
export async function POST(req: NextRequest) {
  try {
    let body: { title?: string; content?: string; excerpt?: string; slug?: string; featured_image?: string; tags?: string[]; category?: string }
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { title, content, excerpt, slug, featured_image, tags, category } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const analysis = analyzeSEO({ title, content, excerpt, slug, featured_image, tags, category })

    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[POST /api/seo/analyze]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
