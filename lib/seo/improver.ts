/**
 * Content Style Matcher & Improver for 026News
 * Analyzes writing style, suggests improvements, and auto-enhances content.
 */

export interface StyleProfile {
  tone: 'formal' | 'casual' | 'academic' | 'conversational' | 'authoritative'
  readingLevel: 'elementary' | 'middle' | 'high-school' | 'college' | 'professional'
  sentenceVariety: 'low' | 'medium' | 'high'
  voiceActive: number // percentage 0-100
  avgWordLength: number
  vocabularyRichness: number // unique words / total words
  paragraphStructure: 'short' | 'medium' | 'long'
  hookQuality: 'strong' | 'moderate' | 'weak'
}

export interface ContentImprovement {
  type: 'headline' | 'hook' | 'structure' | 'style' | 'engagement' | 'clarity'
  original: string
  improved: string
  reason: string
}

export interface ContentAnalysis {
  style: StyleProfile
  improvements: ContentImprovement[]
  enhancedTitle: string
  enhancedExcerpt: string
  enhancedContent: string
  summary: {
    overallAppeal: number // 0-100
    seoOptimization: number
    readabilityScore: number
    engagementScore: number
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5)
}

function getParagraphs(text: string): string[] {
  return text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 20)
}

function detectTone(text: string): StyleProfile['tone'] {
  const lower = text.toLowerCase()
  const formalMarkers = ['therefore', 'furthermore', 'consequently', 'moreover', 'henceforth', 'notwithstanding']
  const casualMarkers = ['gonna', 'wanna', 'hey', 'yeah', 'cool', 'awesome', 'pretty much']
  const academicMarkers = ['hypothesis', 'methodology', 'empirical', 'theoretical', 'paradigm', 'epistemological']
  const authoritativeMarkers = ['must', 'should', 'will', 'requires', 'demands', 'essential', 'critical']

  const formalScore = formalMarkers.filter(m => lower.includes(m)).length
  const casualScore = casualMarkers.filter(m => lower.includes(m)).length
  const academicScore = academicMarkers.filter(m => lower.includes(m)).length
  const authoritativeScore = authoritativeMarkers.filter(m => lower.includes(m)).length

  const scores = [
    { tone: 'formal' as const, score: formalScore },
    { tone: 'casual' as const, score: casualScore },
    { tone: 'academic' as const, score: academicScore },
    { tone: 'authoritative' as const, score: authoritativeScore },
  ]

  const sorted = scores.sort((a, b) => b.score - a.score)
  return sorted[0].score > 0 ? sorted[0].tone : 'conversational'
}

function detectReadingLevel(text: string): StyleProfile['readingLevel'] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const avgWordLen = words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1)
  const longWords = words.filter(w => w.length > 6).length / Math.max(words.length, 1)

  if (avgWordLen < 4 && longWords < 0.1) return 'elementary'
  if (avgWordLen < 4.5 && longWords < 0.15) return 'middle'
  if (avgWordLen < 5 && longWords < 0.2) return 'high-school'
  if (avgWordLen < 5.5 && longWords < 0.25) return 'college'
  return 'professional'
}

function detectSentenceVariety(sentences: string[]): StyleProfile['sentenceVariety'] {
  if (sentences.length < 3) return 'low'
  const lengths = sentences.map(s => countWords(s))
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length
  const cv = Math.sqrt(variance) / avg // coefficient of variation

  if (cv > 0.6) return 'high'
  if (cv > 0.35) return 'medium'
  return 'low'
}

function detectActiveVoice(sentences: string[]): number {
  const passiveIndicators = /\b(is|are|was|were|been|being)\s+(being\s+)?\w+ed\b/i
  let passiveCount = 0
  for (const s of sentences) {
    if (passiveIndicators.test(s)) passiveCount++
  }
  return Math.round(((sentences.length - passiveCount) / Math.max(sentences.length, 1)) * 100)
}

function detectVocabularyRichness(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  const unique = new Set(words)
  return Number((unique.size / Math.max(words.length, 1)).toFixed(3))
}

