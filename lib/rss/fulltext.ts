import { Readability } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
}

/**
 * Fetches the source article HTML and extracts the main body text using
 * Mozilla Readability. Returns plain text with paragraph breaks, or null if
 * extraction fails or yields too little content (so callers can fall back to
 * the RSS summary).
 */
export async function fetchFullArticleContent(
  url: string,
  timeoutMs = 6000,
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const html = await res.text()

    const { document } = parseHTML(html)
    const reader = new Readability(document as unknown as Document)
    const parsed = reader.parse()
    const raw = parsed?.content ?? ''
    if (!raw) return null

    const withBreaks = raw
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')

    const paragraphs = decodeEntities(withBreaks)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const joined = paragraphs.join('\n\n')
    return joined.length >= 200 ? joined : null
  } catch {
    return null
  }
}
