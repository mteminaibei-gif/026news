/**
 * Unified AI Service - Groq-powered
 * Replaces: SEO analyzer, Content enhancer, Grammar checker, Content moderation
 */

import { groqChat, groqChatJSON, groqConfigured, GROQ_MODELS, type GroqModel } from './groq-client'

// ============================================
// TYPES
// ============================================

export interface SEOAnalysis {
  score: number
  readability: {
    flesch: number
    grade: string
    avgWordsPerSentence: number
  }
  keywordAnalysis: {
    primaryKeywords: { keyword: string; density: number; positions: number[] }[]
    secondaryKeywords: string[]
    missingKeywords: string[]
    keywordGaps: string[]
  }
  contentQuality: {
    score: number
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'
    strengths: string[]
    weaknesses: string[]
  }
  structureAnalysis: {
    headingScore: number
    paragraphScore: number
    internalLinks: number
    externalLinks: number
    imageAltCoverage: number
  }
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: 'keywords' | 'structure' | 'readability' | 'technical' | 'content'
    issue: string
    suggestion: string
    autoFixable: boolean
  }[]
  optimizedContent?: {
    title: string
    metaDescription: string
    slug: string
    content: string
    schemaMarkup: string
  }
}

export interface ContentEnhancement {
  originalContent: string
  enhancedContent: string
  changes: {
    type: 'grammar' | 'style' | 'clarity' | 'flow' | 'seo' | 'tone'
    original: string
    improved: string
    reason: string
  }[]
  summary: string
  readabilityImprovement: number
  seoImprovement: number
}

export interface GrammarStyleCheck {
  score: number
  issues: {
    type: 'grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity' | 'consistency'
    severity: 'error' | 'warning' | 'suggestion'
    message: string
    suggestion: string
    position?: { start: number; end: number }
    context?: string
  }[]
  readability: {
    flesch: number
    grade: string
    avgWordsPerSentence: number
    avgSyllablesPerWord: number
  }
  styleMetrics: {
    passiveVoicePercent: number
    complexWordsPercent: number
    sentenceVariety: number
  }
}

