import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MOCK_USERS } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'About Us',
  description: '026News is a next-generation news platform combining aggregated global journalism with a thriving community of freelance contributors across Africa and the world.',
}

const STATS = [
  { value: '120K+', label: 'Monthly Readers' },
  { value: '50+', label: 'Freelance Journalists' },
  { value: '1,200+', label: 'Articles Published' },
  { value: '7', label: 'News Categories' },
]

const VALUES = [
  { icon: '🎯', title: 'Accuracy First', desc: 'Every article is fact-checked and sourced. We cite our references and correct errors transparently.' },
  { icon: '✊', title: 'Journalist Empowerment', desc: 'We pay fair rates, provide analytics, and give journalists the tools to build sustainable careers.' },
  { icon: '🌍', title: 'Africa-Centered', desc: 'We amplify African voices, stories, and perspectives that are underrepresented in global media.' },
  { icon: '🔓', title: 'Open Access', desc: 'Core news is always free. Premium subscriptions unlock exclusive analysis and ad-free reading.' },
  { icon: '🔒', title: 'Privacy by Design', desc: 'We collect only what we need, never sell your data, and give you full control over your account.' },
  { icon: '⚡', title: 'Real-Time Journalism', desc: 'Live breaking news, realtime comments, and instant notifications keep you ahead of the story.' },
]

export default function AboutPage() {
  const journalists = MOCK_USERS.filter(u => u.role === 'journalist')

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Journalism that <span className="text-orange-400">matters.</span><br />
            Stories that <span className="text-orange-400">connect.</span>
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto">
            026News was founded with a simple belief: quality journalism should be accessible to everyone,
            and talented journalists deserve a platform that rewards their work fairly. We&apos;re building
            the future of news — open, transparent, and Africa-first.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-[#0a1628]">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0a1628] mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            026News is a next-generation media platform that combines aggregated global news with
            original freelance journalism. We believe the best stories come from people who live them —
            local journalists, analysts, and contributors from across the African continent and beyond.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Our platform gives journalists tools to publish, monetize their work through subscriptions
            and sponsored content, and build a loyal audience. Readers get breaking news, deep analysis,
            and a direct connection to the journalists they trust.
          </p>
          <Link href="/subscribe" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Join 026News →
          </Link>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
          <Image src="https://picsum.photos/id/1060/600/400" alt="Newsroom" fill className="object-cover" />
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#0a1628] mb-2 text-center">What We Stand For</h2>
          <p className="text-gray-500 text-center mb-10">The principles that guide every decision we make.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(v => (
              <div key={v.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl mb-3 block">{v.icon}</span>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-[#0a1628] mb-2 text-center">Meet Our Journalists</h2>
        <p className="text-gray-500 text-center mb-10">The voices behind our stories.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {journalists.map(j => (
            <Link key={j.user_id} href={`/journalists/${j.user_id}`} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all text-center group">
              <Image
                src={j.profile_image ?? ''}
                alt={j.name}
                width={72}
                height={72}
                className="rounded-full object-cover mx-auto mb-3 ring-2 ring-gray-100 group-hover:ring-blue-400 transition-all"
              />
              <p className="font-bold text-gray-900">{j.name}</p>
              <p className="text-xs text-gray-400 mt-1">{j.articles} articles published</p>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{j.bio}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/journalists" className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
            View All Journalists →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0a1628] text-white py-16 px-4 text-center">
        <h2 className="text-2xl font-extrabold mb-3">Ready to contribute?</h2>
        <p className="text-white/60 mb-6 max-w-lg mx-auto">Join hundreds of freelance journalists already earning on 026News.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Start Writing
          </Link>
          <Link href="/contact" className="border border-white/30 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-colors">
            Get in Touch
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
