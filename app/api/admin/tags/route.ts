import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAdmin } from '@/lib/server-auth'

// GET /api/admin/tags — list all tags
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('article_tags')
      .select('tag_id, tag_name, tag_slug, usage_count')
      .order('usage_count', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[GET /api/admin/tags]', err)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// POST /api/admin/tags — create tag or assign tags to article
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()

    const body = await req.json()
    const { action, tag_name, tag_id, article_id, article_ids, tags } = body as {
      action?: string
      tag_name?: string
      tag_id?: number
      article_id?: number
      article_ids?: number[]
      tags?: string[]
    }

    // Create a new tag
    if (action === 'create' && tag_name) {
      const slug = tag_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const { data, error } = await supabase
        .from('article_tags')
        .insert({ tag_name: tag_name.trim(), tag_slug: slug, usage_count: 0 } as never)
        .select()
        .single()
      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })
        }
        throw error
      }
      return NextResponse.json(data, { status: 201 })
    }

    // Assign tags to an article (update the article's tags array + tag_mappings)
    if (article_id && tags) {
      // Update the article's tags array column
      await supabase
        .from('articles')
        .update({ tags, updated_at: new Date().toISOString() } as never)
        .eq('article_id', article_id)

      // Also sync article_tag_mappings
      await supabase.from('article_tag_mappings').delete().eq('article_id', article_id)

      for (const tagName of tags) {
        // Find or create tag
        let { data: existingTag } = await supabase
          .from('article_tags')
          .select('tag_id')
          .eq('tag_name', tagName)
          .maybeSingle()

        if (!existingTag) {
          const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const { data: newTag } = await supabase
            .from('article_tags')
            .insert({ tag_name: tagName, tag_slug: slug, usage_count: 0 } as never)
            .select()
            .single()
          existingTag = newTag
        }

        if (existingTag) {
          await supabase
            .from('article_tag_mappings')
            .insert({ article_id, tag_id: (existingTag as { tag_id: number }).tag_id } as never)

          // Increment usage_count
          const tagId = (existingTag as { tag_id: number; usage_count: number }).tag_id
          const currentCount = (existingTag as { usage_count: number }).usage_count
          await supabase.from('article_tags')
            .update({ usage_count: currentCount + 1 } as never)
            .eq('tag_id', tagId)
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/admin/tags]', err)
    return NextResponse.json({ error: 'Failed to process tag' }, { status: 500 })
  }
}

// DELETE /api/admin/tags?id=123
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createClient()

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await supabase.from('article_tag_mappings').delete().eq('tag_id', Number(id))
    const { error } = await supabase.from('article_tags').delete().eq('tag_id', Number(id))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/tags]', err)
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 })
  }
}
