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
    { label: 'Become a Journalist', href: '/login' },
  ],
  Categories: [
    { label: 'Politics', href: '/?category=Politics' },
    { label: 'Business', href: '/?category=Business' },
    { label: 'Technology', href: '/?category=Tech' },
    { label: 'Science', href: '/?category=Science' },
    { label: 'Sports', href: '/?category=Sports' },
    { label: 'Entertainment', href: '/?category=Entertainment' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/privacy#cookies' },
    { label: 'Editorial Standards', href: '/about#standards' },
  ],
}

const SOCIAL_LINKS = [
  { label: 'Twitter / X', href: 'https://twitter.com/026news', icon: '𝕏' },
  { label: 'Facebook', href: 'https://facebook.com/026news', icon: 'f' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/026news', icon: 'in' },
  { label: 'YouTube', href: 'https://youtube.com/@026news', icon: '▶' },
]

export function Footer() {
  return (
    <footer className="bg-[#0a1628] text-white mt-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Brand column */}
        <div className="md:col-span-1">
          <Link href="/" aria-label="026News home">
            <Image
              src="/logo-dark.svg"
              alt="026News"
              width={160}
              height={48}
              className="h-10 w-auto mb-4"
            />
          </Link>
          <p className="text-white/50 text-sm leading-relaxed mb-4">
            Next-generation news platform combining global journalism with a thriving community of
            freelance contributors. Committed to accuracy, transparency, and impact.
          </p>
          {/* Social links */}
          <div className="flex gap-3">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center text-xs font-bold transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([section, links]) => (
          <div key={section}>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">{section}</h5>
            <ul className="space-y-2">
              {links.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/50 hover:text-white transition-colors">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; {new Date().getFullYear()} 026News. All rights reserved. Built in Africa 🌍</span>
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
