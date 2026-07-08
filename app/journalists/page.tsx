import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Our Journalists',
  description:
    'Meet the award-winning freelance journalists behind 026News. Covering politics, tech, business, science, and more from Africa and the world.',
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

      <section className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Our Journalists</h1>
        <p className="text-white/60 max-w-xl mx-auto">
          Independent voices. Verified facts. Stories from across Africa and the world.
          Meet the contributors behind 026News.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        {journalists.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No journalists found yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {journalists.map(j => (
              <Link
                key={j.user_id}
                href={`/journalists/${j.user_id}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#0a1628] to-[#1a3a6e]">
                  {j.profile_image ? (
                    <Image
                      src={j.profile_image}
                      alt={j.name}
                      width={80}
                      height={80}
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full object-cover ring-4 ring-white"
                    />
                  ) : (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-20 h-20 rounded-full bg-white ring-4 ring-white flex items-center justify-center text-2xl font-black text-[#0a1628]">
                      {j.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="pt-12 pb-6 px-5 text-center">
                  <h2 className="font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {j.name}
                  </h2>
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mt-0.5">
                    {j.first_category ?? 'Journalist'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{j.bio}</p>
                  <div className="flex justify-center gap-5 mt-4 text-xs text-gray-400">
                    <span>
                      <strong className="text-gray-700">{j.article_count ?? 0}</strong> articles
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA for writers */}
        <div className="mt-16 bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-extrabold mb-3">Are you a journalist?</h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Join our growing community of freelance contributors. Publish, earn, and build your
            audience on 026News.
          </p>
          <Link
            href="/login?mode=signup"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Apply as a Journalist
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
