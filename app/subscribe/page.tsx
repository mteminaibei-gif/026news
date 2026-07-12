import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Subscribe to 026News',
  description: 'Get unlimited access to premium journalism on 026News. Choose a plan that works for you — free, premium, or pro.',
}

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    badge: '',
    features: [
      '5 free articles per month',
      'Breaking news alerts',
      'Comment on articles',
      'Follow authors',
      'Mobile-friendly reading',
    ],
    cta: 'Get Started Free',
    href: '/login',
    primary: false,
  },
  {
    name: 'Premium',
    price: '$7',
    period: 'per month',
    badge: 'Most Popular',
    features: [
      'Unlimited article access',
      'Ad-free reading experience',
      'Early access to investigations',
      'Exclusive author newsletters',
      'Download articles offline',
      'Priority comment visibility',
      'Cancel anytime',
    ],
    cta: 'Start Premium',
    href: '/login?plan=premium',
    primary: true,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    badge: 'For Teams',
    features: [
      'Everything in Premium',
      'Up to 5 team members',
      'API access for data journalism',
      'Analytics dashboard',
      'White-label newsletter export',
      'Dedicated account manager',
      'Cancel anytime',
    ],
    cta: 'Go Pro',
    href: '/login?plan=pro',
    primary: false,
  },
]

const FAQS = [
  { q: 'Can I cancel my subscription?', a: 'Yes, cancel anytime from your account settings. Access continues until the end of your billing period.' },
  { q: 'What payment methods do you accept?', a: 'We accept Stripe (Visa, Mastercard, Amex) and M-Pesa for readers in Kenya and East Africa.' },
  { q: 'Do you offer student discounts?', a: 'Yes — email us at support@026news.com with your institution email for 50% off Premium.' },
  { q: 'Is there a free trial?', a: 'Premium includes a 7-day free trial. No credit card required to start.' },
]

export default function SubscribePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <section
        className="text-white py-16 px-4 text-center"
        style={{ background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--primary))' }}
      >
        <span
          className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
        >
          Join the Team
        </span>
        <h1 className="text-4xl font-extrabold mb-4" style={{ fontFamily: "'Newsreader', Georgia, serif" }}>Contribute as an Author</h1>
        <p className="max-w-xl mx-auto mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
          The site remains free to view — supported by AdSense and optional in-app purchases.
          If you&apos;re an author or contributor, join our team to publish and earn revenue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login?mode=signup" className="font-bold px-6 py-3 rounded-xl" style={{ background: 'var(--accent)', color: '#1a1a1a' }}>Join the Team — Sign Up</Link>
          <Link href="/" className="underline" style={{ color: 'rgba(255,255,255,0.9)' }}>Browse for free</Link>
        </div>
        <p className="text-xs mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>We implement Google AdSense for monetization and support in-app purchases for premium content.</p>
      </section>

      {/* Plans moved to bottom; users can browse for free, upgrade if desired */}

      {/* FAQ */}
      <section className="py-16 px-4" style={{ background: 'var(--bg-inset)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold mb-8 text-center" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{faq.q}</h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* M-Pesa note */}
      <section className="py-8 px-4 text-center" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          🇰🇪 Paying from Kenya? We accept <strong style={{ color: 'var(--text-secondary)' }}>M-Pesa</strong> — pay with your phone, no card needed.
          <Link href="/contact" className="ml-2 hover:underline" style={{ color: 'var(--primary)' }}>Contact us to set up M-Pesa →</Link>
        </p>
      </section>

      {/* Plans placed at the bottom per request */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className="rounded-2xl p-7 relative transition-all"
              style={{
                background: 'var(--bg-surface)',
                border: `2px solid ${plan.primary ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: plan.primary ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                transform: plan.primary ? 'scale(1.02)' : undefined,
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: plan.primary ? 'var(--primary)' : 'var(--accent)' }}
                >
                  {plan.badge}
                </span>
              )}
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: 'var(--primary)', fontFamily: "'Newsreader', Georgia, serif" }}>{plan.price}</span>
                  <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="mt-0.5" style={{ color: 'var(--success)' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className="block w-full text-center font-bold py-3 rounded-xl text-sm transition-colors"
                style={plan.primary
                  ? { background: 'var(--primary)', color: 'var(--text-inverse)' }
                  : { border: '1px solid var(--border)', color: 'var(--text-primary)' }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
