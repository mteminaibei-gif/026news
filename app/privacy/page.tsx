import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how 026News collects, uses, and protects your personal data in compliance with GDPR and applicable privacy laws.',
}

const SECTIONS = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: `We collect information you provide directly (name, email, password when you register), information generated through your use of the platform (articles read, comments posted, subscription status), and technical information (IP address, browser type, device identifiers) for security and analytics purposes.

We use cookies and similar tracking technologies to maintain sessions, remember preferences, and measure engagement. You can manage cookies through our consent banner or your browser settings.`,
  },
  {
    id: 'how-we-use-data',
    title: '2. How We Use Your Data',
    content: `Your data is used to: provide and personalise the news platform, process subscription payments, send editorial newsletters (with your consent), analyse platform performance, detect and prevent fraud, comply with legal obligations, and pay journalist earnings.

We do not sell your personal data to third parties. We do not use your data for targeted advertising without explicit consent.`,
  },
  {
    id: 'data-sharing',
    title: '3. Data Sharing',
    content: `We share data only with trusted service providers necessary to operate the platform: Supabase (database and authentication), Stripe or M-Pesa (payment processing), Vercel (hosting), and Sentry (error monitoring). Each provider is bound by data processing agreements and appropriate safeguards.

If required by law or court order, we may disclose data to authorities, but will notify you wherever legally permitted.`,
  },
  {
    id: 'your-rights',
    title: '4. Your Rights (GDPR)',
    content: `If you are in the European Economic Area, you have the right to: access your personal data, correct inaccurate data, delete your account and data ("right to be forgotten"), restrict or object to processing, data portability, and withdraw consent at any time.

To exercise any of these rights, email legal@026news.com or use the account deletion option in your profile settings. We will respond within 30 days.`,
  },
  {
    id: 'data-retention',
    title: '5. Data Retention',
    content: `Account data is retained as long as your account is active. Upon account deletion, personal identifiers are removed within 30 days. Aggregated, anonymised analytics data may be retained indefinitely. Transaction records are kept for 7 years for legal and tax compliance.`,
  },
  {
    id: 'security',
    title: '6. Security',
    content: `We use industry-standard security measures including TLS/SSL encryption for all data in transit, bcrypt password hashing, row-level security policies on our database, and regular security audits. No system is 100% secure — if you suspect unauthorised access, contact support@026news.com immediately.`,
  },
  {
    id: 'children',
    title: '7. Children\'s Privacy',
    content: `026News is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.`,
  },
  {
    id: 'changes',
    title: '8. Changes to This Policy',
    content: `We may update this policy periodically. Material changes will be communicated by email or prominent notice on the platform at least 14 days before taking effect. Continued use after changes constitutes acceptance.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="bg-[#0a1628] text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-white/50 text-sm">Last updated: January 1, 2026 · Effective: January 1, 2026</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid lg:grid-cols-[220px_1fr] gap-10">

        {/* TOC */}
        <nav className="hidden lg:block self-start sticky top-20">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Contents</p>
          <ul className="space-y-1.5">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors line-clamp-1">{s.title}</a>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Questions?</p>
            <Link href="/contact" className="text-sm text-blue-600 hover:underline">Contact Legal Team →</Link>
          </div>
        </nav>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed mb-8">
            This Privacy Policy explains how 026News (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, and protects your
            personal information when you use our platform at{' '}
            <Link href="/" className="text-blue-600 hover:underline">026news.com</Link>.
            We are committed to protecting your privacy and complying with the General Data Protection Regulation (GDPR)
            and other applicable privacy laws.
          </p>

          {SECTIONS.map(section => (
            <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
              <h2 className="text-lg font-extrabold text-[#0a1628] mb-3">{section.title}</h2>
              {section.content.split('\n\n').map((para, i) => (
                <p key={i} className="text-gray-600 leading-relaxed mb-3 text-sm">{para}</p>
              ))}
            </section>
          ))}

          <div className="mt-8 pt-6 border-t border-gray-100 text-sm text-gray-500">
            <p>For privacy concerns, contact: <a href="mailto:legal@026news.com" className="text-blue-600">legal@026news.com</a></p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
