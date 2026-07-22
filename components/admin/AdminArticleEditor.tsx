'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { uploadFeaturedImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { SEOAnalyzer } from '@/components/seo/SEOAnalyzer'
import { AIWritingAssistant } from '@/components/admin/AIWritingAssistant'
import { AIEnhancePanel } from '@/components/editor/AIEnhancePanel'

const MONETIZE_OPTIONS = [
  { value: 'free',      icon: '🆓', label: 'Free',         desc: 'Public access' },
  { value: 'sponsored', icon: '🤝', label: 'Sponsored',    desc: 'Sponsored content' },
  { value: 'ad',        icon: '📢', label: 'Ad-supported', desc: 'Serves ad units' },
]

const STATUS_OPTIONS = [
  { value: 'draft',        icon: '💾', label: 'Draft',        desc: 'Save without publishing', color: 'text-gray-600' },
  { value: 'under_review', icon: '🔍', label: 'Under Review', desc: 'Queue for editorial',     color: 'text-amber-600' },
  { value: 'published',    icon: '🚀', label: 'Published',    desc: 'Live immediately',         color: 'var(--primary)', colorVar: 'var(--primary)' },
  { value: 'rejected',     icon: '❌', label: 'Rejected',     desc: 'Mark as declined',         color: 'var(--error)', colorVar: 'var(--error)' },
]

type Category = { category_id: number; name: string }

interface ArticleEditorProps {
  initialData?: {
    article_id: number; title: string; content: string
    excerpt?: string | null; category_id: number | null
    featured_image: string | null; monetization_type: string
    status: string; source_reference?: string | null; author_id?: number | null
  }
  redirectTo?: string
  adminName?: string
  adminImage?: string | null
  backHref?: string
  backLabel?: string
}

const fieldCls = 'w-full border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all'
const fieldStyle: React.CSSProperties = { background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)', ['--tw-ring-color' as string]: 'var(--success)' }
const labelCls = 'block text-[11px] font-black uppercase tracking-[0.1em] mb-2'

const AUTOSAVE_KEY = 'admin_editor_draft'

