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
    color: 'border-gray-200',
    badge: '',
    features: [
      '5 free articles per month',
      'Breaking news alerts',
      'Comment on articles',
      'Follow journalists',
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
    color: 'border-blue-600',
    badge: 'Most Popular',
    features: [
      'Unlimited article access',
      'Ad-free reading experience',
      'Early access to investigations',
      'Exclusive journalist newsletters',
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
    color: 'border-orange-500',
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
      <section className="bg-linear-to-br from-[#0a1628] to-[#1a3a6e] text-white py-16 px-4 text-center">
        <span className="inline-block bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
          Join the Team
        </span>
        <h1 className="text-4xl font-extrabold mb-4">Contribute as a Journalist</h1>
        <p className="text-white/60 max-w-xl mx-auto mb-6">
          The site remains free to view — supported by AdSense and optional in-app purchases.
          If you're a journalist or contributor, join our team to publish and earn revenue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login?mode=signup" className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-bold text-white">Join the Team — Sign Up</Link>
          <Link href="/" className="text-white/90 underline">Browse for free</Link>
        </div>
        <p className="text-xs text-white/60 mt-4 max-w-xl mx-auto">We implement Google AdSense for monetization and support in-app purchases for premium content.</p>
      </section>

      {/* Plans moved to bottom; users can browse for free, upgrade if desired */}

      {/* FAQ */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-[#0a1628] mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* M-Pesa note */}
      <section className="bg-white border-t border-gray-100 py-8 px-4 text-center">
        <p className="text-gray-500 text-sm">
          🇰🇪 Paying from Kenya? We accept <strong className="text-gray-800">M-Pesa</strong> — pay with your phone, no card needed.
          <Link href="/contact" className="text-blue-600 ml-2 hover:underline">Contact us to set up M-Pesa →</Link>
        </p>
      </section>

      {/* Plans placed at the bottom per request */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 ${plan.color} p-7 shadow-sm relative ${plan.primary ? 'shadow-lg scale-[1.02]' : ''} transition-all hover:shadow-md`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${plan.primary ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                  {plan.badge}
                </span>
              )}
              <div className="mb-5">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{plan.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-[#0a1628]">{plan.price}</span>
                  <span className="text-gray-400 text-sm mb-1">/{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full text-center font-bold py-3 rounded-xl text-sm transition-colors ${
                  plan.primary
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border border-gray-200 hover:bg-gray-50 text-gray-800'
                }`}
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
