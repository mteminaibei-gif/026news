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
  { label: 'Facebook', href: 'https://facebook.com/026newsblog', icon: 'f' },
  { label: 'YouTube', href: 'https://youtube.com/@026newsblog', icon: '▶' },
  { label: 'WhatsApp', href: 'https://wa.me/254700000000', icon: '💬' },
]

export function Footer() {
  return (
    <footer className="bg-white border-t-4 border-[#1a5c2a] mt-12" role="contentinfo">
      {/* Kenya flag accent bar */}
      <div className="h-2 bg-gradient-to-r from-[#c8102e] via-[#1a1a1a] to-[#4caf28]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Top section with logo and social */}
        <div className="flex flex-col lg:flex-row gap-8 mb-10 pb-10 border-b border-gray-200">
          {/* Brand */}
          <div className="lg:w-1/3">
            <Link href="/" aria-label="026NEWS home" className="block mb-4">
              <Image src="/logo.svg" alt="026NEWS" width={200} height={60} className="h-14 w-auto object-contain" />
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Kenya&apos;s premier digital news platform. Breaking news, in-depth analysis, and community journalism from Nairobi and across Africa.
            </p>
            {/* Social Links - High contrast */}
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-10 h-10 rounded-lg bg-[#1a5c2a] text-white flex items-center justify-center text-sm font-bold hover:bg-[#2d8a47] transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links sections */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#1a5c2a] mb-4">
                  {section}
                </h5>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-gray-700 hover:text-[#1a5c2a] transition-colors">
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
          <span className="flex items-center gap-2 text-gray-600">
            <span>🇰🇪</span>
            &copy; {new Date().getFullYear()} 026NEWS. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-600 hover:text-[#1a5c2a] transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-600 hover:text-[#1a5c2a] transition-colors">Terms</Link>
            <Link href="/contact" className="text-gray-600 hover:text-[#1a5c2a] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}