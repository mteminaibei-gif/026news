/**
 * SEO Analysis Algorithm for 026News
 * Analyzes title, content, meta tags, readability, keyword density, and structure.
 */

export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: 'title' | 'content' | 'structure' | 'keywords' | 'readability' | 'meta' | 'images' | 'links'
  message: string
  suggestion: string
}

export interface SEOAnalysis {
  score: number
  issues: SEOIssue[]
  metrics: {
    titleLength: number
    contentWordCount: number
    contentCharCount: number
    headingCount: { h1: number; h2: number; h3: number }
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
  }
  improvedTitle?: string
  improvedExcerpt?: string
  suggestedTags?: string[]
}

const NEWS_KEYWORDS = [
  'kenya', 'nairobi', 'africa', 'breaking', 'news', 'report', 'analysis',
  'politics', 'economy', 'business', 'technology', 'health', 'sports',
  'climate', 'education', 'crime', 'court', 'government', 'president',
  'minister', 'county', '-election', 'policy', 'reform', 'crisis',
]

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

function extractKeywords(text: string): Record<string, number> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}
  const stops = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of',
    'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'because', 'but', 'and', 'or', 'if', 'while', 'that', 'this', 'these',
    'those', 'it', 'its', 'he', 'she', 'they', 'them', 'we', 'you', 'i', 'me',
    'my', 'your', 'his', 'her', 'our', 'their', 'what', 'which', 'who', 'whom'])

  for (const w of words) {
    if (w.length < 3 || stops.has(w)) continue
    freq[w] = (freq[w] || 0) + 1
  }

  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})
}

function analyzeHeadings(content: string): { h1: number; h2: number; h3: number } {
  return {
    h1: (content.match(/<h1[\s>]/gi) || []).length,
    h2: (content.match(/<h2[\s>]/gi) || []).length,
    h3: (content.match(/<h3[\s>]/gi) || []).length,
  }
}

function countImages(content: string): { total: number; withAlt: number } {
  const imgs = content.match(/<img[^>]*>/gi) || []
  const withAlt = imgs.filter(img => /alt\s*=\s*["'][^"']+["']/i.test(img)).length
  return { total: imgs.length, withAlt }
}

function countLinks(content: string): { total: number; internal: number; external: number } {
  const links = content.match(/<a[^>]*href\s*=\s*["'][^"']*["'][^>]*>/gi) || []
  let internal = 0
  let external = 0
  for (const link of links) {
    const hrefMatch = link.match(/href\s*=\s*["']([^"']*)["']/i)
    if (!hrefMatch) continue
    const href = hrefMatch[1]
    if (href.startsWith('/') || href.startsWith('#') || href.includes('026newsblog')) {
      internal++
    } else if (href.startsWith('http')) {
      external++
    }
  }
  return { total: links.length, internal, external }
}

function analyzeParagraphs(textContent: string): { count: number; avgLength: number; longParagraphs: number } {
  const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 20)
  const lengths = paragraphs.map(p => countWords(p))
  const avg = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
  const longParagraphs = lengths.filter(l => l > 100).length
  return { count: paragraphs.length, avgLength: Math.round(avg), longParagraphs }
}

function generateImprovedTitle(title: string, keywords: Record<string, number>): string {
  const topKeywords = Object.keys(keywords).slice(0, 3)
  let improved = title

  // Ensure title is between 50-60 chars for optimal SEO
  if (title.length < 40) {
    // Title is too short — suggest expansion
    const keyword = topKeywords.find(k => !title.toLowerCase().includes(k))
    if (keyword) {
      improved = `${title} — ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Update`
    }
  }

  if (title.length > 65) {
    // Title is too long — truncate at last complete word before 60
    improved = title.substring(0, 60).replace(/\s+\S*$/, '') + '...'
  }

  return improved
}

