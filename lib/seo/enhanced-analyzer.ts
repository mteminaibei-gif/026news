/**
 * Enhanced SEO Analyzer v2 for 026news — Groq-powered.
 *
 * Produces a full AI-driven analysis (score, issues, content summary, suggested
 * title/excerpt/slug/tags, optimized content, image & layout recommendations,
 * social + schema markup). Falls back to the local heuristic engine when Groq
 * is not configured so the panel always renders something.
 */

import { groqChatJSON, groqConfigured } from '@/lib/ai/groq-client'

export interface SEOIssue {
  type: 'error' | 'warning' | 'info' | 'success'
  category: 'title' | 'content' | 'structure' | 'keywords' | 'readability' | 'meta' | 'images' | 'links' | 'performance' | 'accessibility'
  message: string
  suggestion: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  autoFixable?: boolean
}

export interface ImageRecommendation {
  position: number // character position in content
  altText: string
  caption?: string
  suggestedQuery: string // for Unsplash/Pexels search
  relevanceScore: number
  placementType: 'inline' | 'featured' | 'gallery' | 'breakout'
  context: string // surrounding text context
}

export interface LayoutRecommendation {
  type: 'paragraph-break' | 'subheading' | 'bullet-list' | 'blockquote' | 'callout' | 'table' | 'faq'
  position: number
  originalText: string
  recommendedHtml: string
  reason: string
  impact: 'high' | 'medium' | 'low'
}

export interface SEOContentSummary {
  executiveSummary: string // 300+ words SEO-rich
  keyTakeaways: string[]
  seoKeywords: { keyword: string; density: number; positions: number[] }[]
  metaDescription: string
  socialSnippet: string
  estimatedReadingTime: number
  contentGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'
}

export interface EnhancedSEOAnalysis {
  score: number
  issues: SEOIssue[]
  metrics: SEOMetrics
  improvedTitle?: string
  improvedExcerpt?: string
  improvedSlug?: string
  suggestedTags?: string[]
  contentSummary: SEOContentSummary
  imageRecommendations: ImageRecommendation[]
  layoutRecommendations: LayoutRecommendation[]
  optimizedContent: string
  schemaMarkup: string
  socialOptimization: {
    ogTitle: string
    ogDescription: string
    ogImage: string
    twitterCard: string
    twitterTitle: string
    twitterDescription: string
  }
  performanceHints: {
    lazyLoadImages: boolean
    preloadFeatured: boolean
    deferNonCritical: boolean
    estimatedLoadTime: number
  }
}

export interface SEOMetrics {
  titleLength: number
  contentWordCount: number
  contentCharCount: number
  headingCount: { h1: number; h2: number; h3: number; h4: number }
  imageCount: number
  imagesWithAlt: number
  linkCount: number
  internalLinks: number
  externalLinks: number
  paragraphCount: number
  avgSentenceLength: number
  avgParagraphLength: number
  readingTimeMinutes: number
  fleschReadingEase: number
  keywordDensity: Record<string, number>
  slugOptimal: boolean
  excerptLength: number
  hasFeaturedImage: boolean
  tagsCount: number
  semanticKeywords: string[]
  contentFreshness: number
  eeatScore: number
  topicalAuthority: number
}

const NEWS_KEYWORDS = [
  'kenya', 'nairobi', 'mombasa', 'kisumu', 'africa', 'breaking', 'news', 'report', 'analysis',
  'politics', 'economy', 'business', 'technology', 'health', 'sports', 'climate', 'education',
  'crime', 'court', 'government', 'president', 'minister', 'county', 'election', 'policy',
  'reform', 'crisis', 'investment', 'trade', 'agriculture', 'tourism', 'energy', 'infrastructure'
]

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of',
  'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'because', 'but', 'and', 'or', 'if', 'while', 'that', 'this', 'these',
  'those', 'it', 'its', 'he', 'she', 'they', 'them', 'we', 'you', 'i', 'me',
  'my', 'your', 'his', 'her', 'our', 'their', 'what', 'which', 'who', 'whom',
  'said', 'says', 'according', 'reported', 'added', 'explained', 'noted', 'confirmed'
])

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  return Math.max(sentences.length, 1)
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

function fleschReadingEase(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const sentenceCount = countSentences(text)
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0)
  if (wordCount === 0 || sentenceCount === 0) return 0
  return Math.round(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount))
}

function extractKeywords(text: string, topN = 20): Record<string, number> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}

  for (const w of words) {
    if (w.length < 3 || STOP_WORDS.has(w)) continue
    freq[w] = (freq[w] || 0) + 1
  }

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})
}

function extractNgrams(text: string, n: number): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
  const ngrams: string[] = []
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '))
  }
  return ngrams
}

function analyzeHeadings(content: string): { h1: number; h2: number; h3: number; h4: number } {
  return {
    h1: (content.match(/<h1[\s>]/gi) || []).length,
    h2: (content.match(/<h2[\s>]/gi) || []).length,
    h3: (content.match(/<h3[\s>]/gi) || []).length,
    h4: (content.match(/<h4[\s>]/gi) || []).length,
  }
}

