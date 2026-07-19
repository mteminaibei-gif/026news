import { NextRequest, NextResponse } from 'next/server'
import { enhancedAnalyzeSEO } from '@/lib/seo/enhanced-analyzer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/seo/analyze-enhanced — robust AI-powered SEO analysis
export async function POST(req: NextRequest) {
  try {
    let body: {
      title?: string
      content?: string
      excerpt?: string
      slug?: string
      featured_image?: string
      tags?: string[]
      category?: string
      authorName?: string
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { title, content, excerpt, slug, featured_image, tags, category, authorName } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
    }

    const analysis = await enhancedAnalyzeSEO({
      title,
      content,
      excerpt,
      slug,
      featured_image: featured_image,
      tags,
      category,
      authorName,
    })

    return NextResponse.json(analysis, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[POST /api/seo/analyze-enhanced]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