function generateImprovedExcerpt(content: string, maxLength = 160): string {
  const plain = stripHtml(content)
  if (plain.length <= maxLength) return plain

  // Find a good sentence boundary
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
    'politics': ['politics', 'governance', 'election'],
    'economy': ['economy', 'business', 'finance'],
    'technology': ['technology', 'digital', 'innovation'],
    'health': ['health', 'healthcare', 'medicine'],
    'sports': ['sports', 'football', 'athletics'],
    'climate': ['climate', 'environment', 'sustainability'],
    'education': ['education', 'schools', 'university'],
    'crime': ['crime', 'security', 'law-enforcement'],
    'court': ['court', 'judiciary', 'legal'],
    'kenya': ['kenya', 'nairobi', 'east-africa'],
    'africa': ['africa', 'continental', 'african-union'],
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

export function analyzeSEO(params: {
  title: string
  content: string
  excerpt?: string | null
  slug?: string
  featured_image?: string | null
  tags?: string[] | null
  category?: string | null
}): SEOAnalysis {
  const { title, content, excerpt, slug, featured_image, tags, category } = params
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
  const readingTime = Math.max(1, Math.round(wordCount / 200))
  const slugOptimal = !slug || (slug.length >= 10 && slug.length <= 75 && !slug.includes('_'))
  const excerptLength = excerpt ? countWords(excerpt) : 0

  // ── Title Analysis ──
  if (title.length < 30) {
    issues.push({ type: 'warning', category: 'title', message: `Title is too short (${title.length} chars)`, suggestion: 'Aim for 50-60 characters for optimal SEO. Add relevant keywords or location.' })
    score -= 8
  } else if (title.length > 65) {
    issues.push({ type: 'warning', category: 'title', message: `Title is too long (${title.length} chars)`, suggestion: 'Keep title under 60 characters. Long titles get truncated in search results.' })
    score -= 5
  } else {
    issues.push({ type: 'info', category: 'title', message: `Title length is optimal (${title.length} chars)`, suggestion: 'Good — title will display fully in search results.' })
  }

  if (title.length < 5) {
    issues.push({ type: 'error', category: 'title', message: 'Title is too short', suggestion: 'Title must be at least 5 characters.' })
    score -= 15
  }

  const titleLower = title.toLowerCase()
  const hasLocation = /kenya|nairobi|mombasa|africa|east africa/i.test(title)
  if (!hasLocation && category !== 'Technology' && category !== 'Sports') {
    issues.push({ type: 'info', category: 'title', message: 'Title lacks geographic location', suggestion: 'Adding a location (e.g., "Kenya", "Nairobi") improves local SEO.' })
    score -= 2
  }

  // ── Content Analysis ──
  if (wordCount < 300) {
    issues.push({ type: 'error', category: 'content', message: `Content is too short (${wordCount} words)`, suggestion: 'News articles should be at least 300 words. Aim for 600-1200 words for better SEO ranking.' })
    score -= 20
  } else if (wordCount < 600) {
    issues.push({ type: 'warning', category: 'content', message: `Content is thin (${wordCount} words)`, suggestion: 'Consider expanding to 600+ words. Longer content ranks better and provides more value.' })
    score -= 8
  } else if (wordCount > 3000) {
    issues.push({ type: 'info', category: 'content', message: `Content is comprehensive (${wordCount} words)`, suggestion: 'Long-form content performs well. Consider adding a table of contents.' })
  } else {
    issues.push({ type: 'info', category: 'content', message: `Content length is good (${wordCount} words)`, suggestion: 'Well-balanced article length.' })
  }

  // ── Heading Structure ──
  if (headings.h1 === 0) {
    issues.push({ type: 'warning', category: 'structure', message: 'No H1 heading found', suggestion: 'Add an H1 heading to structure your content. Use H2 for sections and H3 for subsections.' })
    score -= 5
  } else if (headings.h1 > 1) {
    issues.push({ type: 'warning', category: 'structure', message: `Multiple H1 headings (${headings.h1})`, suggestion: 'Use only one H1 per article. Convert extras to H2.' })
    score -= 5
  }

  if (headings.h2 === 0 && wordCount > 500) {
    issues.push({ type: 'warning', category: 'structure', message: 'No H2 subheadings found', suggestion: 'Add H2 subheadings to break up long content. This improves readability and SEO.' })
    score -= 5
  }

  // ── Images ──
  if (images.total === 0) {
    issues.push({ type: 'warning', category: 'images', message: 'No images in content', suggestion: 'Add at least 1-2 images to make the article more engaging. Include descriptive alt text.' })
    score -= 5
  }

  if (images.total > 0 && images.withAlt < images.total) {
    const missing = images.total - images.withAlt
    issues.push({ type: 'warning', category: 'images', message: `${missing} image(s) missing alt text`, suggestion: 'Add descriptive alt text to all images for accessibility and SEO.' })
    score -= 3
  }

  if (!featured_image) {
    issues.push({ type: 'warning', category: 'images', message: 'No featured image set', suggestion: 'Add a featured image for social media sharing (Open Graph) and visual appeal.' })
    score -= 5
  }

  // ── Links ──
  if (links.total === 0 && wordCount > 500) {
    issues.push({ type: 'info', category: 'links', message: 'No links in content', suggestion: 'Adding internal and external links improves SEO and reader engagement.' })
    score -= 3
  }

  if (links.external === 0 && links.internal === 0 && wordCount > 500) {
    issues.push({ type: 'info', category: 'links', message: 'Consider adding source references', suggestion: 'Link to original sources or related articles for credibility and SEO.' })
  }

  // ── Readability ──
  if (readability < 30) {
    issues.push({ type: 'warning', category: 'readability', message: `Readability is difficult (score: ${readability})`, suggestion: 'Use shorter sentences and simpler words. Aim for a Flesch score of 50-70 for news content.' })
    score -= 8
  } else if (readability < 50) {
    issues.push({ type: 'info', category: 'readability', message: `Readability is moderate (score: ${readability})`, suggestion: 'Consider simplifying some sentences for broader audience reach.' })
    score -= 3
  } else {
    issues.push({ type: 'info', category: 'readability', message: `Readability is good (score: ${readability})`, suggestion: 'Content is accessible to most readers.' })
  }

  if (avgSentenceLength > 25) {
    issues.push({ type: 'warning', category: 'readability', message: `Average sentence length is high (${avgSentenceLength} words)`, suggestion: 'Break long sentences into shorter ones. Aim for 15-20 words per sentence.' })
    score -= 3
  }

  // ── Paragraphs ──
  if (paragraphs.longParagraphs > 2) {
    issues.push({ type: 'warning', category: 'structure', message: `${paragraphs.longParagraphs} paragraphs exceed 100 words`, suggestion: 'Break long paragraphs into smaller chunks (3-5 sentences each) for better readability on mobile.' })
    score -= 3
  }

  // ── Excerpt ──
  if (!excerpt || excerpt.length < 20) {
    issues.push({ type: 'warning', category: 'meta', message: 'Missing or too short excerpt', suggestion: 'Add a compelling 120-160 character excerpt for search engine snippets and social sharing.' })
    score -= 5
  } else if (excerpt.length > 300) {
    issues.push({ type: 'info', category: 'meta', message: 'Excerpt is long', suggestion: 'Keep excerpt under 160 characters for optimal search result display.' })
    score -= 2
  }

  // ── Tags ──
  if (!tags || tags.length === 0) {
    issues.push({ type: 'info', category: 'keywords', message: 'No tags assigned', suggestion: 'Add 3-5 relevant tags to improve content discoverability.' })
    score -= 3
  } else if (tags.length > 10) {
    issues.push({ type: 'info', category: 'keywords', message: `Too many tags (${tags.length})`, suggestion: 'Use 3-5 focused tags. Too many tags dilute relevance.' })
    score -= 2
  }

  // ── Slug ──
  if (slug && !slugOptimal) {
    issues.push({ type: 'warning', category: 'meta', message: 'URL slug could be improved', suggestion: 'Use lowercase, hyphens, and keep between 10-75 characters. Avoid underscores.' })
    score -= 3
  }

  // ── Keywords ──
  const topKeywords = Object.entries(keywords).slice(0, 5)
  if (topKeywords.length > 0) {
    const primaryKeyword = topKeywords[0]
    const density = (primaryKeyword[1] / Math.max(wordCount, 1)) * 100
    if (density < 0.5) {
      issues.push({ type: 'info', category: 'keywords', message: `Primary keyword "${primaryKeyword[0]}" density is low (${density.toFixed(1)}%)`, suggestion: 'Aim for 1-2% keyword density. Use the keyword naturally in headings and throughout the content.' })
      score -= 2
    } else if (density > 3) {
      issues.push({ type: 'warning', category: 'keywords', message: `Primary keyword "${primaryKeyword[0]}" density is high (${density.toFixed(1)}%)`, suggestion: 'Reduce keyword stuffing. Use synonyms and related terms instead.' })
      score -= 5
    }
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    issues,
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
    },
    improvedTitle: generateImprovedTitle(title, keywords),
    improvedExcerpt: excerpt && excerpt.length < 20 ? generateImprovedExcerpt(content) : undefined,
    suggestedTags: suggestTags(title, content, tags ?? []),
  }
}