function countImages(content: string): { total: number; withAlt: number; withLazy: number; withDimensions: number } {
  const imgs = content.match(/<img[^>]*>/gi) || []
  const withAlt = imgs.filter(img => /alt\s*=\s*["'][^"']+["']/i.test(img)).length
  const withLazy = imgs.filter(img => /loading\s*=\s*["']lazy["']/i.test(img)).length
  const withDimensions = imgs.filter(img => /width\s*=\s*["']\d+["']/i.test(img) && /height\s*=\s*["']\d+["']/i.test(img)).length
  return { total: imgs.length, withAlt, withLazy, withDimensions }
}

function countLinks(content: string): { total: number; internal: number; external: number; nofollow: number } {
  const links = content.match(/<a[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi) || []
  let internal = 0, external = 0, nofollow = 0
  for (const link of links) {
    const hrefMatch = link.match(/href\s*=\s*["']([^"']*)["']/i)
    const relMatch = link.match(/rel\s*=\s*["']([^"']*)["']/i)
    if (!hrefMatch) continue
    const href = hrefMatch[1]
    if (href.startsWith('/') || href.startsWith('#') || href.includes('026connet!')) {
      internal++
    } else if (href.startsWith('http')) {
      external++
    }
    if (relMatch && relMatch[1].includes('nofollow')) nofollow++
  }
  return { total: links.length, internal, external, nofollow }
}

function analyzeParagraphs(textContent: string): { count: number; avgLength: number; longParagraphs: number; veryLongParagraphs: number } {
  const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 20)
  const lengths = paragraphs.map(p => countWords(p))
  const avg = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
  const longParagraphs = lengths.filter(l => l > 100).length
  const veryLongParagraphs = lengths.filter(l => l > 200).length
  return { count: paragraphs.length, avgLength: Math.round(avg), longParagraphs, veryLongParagraphs }
}

function generateImprovedTitle(title: string, keywords: Record<string, number>): string {
  const topKeywords = Object.keys(keywords).slice(0, 3)
  let improved = title

  if (title.length < 40) {
    const keyword = topKeywords.find(k => !title.toLowerCase().includes(k))
    if (keyword) {
      improved = `${title} — ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Update`
    }
  }

  if (title.length > 65) {
    improved = title.substring(0, 60).replace(/\s+\S*$/, '') + '…'
  }

  return improved
}

function generateImprovedExcerpt(content: string, maxLength = 160): string {
  const plain = stripHtml(content)
  if (plain.length <= maxLength) return plain

  let cutPoint = maxLength
  const periodIdx = plain.lastIndexOf('.', maxLength - 10)
  const commaIdx = plain.lastIndexOf(',', maxLength - 10)

  if (periodIdx > maxLength * 0.6) {
    cutPoint = periodIdx + 1
  } else if (commaIdx > maxLength * 0.6) {
    cutPoint = commaIdx + 1
  }

  return plain.substring(0, cutPoint).trim()
}

function suggestTags(title: string, content: string, existingTags: string[]): string[] {
  const text = `${title} ${stripHtml(content)}`.toLowerCase()
  const suggested: string[] = []

  const tagMap: Record<string, string[]> = {
    'politics': ['politics', 'governance', 'election', 'parliament'],
    'economy': ['economy', 'business', 'finance', 'markets'],
    'technology': ['technology', 'digital', 'innovation', 'ai', 'startups'],
    'health': ['health', 'healthcare', 'medicine', 'wellness', 'mental-health'],
    'sports': ['sports', 'football', 'athletics', 'rugby', 'cricket'],
    'climate': ['climate', 'environment', 'sustainability', 'renewable-energy'],
    'education': ['education', 'schools', 'university', 'research'],
    'crime': ['crime', 'security', 'law-enforcement', 'justice'],
    'court': ['court', 'judiciary', 'legal', 'supreme-court'],
    'kenya': ['kenya', 'nairobi', 'mombasa', 'east-africa'],
    'africa': ['africa', 'continental', 'african-union', 'ecowas'],
    'energy': ['energy', 'oil', 'gas', 'renewable', 'power'],
    'agriculture': ['agriculture', 'farming', 'food-security', 'livestock'],
    'transport': ['transport', 'infrastructure', 'roads', 'railway', 'aviation'],
    'banking': ['banking', 'fintech', 'mobile-money', 'mpesa'],
  }

  for (const [keyword, tags] of Object.entries(tagMap)) {
    if (text.includes(keyword)) {
      for (const tag of tags) {
        if (!existingTags.includes(tag) && suggested.length < 8) {
          suggested.push(tag)
        }
      }
    }
  }

  return suggested
}

function detectSemanticKeywords(text: string): string[] {
  const ngrams = [
    ...extractNgrams(text, 2),
    ...extractNgrams(text, 3),
  ]
  const freq: Record<string, number> = {}
  for (const ng of ngrams) {
    freq[ng] = (freq[ng] || 0) + 1
  }
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([k]) => k)
}

function calculateEeatScore(title: string, content: string, category: string | null): number {
  let score = 50
  const plain = stripHtml(content)
  const wordCount = countWords(plain)

  // Expertise signals
  if (/\b(dr\.|prof\.|expert|specialist|analyst|researcher)\b/i.test(plain)) score += 10
  if (/\b(study|research|survey|analysis|report|data shows|according to)\b/i.test(plain)) score += 10

  // Authority signals
  if (/\b(official|government|ministry|agency|organization|institution)\b/i.test(plain)) score += 8
  if (/\b(announced|confirmed|released|published|stated|declared)\b/i.test(plain)) score += 5

  // Trustworthiness signals
  if (/\b(source|sources|cited|reference|according to)\b/i.test(plain)) score += 8
  if (/\b(“|”|"|')/.test(plain) && (plain.match(/['"]+/g)?.length ?? 0) >= 4) score += 10 // quotes

  // Experience signals
  if (/\b(first.hand|witnessed|observed|on the ground|reporting from)\b/i.test(plain)) score += 8

  // Content depth
  if (wordCount > 1000) score += 5
  if (wordCount > 2000) score += 5

  return Math.min(100, score)
}

function calculateTopicalAuthority(content: string, category: string | null): number {
  const plain = stripHtml(content).toLowerCase()
  const categoryKeywords: Record<string, string[]> = {
    'politics': ['parliament', 'election', 'government', 'policy', 'legislation', 'mp', 'senator', 'cabinet', 'governor', 'president', 'opposition', 'coalition', 'nasa', 'jubilee', 'UDA', 'ODM', 'IEBC', 'county'],
    'economy': ['gdp', 'inflation', 'investment', 'trade', 'budget', 'fiscal', 'monetary', 'central bank', 'stock', 'market', 'shilling', 'nse', 'nairobi securities', 'imf', 'world bank', 'growth'],
    'technology': ['ai', 'artificial intelligence', 'digital', 'innovation', 'startup', 'tech', 'software', 'platform', 'app', 'mobile', 'fintech', 'm-pesa', 'safaricom', 'internet', 'cyber', 'data', 'coding'],
    'health': ['hospital', 'clinic', 'patient', 'treatment', 'vaccine', 'disease', 'ministry of health', 'who', 'covid', 'malaria', 'cancer', 'maternal', 'mental health', 'pharmaceutical', 'drug'],
    'sports': ['match', 'tournament', 'championship', 'league', 'team', 'player', 'coach', 'victory', 'premier league', 'football', 'soccer', 'athletics', 'marathon', 'olympics', 'kpl', 'harambee'],
    'climate': ['carbon', 'emissions', 'renewable', 'solar', 'wind', 'climate change', 'cop', 'paris agreement', 'deforestation', 'drought', 'flood', 'environment', 'conservation', 'wildlife'],
    'world': ['united nations', 'nato', 'g7', 'g20', 'sanctions', 'diplomacy', 'treaty', 'summit', 'geopolitics', 'foreign policy', 'embassy', 'refugee', 'humanitarian', 'conflict', 'peace'],
    'business': ['revenue', 'profit', 'company', 'corporate', 'merger', 'acquisition', 'stock', 'shareholder', 'ceo', 'startup', 'entrepreneur', 'manufacturing', 'supply chain', 'logistics'],
    'arts': ['culture', 'music', 'film', 'art', 'gallery', 'museum', 'literature', 'theatre', 'dance', 'fashion', 'design', 'photography', 'heritage', 'tradition', 'festival', 'creative'],
    'opinion': ['opinion', 'editorial', 'commentary', 'analysis', 'perspective', 'debate', 'column', 'viewpoint', 'argument', 'stance', 'critique', 'reflection', 'editor', 'columnist'],
    'features': ['profile', 'interview', 'feature', 'documentary', 'investigation', 'deep dive', 'longread', 'special report', 'series', 'in-depth', 'human interest', 'portrait'],
    'environment': ['pollution', 'waste', 'recycling', 'sustainability', 'green', 'eco', 'biodiversity', 'ecosystem', 'ocean', 'forest', 'agriculture', 'farming', 'food security', 'water'],
  }

  const normalizedCategory = (category?.toLowerCase() || '').replace(/[^a-z]/g, '')
  let keywords = NEWS_KEYWORDS
  for (const [key, words] of Object.entries(categoryKeywords)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      keywords = words
      break
    }
  }
  let matches = 0
  for (const kw of keywords) {
    if (plain.includes(kw.toLowerCase())) matches++
  }
  return Math.min(100, Math.round((matches / keywords.length) * 100))
}

