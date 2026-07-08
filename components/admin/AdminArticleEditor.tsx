'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { uploadFeaturedImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const MONETIZE_OPTIONS = [
  { value: 'free',      icon: '🆓', label: 'Free',         desc: 'Public access' },
  { value: 'paywall',   icon: '🔒', label: 'Paywall',      desc: 'Premium subscribers only' },
  { value: 'sponsored', icon: '🤝', label: 'Sponsored',    desc: 'Sponsored content' },
  { value: 'ad',        icon: '📢', label: 'Ad Placement', desc: 'Serves ad units' },
]

const STATUS_OPTIONS = [
  { value: 'draft',        label: '💾 Draft',          desc: 'Save without publishing' },
  { value: 'under_review', label: '🔍 Under Review',   desc: 'Queue for editorial review' },
  { value: 'published',    label: '🚀 Published',      desc: 'Live on the site immediately' },
  { value: 'rejected',     label: '❌ Rejected',       desc: 'Mark as declined' },
]

type Category = { category_id: number; name: string }

interface ArticleEditorProps {
  /** When provided the editor works in edit mode; omit for create mode */
  initialData?: {
    article_id: number
    title: string
    content: string
    excerpt?: string | null
    category_id: number | null
    featured_image: string | null
    monetization_type: string
    status: string
    source_reference?: string | null
    author_id?: number | null
  }
  /** Redirect destination after save */
  redirectTo?: string
}

