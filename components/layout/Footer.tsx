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
    { label: 'Author Portal', href: '/journalist/dashboard' },
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
    <footer className="bg-gradient-to-b from-[#1a5c2a] to-[#0f3a1a] text-white mt-12 relative" role="contentinfo">
      {/* Kenya flag top stripe with animation */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28]" />
      <div className="pt-4" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link href="/" aria-label="026NEW Blog home" className="block group">
            <Image src="/logo.svg" alt="026NEW Blog" width={280} height={84} className="h-16 w-auto object-contain mb-4 filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
          </Link>
          <p className="text-white/70 text-sm leading-relaxed mb-4 font-medium">
            Kenya&apos;s premier digital news platform. Breaking news, in-depth analysis, and community journalism from Nairobi and across Africa.
          </p>
          {/* Social Links with Kenya colors */}
          <div className="flex gap-3">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#f5c518] hover:text-[#1a1a1a] flex items-center justify-center text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[#f5c518]/30 hover:-translate-y-0.5"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section}>
            <h5 className="text-xs font-black uppercase tracking-wider text-[#f5c518] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#f5c518] rounded-full"></span>
              {section}
            </h5>
            <ul className="space-y-2.5">
              {links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-white hover:translate-x-1.5 inline-block transition-all duration-300 flex items-center gap-1.5 group">
                    <span className="w-1 h-1 bg-[#4caf28] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-[#0a1f12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 text-white/50">
            <span className="text-sm">🇰🇪</span>
            &copy; {new Date().getFullYear()} 026NEW Blog. All rights reserved. Made in Kenya
          </span>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="text-white/50 hover:text-white transition-colors font-medium">Privacy</Link>
            <Link href="/terms" className="text-white/50 hover:text-white transition-colors font-medium">Terms</Link>
            <Link href="/contact" className="text-white/50 hover:text-white transition-colors font-medium">Contact</Link>
            <Link href="/sitemap.xml" className="text-white/50 hover:text-white transition-colors font-medium">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
