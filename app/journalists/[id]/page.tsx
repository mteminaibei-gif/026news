import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ArticleCard } from '@/components/news/ArticleCard'
import { ChatWidget } from '@/components/ui/ChatWidget'
import { createClient } from '@/lib/supabase/server'
import { formatNumber } from '@/lib/utils'
import type { ArticleWithAuthor } from '@/lib/supabase/types'

interface Props { params: Promise<{ id: string }> }

type JournalistProfile = {
  user_id: number
  name: string
  bio: string | null
  profile_image: string | null
  email: string
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('name, bio, profile_image')
    .eq('user_id', Number(id))
    .eq('role', 'journalist' as never)
    .single()

  if (!data) return { title: 'Journalist Not Found' }
  const j = data as { name: string; bio: string | null; profile_image: string | null }
  return {
    title: `${j.name} — Journalist`,
    description: j.bio ?? `Read articles by ${j.name} on 026News.`,
    openGraph: {
      title: `${j.name} | 026News`,
      description: j.bio ?? '',
      images: j.profile_image ? [{ url: j.profile_image }] : [],
    },
  }
}

export default async function JournalistProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch journalist profile
  const { data: rawJournalist } = await supabase
    .from('users')
    .select('user_id, name, bio, profile_image, email')
    .eq('user_id', Number(id))
    .eq('role', 'journalist' as never)
    .single()

  if (!rawJournalist) notFound()
  const journalist = rawJournalist as unknown as JournalistProfile

  // Fetch their published articles
  const { data: rawArticles } = await supabase
    .from('articles')
    .select('*, author:users(user_id,name,profile_image,bio), category:categories(name)')
    .eq('author_id', journalist.user_id)
    .eq('status', 'published' as never)
    .order('created_at', { ascending: false })
    .limit(20)
  const articles = (rawArticles ?? []) as unknown as ArticleWithAuthor[]

  // Aggregate stats
  const totalViews = articles.reduce((s, a) => s + (a.views ?? 0), 0)

  const stats = [
    { label: 'Articles Published', value: articles.length.toString() },
    { label: 'Total Views',        value: formatNumber(totalViews) },
    { label: 'Categories',         value: [...new Set(articles.map(a => a.category?.name).filter(Boolean))].length.toString() },
    { label: 'Platform',           value: '026News' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero banner */}
      <section
        className="text-white py-20 px-4"
        style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}
        aria-label={`${journalist.name} profile`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative inline-block mb-4">
            {journalist.profile_image ? (
              <Image
                src={journalist.profile_image}
                alt={journalist.name}
                width={100}
                height={100}
                className="rounded-full object-cover"
                style={{ border: '4px solid var(--accent)' }}
              />
            ) : (
              <div
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center text-4xl font-black text-white"
                style={{ background: 'rgba(255,255,255,0.2)', border: '4px solid var(--accent)' }}
              >
                {journalist.name.charAt(0)}
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>{journalist.name}</h1>
          <p className="font-bold uppercase tracking-wider text-sm mb-4" style={{ color: 'var(--accent)' }}>
            Freelance Author · 026News
          </p>
          {journalist.bio && (
            <p className="max-w-xl mx-auto text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{journalist.bio}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a
              href={`mailto:${journalist.email}`}
              className="font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ background: 'var(--accent)', color: '#1a1a1a' }}
            >
              Contact Author
            </a>
            <Link
              href="/subscribe"
              className="font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
            >
              Follow &amp; Subscribe
            </Link>
          </div>
        </div>

        {/* Chat Widget */}
        <div className="absolute bottom-6 right-6 z-10">
          <ChatWidget
            receiverId={journalist.user_id}
            receiverName={journalist.name}
            receiverImage={journalist.profile_image}
          />
        </div>
      </section>

      {/* Stats strip */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-4xl mx-auto px-4 py-12 w-full">
        <h2 className="text-xl font-extrabold mb-6" style={{ color: 'var(--text-primary)', fontFamily: "'Newsreader', Georgia, serif" }}>
          📰 Articles by {journalist.name}
        </h2>
        {articles.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {articles.map(article => (
              <ArticleCard key={article.article_id} article={article as never} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="text-4xl mb-3">📭</div>
            <p className="font-semibold">No published articles yet.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
