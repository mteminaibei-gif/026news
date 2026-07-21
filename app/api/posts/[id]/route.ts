import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const postId = parseInt(id)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimit = await checkRateLimit(`edit_post_${user.id}`, 10, 60)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many edit requests. Please slow down.' }, { status: 429 })
    }

    const body = await req.json().catch(() => ({}))
    const content = body.content?.toString().trim()

    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    if (content.length > 2000) return NextResponse.json({ error: 'Content too long' }, { status: 400 })

    const { data: post } = await (supabase as any)
      .from('posts')
      .select('user_id, content')
      .eq('post_id', postId)
      .single()

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('users')
      .select('user_id')
      .eq('auth_id', user.id)
      .single()

    if (!profile || post.user_id !== profile.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = await createAdminClient()
    const { data: updated, error } = await (adminDb as any)
      .from('posts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('post_id', postId)
      .select('*, user:users(user_id, name, profile_image, role)')
      .single()

    if (error) throw error

    return NextResponse.json({ post: updated })
  } catch (err) {
    console.error('[PATCH /api/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to edit post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const postId = parseInt(id)
    if (isNaN(postId)) return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: post } = await (supabase as any)
      .from('posts')
      .select('user_id')
      .eq('post_id', postId)
      .single()

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const { data: profile } = await supabase
      .from('users')
      .select('user_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const isOwner = post.user_id === profile.user_id
    const isAdmin = profile.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = await createAdminClient()
    const { error } = await (adminDb as any)
      .from('posts')
      .delete()
      .eq('post_id', postId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}