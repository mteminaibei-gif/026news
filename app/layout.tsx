import { Space_Grotesk, Newsreader } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { RadioProvider } from '@/components/radio/RadioProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`h-full antialiased ${spaceGrotesk.variable} ${newsreader.variable}`}>
      <body className="min-h-full flex flex-col font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ThemeProvider>
          <QueryProvider>
            <RadioProvider>
              {children}
              <CookieConsent />
            </RadioProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
