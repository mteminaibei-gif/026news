import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MOCK_USERS, MOCK_ARTICLES } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Our Journalists',
  description: 'Meet the award-winning freelance journalists behind 026News. Covering politics, tech, business, science, and more from Africa and the world.',
}

export default function JournalistsPage() {
  const journalists = MOCK_USERS.filter(u => u.role === 'journalist')

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {journalists.map(j => {
            const articles = MOCK_ARTICLES.filter(a => a.author_id === j.user_id && a.status === 'published')
            return (
              <Link
                key={j.user_id}
                href={`/journalists/${j.user_id}`}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#0a1628] to-[#1a3a6e]">
                  <Image
                    src={j.profile_image ?? ''}
                    alt={j.name}
                    width={80}
                    height={80}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full object-cover ring-4 ring-white"
                  />
                </div>
                <div className="pt-12 pb-6 px-5 text-center">
                  <h2 className="font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">{j.name}</h2>
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mt-0.5">
                    {articles[0]?.category?.name ?? 'Journalist'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{j.bio}</p>
                  <div className="flex justify-center gap-5 mt-4 text-xs text-gray-400">
                    <span><strong className="text-gray-700">{j.articles}</strong> articles</span>
                    <span><strong className="text-gray-700">{j.subscribers.toLocaleString()}</strong> subscribers</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* CTA for writers */}
        <div className="mt-16 bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-extrabold mb-3">Are you a journalist?</h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Join our growing community of freelance contributors. Publish, earn, and build your audience on 026News.
          </p>
          <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Apply as a Journalist
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
