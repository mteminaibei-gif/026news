import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Authors', href: '/journalists' },
    { label: 'Advertise', href: '/contact' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Platform: [
    { label: 'Social Feed', href: '/social' },
    { label: 'News', href: '/news' },
    { label: 'Become an Author', href: '/signup' },
  ],
  Kenya: [
    { label: 'Kenya News', href: '/?category=Kenya' },
    { label: 'Africa', href: '/?category=Africa' },
    { label: 'Politics', href: '/?category=Politics' },
    { label: 'Business', href: '/?category=Business' },
    { label: 'Tech', href: '/?category=Tech' },
    { label: 'Sports', href: '/?category=Sports' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/privacy#cookies' },
    { label: 'Editorial Standards', href: '/about#standards' },
  ],
}

const SOCIAL_LINKS = [
  { label: 'Twitter / X', href: 'https://twitter.com/026connet!', icon: 'X' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591846443015', icon: 'f' },
  { label: 'YouTube', href: 'https://youtube.com/@026connet!', icon: '\u25B6' },
  { label: 'WhatsApp', href: 'https://wa.me/254700000000', icon: '\uD83D\uDCAC' },
]

export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--glass-bg-strong)',
        borderTop: '1px solid var(--glass-border)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(150%)',
      }}
      role="contentinfo"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12 pb-12" style={{ borderBottom: '1px solid var(--glass-border)' }}>
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="block mb-5">
              <Logo size="md" />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>
              Kenya&apos;s premier digital news platform. Breaking news, in-depth analysis, and community journalism from Nairobi and across Africa.
            </p>

            {/* Newsletter */}
            <div style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              marginBottom: 20,
              backdropFilter: 'blur(8px)',
            }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Stay informed</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Get the latest news delivered to your inbox.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  placeholder="Your email"
                  aria-label="Email for newsletter"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--glass-border)', background: 'var(--glass-bg-strong)',
                    color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none',
                    minWidth: 0,
                  }}
                />
                <button
                  style={{
                    padding: '8px 16px', borderRadius: 'var(--radius-xs)',
                    border: 'none', background: 'var(--grad-primary)',
                    color: '#fff', fontWeight: 600, fontSize: '0.8rem',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all var(--dur-fast) var(--ease-out-expo)',
                    boxShadow: 'var(--glow-primary)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
                >
                  Subscribe
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex items-center justify-center text-sm font-bold transition-all"
                  style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-xs)',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    backdropFilter: 'blur(4px)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--grad-primary)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.boxShadow = 'var(--glow-primary)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--glass-bg)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'var(--glass-border)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <div className="made-in-kenya" style={{ justifyContent: 'flex-start', marginTop: 20 }}>
              <span>Proudly Made in Kenya</span>
            </div>
          </div>

          {/* Links sections */}
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h5 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--primary)' }}>
                  {section}
                </h5>
                <ul className="space-y-1">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="transition-all duration-200"
                        style={{
                          color: 'var(--text-secondary)',
                          display: 'inline-block', padding: '6px 0',
                          fontSize: '0.85rem',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.transform = 'none' }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            &copy; {new Date().getFullYear()} 026connet!. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="transition-all duration-200"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-all duration-200"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="transition-all duration-200"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)' }}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