function generateContentSummary(
  title: string,
  content: string,
  keywords: Record<string, number>,
  category: string | null
): SEOContentSummary {
  const plain = stripHtml(content)
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const wordCount = countWords(plain)
  const topKeywords = Object.keys(keywords).slice(0, 8)

  // Build executive summary (300+ words)
  const keySentences = sentences.slice(0, Math.min(8, sentences.length))
  const summary = keySentences.join('. ') + '.'

  // Expand with context for SEO richness
  const expandedSummary = `${summary} This development in ${category || 'the region'} has significant implications for stakeholders across the sector. ${topKeywords.slice(0, 3).join(', ')} are among the key factors driving this story. Industry experts suggest that the impact will be felt across multiple dimensions, including economic, social, and policy realms. As the situation evolves, continued monitoring of ${topKeywords[0] || 'key developments'} will be essential for understanding the broader trajectory. The article provides comprehensive coverage with ${wordCount} words of analysis, ensuring readers receive in-depth context beyond headline reporting.`

  const keywordPositions: { keyword: string; density: number; positions: number[] }[] = []
  for (const [kw, count] of Object.entries(keywords).slice(0, 10)) {
    const positions: number[] = []
    let pos = plain.toLowerCase().indexOf(kw.toLowerCase())
    while (pos !== -1) {
      positions.push(pos)
      pos = plain.toLowerCase().indexOf(kw.toLowerCase(), pos + 1)
    }
    keywordPositions.push({
      keyword: kw,
      density: Number(((count / Math.max(wordCount, 1)) * 100).toFixed(2)),
      positions
    })
  }

  // Determine content grade
  let grade: SEOContentSummary['contentGrade'] = 'C'
  if (wordCount >= 1500 && Object.keys(keywords).length >= 10) grade = 'A+'
  else if (wordCount >= 1000 && Object.keys(keywords).length >= 8) grade = 'A'
  else if (wordCount >= 800 && Object.keys(keywords).length >= 6) grade = 'B+'
  else if (wordCount >= 600 && Object.keys(keywords).length >= 5) grade = 'B'
  else if (wordCount >= 400) grade = 'C'
  else grade = 'D'

  return {
    executiveSummary: expandedSummary,
    keyTakeaways: sentences.slice(0, 5).map(s => s.trim() + '.'),
    seoKeywords: keywordPositions,
    metaDescription: generateImprovedExcerpt(content, 155),
    socialSnippet: `${title} — ${generateImprovedExcerpt(content, 120)}`,
    estimatedReadingTime: Math.max(1, Math.round(wordCount / 200)),
    contentGrade: grade,
  }
}

function generateImageRecommendations(
  content: string,
  plainContent: string,
  keywords: Record<string, number>,
  category: string | null,
  title: string
): ImageRecommendation[] {
  const recommendations: ImageRecommendation[] = []
  const paragraphs = plainContent.split(/\n\n+/).filter(p => p.trim().length > 50)
  const topKeywords = Object.keys(keywords).slice(0, 5)

  // Featured image recommendation
  recommendations.push({
    position: 0,
    altText: `${title} - Featured image showing ${category || 'news scene'}`,
    caption: `Main image for "${title}"`,
    suggestedQuery: `${topKeywords[0] || category || 'news'} ${category ? category.toLowerCase() : ''} Kenya`,
    relevanceScore: 0.95,
    placementType: 'featured',
    context: 'Article header / hero section'
  })

  // Inline images every ~400 words
  let charPosition = 0
  for (let i = 0; i < paragraphs.length; i++) {
    charPosition += paragraphs[i].length + 2
    if (i > 0 && i % 3 === 0 && charPosition > 500) {
      const paraKeywords = Object.keys(extractKeywords(paragraphs[i])).slice(0, 3)
      const query = paraKeywords.length > 0 ? paraKeywords.join(' ') : (topKeywords[0] || category || 'news')
      recommendations.push({
        position: charPosition,
        altText: `Illustration for section about ${query}`,
        caption: `Related to: ${query}`,
        suggestedQuery: `${query} Kenya Africa`,
        relevanceScore: 0.75,
        placementType: 'inline',
        context: paragraphs[i].substring(0, 100)
      })
    }
  }

  // Breakout image for long content
  if (countWords(plainContent) > 1500) {
    recommendations.push({
      position: Math.floor(plainContent.length * 0.6),
      altText: `Data visualization for ${title}`,
      caption: `Key statistics and trends`,
      suggestedQuery: `data chart ${topKeywords[0] || category} infographic`,
      relevanceScore: 0.8,
      placementType: 'breakout',
      context: 'Mid-article data visualization breakout'
    })
  }

  return recommendations.slice(0, 8)
}

