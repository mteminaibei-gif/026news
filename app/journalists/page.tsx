import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Our Authors',
  description:
    'Meet the award-winning freelance authors behind 026News. Covering politics, tech, business, science, and more from Africa and the world.',
}

type JournalistRow = {
  user_id: number
  name: string
  bio: string | null
  profile_image: string | null
  article_count: number | null
  first_category: string | null
}

export default async function JournalistsPage() {
  const supabase = await createClient()

  // Fetch journalists with a count of their published articles
  const { data: rawJournalists } = await supabase
    .from('users')
    .select('user_id, name, bio, profile_image')
    .eq('role', 'journalist' as never)
    .eq('status', 'active' as never)
    .order('name', { ascending: true })

  const baseJournalists = (rawJournalists ?? []) as {
    user_id: number
    name: string
    bio: string | null
    profile_image: string | null
  }[]

  // Fetch per-journalist article counts + first category in one query
  const journalistIds = baseJournalists.map(j => j.user_id)
  let articleData: { author_id: number; category_name: string | null }[] = []

  if (journalistIds.length > 0) {
    const { data: rawArticles } = await supabase
      .from('articles')
      .select('author_id, category:categories(name)')
      .eq('status', 'published' as never)
      .in('author_id', journalistIds)
    articleData = (rawArticles ?? []).map((a: unknown) => {
      const row = a as { author_id: number; category: { name: string } | null }
      return { author_id: row.author_id, category_name: row.category?.name ?? null }
    })
  }

  // Build enriched journalist list
  const journalists: JournalistRow[] = baseJournalists.map(j => {
    const myArticles = articleData.filter(a => a.author_id === j.user_id)
    return {
      ...j,
      article_count:  myArticles.length,
      first_category: myArticles[0]?.category_name ?? null,
    }
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <section
        className="text-white py-16 px-4 text-center"
        style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}
      >
        <h1 className="text-4xl font-extrabold mb-4" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>Our Authors</h1>
        <p className="max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Independent voices. Verified facts. Stories from across Africa and the world.
          Meet the contributors behind 026News.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        {journalists.length === 0 ? (
          <p className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No authors found yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalists.map(j => (
              <Link
                key={j.user_id}
                href={`/journalists/${j.user_id}`}
                className="rounded-2xl transition-all overflow-hidden group"
                style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="relative h-32" style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}>
                  {j.profile_image ? (
                    <Image
                      src={j.profile_image}
                      alt={j.name}
                      width={80}
                      height={80}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full object-cover"
                      style={{ border: '4px solid var(--bg-surface)' }}
                    />
                  ) : (
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black"
                      style={{ background: 'var(--bg-surface)', border: '4px solid var(--bg-surface)', color: 'var(--primary)' }}
                    >
                      {j.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="pt-12 pb-6 px-5 text-center">
                  <h2 className="font-extrabold transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {j.name}
                  </h2>
                  <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--accent)' }}>
                    {j.first_category ?? 'Author'}
                  </p>
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{j.bio}</p>
                  <div className="flex justify-center gap-5 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>
                      <strong style={{ color: 'var(--text-secondary)' }}>{j.article_count ?? 0}</strong> articles
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA for writers */}
        <div
          className="mt-16 rounded-2xl p-8 text-center text-white"
          style={{ background: 'linear-gradient(to right, var(--bg-elevated), var(--primary))' }}
        >
          <h3 className="text-2xl font-extrabold mb-3" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>Are you an author?</h3>
          <p className="mb-6 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Join our growing community of freelance contributors. Publish, earn, and build your
            audience on 026News.
          </p>
          <Link
            href="/onboarding"
            className="font-bold px-8 py-3 rounded-xl transition-colors"
            style={{ background: 'var(--accent)', color: '#1a1a1a' }}
          >
            Apply as an Author
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
