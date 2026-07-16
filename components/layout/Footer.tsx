import Link from 'next/link'

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Authors', href: '/journalists' },
    { label: 'Advertise', href: '/contact' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Platform: [
    { label: 'Author Portal', href: '/journalist/profile' },
    { label: 'Admin Panel', href: '/admin/profile' },
    { label: 'Become an Author', href: '/onboarding' },
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
  { label: 'Twitter / X', href: 'https://twitter.com/026newsblog', icon: 'X' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61591846443015', icon: 'f' },
  { label: 'YouTube', href: 'https://youtube.com/@026newsblog', icon: '\u25B6' },
  { label: 'WhatsApp', href: 'https://wa.me/254700000000', icon: '\uD83D\uDCAC' },
]

export function Footer() {
  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }} role="contentinfo">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10 mb-10 pb-10" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Brand */}
          <div className="lg:w-1/3">
            <Link href="/" aria-label="026Newsblog home" className="block mb-4">
              <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                 026<span style={{ color: '#e23b3b' }}>Newsblog</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
              Kenya&apos;s premier digital news platform. Breaking news, in-depth analysis, and community journalism from Nairobi and across Africa.
            </p>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex items-center justify-center text-sm font-bold transition-colors"
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'var(--primary)',
                    color: 'var(--bg-elevated)',
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            <div className="made-in-kenya" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
              <span>Proudly Made in Kenya</span>
            </div>
          </div>

          {/* Links sections */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h5 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--primary)' }}>
                  {section}
                </h5>
                <ul className="space-y-1">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)', display: 'inline-block', padding: '8px 0' }}
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
            &copy; {new Date().getFullYear()} 026Newsblog. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>Privacy</Link>
            <Link href="/terms" className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>Terms</Link>
            <Link href="/contact" className="transition-colors" style={{ color: 'var(--text-tertiary)' }}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
