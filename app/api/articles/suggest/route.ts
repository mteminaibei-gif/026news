import { NextRequest, NextResponse } from 'next/server'
import { autoCategorize, type CategorizationResult } from '@/lib/auto-categorize'

export async function POST(req: NextRequest) {
  try {
    const { title, content, excerpt, tags, sourceName, sourceReference } = await req.json()
    if (!title && !content) {
      return NextResponse.json({ categoryId: null, tags: [], scores: [] })
    }

    const plainContent = (content ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    const result: CategorizationResult = autoCategorize({
      title: title ?? '',
      content: plainContent,
      excerpt: excerpt ?? null,
      tags: tags ?? null,
      sourceName: sourceName ?? null,
      sourceReference: sourceReference ?? null,
    })

    return NextResponse.json({
      categoryId: result.bestCategoryId,
      confidence: result.confidence,
      scores: result.scores,
      matchedTerms: result.matchedTerms,
    })
  } catch {
    return NextResponse.json({ categoryId: null, tags: [], scores: [] })
  }
}