function detectHookQuality(firstParagraph: string): StyleProfile['hookQuality'] {
  const strongHooks: RegExp[] = [
    /^(breaking|exclusive|just in|developing)/i,
    /\d+ (people|killed|injured|arrested|charged)/i,
    /(president|minister|governor|official)\s+\w+\s+(said|announced|declared|revealed)/i,
    /^(in|at|on)\s+\w+,?\s+\w+\s+\d+/i, // dateline format
    /\?$/, // ends with question
  ]

  const matchCount = strongHooks.filter(p => p.test(firstParagraph)).length
  if (matchCount >= 2) return 'strong'
  if (matchCount >= 1) return 'moderate'
  return 'weak'
}

function improveTitle(title: string): ContentImprovement | null {
  const improvements: ContentImprovement[] = []

  // Check for passive voice in title
  if (/\b(is|are|was|were)\s+\w+ed\b/i.test(title)) {
    improvements.push({
      type: 'headline',
      original: title,
      improved: title.replace(/\b(is|are|was|were)\s+(\w+ed)\b/gi, (_, verb, past) => {
        const root = past.replace(/ed$/, '')
        return `${root}s`
      }),
      reason: 'Convert passive voice to active voice for a stronger headline.',
    })
  }

  // Check for weak opener words
  const weakOpeners = /^(a|an|the|this|that|there|it)\s/i
  if (weakOpeners.test(title)) {
    const stronger = title.replace(weakOpeners, '')
    if (stronger.length > 5) {
      improvements.push({
        type: 'headline',
        original: title,
        improved: stronger.charAt(0).toUpperCase() + stronger.slice(1),
        reason: 'Remove weak opener words for a more impactful headline.',
      })
    }
  }

  // Check for all caps
  if (title === title.toUpperCase() && title.length > 5) {
    improvements.push({
      type: 'headline',
      original: title,
      improved: title.charAt(0).toUpperCase() + title.slice(1).toLowerCase(),
      reason: 'Avoid ALL CAPS — use title case instead.',
    })
  }

  return improvements.length > 0 ? improvements[0] : null
}

function improveHook(firstParagraph: string, style: StyleProfile): ContentImprovement | null {
  const words = countWords(firstParagraph)

  if (words < 15) {
    const expanded = `${firstParagraph.trim()} This development has significant implications for the region.`
    return {
      type: 'hook',
      original: firstParagraph,
      improved: expanded,
      reason: 'Opening paragraph is too short. Expand with context or a compelling statement.',
    }
  }

  if (words > 80) {
    const sentences = getSentences(firstParagraph)
    if (sentences.length > 3) {
      const trimmed = sentences.slice(0, 2).join('. ') + '.'
      return {
        type: 'hook',
        original: firstParagraph,
        improved: trimmed,
        reason: 'Opening paragraph is too long. Lead with the most compelling information.',
      }
    }
  }

  return null
}

function improveStructure(content: string): ContentImprovement[] {
  const improvements: ContentImprovement[] = []
  const paragraphs = getParagraphs(content)

  // Check for wall of text (no subheadings in long content)
  const wordCount = countWords(content)
  if (wordCount > 800 && !/<h[23]/i.test(content)) {
    improvements.push({
      type: 'structure',
      original: '(no subheadings)',
      improved: 'Add H2 subheadings every 200-300 words to break up long content.',
      reason: 'Long articles need subheadings for readability and SEO.',
    })
  }

  // Check for very long paragraphs
  for (const para of paragraphs) {
    const paraWords = countWords(para)
    if (paraWords > 120) {
      const mid = Math.floor(para.length / 2)
      const splitPoint = para.indexOf('.', mid) + 1 || mid
      const firstHalf = para.substring(0, splitPoint).trim()
      const secondHalf = para.substring(splitPoint).trim()

      if (firstHalf.length > 20 && secondHalf.length > 20) {
        improvements.push({
          type: 'structure',
          original: para.substring(0, 80) + '...',
          improved: `${firstHalf}\n\n${secondHalf.substring(0, 80)}...`,
          reason: `Paragraph is ${paraWords} words. Break into 2-3 shorter paragraphs.`,
        })
        break // only suggest one at a time
      }
    }
  }

  return improvements
}

