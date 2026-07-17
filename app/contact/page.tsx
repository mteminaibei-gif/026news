import type { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the 026connet! team for editorial inquiries, advertising, partnerships, or technical support.',
}

const CONTACT_METHODS = [
  { icon: '📧', title: 'Editorial', desc: 'Pitches, corrections, and editorial inquiries', email: 'editorial@026connet!.com' },
  { icon: '💼', title: 'Advertising', desc: 'Ad placements, sponsorships, and partnerships', email: 'ads@026connet!.com' },
  { icon: '🛠️', title: 'Technical Support', desc: 'Account issues, bugs, and platform help', email: 'support@026connet!.com' },
  { icon: '⚖️', title: 'Legal & Privacy', desc: 'GDPR requests, DMCA, and legal matters', email: 'legal@026connet!.com' },
]

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Hero */}
      <section className="py-16 px-4 text-center" style={{ background: 'var(--primary)', color: 'var(--bg-elevated)' }}>
        <h1 className="text-4xl font-extrabold mb-4">Get in Touch</h1>
        <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
          We&apos;d love to hear from you — whether it&apos;s a story pitch, an ad inquiry, or just a question about the platform.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">

        {/* Contact form */}
        <div className="rounded-2xl shadow-sm p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h2 className="text-xl font-extrabold mb-6" style={{ color: 'var(--text-primary)' }}>Send us a message</h2>
          <form className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>First Name</label>
                <input type="text" placeholder="Alex" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Last Name</label>
                <input type="text" placeholder="Johnson" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: '1px solid var(--border)' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" placeholder="you@example.com" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                <select className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ border: '1px solid var(--border)' }}>
                <option>Editorial Inquiry</option>
                <option>Advertising / Partnership</option>
                <option>Technical Support</option>
                <option>Press Inquiry</option>
                <option>Legal / Privacy</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Message</label>
                <textarea rows={5} placeholder="Tell us what's on your mind..." className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none" style={{ border: '1px solid var(--border)' }} />
            </div>
            <button type="submit" className="w-full hover:brightness-110 text-white font-bold py-3 rounded-xl text-sm transition-colors" style={{ background: 'var(--primary)' }}>
              Send Message
            </button>
          </form>
        </div>

        {/* Contact methods + info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>Contact by department</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>Direct your message to the right team for a faster response.</p>
            <div className="space-y-4">
              {CONTACT_METHODS.map(m => (
                <div key={m.title} className="rounded-xl p-4 shadow-sm flex items-start gap-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                   <span className="text-2xl mt-0.5">{m.icon}</span>
                   <div>
                     <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{m.title}</p>
                     <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{m.desc}</p>
                     <a href={`mailto:${m.email}`} className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>{m.email}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'var(--primary)', color: 'var(--bg-elevated)' }}>
            <h3 className="font-bold mb-2">Response times</h3>
            <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
              <li>Editorial inquiries: <strong style={{ color: 'var(--text-primary)' }}>1-2 business days</strong></li>
              <li>Advertising: <strong style={{ color: 'var(--text-primary)' }}>24 hours</strong></li>
              <li>Technical support: <strong style={{ color: 'var(--text-primary)' }}>Same day</strong></li>
              <li>Legal requests: <strong style={{ color: 'var(--text-primary)' }}>3-5 business days</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
