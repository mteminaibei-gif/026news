import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service governing your use of the 026News platform, including user responsibilities, content policy, and journalist agreements.',
}

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using 026News, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. These terms apply to all visitors, registered users, journalists, and administrators.`,
  },
  {
    id: 'accounts',
    title: '2. User Accounts',
    content: `You must provide accurate information when creating an account. You are responsible for maintaining the security of your credentials. Notify us immediately at support@026news.com if you suspect unauthorized access. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    id: 'content-policy',
    title: '3. Content Policy',
    content: `All content submitted to 026News must be original or properly attributed, factually accurate to the best of the author's knowledge, free from defamatory, harassing, or illegal material, and must not infringe on any third party's intellectual property rights.

026News reserves the right to remove any content that violates these standards without prior notice. Repeated violations will result in account termination.`,
  },
  {
    id: 'journalist-agreement',
    title: '4. Journalist Agreement',
    content: `Journalists who publish on 026News grant us a non-exclusive license to display, distribute, and monetize their articles on the platform. Journalists retain full copyright to their work. Payment terms: earnings are calculated monthly and paid on the 1st of each month, subject to a minimum threshold of $10 USD or equivalent.

Journalists are responsible for the accuracy of their work and must disclose any conflicts of interest, sponsored content, or affiliate relationships.`,
  },
  {
    id: 'subscriptions',
    title: '5. Subscriptions & Payments',
    content: `Subscription fees are billed in advance on a monthly or annual basis. You may cancel your subscription at any time; access continues until the end of the current billing period. Refunds are provided for annual subscriptions within 14 days of purchase if no premium content has been consumed.

Payment is processed securely by Stripe or M-Pesa. We never store your full card details.`,
  },
  {
    id: 'intellectual-property',
    title: '6. Intellectual Property',
    content: `The 026News platform, including its design, code, and aggregated data, is owned by 026News and protected by copyright law. You may not reproduce, distribute, or create derivative works without written permission. The 026News name, logo, and brand assets are trademarks of 026News.`,
  },
  {
    id: 'limitation',
    title: '7. Limitation of Liability',
    content: `026News provides the platform "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including loss of data, revenue, or profits. Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.`,
  },
  {
    id: 'governing-law',
    title: '8. Governing Law',
    content: `These terms are governed by the laws of Kenya. Any disputes will be resolved through binding arbitration in Nairobi, Kenya, except where prohibited by local law. If you are in the European Union, you retain the right to bring claims before your local courts.`,
  },
]

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="bg-[#0a1628] text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-extrabold mb-2">Terms of Service</h1>
        <p className="text-white/50 text-sm">Last updated: January 1, 2026 · Effective: January 1, 2026</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 grid lg:grid-cols-[220px_1fr] gap-10">
        <nav className="hidden lg:block self-start sticky top-20">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Contents</p>
          <ul className="space-y-1.5">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{s.title}</a>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link href="/contact" className="text-sm text-blue-600 hover:underline">Questions? Contact us →</Link>
          </div>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <p className="text-gray-600 leading-relaxed mb-8 text-sm">
            Please read these Terms of Service carefully before using 026News. These terms constitute a legally binding agreement between you and 026News.
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
            <p>Questions about these terms? <a href="mailto:legal@026news.com" className="text-blue-600">legal@026news.com</a></p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
