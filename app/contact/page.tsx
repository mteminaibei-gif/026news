import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the 026News team for editorial inquiries, advertising, partnerships, or technical support.',
}

const CONTACT_METHODS = [
  { icon: '📧', title: 'Editorial', desc: 'Pitches, corrections, and editorial inquiries', email: 'editorial@026news.com' },
  { icon: '💼', title: 'Advertising', desc: 'Ad placements, sponsorships, and partnerships', email: 'ads@026news.com' },
  { icon: '🛠️', title: 'Technical Support', desc: 'Account issues, bugs, and platform help', email: 'support@026news.com' },
  { icon: '⚖️', title: 'Legal & Privacy', desc: 'GDPR requests, DMCA, and legal matters', email: 'legal@026news.com' },
]

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a1628] to-[#1a3a6e] text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-extrabold mb-4">Get in Touch</h1>
        <p className="text-white/60 max-w-xl mx-auto">
          We&apos;d love to hear from you — whether it&apos;s a story pitch, an ad inquiry, or just a question about the platform.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">

        {/* Contact form */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">Send us a message</h2>
          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">First Name</label>
                <input type="text" placeholder="Alex" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Last Name</label>
                <input type="text" placeholder="Johnson" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Subject</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 bg-white">
                <option>Editorial Inquiry</option>
                <option>Advertising / Partnership</option>
                <option>Technical Support</option>
                <option>Press Inquiry</option>
                <option>Legal / Privacy</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Message</label>
              <textarea rows={5} placeholder="Tell us what's on your mind..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
              Send Message
            </button>
          </form>
        </div>

        {/* Contact methods + info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Contact by department</h2>
            <p className="text-gray-500 text-sm mb-6">Direct your message to the right team for a faster response.</p>
            <div className="space-y-4">
              {CONTACT_METHODS.map(m => (
                <div key={m.title} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{m.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-400 mb-1">{m.desc}</p>
                    <a href={`mailto:${m.email}`} className="text-sm text-blue-600 hover:underline">{m.email}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a1628] rounded-xl p-6 text-white">
            <h3 className="font-bold mb-2">Response times</h3>
            <ul className="text-sm text-white/60 space-y-1.5">
              <li>Editorial inquiries: <strong className="text-white">1-2 business days</strong></li>
              <li>Advertising: <strong className="text-white">24 hours</strong></li>
              <li>Technical support: <strong className="text-white">Same day</strong></li>
              <li>Legal requests: <strong className="text-white">3-5 business days</strong></li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