function improveStyle(text: string, style: StyleProfile): ContentImprovement[] {
  const improvements: ContentImprovement[] = []
  const sentences = getSentences(text)

  // Detect filler words
  const fillerPatterns = [
    { pattern: /\b(very|really|quite|extremely|absolutely)\b/gi, replacement: '', reason: 'Remove filler words for concise writing.' },
    { pattern: /\b(in order to)\b/gi, replacement: 'to', reason: 'Replace "in order to" with "to" for brevity.' },
    { pattern: /\b(due to the fact that)\b/gi, replacement: 'because', reason: 'Replace "due to the fact that" with "because".' },
    { pattern: /\b(at this point in time)\b/gi, replacement: 'now', reason: 'Replace "at this point in time" with "now".' },
    { pattern: /\b(in the event that)\b/gi, replacement: 'if', reason: 'Replace "in the event that" with "if".' },
    { pattern: /\b(has the ability to)\b/gi, replacement: 'can', reason: 'Replace "has the ability to" with "can".' },
  ]

  for (const { pattern, replacement, reason } of fillerPatterns) {
    const match = text.match(pattern)
    if (match) {
      improvements.push({
        type: 'style',
        original: match[0],
        improved: replacement || match[0],
        reason,
      })
      break // one at a time
    }
  }

  // Check for passive voice in key sentences
  for (const sentence of sentences.slice(0, 10)) {
    const passiveMatch = sentence.match(/\b(was|were|is|are|been)\s+(\w+ed)\b/i)
    if (passiveMatch) {
      improvements.push({
        type: 'style',
        original: sentence.trim(),
        improved: `Active voice: ${sentence.replace(passiveMatch[0], passiveMatch[2])}`,
        reason: 'Convert passive voice to active voice for stronger, clearer writing.',
      })
      break
    }
  }

  return improvements
}

function improveEngagement(content: string): ContentImprovement[] {
  const improvements: ContentImprovement[] = []
  const plain = stripHtml(content)
  const sentences = getSentences(plain)

  // Check for lack of quotes or attributions
  const hasQuotes = content.includes('"') || content.includes('\u201c') || content.includes('\u201d')
  if (!hasQuotes && sentences.length > 5) {
    improvements.push({
      type: 'engagement',
      original: '(no direct quotes)',
      improved: 'Add direct quotes from sources to add credibility and engagement.',
      reason: 'Direct quotes make articles more engaging and authoritative.',
    })
  }

  // Check for rhetorical questions
  const hasQuestion = sentences.some(s => s.trim().endsWith('?'))
  if (!hasQuestion && sentences.length > 10) {
    improvements.push({
      type: 'engagement',
      original: '(no questions)',
      improved: 'Consider adding a thought-provoking question to engage readers.',
      reason: 'Rhetorical questions can increase reader engagement.',
    })
  }

  return improvements
}

