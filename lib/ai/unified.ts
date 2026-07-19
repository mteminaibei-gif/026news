/**
 * Unified AI Service - Groq-powered
 * Consolidates: SEO analysis, Content enhancement, Grammar/Style check, Content moderation
 */

import { groqChat, groqChatJSON, groqConfigured } from './groq'

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
  allowed: boolean
  flagged: boolean
  scores: {
    TOXICITY?: number
    SEVERE_TOXICITY?: number
    IDENTITY_ATTACK?: number
    THREAT?: number
    INSULT?: number
    PROFANITY?: number
  }
  flaggedCategories: string[]
  recommendedAction: 'allow' | 'review' | 'reject'
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPTS = {
  seo: `You are an expert SEO analyst for 026news, a Kenyan digital news platform.
Analyze articles for SEO optimization targeting Kenyan and African audiences.
Return ONLY valid JSON matching the exact schema provided.`,

  contentEnhancement: `You are a senior editor at 026news, a Kenyan digital news platform.
Improve article content for clarity, flow, engagement, and SEO.
Preserve the original meaning, facts, and voice.
Return ONLY valid JSON matching the exact schema provided.`,

  grammar: `You are a professional copy editor for 026news.
Check grammar, spelling, punctuation, style, and readability.
Follow AP style with Kenyan English conventions.
Return ONLY valid JSON matching the exact schema provided.`,

  moderation: `You are a content moderator for 026news.
Analyze text for toxicity, hate speech, harassment, threats, and policy violations.
Return ONLY valid JSON matching the exact schema provided.`,
}

// ============================================
// SEO ANALYSIS
// ============================================

const SEO_ANALYSIS_SCHEMA = {
  score: 'number (0-100)',
  readability: {
    flesch: 'number',
    grade: 'string',
    avgWordsPerSentence: 'number',
  },
  keywordAnalysis: {
    primaryKeywords: [{ keyword: 'string', density: 'number', positions: ['number'] }],
    secondaryKeywords: ['string'],
    missingKeywords: ['string'],
    keywordGaps: ['string'],
  },
  contentQuality: {
    score: 'number',
    grade: "'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'",
    strengths: ['string'],
    weaknesses: ['string'],
  },
  structureAnalysis: {
    headingScore: 'number',
    paragraphScore: 'number',
    internalLinks: 'number',
    externalLinks: 'number',
    imageAltCoverage: 'number',
  },
  recommendations: [{
    priority: "'critical' | 'high' | 'medium' | 'low'",
    category: "'keywords' | 'structure' | 'readability' | 'technical' | 'content'",
    issue: 'string',
    suggestion: 'string',
    autoFixable: 'boolean',
  }],
  optimizedContent: {
    title: 'string',
    metaDescription: 'string',
    slug: 'string',
    content: 'string',
    schemaMarkup: 'string',
  },
}

export async function analyzeSEO(params: {
  title: string
  content: string
  excerpt?: string
  slug?: string
  keywords?: string[]
  category?: string
}): Promise<SEOAnalysis> {
  if (!groqConfigured()) {
    throw new Error('Groq API not configured')
  }

  const prompt = `Analyze this news article for SEO optimization targeting Kenyan/African audiences.

Article:
Title: ${params.title}
Excerpt: ${params.excerpt || 'N/A'}
Category: ${params.category || 'General'}
Keywords: ${params.keywords?.join(', ') || 'Auto-detect'}
Slug: ${params.slug || 'Auto-generate'}

Content:
${params.content.slice(0, 6000)}

Return JSON matching this schema exactly:
${JSON.stringify(SEO_ANALYSIS_SCHEMA, null, 2)}`

  const result = await groqChatJSON<SEOAnalysis>([
    { role: 'system', content: SYSTEM_PROMPTS.seo },
    { role: 'user', content: prompt },
  ], { temperature: 0.1, maxTokens: 4096 })

  // Ensure all required fields exist with defaults
  return {
    score: result.score ?? 0,
    readability: result.readability ?? { flesch: 0, grade: '—', avgWordsPerSentence: 0 },
    keywordAnalysis: result.keywordAnalysis ?? { primaryKeywords: [], secondaryKeywords: [], missingKeywords: [], keywordGaps: [] },
    contentQuality: result.contentQuality ?? { score: 0, grade: 'D', strengths: [], weaknesses: [] },
    structureAnalysis: result.structureAnalysis ?? { headingScore: 0, paragraphScore: 0, internalLinks: 0, externalLinks: 0, imageAltCoverage: 0 },
    recommendations: result.recommendations ?? [],
    optimizedContent: result.optimizedContent,
  }
}

// ============================================
// CONTENT ENHANCEMENT
// ============================================

const ENHANCEMENT_SCHEMA = {
  enhancedContent: 'string',
  changes: [{
    type: "'grammar' | 'style' | 'clarity' | 'flow' | 'seo' | 'tone'",
    original: 'string',
    improved: 'string',
    reason: 'string',
  }],
  summary: 'string',
  readabilityImprovement: 'number',
  seoImprovement: 'number',
}

