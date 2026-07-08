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

  const [notes, setNotes]                   = useState('')
  const [featureHomepage, setFeatureHomepage] = useState(false)
  const [submitting, setSubmitting]          = useState(false)
  const [submitError, setSubmitError]        = useState('')

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
        <div className="bg-white rounded-2xl shadow-sm p-6">

          {submitError && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {submitError}
            </div>
          )}

          {/* Headline */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Headline</p>
            <p className="text-base font-bold text-gray-900">{article.title}</p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-5 mb-5">
            {article.category && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                <Badge status="published" label={article.category.name} />
              </div>
            )}
            {article.author && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Author</p>
                <div className="flex items-center gap-2">
                  {article.author.profile_image ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0">
                      <Image src={article.author.profile_image} alt={article.author.name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {article.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900">{article.author.name}</span>
                  <span className="text-xs text-gray-400">· {formatDate(article.created_at)}</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <Badge status={article.status} />
            </div>
          </div>

          {/* Featured image */}
          {article.featured_image && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-5 bg-gray-100">
              <Image
                src={article.featured_image}
                alt={article.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Content */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Article Content</p>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-64 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-3">
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
              <a
                href={article.source_reference}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {article.source_reference}
              </a>
            </p>
          )}

          <hr className="my-5 border-gray-100" />

          {/* Publication settings */}
          <h3 className="text-sm font-bold text-gray-900 mb-4">⚙️ Publication Settings</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 w-40 shrink-0">Feature on Homepage</span>
            <button
              type="button"
              onClick={() => setFeatureHomepage(!featureHomepage)}
              aria-pressed={featureHomepage}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${featureHomepage ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5 ${featureHomepage ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={() => handleAction('approve')}
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              ✅ Approve & Publish
            </button>
            <button
              onClick={() => handleAction('revision')}
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              🔄 Request Revision
            </button>
            <button
              onClick={() => handleAction('reject')}
              disabled={submitting}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              ❌ Reject
            </button>
            <Link
              href={`/admin/edit/${article.article_id}`}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900">📝 Revision Notes</h4>
          </div>
          <div className="p-4">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder={"Add revision notes for the journalist...\nBe specific about what needs to change."}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:border-blue-600"
            />
            <p className="text-xs text-gray-400 mt-1.5">Notes are sent when you request revision or reject.</p>
          </div>
        </div>

        {/* Journalist Profile */}
        {article.author && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">✍️ Journalist Profile</h4>
            <div className="flex items-center gap-3 mb-3">
              {article.author.profile_image ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                  <Image src={article.author.profile_image} alt={article.author.name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-600">
                  {article.author.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-gray-900">{article.author.name}</p>
                <p className="text-xs text-gray-400">Journalist</p>
                <p className="text-xs text-gray-400">{authorArticleCount} articles published</p>
              </div>
            </div>
            {article.author.bio && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">{article.author.bio}</p>
            )}
          </div>
        )}

        {/* Article Stats */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">📊 Article Stats</h4>
          <div className="space-y-0 divide-y divide-gray-50">
            {[
              { label: 'Word Count',     value: `${article.content.split(/\s+/).filter(Boolean).length} words` },
              { label: 'Est. Read Time', value: `${readingTime(article.content)} min` },
              { label: 'Category',       value: article.category?.name ?? '—' },
              { label: 'Monetization',   value: article.monetization_type },
              { label: 'Views',          value: article.views.toLocaleString() },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500">{row.label}</span>
                <span className="text-xs font-bold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">🔒 Audit Trail</h4>
          <div className="space-y-3">
            {[
              {
                color: '#1a56db',
                text:  `Submitted by ${article.author?.name ?? 'unknown'}`,
                time:  formatDate(article.created_at),
              },
              {
                color: '#f59e0b',
                text:  `Status: ${article.status.replace('_', ' ')}`,
                time:  'Current',
              },
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