function enhanceTitle(title: string, keywords: string[]): string {
  let enhanced = title.trim()

  // Ensure it doesn't end with a period
  if (enhanced.endsWith('.')) {
    enhanced = enhanced.slice(0, -1)
  }

  // Capitalize properly (title case)
  const smallWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of']
  enhanced = enhanced.split(' ').map((word, i) => {
    if (i === 0 || !smallWords.includes(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
    return word.toLowerCase()
  }).join(' ')

  return enhanced
}

function enhanceExcerpt(content: string, targetLength = 155): string {
  const plain = stripHtml(content)

  if (plain.length <= targetLength) return plain

  // Find a good cut point (end of sentence)
  let cutPoint = targetLength
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 10)
  let accumulated = 0

  for (const sentence of sentences) {
    accumulated += sentence.length + 1
    if (accumulated >= targetLength * 0.8) {
      cutPoint = accumulated
      break
    }
  }

  return plain.substring(0, cutPoint).trim() + (cutPoint < plain.length ? '...' : '')
}

function enhanceContent(content: string): string {
  let enhanced = content

  // Fix double spaces
  enhanced = enhanced.replace(/\s{2,}/g, ' ')

  // Fix missing spaces after periods
  enhanced = enhanced.replace(/\.([A-Z])/g, '. $1')

  // Fix missing spaces after commas
  enhanced = enhanced.replace(/,([A-Za-z])/g, ', $1')

  // Ensure paragraphs are separated by double newlines
  enhanced = enhanced.replace(/\n{3,}/g, '\n\n')

  return enhanced
}

export function analyzeAndImprove(params: {
  title: string
  content: string
  excerpt?: string | null
  tags?: string[] | null
}): ContentAnalysis {
  const { title, content, excerpt, tags } = params
  const plainContent = stripHtml(content)
  const sentences = getSentences(plainContent)
  const paragraphs = getParagraphs(plainContent)

  // Build style profile
  const tone = detectTone(plainContent)
  const readingLevel = detectReadingLevel(plainContent)
  const sentenceVariety = detectSentenceVariety(sentences)
  const voiceActive = detectActiveVoice(sentences)
  const words = plainContent.split(/\s+/).filter(w => w.length > 0)
  const avgWordLength = Number((words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1)).toFixed(1))
  const vocabularyRichness = detectVocabularyRichness(plainContent)
  const paragraphStructure = paragraphs.length > 0
    ? (paragraphs.reduce((sum, p) => sum + countWords(p), 0) / paragraphs.length) < 40 ? 'short' as const
    : (paragraphs.reduce((sum, p) => sum + countWords(p), 0) / paragraphs.length) < 80 ? 'medium' as const
    : 'long' as const
    : 'medium' as const
  const hookQuality = paragraphs.length > 0 ? detectHookQuality(paragraphs[0]) : 'weak'

  const style: StyleProfile = {
    tone,
    readingLevel,
    sentenceVariety,
    voiceActive,
    avgWordLength,
    vocabularyRichness,
    paragraphStructure,
    hookQuality,
  }

  // Collect improvements
  const improvements: ContentImprovement[] = []

  const titleImprovement = improveTitle(title)
  if (titleImprovement) improvements.push(titleImprovement)

  if (paragraphs.length > 0) {
    const hookImprovement = improveHook(paragraphs[0], style)
    if (hookImprovement) improvements.push(hookImprovement)
  }

  improvements.push(...improveStructure(content))
  improvements.push(...improveStyle(plainContent, style))
  improvements.push(...improveEngagement(content))

  // Calculate scores
  const readabilityScore = Math.min(100, Math.round(
    (style.voiceActive * 0.3) +
    (style.vocabularyRichness * 50) +
    (style.sentenceVariety === 'high' ? 25 : style.sentenceVariety === 'medium' ? 15 : 5) +
    (style.hookQuality === 'strong' ? 25 : style.hookQuality === 'moderate' ? 15 : 5)
  ))

  const engagementScore = Math.min(100, Math.round(
    (style.hookQuality === 'strong' ? 30 : style.hookQuality === 'moderate' ? 20 : 10) +
    (style.sentenceVariety === 'high' ? 25 : 15) +
    (style.tone === 'conversational' || style.tone === 'casual' ? 20 : 15) +
    (improvements.filter(i => i.type === 'engagement').length === 0 ? 25 : 10)
  ))

  const seoOptimization = Math.min(100, Math.round(
    (countWords(title) >= 5 ? 20 : 10) +
    (title.length >= 30 && title.length <= 65 ? 25 : 15) +
    (countWords(plainContent) >= 300 ? 25 : 10) +
    (tags && tags.length > 0 ? 15 : 5) +
    (excerpt && excerpt.length > 20 ? 15 : 5)
  ))

  const overallAppeal = Math.round((readabilityScore + engagementScore + seoOptimization) / 3)

  return {
    style,
    improvements,
    enhancedTitle: enhanceTitle(title, Object.keys(extractKeywordsSimple(plainContent))),
    enhancedExcerpt: excerpt && excerpt.length < 20 ? enhanceExcerpt(content) : excerpt || enhanceExcerpt(content),
    enhancedContent: enhanceContent(content),
    summary: {
      overallAppeal,
      seoOptimization,
      readabilityScore,
      engagementScore,
    },
  }
}

function extractKeywordsSimple(text: string): Record<string, number> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  const freq: Record<string, number> = {}
  for (const w of words) {
    if (w.length > 3) freq[w] = (freq[w] || 0) + 1
  }
  return freq
}
