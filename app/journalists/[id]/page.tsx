import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { MOCK_USERS, MOCK_ARTICLES } from '@/lib/mock-data'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const journalist = MOCK_USERS.find(u => u.user_id === Number(id))
  if (!journalist) return { title: 'Journalist Not Found' }
  return {
    title: `${journalist.name} — Journalist`,
    description: journalist.bio ?? `Read articles by ${journalist.name} on 026News.`,
    openGraph: {
      title: `${journalist.name} | 026News`,
      description: journalist.bio ?? '',
      images: journalist.profile_image ? [{ url: journalist.profile_image }] : [],
    },
  }
}

export function generateStaticParams() {
  return MOCK_USERS
    .filter(u => u.role === 'journalist')
    .map(u => ({ id: String(u.user_id) }))
}

export default async function JournalistProfilePage({ params }: Props) {
  const { id } = await params
  const journalist = MOCK_USERS.find(u => u.user_id === Number(id) && u.role === 'journalist')
  if (!journalist) notFound()

  const articles = MOCK_ARTICLES.filter(
    a => a.author_id === journalist.user_id && a.status === 'published'
  )

  const stats = [
    { label: 'Articles Published', value: journalist.articles },
    { label: 'Subscribers', value: journalist.subscribers.toLocaleString() },
    { label: 'Total Views', value: articles.reduce((s, a) => s + a.views, 0).toLocaleString() },
    { label: 'Earnings (USD)', value: `$${journalist.earnings.toFixed(2)}` },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero banner */}
      <section
        className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white py-20 px-4"
        aria-label={`${journalist.name} profile hero`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative inline-block mb-4">
            <Image
              src={journalist.profile_image ?? ''}
              alt={journalist.name}
              width={100}
              height={100}
              className="rounded-full object-cover ring-4 ring-orange-500"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{journalist.name}</h1>
          <p className="text-orange-400 font-bold uppercase tracking-wider text-sm mb-4">
            Freelance Journalist · 026News
          </p>
          {journalist.bio && (
            <p className="text-white/60 max-w-xl mx-auto text-base leading-relaxed">{journalist.bio}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link
              href={`mailto:${journalist.email}`}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Contact Journalist
            </Link>
            <Link
              href="/subscribe"
              className="border border-white/30 hover:bg-white/10 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Follow & Subscribe
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-[#0a1628]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-4xl mx-auto px-4 py-12 w-full">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          📰 Articles by {journalist.name}
        </h2>
        {articles.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {articles.map(article => (
              <ArticleCard key={article.article_id} article={article} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-10 text-center text-gray-400 shadow-sm">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold">No published articles yet.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