export function AdminArticleEditor({ initialData, redirectTo = '/admin/articles', adminName, adminImage, backHref = '/admin/articles', backLabel = '← Articles' }: ArticleEditorProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [title,        setTitle]        = useState(initialData?.title ?? '')
  const [content,      setContent]      = useState(initialData?.content ?? '')
  const [excerpt,      setExcerpt]      = useState(initialData?.excerpt ?? '')
  const [slug,         setSlug]         = useState(initialData?.title ? slugify(initialData.title) : '')
  const [slugEdited,   setSlugEdited]   = useState(false)
  const [tags,         setTags]         = useState('')
  const [categoryId,   setCategoryId]   = useState<number | ''>(initialData?.category_id ?? '')
  const [sourceRef,    setSourceRef]    = useState(initialData?.source_reference ?? '')
  const [monetization, setMonetization] = useState(initialData?.monetization_type ?? 'free')
  const [status,       setStatus]       = useState(initialData?.status ?? 'published')
  const [categories,   setCategories]   = useState<Category[]>([])

  const fileInputRef                        = useRef<HTMLInputElement>(null)
  const dropZoneRef                         = useRef<HTMLDivElement>(null)
  const [imageFile,      setImageFile]      = useState<File | null>(null)
  const [imagePreview,   setImagePreview]   = useState<string | null>(initialData?.featured_image ?? null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError,     setImageError]     = useState('')
  const [isDragging,     setIsDragging]     = useState(false)
  const [imageUrlInput,  setImageUrlInput]  = useState('')
  const [showUrlInput,   setShowUrlInput]   = useState(false)

  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [lastSaved,   setLastSaved]   = useState<Date | null>(null)

  const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  const wordCount    = plainText ? plainText.split(/\s+/).length : 0
  const readMins     = Math.max(1, Math.ceil(wordCount / 200))
  const completeness = [title, categoryId, content.length > 50, imagePreview].filter(Boolean).length * 25

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((d: Category[]) => setCategories(d))
      .catch(() => {})
  }, [])

  // Restore autosaved draft (new articles only)
  useEffect(() => {
    if (isEdit) return
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) return
      const d = JSON.parse(raw) as { title?: string; content?: string; excerpt?: string; tags?: string }
      if (d.title && !title)   setTitle(d.title)
      if (d.content && !content) setContent(d.content)
      if (d.excerpt) setExcerpt(d.excerpt)
      if (d.tags)    setTags(d.tags)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave draft to localStorage every 2 s
  useEffect(() => {
    if (isEdit) return
    const timer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title, content, excerpt, tags }))
      setLastSaved(new Date())
    }, 2000)
    return () => clearTimeout(timer)
  }, [title, content, excerpt, tags, isEdit])

  // Ctrl+S / Cmd+S → save as draft
  const handleSave = useCallback(async (overrideStatus?: string) => {
    setSaveError(''); setSaving(true); setSaved(false)
    try {
      let featuredImageUrl: string | null = imagePreview
      if (imageFile) {
        setImageUploading(true)
        try {
          const { url } = await uploadFeaturedImage(imageFile, slugify(title || 'article'))
          featuredImageUrl = url
        } catch {
          setImageError('Image upload failed — try again.')
          setSaving(false); setImageUploading(false); return
        }
        setImageUploading(false)
      }
      const payload = {
        ...(isEdit ? { article_id: initialData!.article_id } : {}),
        title: title.trim(), content: content.trim(),
        excerpt: excerpt.trim() || content.trim().substring(0, 200),
        category_id: categoryId !== '' ? Number(categoryId) : null,
        featured_image: featuredImageUrl, monetization_type: monetization,
        status: overrideStatus ?? status,
        source_reference: sourceRef.trim() || null,
        tags: tags.trim() || null,
        ...(slugEdited ? { slug: slug.trim() } : {}),
      }
      const res = await fetch('/api/admin/articles/edit', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? 'Save failed'); return }
      setSaved(true)
      if (!isEdit) localStorage.removeItem(AUTOSAVE_KEY)
      router.push(redirectTo)
    } catch { setSaveError('Unexpected error — please try again.') }
    finally   { setSaving(false) }
  }, [title, content, excerpt, tags, categoryId, sourceRef, monetization, status, imagePreview, imageFile, isEdit, initialData, redirectTo, router])

  // Image helpers
  function applyImageFile(file: File) {
    if (!file.type.startsWith('image/')) { setImageError('Select an image file (PNG, JPG, WebP)'); return }
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) applyImageFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) applyImageFile(file)
  }

  function handlePasteUrl() {
    const url = imageUrlInput.trim()
    if (!url.startsWith('http')) { setImageError('Enter a valid image URL (http/https)'); return }
    setImageError('')
    setImagePreview(url)
    setImageFile(null)
    setImageUrlInput('')
    setShowUrlInput(false)
  }

  // Ctrl+S / Cmd+S → save draft
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave('draft')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom right, var(--primary-light), var(--bg-surface), var(--warning-light))' }}>

      {/* ── CMS Header Navigation Strip ── */}
      <div className="sticky top-0 z-20 backdrop-blur-md shadow-sm" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a href={backHref}
              className="text-sm transition-colors shrink-0 hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
              ←
            </a>
            <div className="w-2 h-6 rounded-full shrink-0" style={{ background: 'linear-gradient(to bottom, var(--primary), var(--success))' }} />
            <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              {isEdit ? 'Editing' : 'Draft'}
            </span>
            <h1 className="text-sm font-black truncate" style={{ color: 'var(--primary)' }}>
              {isEdit ? 'Edit Article' : 'Writing Studio'}
            </h1>
            {title && (
              <span className="text-xs truncate hidden md:block" style={{ color: 'var(--text-tertiary)' }}>— {title}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <span className="text-xs font-bold px-3 py-1 rounded-full animate-fade-in" style={{ color: 'var(--primary)', background: 'var(--border-subtle)' }}>
                ✅ Saved
              </span>
            )}
            {!saved && lastSaved && (
              <span className="text-[10px] hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
                autosaved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="text-xs hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>{wordCount} words · {readMins} min</span>
            <span className="text-[10px] hidden md:block" style={{ color: 'var(--text-tertiary)' }}>Ctrl+S = draft</span>
            <button onClick={() => handleSave('draft')} disabled={saving}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40" style={{ color: 'var(--text-tertiary)', background: 'var(--border)' }}>
              💾 Draft
            </button>
            <button onClick={() => handleSave('under_review')} disabled={saving || !title.trim() || !content.trim()}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40" style={{ background: 'var(--warning)', color: 'var(--text-primary)' }}>
              🔍 Review
            </button>
            <button onClick={() => handleSave('published')} disabled={saving || !title.trim() || !content.trim()}
              className="text-xs font-bold text-white px-4 py-1.5 rounded-lg transition-all hover:shadow-md disabled:opacity-40" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}>
              {saving ? (imageUploading ? '⏫ Uploading…' : '⏳ Saving…') : '🚀 Publish'}
            </button>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div role="alert" className="text-sm px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--error-light)', border: '1px solid rgba(200, 16, 46, 0.2)', color: 'var(--error)' }}>
            ⚠️ {saveError}
          </div>
        </div>
      )}

      {/* ── Split Screen Studio Grid ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex gap-6 items-start">

          {/* ════ LEFT: Writing Deck (flexible) ════ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Headline */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <label className={labelCls} htmlFor="ed-title" style={{ color: 'var(--text-tertiary)' }}>Article Core Headline</label>
              <textarea id="ed-title" rows={2} value={title}
                onChange={e => { setTitle(e.target.value); if (!slugEdited) setSlug(slugify(e.target.value)) }}
                placeholder="Write your headline here..."
                className="w-full text-2xl md:text-3xl font-black bg-transparent outline-none resize-none leading-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'Georgia, "Times New Roman", serif' }} />
              {title && <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{title.length} characters</p>}
            </div>

            {/* Excerpt (Subhead) */}
            <div className="rounded-2xl shadow-sm p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <label className={labelCls} htmlFor="ed-excerpt" style={{ color: 'var(--text-tertiary)' }}>Article Short Deck Subhead</label>
              <textarea id="ed-excerpt" rows={2} value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Brief summary that draws readers in..."
                className={fieldCls + ' resize-none'} style={fieldStyle} />
            </div>

            {/* Content WYSIWYG */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <label className={labelCls + ' mb-0'} style={{ color: 'var(--text-tertiary)' }}>Content Canvas</label>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{wordCount} words · ~{readMins} min read</span>
              </div>
              <RichTextEditor
                content={content}
                onChange={val => setContent(val)}
                placeholder="Write your article here..."
                minHeight={480}
              />
            </div>

          </div>

          {/* ════ RIGHT: Article Configuration Dock (fixed 20rem) ════ */}
          <div className="w-[20rem] shrink-0 space-y-4 xl:sticky xl:top-16">

            {/* Global Production Attributes */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <h4 className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>🗂 Taxonomy</h4>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Regional Desk</label>
                  <select id="ed-category" value={categoryId}
                    onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className={fieldCls} style={fieldStyle}>
                    <option value="">Select category…</option>
                    {categories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Tags</label>
                  <input id="ed-tags" type="text" value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Kenya, Politics, Breaking..."
                    className={fieldCls + ' text-xs'} style={fieldStyle} />
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>Comma-separated keywords</p>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h4 className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>🖼 Featured Image</h4>
                <button type="button" onClick={() => setShowUrlInput(v => !v)}
                  className="text-[10px] font-bold hover:underline" style={{ color: 'var(--primary)' }}>
                  {showUrlInput ? 'Upload' : 'Paste URL'}
                </button>
              </div>
              <div className="p-4">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageSelect} className="sr-only" aria-label="Upload featured image" />
                {showUrlInput ? (
                  <div className="flex gap-2">
                    <input type="url" value={imageUrlInput}
                      onChange={e => setImageUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handlePasteUrl()}
                      placeholder="https://example.com/image.jpg"
                      className={fieldCls + ' text-xs'} style={fieldStyle} autoFocus />
                    <button type="button" onClick={handlePasteUrl}
                      className="shrink-0 text-white text-xs font-bold px-3 rounded-xl transition-all" style={{ background: 'var(--primary)' }}>
                      Use
                    </button>
                  </div>
                ) : imagePreview ? (
                  <div ref={dropZoneRef} className="relative w-full aspect-video rounded-xl overflow-hidden group"
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
                    <Image src={imagePreview} alt="Featured" fill className="object-cover" unoptimized sizes="(max-width: 640px) 100vw, 50vw" loading="lazy"/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs font-bold">Replace</button>
                      <button type="button" onClick={() => { setImagePreview(null); setImageFile(null) }}
                        className="opacity-0 group-hover:opacity-100 text-white rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: 'var(--error)' }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div ref={dropZoneRef}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer transition-all`}
                    style={{ borderColor: isDragging ? 'var(--primary)' : 'var(--border)', background: isDragging ? 'var(--border-subtle)' : 'transparent' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--primary-light)' }}>
                      {isDragging ? '⬇️' : '📷'}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: isDragging ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                      Click or drag image
                    </p>
                  </div>
                )}
                {imageError && <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--error)' }}>⚠️ {imageError}</p>}
              </div>
            </div>

            {/* SEO & Metadata */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <h4 className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>🔍 SEO</h4>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Slug</label>
                  <input type="text" value={slug}
                    onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
                    className={fieldCls + ' text-xs'} style={fieldStyle} />
                </div>
                <SEOAnalyzer
                  title={title}
                  content={content}
                  excerpt={excerpt}
                  slug={slug}
                  featuredImage={imagePreview ?? undefined}
                  tags={tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined}
                  category={categories.find(c => c.category_id === categoryId)?.name}
                  authorName={adminName}
                  onApplyTitle={(t) => setTitle(t)}
                  onApplyExcerpt={(e) => setExcerpt(e)}
                  onApplyContent={(c) => setContent(c)}
                  onApplySlug={(s) => { setSlug(s); setSlugEdited(true) }}
                  onApplyTags={(t) => setTags(t.join(', '))}
                />
              </div>
            </div>

            {/* AI Writing Assistant */}
            <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <AIWritingAssistant
                title={title}
                content={content}
                excerpt={excerpt}
                wordCount={wordCount}
                readMins={readMins}
                onApplyContent={(c) => setContent(c)}
                onApplyExcerpt={(e) => setExcerpt(e)}
              />
            </div>

            {/* AI Enhance (OpenAI grammar/style/cohesion + rewrite) */}
            <AIEnhancePanel
              title={title}
              content={content}
              onApplyContent={(c) => setContent(c)}
            />

            {/* Editorial Flags */}
            <div className="rounded-2xl shadow-sm p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>🚩 Editorial Flags</h4>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-muted">
                  <input type="checkbox" className="rounded accent-purple-500" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>⭐ Hero Carousel Feature</span>
                </label>
                <label className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-muted">
                  <input type="checkbox" className="rounded accent-red-500" />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>🔔 Push Alert Broadcast</span>
                </label>
              </div>
            </div>

            {/* Completeness */}
            <div className="rounded-2xl shadow-sm p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-black uppercase tracking-[0.1em]" style={{ color: 'var(--text-tertiary)' }}>✅ Completeness</h4>
                <span className="text-sm font-black" style={{ color: completeness === 100 ? 'var(--primary)' : 'var(--text-tertiary)' }}>{completeness}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completeness}%`, background: completeness === 100 ? 'linear-gradient(to right, var(--primary), var(--success))' : 'linear-gradient(to right, var(--warning), var(--success))' }} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Headline', done: !!title },
                  { label: 'Category', done: categoryId !== '' },
                  { label: 'Content', done: content.length > 50 },
                  { label: 'Image', done: !!imagePreview },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5"
                    style={{ background: item.done ? 'var(--primary-light)' : 'var(--border)', color: item.done ? 'var(--primary)' : 'var(--text-tertiary)', fontWeight: item.done ? 600 : 400 }}>
                    <span>{item.done ? '✅' : '○'}</span>{item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Publish button at bottom */}
            <button onClick={() => handleSave()} disabled={saving || !title.trim() || !content.trim()}
              className="w-full text-white font-bold py-3 rounded-xl text-sm transition-all duration-300 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}>
              {saving ? '⏳ Saving…' : isEdit ? '💾 Save Changes' : '✨ Create Article'}
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