export function AdminArticleEditor({ initialData, redirectTo = '/admin/articles' }: ArticleEditorProps) {
  const router  = useRouter()
  const isEdit  = !!initialData

  const [title, setTitle]             = useState(initialData?.title ?? '')
  const [content, setContent]         = useState(initialData?.content ?? '')
  const [excerpt, setExcerpt]         = useState(initialData?.excerpt ?? '')
  const [categoryId, setCategoryId]   = useState<number | ''>(initialData?.category_id ?? '')
  const [sourceRef, setSourceRef]     = useState(initialData?.source_reference ?? '')
  const [monetization, setMonetization] = useState(initialData?.monetization_type ?? 'free')
  const [status, setStatus]           = useState(initialData?.status ?? 'published')

  const [categories, setCategories]   = useState<Category[]>([])

  // Image state
  const fileInputRef                        = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile]           = useState<File | null>(null)
  const [imagePreview, setImagePreview]     = useState<string | null>(initialData?.featured_image ?? null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError]         = useState('')

  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved]         = useState(false)

  const wordCount    = content.trim().split(/\s+/).filter(Boolean).length
  const completeness = [title, categoryId, content, imagePreview].filter(Boolean).length * 25

  // Load categories from Supabase via API
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {
        // Fallback to common categories if endpoint not available
        setCategories([
          { category_id: 1, name: 'Politics' },
          { category_id: 2, name: 'Business' },
          { category_id: 3, name: 'Tech' },
          { category_id: 4, name: 'Science' },
          { category_id: 5, name: 'Entertainment' },
          { category_id: 6, name: 'Sports' },
          { category_id: 7, name: 'Kenya' },
          { category_id: 8, name: 'Africa' },
          { category_id: 9, name: 'Health' },
        ])
      })
  }, [])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setImageError('Please select an image file (PNG, JPG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5 MB.')
      return
    }
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave(overrideStatus?: string) {
    setSaveError('')
    setSaving(true)
    setSaved(false)

    try {
      let featuredImageUrl: string | null = imagePreview

      if (imageFile) {
        setImageUploading(true)
        try {
          const { url } = await uploadFeaturedImage(imageFile, slugify(title || 'article'))
          featuredImageUrl = url
        } catch {
          setImageError('Image upload failed. Please try again.')
          setSaving(false)
          setImageUploading(false)
          return
        }
        setImageUploading(false)
      }

      const payload = {
        ...(isEdit ? { article_id: initialData!.article_id } : {}),
        title:             title.trim(),
        content:           content.trim(),
        excerpt:           excerpt.trim() || content.trim().substring(0, 200),
        category_id:       categoryId !== '' ? Number(categoryId) : null,
        featured_image:    featuredImageUrl,
        monetization_type: monetization,
        status:            overrideStatus ?? status,
        source_reference:  sourceRef.trim() || null,
      }

      const res = await fetch('/api/admin/articles/edit', {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error ?? 'Failed to save article. Please try again.')
        return
      }

      setSaved(true)
      router.push(redirectTo)
      router.refresh()
    } catch {
      setSaveError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

      {/* ── Main editor panel ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900">
            {isEdit ? '✏️ Edit Article' : '✏️ Write New Article'}
          </h2>
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              ✅ Saved!
            </span>
          )}
        </div>

        {saveError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {saveError}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="article-title">
            Headline
          </label>
          <input
            id="article-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter your headline here..."
            className="w-full text-xl font-bold text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-2 bg-transparent transition-colors"
          />
        </div>

        {/* Category + Source */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="article-category">
              Category
            </label>
            <select
              id="article-category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-600 bg-white"
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="article-source">
              Source Reference URL
            </label>
            <input
              id="article-source"
              type="url"
              value={sourceRef}
              onChange={e => setSourceRef(e.target.value)}
              placeholder="https://source.com/article"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="article-excerpt">
            Excerpt <span className="font-normal text-gray-400">(optional — auto-generated if blank)</span>
          </label>
          <textarea
            id="article-excerpt"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Brief description shown in article cards..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 resize-none"
          />
        </div>

        {/* MD Editor */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Content
          </label>
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={val => setContent(val ?? '')}
              height={420}
              preview="edit"
              aria-label="Article content editor"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min read
          </p>
        </div>

        {/* Monetization */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            💰 Monetization
          </label>
          <div className="grid sm:grid-cols-2 gap-2">
            {MONETIZE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  monetization === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="monetization"
                  value={opt.value}
                  checked={monetization === opt.value}
                  onChange={() => setMonetization(opt.value)}
                  className="sr-only"
                />
                <span className="text-lg">{opt.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            💾 Save as Draft
          </button>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSave('under_review')}
              disabled={saving || !title.trim() || !content.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              🔍 Queue for Review
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving || !title.trim() || !content.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {saving ? (imageUploading ? 'Uploading image…' : 'Publishing…') : '🚀 Publish Now'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="space-y-4">

        {/* Featured image */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">🖼 Featured Image</h4>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageSelect}
            className="sr-only"
            aria-label="Upload featured image"
          />
          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
              <Image src={imagePreview} alt="Featured image preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null) }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <span className="text-3xl block mb-2">📷</span>
              <p className="text-sm text-gray-400">Click to upload image</p>
              <p className="text-xs text-gray-300 mt-1">PNG, JPG, WebP up to 5 MB</p>
            </button>
          )}
          {imageError && <p className="text-red-500 text-xs mt-1">{imageError}</p>}
          {!imagePreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors"
            >
              📤 Choose Image
            </button>
          )}
        </div>

        {/* Publication status */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">📋 Publication Status</h4>
          <div className="space-y-2">
            {STATUS_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                  status === opt.value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="pub-status"
                  value={opt.value}
                  checked={status === opt.value}
                  onChange={() => setStatus(opt.value)}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={() => handleSave()}
            disabled={saving || !title.trim() || !content.trim()}
            className="w-full mt-3 bg-[#0a1628] hover:bg-[#162035] text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '✨ Create Article'}
          </button>
        </div>

        {/* Completeness */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">✅ Completeness</h4>
          <div className="space-y-2 text-sm mb-3">
            {[
              { label: 'Headline',        done: !!title },
              { label: 'Category',        done: categoryId !== '' },
              { label: 'Content written', done: content.length > 100 },
              { label: 'Featured image',  done: !!imagePreview },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-gray-600">
                <span>{item.done ? '✅' : '⬜'}</span>
                <span className={item.done ? 'font-medium text-gray-900' : ''}>{item.label}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-bold">{completeness}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
