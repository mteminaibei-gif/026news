'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { uploadFeaturedImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { AIEnhancePanel } from '@/components/editor/AIEnhancePanel'

interface Article {
  article_id: number; title: string; slug: string; content: string;
  excerpt: string; status: string; featured_image: string | null;
  tags: string[] | null; category_id: number | null;
  source_reference: string | null; monetization_type: string;
}

interface Props {
  article: Article
  categories: Array<{ category_id: number; name: string }>
}

const fieldCls = 'w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all'
const labelCls = 'block text-[11px] font-black uppercase tracking-[0.1em] mb-2'

export function EditArticleClient({ article, categories }: Props) {
  const router = useRouter()

  const [title, setTitle] = useState(article.title)
  const [categoryId, setCategoryId] = useState<string>(article.category_id?.toString() ?? '')
  const [tags, setTags] = useState(article.tags?.join(', ') ?? '')
  const [content, setContent] = useState(article.content)
  const [excerpt, setExcerpt] = useState(article.excerpt ?? '')
  const [sourceRef, setSourceRef] = useState(article.source_reference ?? '')
  const [monetization, setMonetization] = useState(article.monetization_type ?? 'free')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(article.featured_image)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError] = useState('')

  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const wordCount = plainText ? plainText.split(/\s+/).length : 0
  const readMins = Math.max(1, Math.ceil(wordCount / 200))

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setImageError('Select an image file'); return }
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(action: 'draft' | 'submit') {
    setSubmitError(''); setSubmitSuccess(''); setSubmitting(true)
    try {
      let featuredImageUrl = article.featured_image
      if (imageFile) {
        setImageUploading(true)
        try {
          const { url } = await uploadFeaturedImage(imageFile, slugify(title || 'article'))
          featuredImageUrl = url
        } catch {
          setImageError('Image upload failed')
          setSubmitting(false); setImageUploading(false); return
        }
        setImageUploading(false)
      }

      const res = await fetch('/api/articles/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article.article_id,
          title, category: categories.find(c => c.category_id === Number(categoryId))?.name ?? '',
          tags, content, excerpt,
          source_reference: sourceRef,
          monetization_type: monetization,
          featured_image: featuredImageUrl,
          action,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.error ?? 'Failed to save')
        return
      }

      if (action === 'submit') {
        setSubmitSuccess('Article submitted for review!')
        setTimeout(() => router.push('/journalist/articles'), 2000)
      } else {
        setSubmitSuccess('Draft saved!')
        setTimeout(() => router.push('/journalist/articles'), 1500)
      }
    } catch {
      setSubmitError('Unexpected error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Sticky bar */}
      <div className="sticky top-0 z-20 backdrop-blur-md shadow-sm" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/journalist/articles" className="transition-colors shrink-0" style={{ color: 'var(--text-tertiary)' }}>←</Link>
            <div className="w-2 h-6 rounded-full shrink-0" style={{ background: 'linear-gradient(to bottom, var(--primary), var(--accent))' }} />
            <h1 className="text-sm font-black truncate" style={{ color: 'var(--primary)' }}>Edit Article</h1>
            {title && <span className="text-xs truncate hidden md:block" style={{ color: 'var(--text-tertiary)' }}>— {title}</span>}
            {submitSuccess && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-fade-in" style={{ color: 'var(--primary)', background: 'var(--success-light)' }}>
                ✅ {submitSuccess}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>{wordCount} words · {readMins} min</span>
            <button onClick={() => handleSubmit('draft')} disabled={submitting}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-muted)' }}>
              💾 Draft
            </button>
            <button onClick={() => handleSubmit('submit')} disabled={submitting || !title.trim() || !content.trim()}
              className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:shadow-md disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
              {submitting ? '⏳ Submitting…' : '📤 Submit for Review'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {submitError && (
          <div role="alert" className="mb-5 text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
            ⚠️ {submitError}
          </div>
        )}

        <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="space-y-5">
            {/* Headline */}
            <div className="rounded-2xl shadow-sm p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <label className={labelCls} htmlFor="ed-title" style={{ color: 'var(--text-tertiary)' }}>📰 Headline</label>
              <textarea id="ed-title" rows={2} value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Write your headline here…"
                className="w-full text-2xl md:text-3xl font-black bg-transparent outline-none resize-none leading-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, "Times New Roman", serif' }} />
            </div>

            {/* Category + Tags */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="ed-category" style={{ color: 'var(--text-tertiary)' }}>🗂 Category</label>
                  <select id="ed-category" value={categoryId} onChange={e => setCategoryId(e.target.value)} className={fieldCls}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <option value="">Choose…</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="ed-tags" style={{ color: 'var(--text-tertiary)' }}>🏷 Tags</label>
                  <input id="ed-tags" type="text" value={tags} onChange={e => setTags(e.target.value)}
                    placeholder="Kenya, Politics, Africa…" className={fieldCls}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <label className={labelCls} htmlFor="ed-excerpt" style={{ color: 'var(--text-tertiary)' }}>📝 Excerpt</label>
              <textarea id="ed-excerpt" rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="A brief hook…" className={fieldCls + ' resize-none'}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>

            {/* Content editor */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <label className={labelCls + ' mb-0'} style={{ color: 'var(--text-tertiary)' }}>Content</label>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{wordCount} words · ~{readMins} min read</span>
              </div>
              <RichTextEditor content={content} onChange={val => setContent(val)} placeholder="Write your article here..." minHeight={480} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 xl:sticky xl:top-16">
            {/* AI Enhance */}
            <AIEnhancePanel
              title={title}
              content={content}
              onApplyContent={(c) => setContent(c)}
            />

            {/* Featured image */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h4 className={labelCls + ' mb-0'} style={{ color: 'var(--text-tertiary)' }}>🖼 Featured Image</h4>
              </div>
              <div className="p-4">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} className="sr-only" />
                {imagePreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                    <Image src={imagePreview} alt="Featured" fill className="object-cover" unoptimized  sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
                    <button onClick={() => { setImagePreview(null); setImageFile(null) }}
                      className="absolute top-2 right-2 text-white rounded-lg px-2 py-1 text-xs font-bold"
                      style={{ background: 'var(--error)' }}>Remove</button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2"
                    style={{ borderColor: 'var(--border)' }}>
                    <span className="text-2xl">📷</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>Choose Image</span>
                  </button>
                )}
                {imageError && <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>⚠️ {imageError}</p>}
              </div>
            </div>

            {/* Submit card */}
            <div className="rounded-2xl shadow-sm p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <button onClick={() => handleSubmit('submit')} disabled={submitting || !title.trim() || !content.trim()}
                className="w-full font-bold py-3 rounded-xl text-sm transition-all hover:shadow-md disabled:opacity-40 mb-2"
                style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                {submitting ? '⏳ Submitting…' : '📤 Submit for Review'}
              </button>
              <button onClick={() => handleSubmit('draft')} disabled={submitting}
                className="w-full font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                💾 Save Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