function generateLayoutRecommendations(
  content: string,
  plainContent: string,
  wordCount: number
): LayoutRecommendation[] {
  const recommendations: LayoutRecommendation[] = []
  const paragraphs = plainContent.split(/\n\n+/).filter(p => p.trim().length > 30)
  let charPosition = 0

  // Add subheadings every 3-4 paragraphs in long content
  if (wordCount > 800) {
    for (let i = 3; i < paragraphs.length; i += 4) {
      charPosition += paragraphs[i - 1].length + 2
      const sectionKeywords = Object.keys(extractKeywords(paragraphs[i])).slice(0, 2)
      const headingText = sectionKeywords.length > 0
        ? sectionKeywords.join(' ').replace(/\b\w/g, c => c.toUpperCase())
        : 'Key Developments'

      recommendations.push({
        type: 'subheading',
        position: charPosition,
        originalText: '',
        recommendedHtml: `<h2>${headingText}</h2>`,
        reason: 'Break long content with descriptive subheadings for readability and SEO',
        impact: 'high'
      })
    }
  }

  // Convert lists to bullet points
  const listPatterns = [
    { pattern: /(\w+(?:,\s*)?)+(?:,\s*)?and\s+\w+/g, type: 'bullet-list' as const },
    { pattern: /\b(?:first|second|third|finally|lastly|moreover|furthermore|additionally|also)\b,?\s+/gi, type: 'bullet-list' as const },
  ]

  for (const { pattern, type } of listPatterns) {
    const matches = [...plainContent.matchAll(pattern)]
    if (matches.length >= 3) {
      const pos = matches[0].index || 0
      recommendations.push({
        type,
        position: pos,
        originalText: matches.slice(0, 3).map(m => m[0]).join(' '),
        recommendedHtml: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>',
        reason: 'Convert inline lists to bullet points for better scannability',
        impact: 'medium'
      })
      break
    }
  }

  // Add blockquote for key quotes
  const quoteMatches = [...plainContent.matchAll(/["'""'']([^"'""'']{20,})["'""'']/g)]
  if (quoteMatches.length > 0 && wordCount > 500) {
    const pos = quoteMatches[0].index || 0
    recommendations.push({
      type: 'blockquote',
      position: pos,
      originalText: quoteMatches[0][0].substring(0, 80),
      recommendedHtml: `<blockquote class="pull-quote">${quoteMatches[0][1]}</blockquote>`,
      reason: 'Highlight important quotes with styled blockquotes',
      impact: 'medium'
    })
  }

  // Add FAQ section for long articles
  if (wordCount > 1200) {
    recommendations.push({
      type: 'faq',
      position: plainContent.length,
      originalText: '',
      recommendedHtml: `
        <section class="faq-section" style="margin-top: 3rem; padding: 1.5rem; background: var(--bg-muted); border-radius: 12px;">
          <h3 style="margin-bottom: 1rem;">Frequently Asked Questions</h3>
          <details><summary>What does this mean for...?</summary><p>Detailed answer...</p></details>
          <details><summary>How will this affect...?</summary><p>Detailed answer...</p></details>
          <details><summary>What happens next?</summary><p>Detailed answer...</p></details>
        </section>
      `,
      reason: 'Add FAQ section for long-form content to capture featured snippets',
      impact: 'high'
    })
  }

  return recommendations.slice(0, 6)
}