export interface ModerationResult {
  flagged: boolean
  categories: {
    category: string
    score: number
    flagged: boolean
  }[]
  action: 'allow' | 'review' | 'reject'
  reason?: string
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPTS = {
  seo: `You are an expert SEO analyst and content strategist for 026news, a Kenyan digital news platform.
Analyze content for SEO optimization, readability, and editorial quality.
Always return valid JSON matching the requested schema exactly.`,

  enhance: `You are a senior editor at 026news. Enhance content for clarity, flow, SEO, and engagement while preserving the author's voice and all facts.
Return JSON with the enhanced content and a detailed change log.`,

  grammar: `You are a professional copy editor. Check grammar, spelling, punctuation, style, and clarity.
Return JSON with issues categorized by type and severity.`,

  moderation: `You are a content moderation system. Analyze content for policy violations.
Return JSON with categories, scores, and recommended action.`,

  summary: `You are a news summarizer. Create concise, engaging summaries that capture key points.
Return JSON with executive summary, key takeaways, and meta description.`,
}

// ============================================
// SEO ANALYSIS
// ============================================

export async function analyzeSEO(params: {
  title: string
  content: string
  excerpt?: string
  slug?: string
  featuredImage?: string
  tags?: string[]
  category?: string
  authorName?: string
  targetKeywords?: string[]
}): Promise<SEOAnalysis> {
  if (!groqConfigured()) {
    throw new Error('Groq API key not configured')
  }

  const prompt = `Analyze this article for SEO and editorial quality:

TITLE: ${params.title}
EXCERPT: ${params.excerpt || 'N/A'}
SLUG: ${params.slug || 'N/A'}
CATEGORY: ${params.category || 'N/A'}
TAGS: ${params.tags?.join(', ') || 'N/A'}
TARGET KEYWORDS: ${params.targetKeywords?.join(', ') || 'Auto-detect'}

CONTENT:
${params.content}

Return JSON with this exact structure:
{
  "score": 0-100,
  "readability": { "flesch": 0-100, "grade": "string", "avgWordsPerSentence": number },
  "keywordAnalysis": {
    "primaryKeywords": [{ "keyword": "string", "density": number, "positions": [number] }],
    "secondaryKeywords": ["string"],
    "missingKeywords": ["string"],
    "keywordGaps": ["string"]
  },
  "contentQuality": {
    "score": 0-100,
    "grade": "A+"|"A"|"B+"|"B"|"C"|"D",
    "strengths": ["string"],
    "weaknesses": ["string"]
  },
  "structureAnalysis": {
    "headingScore": 0-100,
    "paragraphScore": 0-100,
    "internalLinks": number,
    "externalLinks": number,
    "imageAltCoverage": 0-100
  },
  "recommendations": [{
    "priority": "critical"|"high"|"medium"|"low",
    "category": "keywords"|"structure"|"readability"|"technical"|"content",
    "issue": "string",
    "suggestion": "string",
    "autoFixable": boolean
  }],
  "optimizedContent": {
    "title": "string",
    "metaDescription": "string",
    "slug": "string",
    "content": "string",
    "schemaMarkup": "string"
  }
}`

  return groqChatJSON<SEOAnalysis>([
    { role: 'system', content: SYSTEM_PROMPTS.seo },
    { role: 'user', content: prompt }
  ], { model: 'balanced', temperature: 0.1, responseFormat: 'json_object' })
}

// ============================================
// CONTENT ENHANCEMENT
// ============================================

export async function enhanceContent(params: {
  content: string
  title: string
  targetAudience?: string
  tone?: 'professional' | 'conversational' | 'authoritative' | 'engaging'
  preserveFacts?: boolean
  enhanceFor?: 'seo' | 'readability' | 'engagement' | 'all'
}): Promise<ContentEnhancement> {
  if (!groqConfigured()) throw new Error('Groq API key not configured')

  const prompt = `Enhance this article content:

TITLE: ${params.title}
TARGET AUDIENCE: ${params.targetAudience || 'General Kenyan news readers'}
TONE: ${params.tone || 'engaging'}
ENHANCE FOR: ${params.enhanceFor || 'all'}
PRESERVE FACTS: ${params.preserveFacts !== false}

ORIGINAL CONTENT:
${params.content}

Return JSON with this exact structure:
{
  "enhancedContent": "string (full enhanced HTML content)",
  "changes": [{
    "type": "grammar"|"style"|"clarity"|"flow"|"seo"|"tone",
    "original": "string",
    "improved": "string",
    "reason": "string"
  }],
  "summary": "string (2-3 sentences describing main improvements)",
  "readabilityImprovement": number (0-100),
  "seoImprovement": number (0-100)
}

Rules:
- Preserve ALL facts, names, numbers, quotes exactly
- Improve flow, clarity, engagement
- Add subheadings if missing
- Optimize for SEO naturally
- Keep author's voice
- Return ONLY the JSON`

  return groqChatJSON<ContentEnhancement>([
    { role: 'system', content: SYSTEM_PROMPTS.enhance },
    { role: 'user', content: prompt }
  ], { model: 'balanced', temperature: 0.3, responseFormat: 'json_object' })
}

// ============================================
// GRAMMAR & STYLE CHECK
// ============================================

export async function checkGrammarStyle(params: {
  content: string
  checkTypes?: ('grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity' | 'consistency')[]
}): Promise<GrammarStyleCheck> {
  if (!groqConfigured()) throw new Error('Groq API key not configured')

  const prompt = `Check this content for grammar, spelling, punctuation, style, and clarity issues:

${params.content}

Return JSON with this exact structure:
{
  "score": 0-100,
  "issues": [{
    "type": "grammar"|"spelling"|"punctuation"|"style"|"clarity"|"consistency",
    "severity": "error"|"warning"|"suggestion",
    "message": "string",
    "suggestion": "string",
    "position": { "start": number, "end": number },
    "context": "string"
  }],
  "readability": {
    "flesch": 0-100,
    "grade": "string",
    "avgWordsPerSentence": number,
    "avgSyllablesPerWord": number
  },
  "styleMetrics": {
    "passiveVoicePercent": number,
    "complexWordsPercent": number,
    "sentenceVariety": number
  }
}`

  return groqChatJSON<GrammarStyleCheck>([
    { role: 'system', content: SYSTEM_PROMPTS.grammar },
    { role: 'user', content: prompt }
  ], { model: 'balanced', temperature: 0.1, responseFormat: 'json_object' })
}

// ============================================
// CONTENT MODERATION
// ============================================

export async function moderateContent(params: {
  content: string
  contentType: 'comment' | 'article' | 'message' | 'user-generated'
  authorId?: number
}): Promise<ModerationResult> {
  if (!groqConfigured()) {
    return { flagged: false, categories: [], action: 'allow' }
  }

  const prompt = `Moderate this ${params.contentType} for policy violations:

${params.content}

Check for: hate speech, harassment, violence, sexual content, self-harm, spam, misinformation, illegal activities, PII.

Return JSON:
{
  "flagged": boolean,
  "categories": [{
    "category": "hate|harassment|violence|sexual|self-harm|spam|misinformation|illegal|pii",
    "score": 0-1,
    "flagged": boolean
  }],
  "action": "allow"|"review"|"reject",
  "reason": "string"
}`

  return groqChatJSON<ModerationResult>([
    { role: 'system', content: SYSTEM_PROMPTS.moderation },
    { role: 'user', content: prompt }
  ], { model: 'fast', temperature: 0, responseFormat: 'json_object' })
}

// ============================================
// CONTENT SUMMARY
// ============================================

export async function generateSummary(params: {
  content: string
  title: string
  maxLength?: number
  style?: 'news' | 'bullet' | 'social' | 'email'
}): Promise<{
  executiveSummary: string
  keyTakeaways: string[]
  metaDescription: string
  socialSnippet: string
  readingTime: number
}> {
  if (!groqConfigured()) throw new Error('Groq API key not configured')

  const prompt = `Create a summary for this article:

TITLE: ${params.title}
CONTENT: ${params.content}
MAX LENGTH: ${params.maxLength || 150} words
STYLE: ${params.style || 'news'}

Return JSON:
{
  "executiveSummary": "string (2-3 paragraphs)",
  "keyTakeaways": ["string"],
  "metaDescription": "string (150-160 chars)",
  "socialSnippet": "string (280 chars max)",
  "readingTime": number (minutes)
}`

  return groqChatJSON<{
    executiveSummary: string
    keyTakeaways: string[]
    metaDescription: string
    socialSnippet: string
    readingTime: number
  }>([
    { role: 'system', content: SYSTEM_PROMPTS.summary },
    { role: 'user', content: prompt }
  ], { model: 'balanced', temperature: 0.3, responseFormat: 'json_object' })
}

// ============================================
// QUICK ANALYSIS (for real-time feedback)
// ============================================

export async function quickSEOCheck(params: {
  title: string
  content: string
}): Promise<{
  score: number
  quickWins: string[]
  criticalIssues: string[]
}> {
  if (!groqConfigured()) throw new Error('Groq API key not configured')

  const prompt = `Quick SEO check for this article:

TITLE: ${params.title}
CONTENT (first 1000 chars): ${params.content.slice(0, 1000)}

Return JSON:
{
  "score": 0-100,
  "quickWins": ["string"],
  "criticalIssues": ["string"]
}`

  return groqChatJSON<{
    score: number
    quickWins: string[]
    criticalIssues: string[]
  }>([
    { role: 'system', content: 'Quick SEO auditor. Be concise.' },
    { role: 'user', content: prompt }
  ], { model: 'fast', temperature: 0, responseFormat: 'json_object' })
}