'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_CATEGORIES, MOCK_USERS } from '@/lib/mock-data'

const MONETIZE_OPTIONS = [
  { value: 'free', icon: '🆓', label: 'Free', desc: 'Public access' },
  { value: 'paywall', icon: '🔒', label: 'Paywall', desc: 'Premium subscribers only' },
  { value: 'sponsored', icon: '🤝', label: 'Sponsored', desc: 'Sponsored content' },
  { value: 'ad', icon: '📢', label: 'Ad Placement', desc: 'Insert Ad Placement' },
]

export default function CreatePostPage() {
  const router = useRouter()
  const user = MOCK_USERS[0]

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [sourceRef, setSourceRef] = useState('')
  const [monetization, setMonetization] = useState('free')
  const [submitting, setSubmitting] = useState(false)

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const completeness = [title, category, content, sourceRef, tags].filter(Boolean).length * 20

  async function handleSubmit(action: 'draft' | 'submit') {
    setSubmitting(true)
    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, tags, content, source_reference: sourceRef, monetization_type: monetization, action }),
    })
    setSubmitting(false)
    if (res.ok) router.push('/journalist/dashboard')
  }

  return (
    <>
      <Topbar title="Create New Article" user={{ name: user.name, profile_image: user.profile_image }}>
        <span className="text-sm text-gray-400">{user.name}</span>
      </Topbar>

      <div className="p-6 flex-1">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">

          {/* ── Editor ── */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-5">✏️ Create New Article</h2>

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
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Category</label>
                <select
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
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. Tech, Innovation, AI"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-lg">
              {['B', 'I', 'U', '|', 'H1', 'H2', '|', '☰', '1.', '❝', '|', '🔗', '🖼', '🎬', '|', '⬅', '⬛', '➡'].map((btn, i) =>
                btn === '|' ? (
                  <div key={i} className="w-px h-6 bg-gray-300 mx-1 self-center" />
                ) : (
                  <button
                    key={i}
                    type="button"
                    className="w-8 h-7 text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors flex items-center justify-center"
                  >
                    {btn}
                  </button>
                )
              )}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={"Write your story here...\n\nShare the facts, tell the story, cite your sources."}
              rows={12}
              className="w-full border border-gray-200 rounded-b-lg px-4 py-3 text-sm text-gray-800 outline-none focus:border-blue-600 resize-y mb-5"
            />

            {/* Source Reference */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">🔗 Source Reference</label>
              <input
                type="url"
                value={sourceRef}
                onChange={e => setSourceRef(e.target.value)}
                placeholder="https://source-url.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
            </div>

            {/* Monetization */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">💰 Monetization</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {MONETIZE_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      monetization === opt.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input type="radio" name="monetization" value={opt.value} checked={monetization === opt.value} onChange={() => setMonetization(opt.value)} className="hidden" />
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
                  {wordCount} words · {Math.ceil(wordCount / 200)} min read
                </span>
                <button
                  onClick={() => handleSubmit('submit')}
                  disabled={submitting || !title || !content}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : '📤 Submit for Review'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="space-y-4">
            {/* Featured image */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">🖼 Featured Image</h4>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                <span className="text-3xl block mb-2">📷</span>
                <p className="text-sm text-gray-400">Click to upload image</p>
                <p className="text-xs text-gray-300 mt-1">PNG, JPG up to 5MB</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button className="bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors">📤 Upload</button>
                <button className="bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-200 transition-colors">🎬 Video</button>
              </div>
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
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${completeness}%` }} />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">✅ Checklist</h4>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Headline entered', done: !!title },
                  { label: 'Category selected', done: !!category },
                  { label: 'Content written', done: !!content },
                  { label: 'Featured image', done: false },
                  { label: 'Source reference', done: !!sourceRef },
                  { label: 'Tags added', done: !!tags },
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
