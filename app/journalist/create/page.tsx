'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_CATEGORIES } from '@/lib/mock-data'
import { uploadFeaturedImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'

// Load MD editor client-side only (no SSR) to avoid hydration mismatch
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const MONETIZE_OPTIONS = [
  { value: 'free',      icon: '🆓', label: 'Free',         desc: 'Public access' },
  { value: 'paywall',   icon: '🔒', label: 'Paywall',      desc: 'Premium subscribers only' },
  { value: 'sponsored', icon: '🤝', label: 'Sponsored',    desc: 'Sponsored content' },
  { value: 'ad',        icon: '📢', label: 'Ad Placement', desc: 'Insert Ad Placement' },
]

export default function CreatePostPage() {
  const router = useRouter()

  const [title, setTitle]             = useState('')
  const [category, setCategory]       = useState('')
  const [tags, setTags]               = useState('')
  const [content, setContent]         = useState('')
  const [sourceRef, setSourceRef]     = useState('')
  const [monetization, setMonetization] = useState('free')
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Image upload state
  const fileInputRef                        = useRef<HTMLInputElement>(null)
  const [imageFile, setImageFile]           = useState<File | null>(null)
  const [imagePreview, setImagePreview]     = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageError, setImageError]         = useState('')

  const wordCount    = content.trim().split(/\s+/).filter(Boolean).length
  const completeness = [title, category, content, sourceRef, tags, imagePreview].filter(Boolean).length * Math.floor(100 / 6)

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

  async function handleSubmit(action: 'draft' | 'submit') {
    setSubmitError('')
    setSubmitting(true)

    try {
      let featuredImageUrl: string | null = null

      // Upload image first if one was selected
      if (imageFile) {
        setImageUploading(true)
        try {
          const slug = slugify(title || 'article')
          const { url } = await uploadFeaturedImage(imageFile, slug)
          featuredImageUrl = url
        } catch (err) {
          setImageError('Image upload failed. Please try again.')
          setSubmitting(false)
          setImageUploading(false)
          return
        }
        setImageUploading(false)
      }

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          tags,
          content,
          source_reference:  sourceRef,
          monetization_type: monetization,
          featured_image:    featuredImageUrl,
          action,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.error ?? 'Failed to save article. Please try again.')
        return
      }

      router.push('/journalist/dashboard')
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Topbar title="Create New Article" user={{ name: '', profile_image: null }}>
        <span className="text-sm text-gray-400">Journalist Portal</span>
      </Topbar>

      <div className="p-6 flex-1">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">

          {/* ── Editor ── */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5">✏️ Create New Article</h2>

            {submitError && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                {submitError}
              </div>
            )}

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter your headline here..."
              className="w-full text-xl font-bold text-gray-900 placeholder-gray-300 border-b-2 border-gray-200 focus:border-blue-600 outline-none pb-2 mb-5 bg-transparent transition-colors"
            />

            {/* Category + Tags */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Select Category</option>
                  {MOCK_CATEGORIES.map(c => (
                    <option key={c.category_id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="tags">
                  Tags <span className="text-gray-400 font-normal">(comma separated)</span>
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. Tech, Innovation, AI"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Markdown editor */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Content
              </label>
              <div data-color-mode="light">
                <MDEditor
                  value={content}
                  onChange={val => setContent(val ?? '')}
                  height={360}
                  preview="edit"
                  aria-label="Article content editor"
                />
              </div>
            </div>

            {/* Source Reference */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5" htmlFor="source">
                🔗 Source Reference
              </label>
              <input
                id="source"
                type="url"
                value={sourceRef}
                onChange={e => setSourceRef(e.target.value)}
                placeholder="https://source-url.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            {/* Monetization */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
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
                      className="hidden"
                    />
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={submitting}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                💾 Save Draft
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {wordCount} words · {Math.max(1, Math.ceil(wordCount / 200))} min read
                </span>
                <button
                  onClick={() => handleSubmit('submit')}
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (imageUploading ? 'Uploading image…' : 'Submitting…') : '📤 Submit for Review'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="space-y-4">
            {/* Featured image */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">🖼 Featured Image</h4>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
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

              {imageError && (
                <p className="text-red-500 text-xs mt-1">{imageError}</p>
              )}

              {!imagePreview && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-3 bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📤 Choose Image
                </button>
              )}
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">📋 Article Status</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
                📝 New draft — not yet submitted
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completeness</span>
                  <span className="font-bold">{completeness}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">✅ Checklist</h4>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Headline entered',   done: !!title },
                  { label: 'Category selected',  done: !!category },
                  { label: 'Content written',    done: !!content },
                  { label: 'Featured image',     done: !!imagePreview },
                  { label: 'Source reference',   done: !!sourceRef },
                  { label: 'Tags added',         done: !!tags },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-gray-600">
                    <span>{item.done ? '✅' : '⬜'}</span>
                    <span className={item.done ? 'text-gray-900' : ''}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
