import crypto from 'crypto'
import { slugify } from '@/lib/utils'

export type RssItem = { title: string; link: string; description: string; pubDate: string; imageUrl: string | null }

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ')
}

function extractBlock(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
         || block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
  return m?.[1]?.trim() ?? ''
}

function extractImageUrl(block: string, rawDesc: string): string | null {
  const enclosure    = block.match(/enclosure[^>]+url=["']([^"']+)["']/i)
  const mediaContent = block.match(/media:content[^>]+url=["']([^"']+)["']/i)
  const mediaThumbn  = block.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)
  const imgInDesc    = rawDesc.match(/<img[^>]+src=["']([^"']+)["']/i)
  const figImg       = rawDesc.match(/<figure[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i)
  const linkImg      = rawDesc.match(/<a[^>]+href=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/i)
  const atomEnc      = block.match(/<link[^>]+rel=["']enclosure["'][^>]+href=["']([^"']+)["']/i)
  const atomImage    = block.match(/<link[^>]+rel=["']image["'][^>]+href=["']([^"']+)["']/i)
  return enclosure?.[1] ?? mediaContent?.[1] ?? mediaThumbn?.[1] ?? figImg?.[1] ?? imgInDesc?.[1] ?? linkImg?.[1] ?? atomEnc?.[1] ?? atomImage?.[1] ?? null
}

export function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = []

  const rssMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
  for (const match of rssMatches) {
    const block = match[1]
    const title   = decode(extractBlock(block, 'title'))
    const link    = extractBlock(block, 'link') || extractBlock(block, 'guid')
    const rawDesc = extractBlock(block, 'description') || extractBlock(block, 'summary')
    const desc    = decode(stripHtml(rawDesc))
    const pubDate = extractBlock(block, 'pubDate') || extractBlock(block, 'published') || new Date().toISOString()
    const imageUrl = extractImageUrl(block, rawDesc)
    if (title && link) {
      items.push({ title: title.substring(0, 300), link, description: desc.substring(0, 1000), pubDate, imageUrl })
    }
  }

  if (items.length === 0) {
    const atomMatches = xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/gi)
    for (const match of atomMatches) {
      const block = match[1]
      const title   = decode(extractBlock(block, 'title'))
      const altLink = block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i)
      const anyLink = block.match(/<link[^>]+href=["']([^"']+)["']/i)
      const link    = altLink?.[1] || anyLink?.[1] || extractBlock(block, 'id')
      const rawDesc = extractBlock(block, 'content') || extractBlock(block, 'summary')
      const desc    = decode(stripHtml(rawDesc))
      const pubDate = extractBlock(block, 'published') || extractBlock(block, 'updated') || new Date().toISOString()
      const imageUrl = extractImageUrl(block, rawDesc)
      if (title && link) {
        items.push({ title: title.substring(0, 300), link, description: desc.substring(0, 1000), pubDate, imageUrl })
      }
    }
  }

  return items
}

export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    const html = await res.text()

    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (ogMatch?.[1]) return decode(ogMatch[1])
    return null
  } catch {
    return null
  }
}

export function contentHash(title: string, url: string): string {
  return crypto.createHash('sha256').update(`${title}|${url}`).digest('hex').substring(0, 32)
}

export function normalizeImageUrl(raw: string, articleUrl: string): string {
  try {
    const domainMatch = raw.match(/^(https?:\/\/[^/]+)\1(.*)$/)
    if (domainMatch) raw = domainMatch[1] + domainMatch[2]
    if (raw.startsWith('//')) return 'https:' + raw
    if (raw.startsWith('/') && articleUrl) {
      const base = new URL(articleUrl)
      return base.origin + raw
    }
    if (!raw.startsWith('http')) {
      if (articleUrl) return new URL(raw, articleUrl).href
      return 'https://' + raw
    }
    return raw
  } catch {
    return raw
  }
}

export function makeUniqueSlug(title: string, hash: string): string {
  return `${slugify(title).substring(0, 60)}-${hash.substring(0, 8)}`
}
