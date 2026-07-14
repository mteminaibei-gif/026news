import { NextRequest, NextResponse } from 'next/server'
import { categorizeArticle, extractTags } from '@/lib/rss/curation'

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json()
    if (!title && !content) {
      return NextResponse.json({ category: null, tags: [] })
    }

    const plainContent = (content ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const categoryId = categorizeArticle(title ?? '', plainContent, null)
    const tags = extractTags(title ?? '', plainContent, 6)

    return NextResponse.json({ categoryId, tags })
  } catch {
    return NextResponse.json({ categoryId: null, tags: [] })
  }
}