function applyOptimizations(content: string, layoutRecs: LayoutRecommendation[]): string {
  let optimized = content
  let offset = 0

  // Sort by position
  const sorted = [...layoutRecs].sort((a, b) => a.position - b.position)

  for (const rec of sorted) {
    const pos = rec.position + offset
    if (rec.type === 'subheading' && rec.recommendedHtml) {
      optimized = optimized.slice(0, pos) + '\n\n' + rec.recommendedHtml + '\n\n' + optimized.slice(pos)
      offset += rec.recommendedHtml.length + 4
    } else if (rec.type === 'blockquote' && rec.recommendedHtml) {
      // Find the quote and wrap it
      const quoteText = rec.originalText.replace(/^["'""'']|["'""'']$/g, '')
      const quoteRegex = new RegExp(quoteText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      optimized = optimized.replace(quoteRegex, rec.recommendedHtml)
      offset += rec.recommendedHtml.length - quoteText.length
    }
  }

  // Append FAQ at end
  const faqRec = layoutRecs.find(r => r.type === 'faq')
  if (faqRec && faqRec.recommendedHtml) {
    optimized += '\n\n' + faqRec.recommendedHtml
  }

  return optimized
}

function generateSchemaMarkup(
  title: string,
  content: string,
  excerpt: string | null,
  featuredImage: string | null,
  category: string | null,
  tags: string[] | null,
  authorName?: string
): string {
  const plain = stripHtml(content)
  const publishDate = new Date().toISOString()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: excerpt || plain.substring(0, 300),
    image: featuredImage ? [featuredImage] : undefined,
    datePublished: publishDate,
    dateModified: publishDate,
    author: authorName ? {
      '@type': 'Person',
      name: authorName,
    } : undefined,
    publisher: {
      '@type': 'Organization',
      name: '026connet!',
      logo: {
        '@type': 'ImageObject',
        url: 'https://026connet!.co.ke/logo.png'
      }
    },
    articleSection: category || 'General',
    keywords: tags?.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://026connet!.co.ke/article/' // would be actual slug
    }
  }

  return JSON.stringify(schema, null, 2)
}

function generateSocialOptimization(
  title: string,
  content: string,
  featuredImage: string | null,
  category: string | null
) {
  const plain = stripHtml(content)
  const excerpt = generateImprovedExcerpt(content, 155)

  return {
    ogTitle: title.length > 60 ? title.substring(0, 57) + '…' : title,
    ogDescription: excerpt,
    ogImage: featuredImage || 'https://026connet!.co.ke/og-default.png',
    ogType: 'article',
    ogSiteName: '026connet!',
    twitterCard: 'summary_large_image',
    twitterTitle: title.length > 70 ? title.substring(0, 67) + '…' : title,
    twitterDescription: excerpt,
    twitterImage: featuredImage || 'https://026connet!.co.ke/twitter-default.png',
    twitterSite: '@026connet!',
    twitterCreator: '@026connet!',
  }
}

export async function enhancedAnalyzeSEO(params: {
  title: string
  content: string
  excerpt?: string | null
  slug?: string | null
  featured_image?: string | null
  tags?: string[] | null
  category?: string | null
  authorName?: string
}): Promise<EnhancedSEOAnalysis> {
  const { title, content, excerpt, slug, featured_image, tags, category, authorName } = params

  // When Groq is available, delegate the heavy analysis to the model.
  if (groqConfigured()) {
    try {
      return await enhancedAnalyzeSEOWithGroq(params)
    } catch (err) {
      console.error('[enhancedAnalyzeSEO] Groq analysis failed, using heuristic fallback:', err)
    }
  }

  return heuristicAnalyzeSEO(params)
}

// ── Groq-powered analysis ────────────────────────────────────────────────
async function enhancedAnalyzeSEOWithGroq(params: {
  title: string
  content: string
  excerpt?: string | null
  slug?: string | null
  featured_image?: string | null
  tags?: string[] | null
  category?: string | null
  authorName?: string
}): Promise<EnhancedSEOAnalysis> {
  const { title, content, excerpt, slug, featured_image, tags, category, authorName } = params

  const prompt = `You are the SEO and editorial AI for 026news, a Kenyan digital news platform.
Analyze the article below and return ONLY valid JSON matching this exact schema:

{
  "score": number (0-100 overall SEO/editorial score),
  "issues": [
    { "type": "error|warning|info|success", "category": "title|content|structure|keywords|readability|meta|images|links|performance|accessibility", "message": "string", "suggestion": "string", "priority": "critical|high|medium|low", "autoFixable": boolean }
  ],
  "improvedTitle": "string (better SEO title) or null",
  "improvedExcerpt": "string (120-160 char meta description) or null",
  "improvedSlug": "string (url-safe slug) or null",
  "suggestedTags": ["string", "..."],
  "contentSummary": {
    "executiveSummary": "string (2-4 sentence SEO-rich summary)",
    "keyTakeaways": ["string"],
    "seoKeywords": [{ "keyword": "string", "density": number, "positions": [number] }],
    "metaDescription": "string (150-160 chars)",
    "socialSnippet": "string (<=280 chars)",
    "estimatedReadingTime": number,
    "contentGrade": "A+|A|B+|B|C|D"
  },
  "imageRecommendations": [
    { "position": number, "altText": "string", "caption": "string", "suggestedQuery": "string", "relevanceScore": number, "placementType": "inline|featured|gallery|breakout", "context": "string" }
  ],
  "layoutRecommendations": [
    { "type": "paragraph-break|subheading|bullet-list|blockquote|callout|table|faq", "position": number, "originalText": "string", "recommendedHtml": "string", "reason": "string", "impact": "high|medium|low" }
  ],
  "optimizedContent": "string (full improved HTML content preserving facts)",
  "schemaMarkup": "string (JSON-LD NewsArticle, no markdown fences)",
  "socialOptimization": {
    "ogTitle": "string", "ogDescription": "string", "ogImage": "string",
    "twitterCard": "summary|summary_large_image", "twitterTitle": "string", "twitterDescription": "string"
  },
  "performanceHints": { "lazyLoadImages": boolean, "preloadFeatured": boolean, "deferNonCritical": boolean, "estimatedLoadTime": number }
}

Rules:
- Preserve ALL facts, names, figures, quotes and the original meaning.
- Improve headings, flow, clarity and SEO naturally.
- Suggested tags should be 3-6 relevant topics.
- Language: Kenyan/pan-African news context.

Article:
TITLE: ${title}
EXCERPT: ${excerpt || 'N/A'}
SLUG: ${slug || 'N/A'}
CATEGORY: ${category || 'N/A'}
TAGS: ${tags?.join(', ') || 'N/A'}
AUTHOR: ${authorName || 'N/A'}
FEATURED IMAGE: ${featured_image || 'none'}

CONTENT:
${content.slice(0, 12000)}`

  const data = await groqChatJSON<Record<string, any>>(
    [
      { role: 'system', content: 'You are the SEO and editorial AI for 026news. Respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    { model: 'balanced', temperature: 0.2, maxTokens: 6000, responseFormat: 'json_object' },
  )

  // Merge with a quick local metrics pass so the UI always has full metrics.
  const plainContent = stripHtml(content)
  const wordCount = countWords(plainContent)
  const localMetrics = buildMetrics(params, plainContent, wordCount)

  const issues: SEOIssue[] = Array.isArray(data.issues)
    ? data.issues.slice(0, 30).map(normalizeIssue)
    : []

  const contentSummary: SEOContentSummary = normalizeContentSummary(data.contentSummary, plainContent, wordCount)

  const imageRecommendations: ImageRecommendation[] = Array.isArray(data.imageRecommendations)
    ? data.imageRecommendations.slice(0, 8).map(normalizeImageRec)
    : []

  const layoutRecommendations: LayoutRecommendation[] = Array.isArray(data.layoutRecommendations)
    ? data.layoutRecommendations.slice(0, 6).map(normalizeLayoutRec)
    : []

  return {
    score: clampNum(Number(data.score), 0, 100),
    issues: issues.sort(sortByPriority),
    metrics: localMetrics,
    improvedTitle: typeof data.improvedTitle === 'string' ? data.improvedTitle : undefined,
    improvedExcerpt: typeof data.improvedExcerpt === 'string' ? data.improvedExcerpt : undefined,
    improvedSlug: typeof data.improvedSlug === 'string' ? data.improvedSlug : undefined,
    suggestedTags: Array.isArray(data.suggestedTags) ? data.suggestedTags.slice(0, 8).map(String) : undefined,
    contentSummary,
    imageRecommendations,
    layoutRecommendations,
    optimizedContent: typeof data.optimizedContent === 'string' ? data.optimizedContent : content,
    schemaMarkup: typeof data.schemaMarkup === 'string' ? data.schemaMarkup : '',
    socialOptimization: normalizeSocial(data.socialOptimization, title, excerpt, featured_image),
    performanceHints: normalizePerformance(data.performanceHints, featured_image),
  }
}

// ── Local heuristic engine (fallback when Groq is unavailable) ────────────
function heuristicAnalyzeSEO(params: {
  title: string
  content: string
  excerpt?: string | null
  slug?: string | null
  featured_image?: string | null
  tags?: string[] | null
  category?: string | null
  authorName?: string
}): EnhancedSEOAnalysis {
  const { title, content, excerpt, slug, featured_image, tags, category, authorName } = params

  const issues: SEOIssue[] = []
  let score = 100

  const plainContent = stripHtml(content)
  const wordCount = countWords(plainContent)
  const charCount = plainContent.length
  const headings = analyzeHeadings(content)
  const images = countImages(content)
  const links = countLinks(content)
  const paragraphs = analyzeParagraphs(plainContent)
  const sentences = countSentences(plainContent)
  const avgSentenceLength = Math.round(wordCount / Math.max(sentences, 1))
  const readability = fleschReadingEase(plainContent)
  const keywords = extractKeywords(plainContent)
  const semanticKeywords = detectSemanticKeywords(plainContent)
  const readingTime = Math.max(1, Math.round(wordCount / 200))
  const slugOptimal = !slug || (slug.length >= 10 && slug.length <= 75 && !slug.includes('_') && /^[a-z0-9-]+$/.test(slug))
  const excerptLength = excerpt ? countWords(excerpt) : 0

  const eeatScore = calculateEeatScore(title, content, category ?? null)
  const topicalAuthority = calculateTopicalAuthority(content, category ?? null)
  const contentFreshness = 100 // Would be based on publish date vs now

  // Title Analysis
  if (title.length < 30) {
    issues.push({ type: 'warning', category: 'title', message: `Title too short (${title.length} chars)`, suggestion: 'Aim for 50-60 characters. Add location, key figure, or impact.', priority: 'high', autoFixable: true })
    score -= 10
  } else if (title.length > 65) {
    issues.push({ type: 'warning', category: 'title', message: `Title too long (${title.length} chars)`, suggestion: 'Keep under 60 chars. Front-load important keywords.', priority: 'high', autoFixable: true })
    score -= 8
  } else if (title.length >= 50 && title.length <= 60) {
    issues.push({ type: 'success', category: 'title', message: `Optimal title length (${title.length} chars)`, suggestion: 'Perfect for search results and social sharing.', priority: 'low' })
  }

  if (title.length < 5) {
    issues.push({ type: 'error', category: 'title', message: 'Title is critically short', suggestion: 'Minimum 5 characters required.', priority: 'critical' })
    score -= 20
  }

  const titleLower = title.toLowerCase()
  const hasLocation = /kenya|nairobi|mombasa|kisumu|africa|east africa/i.test(title)
  if (!hasLocation && category !== 'Technology' && category !== 'Sports' && category !== 'Entertainment') {
    issues.push({ type: 'info', category: 'title', message: 'No geographic location in title', suggestion: 'Add location (Kenya, Nairobi, Africa) for local SEO boost.', priority: 'medium', autoFixable: true })
    score -= 3
  }

  if (!/[A-Z]/.test(title[0])) {
    issues.push({ type: 'warning', category: 'title', message: 'Title doesn\'t start with capital', suggestion: 'Use Title Case for professional appearance.', priority: 'medium', autoFixable: true })
    score -= 2
  }

  // Content Analysis
  if (wordCount < 300) {
    issues.push({ type: 'error', category: 'content', message: `Content too short (${wordCount} words)`, suggestion: 'Minimum 300 words for news. Aim for 600-1500 for comprehensive coverage.', priority: 'critical' })
    score -= 25
  } else if (wordCount < 600) {
    issues.push({ type: 'warning', category: 'content', message: `Content is thin (${wordCount} words)`, suggestion: 'Expand to 600+ words for better ranking and reader value.', priority: 'high' })
    score -= 10
  } else if (wordCount > 4000) {
    issues.push({ type: 'info', category: 'content', message: `Very long article (${wordCount} words)`, suggestion: 'Consider splitting into series. Add table of contents.', priority: 'low' })
  } else if (wordCount >= 1000) {
    issues.push({ type: 'success', category: 'content', message: `Excellent depth (${wordCount} words)`, suggestion: 'Comprehensive coverage favored by search engines.', priority: 'low' })
  } else {
    issues.push({ type: 'info', category: 'content', message: `Good content length (${wordCount} words)`, suggestion: 'Well-balanced for news article.', priority: 'low' })
  }

  // Heading Structure
  if (headings.h1 === 0) {
    issues.push({ type: 'warning', category: 'structure', message: 'Missing H1 heading', suggestion: 'Add one H1 (usually the title). Use H2/H3 for sections.', priority: 'high', autoFixable: true })
    score -= 8
  } else if (headings.h1 > 1) {
    issues.push({ type: 'warning', category: 'structure', message: `Multiple H1s (${headings.h1})`, suggestion: 'Only one H1 per article. Convert extras to H2.', priority: 'high', autoFixable: true })
    score -= 5
  }

  if (headings.h2 === 0 && wordCount > 500) {
    issues.push({ type: 'warning', category: 'structure', message: 'No H2 subheadings in long content', suggestion: 'Add H2s every 200-300 words for structure and SEO.', priority: 'high', autoFixable: true })
    score -= 8
  } else if (headings.h2 > 0 && headings.h2 < wordCount / 400) {
    issues.push({ type: 'info', category: 'structure', message: `Could use more H2s (${headings.h2} for ${wordCount} words)`, suggestion: 'Aim for one H2 per 250-300 words.', priority: 'medium' })
    score -= 2
  }

  if (headings.h3 > 0 && headings.h2 === 0) {
    issues.push({ type: 'warning', category: 'structure', message: 'H3s without parent H2s', suggestion: 'H3s should be nested under H2s.', priority: 'medium' })
    score -= 3
  }

  // Images
  if (images.total === 0) {
    issues.push({ type: 'warning', category: 'images', message: 'No images in content', suggestion: 'Add 2-4 relevant images. Include descriptive alt text.', priority: 'high' })
    score -= 8
  } else if (images.total < 2 && wordCount > 800) {
    issues.push({ type: 'info', category: 'images', message: `Only ${images.total} image(s) for ${wordCount} words`, suggestion: 'Add one image per 300-400 words.', priority: 'medium' })
    score -= 3
  }

  if (images.total > 0 && images.withAlt < images.total) {
    const missing = images.total - images.withAlt
    issues.push({ type: 'warning', category: 'images', message: `${missing} image(s) missing alt text`, suggestion: 'Add descriptive alt text for accessibility and image SEO.', priority: 'high', autoFixable: true })
    score -= 5
  }

  if (images.withLazy < images.total && images.total > 1) {
    issues.push({ type: 'info', category: 'performance', message: 'Some images lack lazy loading', suggestion: 'Add loading="lazy" to below-fold images.', priority: 'medium', autoFixable: true })
    score -= 2
  }

  if (!featured_image) {
    issues.push({ type: 'warning', category: 'images', message: 'No featured image', suggestion: 'Required for Open Graph, Twitter Cards, and social sharing.', priority: 'high' })
    score -= 8
  }

  // Links
  if (links.total === 0 && wordCount > 500) {
    issues.push({ type: 'info', category: 'links', message: 'No internal or external links', suggestion: 'Add 2-4 relevant links to sources, related articles, or references.', priority: 'medium' })
    score -= 5
  }

  if (links.external > 0 && links.nofollow === 0) {
    issues.push({ type: 'info', category: 'links', message: 'External links without nofollow', suggestion: 'Add rel="nofollow" to untrusted external links.', priority: 'low', autoFixable: true })
    score -= 2
  }

  // Readability
  if (readability < 30) {
    issues.push({ type: 'error', category: 'readability', message: `Very difficult to read (Flesch: ${readability})`, suggestion: 'Shorten sentences, use simpler words. Target 50-70 for news.', priority: 'high' })
    score -= 12
  } else if (readability < 50) {
    issues.push({ type: 'warning', category: 'readability', message: `Moderately difficult (Flesch: ${readability})`, suggestion: 'Simplify some sentences. Aim for 50-70.', priority: 'medium' })
    score -= 5
  } else if (readability >= 70) {
    issues.push({ type: 'success', category: 'readability', message: `Highly readable (Flesch: ${readability})`, suggestion: 'Excellent accessibility for broad audience.', priority: 'low' })
  } else {
    issues.push({ type: 'info', category: 'readability', message: `Good readability (Flesch: ${readability})`, suggestion: 'Content is accessible to most readers.', priority: 'low' })
  }

  if (avgSentenceLength > 25) {
    issues.push({ type: 'warning', category: 'readability', message: `Long sentences (avg ${avgSentenceLength} words)`, suggestion: 'Break into shorter sentences. Target 15-20 words.', priority: 'medium' })
    score -= 4
  }

  // Paragraphs
  if (paragraphs.veryLongParagraphs > 0) {
    issues.push({ type: 'warning', category: 'structure', message: `${paragraphs.veryLongParagraphs} paragraphs exceed 200 words`, suggestion: 'Break into 3-5 sentence chunks for mobile readability.', priority: 'high', autoFixable: true })
    score -= 6
  } else if (paragraphs.longParagraphs > 3) {
    issues.push({ type: 'warning', category: 'structure', message: `${paragraphs.longParagraphs} paragraphs exceed 100 words`, suggestion: 'Shorter paragraphs improve engagement.', priority: 'medium' })
    score -= 3
  }

  // Excerpt
  if (!excerpt || excerptLength < 20) {
    issues.push({ type: 'warning', category: 'meta', message: 'Missing or too short excerpt', suggestion: 'Add 120-160 char compelling summary for search snippets.', priority: 'high', autoFixable: true })
    score -= 8
  } else if (excerptLength > 300) {
    issues.push({ type: 'info', category: 'meta', message: 'Excerpt very long', suggestion: 'Keep under 160 chars for optimal SERP display.', priority: 'low', autoFixable: true })
    score -= 2
  }

  // Tags
  if (!tags || tags.length === 0) {
    issues.push({ type: 'info', category: 'keywords', message: 'No tags assigned', suggestion: 'Add 3-5 relevant tags for discoverability.', priority: 'medium', autoFixable: true })
    score -= 3
  } else if (tags.length > 10) {
    issues.push({ type: 'info', category: 'keywords', message: `Too many tags (${tags.length})`, suggestion: 'Use 3-5 focused tags. Excess dilutes relevance.', priority: 'low' })
    score -= 2
  }

  // Slug
  if (slug && !slugOptimal) {
    issues.push({ type: 'warning', category: 'meta', message: 'URL slug needs improvement', suggestion: 'Use lowercase, hyphens, 10-75 chars. Avoid underscores.', priority: 'medium', autoFixable: true })
    score -= 3
  }

  // Keyword Density
  const topKeywords = Object.entries(keywords).slice(0, 5)
  if (topKeywords.length > 0) {
    const primaryKw = topKeywords[0]
    const density = (primaryKw[1] / Math.max(wordCount, 1)) * 100
    if (density < 0.3) {
      issues.push({ type: 'info', category: 'keywords', message: `Primary keyword "${primaryKw[0]}" density low (${density.toFixed(1)}%)`, suggestion: 'Use naturally in H2s, first paragraph, and throughout.', priority: 'medium' })
      score -= 2
    } else if (density > 3) {
      issues.push({ type: 'warning', category: 'keywords', message: `Keyword "${primaryKw[0]}" overused (${density.toFixed(1)}%)`, suggestion: 'Reduce density. Use synonyms and related terms.', priority: 'medium' })
      score -= 5
    } else if (density >= 0.8 && density <= 2.5) {
      issues.push({ type: 'success', category: 'keywords', message: `Optimal keyword density (${density.toFixed(1)}%)`, suggestion: 'Well-optimized for primary keyword.', priority: 'low' })
    }
  }

  // E-E-A-T
  if (eeatScore < 50) {
    issues.push({ type: 'warning', category: 'content', message: `Low E-E-A-T signals (${eeatScore}/100)`, suggestion: 'Add expert quotes, cite sources, include data, show author credentials.', priority: 'high' })
    score -= 8
  } else if (eeatScore >= 75) {
    issues.push({ type: 'success', category: 'content', message: `Strong E-E-A-T signals (${eeatScore}/100)`, suggestion: 'Content demonstrates expertise, authority, and trustworthiness.', priority: 'low' })
  }

  // Topical Authority
  if (topicalAuthority < 40) {
    issues.push({ type: 'info', category: 'keywords', message: `Low topical relevance (${topicalAuthority}/100)`, suggestion: 'Include more category-specific terminology and entities.', priority: 'medium' })
    score -= 3
  }

  score = Math.max(0, Math.min(100, score))

  // Generate enhanced outputs
  const contentSummary = generateContentSummary(title, content, keywords, category ?? null)
  const imageRecommendations = generateImageRecommendations(content, plainContent, keywords, category ?? null, title)
  const layoutRecommendations = generateLayoutRecommendations(content, plainContent, wordCount)
  const optimizedContent = applyOptimizations(content, layoutRecommendations)
  const schemaMarkup = generateSchemaMarkup(title, content, excerpt ?? null, featured_image ?? null, category ?? null, tags ?? null, authorName)
  const socialOptimization = generateSocialOptimization(title, content, featured_image ?? null, category ?? null)

  return {
    score,
    issues: issues.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }),
    metrics: {
      titleLength: title.length,
      contentWordCount: wordCount,
      contentCharCount: charCount,
      headingCount: headings,
      imageCount: images.total,
      imagesWithAlt: images.withAlt,
      linkCount: links.total,
      internalLinks: links.internal,
      externalLinks: links.external,
      paragraphCount: paragraphs.count,
      avgSentenceLength,
      avgParagraphLength: paragraphs.avgLength,
      readingTimeMinutes: readingTime,
      fleschReadingEase: readability,
      keywordDensity: Object.fromEntries(
        Object.entries(keywords).slice(0, 10).map(([k, v]) => [k, Number(((v / Math.max(wordCount, 1)) * 100).toFixed(2))])
      ),
      slugOptimal,
      excerptLength,
      hasFeaturedImage: !!featured_image,
      tagsCount: tags?.length ?? 0,
      semanticKeywords,
      contentFreshness,
      eeatScore,
      topicalAuthority,
    },
    improvedTitle: generateImprovedTitle(title, keywords),
    improvedExcerpt: (!excerpt || excerptLength < 20) ? generateImprovedExcerpt(content) : undefined,
    improvedSlug: slugifyText(generateImprovedTitle(title, keywords) || title),
    suggestedTags: suggestTags(title, content, tags ?? []),
    contentSummary,
    imageRecommendations,
    layoutRecommendations,
    optimizedContent,
    schemaMarkup,
    socialOptimization,
    performanceHints: {
      lazyLoadImages: images.total > 2,
      preloadFeatured: !!featured_image,
      deferNonCritical: true,
      estimatedLoadTime: Math.round(500 + wordCount * 0.3 + images.total * 150),
    },
  }
}

// ── Helpers: local metrics + Groq response normalizers ───────────────────

function buildMetrics(
  params: { title: string; content: string; excerpt?: string | null | undefined; slug?: string | null | undefined; featured_image?: string | null | undefined; tags?: string[] | null | undefined; category?: string | null | undefined },
  plainContent: string,
  wordCount: number,
): SEOMetrics {
  const { title, content, excerpt, slug, featured_image, tags, category } = params
  const charCount = plainContent.length
  const headings = analyzeHeadings(content)
  const images = countImages(content)
  const links = countLinks(content)
  const paragraphs = analyzeParagraphs(plainContent)
  const sentences = countSentences(plainContent)
  const avgSentenceLength = Math.round(wordCount / Math.max(sentences, 1))
  const readability = fleschReadingEase(plainContent)
  const keywords = extractKeywords(plainContent)
  const semanticKeywords = detectSemanticKeywords(plainContent)
  const readingTime = Math.max(1, Math.round(wordCount / 200))
  const slugOptimal = !slug || (slug.length >= 10 && slug.length <= 75 && !slug.includes('_') && /^[a-z0-9-]+$/.test(slug))
  const excerptLength = excerpt ? countWords(excerpt) : 0
  const eeatScore = calculateEeatScore(title, content, category ?? null)
  const topicalAuthority = calculateTopicalAuthority(content, category ?? null)

  return {
    titleLength: title.length,
    contentWordCount: wordCount,
    contentCharCount: charCount,
    headingCount: headings,
    imageCount: images.total,
    imagesWithAlt: images.withAlt,
    linkCount: links.total,
    internalLinks: links.internal,
    externalLinks: links.external,
    paragraphCount: paragraphs.count,
    avgSentenceLength,
    avgParagraphLength: paragraphs.avgLength,
    readingTimeMinutes: readingTime,
    fleschReadingEase: readability,
    keywordDensity: Object.fromEntries(
      Object.entries(keywords).slice(0, 10).map(([k, v]) => [k, Number(((v / Math.max(wordCount, 1)) * 100).toFixed(2))])
    ),
    slugOptimal,
    excerptLength,
    hasFeaturedImage: !!featured_image,
    tagsCount: tags?.length ?? 0,
    semanticKeywords,
    contentFreshness: 100,
    eeatScore,
    topicalAuthority,
  }
}

function normalizeIssue(i: any): SEOIssue {
  const type = ['error', 'warning', 'info', 'success'].includes(i?.type) ? i.type : 'info'
  const priority = ['critical', 'high', 'medium', 'low'].includes(i?.priority) ? i.priority : 'medium'
  return {
    type,
    category: i?.category ?? 'content',
    message: String(i?.message ?? 'Suggestion'),
    suggestion: String(i?.suggestion ?? ''),
    priority,
    autoFixable: !!i?.autoFixable,
  }
}

function normalizeContentSummary(cs: any, plainContent: string, wordCount: number): SEOContentSummary {
  if (!cs || typeof cs !== 'object') {
    return {
      executiveSummary: stripHtml(plainContent).slice(0, 300) + '…',
      keyTakeaways: [],
      seoKeywords: [],
      metaDescription: generateImprovedExcerpt(plainContent, 155),
      socialSnippet: '',
      estimatedReadingTime: Math.max(1, Math.round(wordCount / 200)),
      contentGrade: 'C',
    }
  }
  const keywords = Array.isArray(cs.seoKeywords)
    ? cs.seoKeywords.slice(0, 10).map((k: any) => ({
        keyword: String(k?.keyword ?? ''),
        density: Number(k?.density) || 0,
        positions: Array.isArray(k?.positions) ? k.positions.map(Number) : [],
      }))
    : []
  return {
    executiveSummary: String(cs.executiveSummary ?? ''),
    keyTakeaways: Array.isArray(cs.keyTakeaways) ? cs.keyTakeaways.map(String) : [],
    seoKeywords: keywords,
    metaDescription: String(cs.metaDescription ?? generateImprovedExcerpt(plainContent, 155)),
    socialSnippet: String(cs.socialSnippet ?? ''),
    estimatedReadingTime: Number(cs.estimatedReadingTime) || Math.max(1, Math.round(wordCount / 200)),
    contentGrade: ['A+', 'A', 'B+', 'B', 'C', 'D'].includes(cs.contentGrade) ? cs.contentGrade : 'C',
  }
}

function normalizeImageRec(r: any): ImageRecommendation {
  return {
    position: Number(r?.position) || 0,
    altText: String(r?.altText ?? ''),
    caption: r?.caption ? String(r.caption) : undefined,
    suggestedQuery: String(r?.suggestedQuery ?? ''),
    relevanceScore: Number(r?.relevanceScore) || 0.5,
    placementType: ['inline', 'featured', 'gallery', 'breakout'].includes(r?.placementType) ? r.placementType : 'inline',
    context: String(r?.context ?? ''),
  }
}

function normalizeLayoutRec(r: any): LayoutRecommendation {
  return {
    type: ['paragraph-break', 'subheading', 'bullet-list', 'blockquote', 'callout', 'table', 'faq'].includes(r?.type) ? r.type : 'subheading',
    position: Number(r?.position) || 0,
    originalText: String(r?.originalText ?? ''),
    recommendedHtml: String(r?.recommendedHtml ?? ''),
    reason: String(r?.reason ?? ''),
    impact: ['high', 'medium', 'low'].includes(r?.impact) ? r.impact : 'medium',
  }
}

function normalizeSocial(s: any, title: string, excerpt: string | null | undefined, featured_image: string | null | undefined) {
  const fallback = generateSocialOptimization(title, '', featured_image ?? null, null)
  return {
    ogTitle: String(s?.ogTitle ?? fallback.ogTitle),
    ogDescription: String(s?.ogDescription ?? fallback.ogDescription),
    ogImage: String(s?.ogImage ?? featured_image ?? fallback.ogImage),
    twitterCard: s?.twitterCard === 'summary' ? 'summary' : 'summary_large_image',
    twitterTitle: String(s?.twitterTitle ?? fallback.twitterTitle),
    twitterDescription: String(s?.twitterDescription ?? fallback.twitterDescription),
  }
}

function normalizePerformance(p: any, featured_image: string | null | undefined) {
  return {
    lazyLoadImages: p?.lazyLoadImages ?? false,
    preloadFeatured: p?.preloadFeatured ?? !!featured_image,
    deferNonCritical: p?.deferNonCritical ?? true,
    estimatedLoadTime: Number(p?.estimatedLoadTime) || 1000,
  }
}

function sortByPriority(a: SEOIssue, b: SEOIssue): number {
  const order = { critical: 0, high: 1, medium: 2, low: 3 }
  return order[a.priority] - order[b.priority]
}

function clampNum(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}