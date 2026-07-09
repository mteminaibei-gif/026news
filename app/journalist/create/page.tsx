'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { uploadFeaturedImage } from '@/lib/storage'
import { slugify } from '@/lib/utils'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const MONETIZE_OPTIONS = [
  { value: 'free',      icon: '🆓', label: 'Free',         desc: 'Public access' },
  { value: 'paywall',   icon: '🔒', label: 'Paywall',      desc: 'Subscribers only' },
  { value: 'sponsored', icon: '🤝', label: 'Sponsored',    desc: 'Sponsored content' },
  { value: 'ad',        icon: '📢', label: 'Ad-supported', desc: 'Serves ad units' },
]

const CATEGORIES = [
  'Politics', 'Business', 'Tech', 'Science',
  'Entertainment', 'Sports', 'Kenya', 'Africa', 'Health',
]

const fieldCls = 'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 font-medium outline-none focus:border-[#4caf28] focus:ring-2 focus:ring-[#4caf28]/20 transition-all placeholder:text-gray-300'
const labelCls = 'block text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 mb-2'

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
    if (file.size > 5 * 1024 * 1024)    { setImageError('Image must be under 5 MB'); return }
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
    <div className="min-h-screen bg-gradient-to-br from-[#f4fbf6] via-white to-[#fff8e1]">

      {/* ── Sticky action bar ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/journalist/dashboard"
              className="text-gray-400 hover:text-[#1a5c2a] transition-colors shrink-0">
              ←
            </Link>
            <div className="w-2 h-6 rounded-full bg-gradient-to-b from-[#1a5c2a] to-[#4caf28] shrink-0" />
            <h1 className="text-sm font-black text-[#1a5c2a] truncate">New Article</h1>
            {title && (
              <span className="text-xs text-gray-400 truncate hidden md:block">— {title}</span>
            )}
            {saved && (
              <span className="text-xs font-bold text-[#1a5c2a] bg-[#e8f5ea] px-2 py-0.5 rounded-full animate-fade-in">
                ✅ Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-300 hidden sm:block">{wordCount} words · {readMins} min</span>
            <button onClick={() => handleSubmit('draft')} disabled={submitting}
              className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40">
              💾 Draft
            </button>
            <button onClick={() => handleSubmit('submit')}
              disabled={submitting || !title.trim() || !content.trim()}
              className="text-xs font-bold bg-[#1a5c2a] hover:bg-[#2d8a47] text-white px-4 py-1.5 rounded-lg transition-all hover:shadow-md disabled:opacity-40">
              {submitting ? (imageUploading ? '⏫ Uploading…' : '⏳ Submitting…') : '📤 Submit for Review'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {submitError && (
          <div role="alert" className="mb-5 bg-[#fde8e8] border border-[#c8102e]/20 text-[#c8102e] text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            ⚠️ {submitError}
          </div>
        )}

        <div className="grid xl:grid-cols-[1fr_300px] gap-6 items-start">

          {/* ════════ LEFT ════════ */}
          <div className="space-y-5">

            {/* Headline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className={labelCls} htmlFor="cr-title">📰 Headline</label>
              <textarea
                id="cr-title" rows={2}
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Write your headline here…"
                className="w-full text-2xl md:text-3xl font-black text-gray-900 placeholder:text-gray-200 bg-transparent outline-none resize-none leading-tight"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              />
              {title && (
                <p className="text-xs text-gray-300 mt-2 border-t border-gray-50 pt-2">{title.length} characters</p>
              )}
            </div>

            {/* Category + Tags + Source */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls} htmlFor="cr-category">🗂 Category</label>
                  <select id="cr-category" value={category} onChange={e => setCategory(e.target.value)}
                    className={fieldCls + ' bg-white'}>
                    <option value="">Choose…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="cr-tags">
                    🏷 Tags
                    <span className="font-normal normal-case tracking-normal ml-1 text-gray-300">comma-separated</span>
                  </label>
                  <input id="cr-tags" type="text" value={tags} onChange={e => setTags(e.target.value)}
                    placeholder="Kenya, Politics, Africa…"
                    className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="cr-source">🔗 Source URL</label>
                  <input id="cr-source" type="url" value={sourceRef} onChange={e => setSourceRef(e.target.value)}
                    placeholder="https://source.com"
                    className={fieldCls} />
                </div>
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className={labelCls} htmlFor="cr-excerpt">
                📝 Excerpt
                <span className="font-normal normal-case tracking-normal text-gray-300 ml-2">
                  (shown in article cards — auto-generated if blank)
                </span>
              </label>
              <textarea id="cr-excerpt" rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)}
                placeholder="A brief hook that draws readers in…"
                className={fieldCls + ' resize-none'} />
            </div>

            {/* Content editor */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
                <label className={labelCls + ' mb-0'}>✍️ Content</label>
                <span className="text-[11px] text-gray-300">{wordCount} words · ~{readMins} min read</span>
              </div>
              <div data-color-mode="light" className="editor-wrapper">
                <MDEditor
                  value={content} onChange={val => setContent(val ?? '')}
                  height={520} preview="live"
                  aria-label="Article content editor"
                />
              </div>
            </div>

            {/* Monetization */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <label className={labelCls}>💰 Monetization</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MONETIZE_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer text-center transition-all duration-200 ${
                    monetization === opt.value
                      ? 'border-[#1a5c2a] bg-[#f0faf2] shadow-sm'
                      : 'border-gray-100 hover:border-[#4caf28]/40 hover:bg-[#f9fdf9]'
                  }`}>
                    <input type="radio" name="monetization" value={opt.value}
                      checked={monetization === opt.value} onChange={() => setMonetization(opt.value)}
                      className="sr-only" />
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-xs font-bold text-gray-800">{opt.label}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* ════════ RIGHT ════════ */}
          <div className="space-y-4 xl:sticky xl:top-16">

            {/* Featured image */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h4 className={labelCls + ' mb-0'}>🖼 Featured Image</h4>
              </div>
              <div className="p-4">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageSelect} className="sr-only" aria-label="Upload featured image" />
                {imagePreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                    <Image src={imagePreview} alt="Featured" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <button type="button"
                        onClick={() => { setImagePreview(null); setImageFile(null) }}
                        className="opacity-0 group-hover:opacity-100 bg-[#c8102e] text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#4caf28] hover:bg-[#f9fdf9] transition-all group">
                    <div className="w-12 h-12 rounded-full bg-[#f0faf2] group-hover:bg-[#e8f5ea] flex items-center justify-center text-2xl transition-all">
                      📷
                    </div>
                    <p className="text-sm font-semibold text-gray-400 group-hover:text-[#1a5c2a] transition-colors">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-300">PNG, JPG, WebP · max 5 MB</p>
                  </button>
                )}
                {imageError && <p className="text-[#c8102e] text-xs mt-2">⚠️ {imageError}</p>}
                {!imagePreview && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-3 bg-[#f0faf2] hover:bg-[#e8f5ea] text-[#1a5c2a] text-xs font-bold py-2.5 rounded-xl transition-all">
                    Choose Image
                  </button>
                )}
              </div>
            </div>

            {/* Submit card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h4 className={labelCls}>🚀 Publish</h4>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Your article goes to the editorial queue. The admin reviews it before it goes live.
              </p>
              <button onClick={() => handleSubmit('submit')}
                disabled={submitting || !title.trim() || !content.trim()}
                className="w-full bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold py-3 rounded-xl text-sm transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed mb-2">
                {submitting ? '⏳ Submitting…' : '📤 Submit for Review'}
              </button>
              <button onClick={() => handleSubmit('draft')} disabled={submitting}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">
                💾 Save Draft
              </button>
            </div>

            {/* Completeness */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className={labelCls + ' mb-0'}>✅ Completeness</h4>
                <span className={`text-sm font-black ${completeness === 100 ? 'text-[#1a5c2a]' : 'text-gray-400'}`}>
                  {completeness}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${completeness}%`,
                    background: completeness === 100
                      ? 'linear-gradient(to right,#1a5c2a,#4caf28)'
                      : 'linear-gradient(to right,#f5c518,#4caf28)',
                  }} />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Headline',  done: !!title },
                  { label: 'Category',  done: !!category },
                  { label: 'Content',   done: content.length > 50 },
                  { label: 'Image',     done: !!imagePreview },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1.5 ${
                    item.done ? 'bg-[#f0faf2] text-[#1a5c2a] font-semibold' : 'bg-gray-50 text-gray-400'
                  }`}>
                    <span>{item.done ? '✅' : '○'}</span>
                    {item.label}
                  </div>
                ))}
              </div>
              {completeness === 100 && (
                <p className="text-xs text-[#1a5c2a] font-bold mt-3 text-center animate-fade-in">
                  🎉 Ready to submit!
                </p>
              )}
            </div>

            {/* Autosave notice */}
            <p className="text-[10px] text-gray-300 text-center px-2">
              ✨ Draft auto-saves to your browser every second.
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
