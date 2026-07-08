import Link from 'next/link'
import Image from 'next/image'

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Our Journalists', href: '/journalists' },
    { label: 'Advertise', href: '/contact' },
    { label: 'Contact Us', href: '/contact' },
  ],
  Platform: [
    { label: 'Subscribe', href: '/subscribe' },
    { label: 'Journalist Portal', href: '/journalist/dashboard' },
    { label: 'Admin Panel', href: '/admin/dashboard' },
    { label: 'Become a Writer', href: '/login?mode=signup' },
  ],
  Kenya: [
    { label: '🇰🇪 Kenya News', href: '/?category=Kenya' },
    { label: '🌍 Africa', href: '/?category=Africa' },
    { label: '🏛️ Politics', href: '/?category=Politics' },
    { label: '💼 Business', href: '/?category=Business' },
    { label: '💻 Tech', href: '/?category=Tech' },
    { label: '⚽ Sports', href: '/?category=Sports' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/privacy#cookies' },
    { label: 'Editorial Standards', href: '/about#standards' },
  ],
}

const SOCIAL_LINKS = [
  { label: 'Twitter / X', href: 'https://twitter.com/026newsblog', icon: '𝕏' },
  { label: 'Facebook', href: 'https://facebook.com/026newsblog', icon: 'f' },
  { label: 'YouTube', href: 'https://youtube.com/@026newsblog', icon: '▶' },
  { label: 'WhatsApp', href: 'https://wa.me/254700000000', icon: '💬' },
]

export function Footer() {
  return (
    <footer className="bg-[#1a5c2a] text-white mt-12" role="contentinfo">
      {/* Kenya flag top stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#1a5c2a]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link href="/" aria-label="026NEW Blog home">
            <Image src="/logo-dark.svg" alt="026NEW Blog" width={160} height={48} className="h-12 w-auto mb-4" />
          </Link>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Kenya&apos;s premier digital news platform. Breaking news, in-depth analysis, and community journalism from Nairobi and across Africa.
          </p>
          <div className="flex gap-3">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#f5c518] hover:text-[#1a1a1a] flex items-center justify-center text-xs font-bold transition-all"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section}>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#f5c518] mb-3">{section}</h5>
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/55 hover:text-white hover:translate-x-1 inline-block transition-all">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
          <span>&copy; {new Date().getFullYear()} 026NEW Blog. All rights reserved. Made in Kenya 🇰🇪</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