export async function enhanceContent(params: {
  title: string
  content: string
  mode?: 'grammar' | 'style' | 'cohesion' | 'paraphrase' | 'full'
  category?: string
  targetAudience?: string
}): Promise<ContentEnhancement> {
  if (!groqConfigured()) {
    throw new Error('Groq API not configured')
  }

  const mode = params.mode ?? 'full'
  const modeInstructions = {
    grammar: 'Fix grammar, spelling, and punctuation only. Preserve exact meaning.',
    style: 'Improve style, word choice, and voice. Make it more engaging.',
    cohesion: 'Improve flow, transitions, and logical structure.',
    paraphrase: 'Rewrite with fresh phrasing while preserving all facts and meaning.',
    full: 'Comprehensive enhancement: grammar, style, flow, clarity, and SEO optimization.',
  }

  const prompt = `Enhance this news article for 026news (Kenyan digital news).

Mode: ${mode} - ${modeInstructions[mode]}
Category: ${params.category || 'General'}
Target Audience: Kenyan/African readers

Title: ${params.title}

Content:
${params.content}

Return JSON:
{
  "enhancedContent": "string (full improved HTML content)",
  "changes": [
    {"type": "grammar|style|clarity|flow|seo|tone", "original": "string", "improved": "string", "reason": "string"}
  ],
  "summary": "string (2-3 sentences summarizing improvements)",
  "readabilityImprovement": "number (0-100)",
  "seoImprovement": "number (0-100)"
}

Preserve all facts, quotes, names, and statistics exactly. Maintain the article's authoritative news tone.`

  const result = await groqChatJSON<ContentEnhancement>([
    { role: 'system', content: SYSTEM_PROMPTS.contentEnhancement },
    { role: 'user', content: prompt },
  ], { temperature: 0.3, maxTokens: 6000 })

  return result
}

// ============================================
// GRAMMAR & STYLE CHECK
// ============================================

const GRAMMAR_SCHEMA = {
  score: 'number (0-100)',
  issues: [{
    type: "'grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity' | 'consistency'",
    severity: "'error' | 'warning' | 'suggestion'",
    message: 'string',
    suggestion: 'string',
    position: { start: 'number', end: 'number' },
    context: 'string',
  }],
  readability: {
    flesch: 'number',
    grade: 'string',
    avgWordsPerSentence: 'number',
    avgSyllablesPerWord: 'number',
  },
  styleMetrics: {
    passiveVoicePercent: 'number',
    complexWordsPercent: 'number',
    sentenceVariety: 'number',
  },
}

export async function checkGrammarStyle(params: {
  content: string
  mode?: 'grammar' | 'style' | 'readability' | 'full'
}): Promise<GrammarStyleCheck> {
  if (!groqConfigured()) {
    throw new Error('Groq API not configured')
  }

  const mode = params.mode ?? 'full'

  const prompt = `Check this text for grammar, spelling, punctuation, style, and readability issues.

Mode: ${mode}
Content:
${params.content.slice(0, 8000)}

Return JSON matching this schema:
${JSON.stringify(GRAMMAR_SCHEMA, null, 2)}`

  const result = await groqChatJSON<GrammarStyleCheck>([
    { role: 'system', content: SYSTEM_PROMPTS.grammar },
    { role: 'user', content: prompt },
  ], { temperature: 0.1, maxTokens: 3000 })

  return result
}

// ============================================
// CONTENT MODERATION
// ============================================

const MODERATION_SCHEMA = {
  allowed: 'boolean',
  flagged: 'boolean',
  scores: {
    TOXICITY: 'number',
    SEVERE_TOXICITY: 'number',
    IDENTITY_ATTACK: 'number',
    THREAT: 'number',
    INSULT: 'number',
    PROFANITY: 'number',
  },
  flaggedCategories: ['string'],
  recommendedAction: "'allow' | 'review' | 'reject'",
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  if (!groqConfigured()) {
    return { allowed: true, flagged: false, scores: {}, flaggedCategories: [], recommendedAction: 'allow' }
  }

  const prompt = `Moderate this content for 026news, a Kenyan news platform.

Check for: hate speech, harassment, violence, threats, self-harm, sexual content, spam, misinformation, PII, and policy violations.

Text:
${text.slice(0, 10000)}

Return JSON:
{
  "allowed": boolean,
  "flagged": boolean,
  "scores": { "TOXICITY": number, "SEVERE_TOXICITY": number, "IDENTITY_ATTACK": number, "THREAT": number, "INSULT": number, "PROFANITY": number },
  "flaggedCategories": ["string"],
  "recommendedAction": "allow | review | reject"
}`

  const result = await groqChatJSON<ModerationResult>([
    { role: 'system', content: SYSTEM_PROMPTS.moderation },
    { role: 'user', content: prompt },
  ], { temperature: 0, maxTokens: 1000 })

  return result
}

// ============================================
// UTILITY
// ============================================

export function aiReady(): boolean {
  return groqConfigured()
}

export class GroqUnconfiguredError extends Error {
  constructor() {
    super('Groq API not configured')
    this.name = 'GroqUnconfiguredError'
  }
}

export function getAIStatus() {
  return {
    configured: groqConfigured(),
    provider: 'Groq',
    models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'llama-3.3-70b-versatile'],
  }
}