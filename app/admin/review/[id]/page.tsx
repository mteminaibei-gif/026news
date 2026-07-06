'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Topbar } from '@/components/layout/Topbar'
import { Badge } from '@/components/ui/Badge'
import { MOCK_ARTICLES, MOCK_USERS } from '@/lib/mock-data'
import { formatDate, readingTime } from '@/lib/utils'

interface Props { params: Promise<{ id: string }> }

export default function ReviewPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()

  const article = MOCK_ARTICLES.find(a => a.article_id === Number(id))
  const admin = MOCK_USERS[1]
  const author = article ? MOCK_USERS.find(u => u.user_id === article.author_id) : null

  const [notes, setNotes] = useState('')
  const [publishStatus, setPublishStatus] = useState('scheduled')
  const [featureHomepage, setFeatureHomepage] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!article) return (
    <div className="flex items-center justify-center h-screen text-gray-500">
      Article not found. <Link href="/admin/dashboard" className="text-blue-600 ml-2">Go back</Link>
    </div>
  )

  async function handleAction(action: 'approve' | 'reject' | 'revision') {
    setSubmitting(true)
    const res = await fetch('/api/articles/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: article!.article_id, action, notes, publish_status: publishStatus, feature_homepage: featureHomepage }),
    })
    setSubmitting(false)
    if (res.ok) router.push('/admin/dashboard')
  }

  const paragraphs = article.content.split('\n\n')

  return (
    <>
      <Topbar title="Review Article Submission" user={{ name: admin.name, profile_image: admin.profile_image }}>
        <Link href="/admin/dashboard" className="text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          ← Back
        </Link>
      </Topbar>

      <div className="p-6 flex-1">
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">

          {/* ── Article Detail ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm p-6">

              {/* Headline box */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Headline</p>
                <p className="text-base font-bold text-gray-900">{article.title}</p>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-5 mb-5">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p>
                  <Badge status="under_review" label={article.category?.name ?? ''} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned To</p>
                  {author && (
                    <div className="flex items-center gap-2">
                      <Image src={author.profile_image ?? ''} alt={author.name} width={28} height={28} className="rounded-full object-cover" />
                      <span className="text-sm font-semibold text-gray-900">By {author.name}</span>
                      <span className="text-xs text-gray-400">· Freelance · {formatDate(article.created_at)}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <Badge status={article.status} />
                </div>
              </div>

              {/* Featured image */}
              <div className="relative w-full h-64 rounded-xl overflow-hidden mb-5">
                <Image src={article.featured_image ?? ''} alt={article.title} fill className="object-cover" />
              </div>

              {/* Content */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Article Content</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-56 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-3">
                  {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs text-gray-400 font-semibold">Tags:</span>
                  {article.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Source */}
              {article.source_reference && (
                <p className="text-sm text-gray-500 mt-3">
                  🔗 Source: <a href={article.source_reference} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{article.source_reference}</a>
                </p>
              )}

              <hr className="my-5 border-gray-100" />

              {/* Publication Settings */}
              <h3 className="text-sm font-bold text-gray-900 mb-4">⚙️ Publication Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-36 shrink-0">Publication Status</span>
                  <select
                    value={publishStatus}
                    onChange={e => setPublishStatus(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="immediate">Immediate</option>
                    <option value="draft">Keep Draft</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-36 shrink-0">Publish Date</span>
                  <input
                    type="datetime-local"
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                    defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-36 shrink-0">Feature on Homepage</span>
                  <button
                    type="button"
                    onClick={() => setFeatureHomepage(!featureHomepage)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${featureHomepage ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ml-0.5 ${featureHomepage ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-36 shrink-0">Monetization</span>
                  <Badge status={article.monetization_type} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-gray-100">
                <button onClick={() => handleAction('approve')} disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                  ✅ Approve
                </button>
                <button onClick={() => handleAction('revision')} disabled={submitting}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                  🔄 Request Revision
                </button>
                <button onClick={() => handleAction('reject')} disabled={submitting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                  ❌ Reject
                </button>
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  ✏️ Edit Article
                </button>
              </div>
              <button onClick={() => handleAction('approve')} disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors mt-3 disabled:opacity-50">
                {submitting ? 'Processing...' : '🚀 Publish Article'}
              </button>
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
            {author && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">✍️ Journalist Profile</h4>
                <div className="flex items-center gap-3 mb-3">
                  <Image src={author.profile_image ?? ''} alt={author.name} width={48} height={48} className="rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-sm text-gray-900">{author.name}</p>
                    <p className="text-xs text-gray-400">Freelance Journalist</p>
                    <p className="text-xs text-gray-400">{(author as typeof author & { articles?: number }).articles ?? 0} articles published</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{author.bio?.substring(0, 110)}...</p>
              </div>
            )}

            {/* Article Stats */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">📊 Article Stats</h4>
              <div className="space-y-2 divide-y divide-gray-50">
                {[
                  { label: 'Word Count', value: `${article.content.split(' ').length} words` },
                  { label: 'Est. Read Time', value: `${readingTime(article.content)} min` },
                  { label: 'Category', value: article.category?.name ?? '—' },
                  { label: 'Monetization', value: article.monetization_type },
                  { label: 'Sources Listed', value: article.sources.length.toString() },
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
                  { color: '#1a56db', text: `Article submitted by ${author?.name}`, time: formatDate(article.created_at) },
                  { color: '#f59e0b', text: 'Under review — pending decision', time: 'Now' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                    <span className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="flex-1">{item.text}</span>
                    <span className="text-gray-400 whitespace-nowrap">{item.time}</span>
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
