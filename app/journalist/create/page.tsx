'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { uploadFeaturedImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

const MONETIZE_OPTIONS = [
  { value: 'free',      icon: '🆓', label: 'Free',         desc: 'Public access' },
  { value: 'sponsored', icon: '🤝', label: 'Sponsored',    desc: 'Sponsored content' },
  { value: 'ad',        icon: '📢', label: 'Ad-supported', desc: 'Serves ad units' },
]

const CATEGORIES = [
  'Politics', 'Business', 'Tech', 'Science',
  'Entertainment', 'Sports', 'Kenya', 'Africa', 'Health',
]

const fieldCls = 'w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all'
const labelCls = 'block text-[11px] font-black uppercase tracking-[0.1em] mb-2'

export default function CreatePostPage() {
  const router = useRouter()

  const [title,         setTitle]         = useState('')
  const [category,      setCategory]      = useState('')
  const [tags,          setTags]          = useState('')
  const [content,       setContent]       = useState('')
  const [excerpt,       setExcerpt]       = useState('')
  const [sourceRef,     setSourceRef]     = useState('')
  const [monetization,  setMonetization]  = useState('free')
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState('')
  const [saved,         setSaved]         = useState(false)

  const fileInputRef                        = useRef<HTMLInputElement>(null)
  const [imageFile,      setImageFile]      = useState<File | null>(null)
  const [imagePreview,   setImagePreview]   = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError,     setImageError]     = useState('')

  const wordCount    = content.trim().split(/\s+/).filter(Boolean).length
  const readMins     = Math.max(1, Math.ceil(wordCount / 200))
  const completeness = [title, category, content.length > 50, imagePreview].filter(Boolean).length * 25

  // Autosave draft to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('draft_create')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (d.title)    setTitle(d.title)
        if (d.content)  setContent(d.content)
        if (d.category) setCategory(d.category)
        if (d.tags)     setTags(d.tags)
        if (d.excerpt)  setExcerpt(d.excerpt)
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('draft_create', JSON.stringify({ title, content, category, tags, excerpt }))
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, content, category, tags, excerpt])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setImageError('Select an image file (PNG, JPG, WebP)'); return }
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(action: 'draft' | 'submit') {
    setSubmitError(''); setSubmitting(true); setSaved(false)
    try {
      let featuredImageUrl: string | null = null
      if (imageFile) {
        setImageUploading(true)
        try {
          const { url } = await uploadFeaturedImage(imageFile, slugify(title || 'article'))
          featuredImageUrl = url
        } catch {
          setImageError('Image upload failed — please try again.')
          setSubmitting(false); setImageUploading(false); return
        }
        setImageUploading(false)
      }

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, category, tags, content, excerpt,
          source_reference:  sourceRef,
          monetization_type: monetization,
          featured_image:    featuredImageUrl,
          action,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.error ?? 'Failed to save — please try again.')
        return
      }

      localStorage.removeItem('draft_create')
      setSaved(true)
      router.push('/journalist/dashboard')
    } catch {
      setSubmitError('Unexpected error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Sticky action bar ── */}
      <div className="sticky top-0 z-20 backdrop-blur-md shadow-sm" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/journalist/dashboard"
              className="transition-colors shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              ←
            </Link>
            <div className="w-2 h-6 rounded-full shrink-0" style={{ background: 'linear-gradient(to bottom, var(--primary), var(--accent))' }} />
            <h1 className="text-sm font-black truncate" style={{ color: 'var(--primary)' }}>New Article</h1>
            {title && (
              <span className="text-xs truncate hidden md:block" style={{ color: 'var(--text-tertiary)' }}>— {title}</span>
            )}
            {saved && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-fade-in"
                style={{ color: 'var(--primary)', background: 'var(--success-light)' }}>
                ✅ Saved
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
            <button onClick={() => handleSubmit('submit')}
              disabled={submitting || !title.trim() || !content.trim()}
              className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:shadow-md disabled:opacity-40"
              style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
              {submitting ? (imageUploading ? '⏫ Uploading…' : '⏳ Submitting…') : '📤 Submit for Review'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {submitError && (
          <div role="alert" className="mb-5 text-sm px-4 py-3 rounded-xl flex items-center gap-2"
            style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
            ⚠️ {submitError}
          </div>
        )}

        <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ════════ LEFT ════════ */}
          <div className="space-y-5">

            {/* Headline */}
            <div className="rounded-2xl shadow-sm p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <label className={labelCls} htmlFor="cr-title" style={{ color: 'var(--text-tertiary)' }}>📰 Headline</label>
              <textarea
                id="cr-title" rows={2}
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Write your headline here…"
                className="w-full text-2xl md:text-3xl font-black bg-transparent outline-none resize-none leading-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, "Times New Roman", serif' }}
              />
              {title && (
                <p className="text-xs mt-2 pt-2" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}>{title.length} characters</p>
              )}
            </div>

            {/* Category + Tags + Source */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls} htmlFor="cr-category" style={{ color: 'var(--text-tertiary)' }}>🗂 Category</label>
                  <select id="cr-category" value={category} onChange={e => setCategory(e.target.value)}
                    className={fieldCls}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                    <option value="">Choose…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="cr-tags" style={{ color: 'var(--text-tertiary)' }}>
                    🏷 Tags
                    <span className="font-normal normal-case tracking-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>comma-separated</span>
                  </label>
                  <input id="cr-tags" type="text" value={tags} onChange={e => setTags(e.target.value)}
                    placeholder="Kenya, Politics, Africa…"
                    className={fieldCls}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="cr-source" style={{ color: 'var(--text-tertiary)' }}>🔗 Source URL</label>
                  <input id="cr-source" type="url" value={sourceRef} onChange={e => setSourceRef(e.target.value)}
                    placeholder="https://source.com"
                    className={fieldCls}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <label className={labelCls} htmlFor="cr-excerpt" style={{ color: 'var(--text-tertiary)' }}>
                📝 Excerpt
                <span className="font-normal normal-case tracking-normal ml-2" style={{ color: 'var(--text-tertiary)' }}>
                  (shown in article cards — auto-generated if blank)
                </span>
              </label>
              <textarea id="cr-excerpt" rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="A brief hook that draws readers in…"
                className={fieldCls + ' resize-none'}
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            </div>

            {/* Content editor */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <label className={labelCls + ' mb-0'} style={{ color: 'var(--text-tertiary)' }}>Content</label>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{wordCount} words · ~{readMins} min read</span>
              </div>
              <RichTextEditor
                content={content}
                onChange={val => setContent(val)}
                placeholder="Write your article here..."
                minHeight={480}
              />
            </div>

            {/* Monetization */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <label className={labelCls} style={{ color: 'var(--text-tertiary)' }}>💰 Monetization</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MONETIZE_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer text-center transition-all duration-200"
                    style={{
                      borderColor: monetization === opt.value ? 'var(--primary)' : 'var(--border-subtle)',
                      background: monetization === opt.value ? 'var(--primary-light)' : 'var(--bg-surface)',
                    }}>
                    <input type="radio" name="monetization" value={opt.value}
                      checked={monetization === opt.value} onChange={() => setMonetization(opt.value)}
                      className="sr-only" />
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                    <span className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* ════════ RIGHT ════════ */}
          <div className="space-y-4 xl:sticky xl:top-16">

            {/* Featured image */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <h4 className={labelCls + ' mb-0'} style={{ color: 'var(--text-tertiary)' }}>🖼 Featured Image</h4>
              </div>
              <div className="p-4">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageSelect} className="sr-only" aria-label="Upload featured image" />
                {imagePreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                    <Image src={imagePreview} alt="Featured" fill className="object-cover" />
                    <div className="absolute inset-0 transition-all duration-300 flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0)' }}>
                      <button type="button"
                        onClick={() => { setImagePreview(null); setImageFile(null) }}
                        className="opacity-0 group-hover:opacity-100 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
                        style={{ background: 'var(--error)' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-xl py-10 flex flex-col items-center gap-2 transition-all group"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all"
                      style={{ background: 'var(--primary-light)' }}>
                      📷
                    </div>
                    <p className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-tertiary)' }}>
                      Click to upload
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>PNG, JPG, WebP</p>
                  </button>
                )}
                {imageError && <p className="text-xs mt-2" style={{ color: 'var(--error)' }}>⚠️ {imageError}</p>}
                {!imagePreview && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-3 text-xs font-bold py-2.5 rounded-xl transition-all"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    Choose Image
                  </button>
                )}
              </div>
            </div>

            {/* Submit card */}
            <div className="rounded-2xl shadow-sm p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h4 className={labelCls} style={{ color: 'var(--text-tertiary)' }}>🚀 Publish</h4>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                Your article goes to the editorial queue. The admin reviews it before it goes live.
              </p>
              <button onClick={() => handleSubmit('submit')}
                disabled={submitting || !title.trim() || !content.trim()}
                className="w-full font-bold py-3 rounded-xl text-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed mb-2"
                style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}>
                {submitting ? '⏳ Submitting…' : '📤 Submit for Review'}
              </button>
              <button onClick={() => handleSubmit('draft')} disabled={submitting}
                className="w-full font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40"
                style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                💾 Save Draft
              </button>
            </div>

            {/* Completeness */}
            <div className="rounded-2xl shadow-sm p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={labelCls + ' mb-0'} style={{ color: 'var(--text-tertiary)' }}>✅ Completeness</h4>
                <span className="text-sm font-black" style={{ color: completeness === 100 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                  {completeness}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-muted)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${completeness}%`,
                    background: completeness === 100
                      ? 'linear-gradient(to right, var(--primary), var(--accent))'
                      : 'linear-gradient(to right, var(--warning), var(--accent))',
                  }} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Headline',  done: !!title },
                  { label: 'Category',  done: !!category },
                  { label: 'Content',   done: content.length > 50 },
                  { label: 'Image',     done: !!imagePreview },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5"
                    style={{
                      background: item.done ? 'var(--primary-light)' : 'var(--bg-muted)',
                      color: item.done ? 'var(--primary)' : 'var(--text-tertiary)',
                    }}>
                    <span>{item.done ? '✅' : '○'}</span>
                    {item.label}
                  </div>
                ))}
              </div>
              {completeness === 100 && (
                <p className="text-xs font-bold mt-3 text-center animate-fade-in"
                  style={{ color: 'var(--primary)' }}>
                  🎉 Ready to submit!
                </p>
              )}
            </div>

            {/* Autosave notice */}
            <p className="text-[10px] text-center px-2" style={{ color: 'var(--text-tertiary)' }}>
              ✨ Draft auto-saves to your browser every second.
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
