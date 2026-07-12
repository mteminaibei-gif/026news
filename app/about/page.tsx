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
  { value: '50+', label: 'Freelance Authors' },
  { value: '1,200+', label: 'Articles Published' },
  { value: '7', label: 'News Categories' },
]

const VALUES = [
  { icon: '🎯', title: 'Accuracy First', desc: 'Every article is fact-checked and sourced. We cite our references and correct errors transparently.' },
  { icon: '✊', title: 'Author Empowerment', desc: 'We pay fair rates, provide analytics, and give journalists the tools to build sustainable careers.' },
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
      <section
        className="text-white py-20 px-4"
        style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            Our Story
          </span>
          <h1
            className="text-4xl md:text-5xl font-extrabold leading-tight mb-6"
            style={{ fontFamily: "'Newsreader', Georgia, serif" }}
          >
            Journalism that <span style={{ color: 'var(--accent)' }}>matters.</span><br />
            Stories that <span style={{ color: 'var(--accent)' }}>connect.</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            026News was founded with a simple belief: quality journalism should be accessible to everyone,
            and talented journalists deserve a platform that rewards their work fairly. We&apos;re building
            the future of news — open, transparent, and Africa-first.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl font-extrabold mb-4" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>Our Mission</h2>
          <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            026News is a next-generation media platform that combines aggregated global news with
            original freelance journalism. We believe the best stories come from people who live them —
            local journalists, analysts, and contributors from across the African continent and beyond.
          </p>
          <p className="leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
            Our platform gives journalists tools to publish, monetize their work through subscriptions
            and sponsored content, and build a loyal audience. Readers get breaking news, deep analysis,
            and a direct connection to the journalists they trust.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors"
            style={{ background: 'var(--primary)', color: 'var(--text-inverse)' }}
          >
            Join 026News →
          </Link>
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <Image src="https://picsum.photos/id/1060/600/400" alt="Newsroom" fill className="object-cover" />
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4" style={{ background: 'var(--bg-inset)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-2 text-center" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>What We Stand For</h2>
          <p className="text-center mb-10" style={{ color: 'var(--text-tertiary)' }}>The principles that guide every decision we make.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(v => (
              <div
                key={v.title}
                className="rounded-xl p-6 transition-shadow"
                style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}
              >
                <span className="text-3xl mb-3 block">{v.icon}</span>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold mb-2 text-center" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>Meet Our Authors</h2>
        <p className="text-center mb-10" style={{ color: 'var(--text-tertiary)' }}>The voices behind our stories.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {journalists.map(j => (
            <Link
              key={j.user_id}
              href={`/journalists/${j.user_id}`}
              className="rounded-xl p-5 transition-all text-center group"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
            >
              <Image
                src={j.profile_image ?? ''}
                alt={j.name}
                width={72}
                height={72}
                className="rounded-full object-cover mx-auto mb-3"
                style={{ border: '2px solid var(--border-subtle)' }}
              />
              <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{j.name}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{j.articles} articles published</p>
              <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{j.bio}</p>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/journalists"
            className="inline-flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl transition-colors"
            style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
          >
            View All Authors →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="text-white py-16 px-4 text-center" style={{ background: 'var(--bg-elevated)' }}>
        <h2 className="text-2xl font-extrabold mb-3" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>Ready to contribute?</h2>
        <p className="mb-6 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>Join hundreds of freelance authors already earning on 026News.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="font-bold px-6 py-3 rounded-xl transition-colors"
            style={{ background: 'var(--accent)', color: '#1a1a1a' }}
          >
            Start Writing
          </Link>
          <Link
            href="/contact"
            className="font-semibold px-6 py-3 rounded-xl transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
          >
            Get in Touch
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
