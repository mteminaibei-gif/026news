'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate, readingTime } from '@/lib/utils'

type ArticleRow = {
  article_id: number
  title: string
  content: string
  slug: string
  status: string
  monetization_type: string
  featured_image: string | null
  source_reference: string | null
  created_at: string
  views: number
  author: {
    user_id: number
    name: string
    profile_image: string | null
    bio: string | null
  } | null
  category: { name: string } | null
}

interface Props {
  article: ArticleRow
  authorArticleCount: number
}

export function AdminReviewClient({ article, authorArticleCount }: Props) {
  const router = useRouter()

  const [notes, setNotes]                     = useState('')
  const [featureHomepage, setFeatureHomepage] = useState(false)
  const [submitting, setSubmitting]           = useState(false)
  const [submitError, setSubmitError]         = useState('')

  const paragraphs = article.content.split('\n\n').filter(Boolean)

  async function handleAction(action: 'approve' | 'reject' | 'revision') {
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/articles/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:               article.article_id,
          action,
          notes,
          feature_homepage: featureHomepage,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setSubmitError(d.error ?? 'Action failed. Please try again.')
        return
      }
      router.push('/admin/articles?filter=under_review')
      router.refresh()
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">

      {/* ── Article Detail ── */}
      <div className="space-y-5">
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">

          {submitError && (
            <div role="alert" className="bg-[#fde8e8] border border-[#c8102e]/20 text-[#c8102e] text-sm px-4 py-3 rounded-xl mb-4">
              {submitError}
            </div>
          )}

          {/* Headline */}
          <div className="bg-[#f0faf2] border border-[#e8f5ea] rounded-xl px-4 py-3 mb-5">
            <p className="text-xs font-bold text-[#1a5c2a]/60 uppercase tracking-wider mb-1">Headline</p>
            <p className="text-base font-bold text-gray-900">{article.title}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-5 mb-5">
            {article.category && (
              <div>
                <p className="text-xs font-bold text-[#1a5c2a]/60 uppercase tracking-wider mb-1">Category</p>
                <Badge status="published" label={article.category.name} />
              </div>
            )}
            {article.author && (
              <div>
                <p className="text-xs font-bold text-[#1a5c2a]/60 uppercase tracking-wider mb-1">Author</p>
                <div className="flex items-center gap-2">
                  {article.author.profile_image ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                      <Image src={article.author.profile_image} alt={article.author.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#e8f5ea] flex items-center justify-center text-xs font-bold text-[#1a5c2a]">
                      {article.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900">{article.author.name}</span>
                  <span className="text-xs text-gray-400">· {formatDate(article.created_at)}</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-[#1a5c2a]/60 uppercase tracking-wider mb-1">Status</p>
              <Badge status={article.status} />
            </div>
          </div>

          {/* Featured image */}
          {article.featured_image && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-5 bg-[#f0faf2]">
              <Image src={article.featured_image} alt={article.title} fill className="object-cover" unoptimized />
            </div>
          )}

          {/* Content */}
          <div>
            <p className="text-xs font-bold text-[#1a5c2a]/60 uppercase tracking-wider mb-2">Article Content</p>
            <div className="bg-[#f9fdf9] border border-[#e8f5ea] rounded-xl p-4 max-h-64 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-3">
              {paragraphs.length > 0
                ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
                : <p className="text-gray-400 italic">No content</p>
              }
            </div>
          </div>

          {/* Source */}
          {article.source_reference && (
            <p className="text-sm text-gray-500 mt-4">
              🔗 Source:{' '}
              <a href={article.source_reference} target="_blank" rel="noopener noreferrer"
                className="text-[#1a5c2a] hover:underline break-all">
                {article.source_reference}
              </a>
            </p>
          )}

          <hr className="my-5 border-[#e8f5ea]" />

          {/* Publication settings */}
          <h3 className="text-sm font-bold text-[#1a5c2a] mb-4">⚙️ Publication Settings</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-40 shrink-0">Feature on Homepage</span>
            <button
              type="button"
              onClick={() => setFeatureHomepage(!featureHomepage)}
              aria-pressed={featureHomepage}
              className={`relative inline-flex h-5 w-9 rounded-full transition-all duration-300 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4caf28] ${
                featureHomepage ? 'bg-[#1a5c2a]' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5 duration-300 ${
                featureHomepage ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-[#e8f5ea]">
            <button
              onClick={() => handleAction('approve')}
              disabled={submitting}
              className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
            >
              ✅ Approve & Publish
            </button>
            <button
              onClick={() => handleAction('revision')}
              disabled={submitting}
              className="bg-[#f5c518] hover:bg-[#e6b800] text-[#1a1a1a] font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
            >
              🔄 Request Revision
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={submitting}
              className="bg-[#c8102e] hover:bg-[#a30d25] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
            >
              ❌ Reject
            </button>
            <Link
              href={`/admin/edit/${article.article_id}`}
              className="bg-[#f0faf2] hover:bg-[#e0f5e4] text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-300"
            >
              ✏️ Edit Article
            </Link>
          </div>
          {submitting && (
            <p className="text-xs text-gray-400 mt-2 animate-pulse">Processing…</p>
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="space-y-4">

        {/* Revision Notes */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="px-4 py-3 border-b border-[#e8f5ea] bg-gradient-to-r from-[#f0faf2] to-white">
            <h4 className="text-sm font-bold text-[#1a5c2a]">📝 Revision Notes</h4>
          </div>
          <div className="p-4">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder={"Add revision notes for the journalist...\nBe specific about what needs to change."}
              className="w-full border border-[#e8f5ea] rounded-xl p-3 text-sm resize-none outline-none focus:border-[#4caf28] focus:ring-2 focus:ring-[#4caf28]/20 transition-all duration-300"
            />
            <p className="text-xs text-gray-400 mt-1.5">Notes are sent when you request revision or reject.</p>
          </div>
        </div>

        {/* Journalist Profile */}
        {article.author && (
          <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-4 transition-all duration-300 hover:shadow-md">
            <h4 className="text-sm font-bold text-[#1a5c2a] mb-3">✍️ Journalist Profile</h4>
            <div className="flex items-center gap-3 mb-3">
              {article.author.profile_image ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-[#e8f5ea]">
                  <Image src={article.author.profile_image} alt={article.author.name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#e8f5ea] flex items-center justify-center text-base font-bold text-[#1a5c2a]">
                  {article.author.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-gray-900">{article.author.name}</p>
                <p className="text-xs text-[#1a5c2a]/70">Journalist</p>
                <p className="text-xs text-gray-400">{authorArticleCount} articles published</p>
              </div>
            </div>
            {article.author.bio && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">{article.author.bio}</p>
            )}
          </div>
        )}

        {/* Article Stats */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-4 transition-all duration-300 hover:shadow-md">
          <h4 className="text-sm font-bold text-[#1a5c2a] mb-3">📊 Article Stats</h4>
          <div className="space-y-0 divide-y divide-[#f0faf2]">
            {[
              { label: 'Word Count',     value: `${article.content.split(/\s+/).filter(Boolean).length} words` },
              { label: 'Est. Read Time', value: `${readingTime(article.content)} min` },
              { label: 'Category',       value: article.category?.name ?? '—' },
              { label: 'Monetization',   value: article.monetization_type },
              { label: 'Views',          value: article.views.toLocaleString() },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500">{row.label}</span>
                <span className="text-xs font-bold text-[#1a5c2a]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-4 transition-all duration-300 hover:shadow-md">
          <h4 className="text-sm font-bold text-[#1a5c2a] mb-3">🔒 Audit Trail</h4>
          <div className="space-y-3">
            {[
              { color: '#1a5c2a', text: `Submitted by ${article.author?.name ?? 'unknown'}`, time: formatDate(article.created_at) },
              { color: '#f5c518', text: `Status: ${article.status.replace('_', ' ')}`,         time: 'Current' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <span>{item.text}</span>
                  <span className="text-gray-400 ml-2">· {item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
