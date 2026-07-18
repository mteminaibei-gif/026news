/**
 * AI article enhancement engine for 026news.
 *
 * Provides:
 *  - analyzeArticle(): grammar / style / cohesion analysis with a quality score
 *    and concrete, localized suggestions.
 *  - rewriteArticle(): produce an improved HTML version (paraphrase + restructure +
 *    cohesion fix) in the publication's house style.
 *
 * Both functions pull a few top-performing published articles as style exemplars
 * ("learn from the feed") and inject them as few-shot context so the model mimics
 * the editorial voice of 026news rather than generic web copy.
 *
 * No SDK dependency — talks to OpenAI via lib/ai/provider.ts (fetch).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { chatCompletion, type ChatMessage } from './provider'

export type EnhanceMode = 'grammar' | 'style' | 'cohesion' | 'paraphrase' | 'full'

export interface Suggestion {
  type: 'error' | 'warning' | 'info' | 'success'
  category: 'grammar' | 'style' | 'cohesion' | 'structure'
  message: string
  suggestion: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** Optional excerpt of the offending text, for in-editor highlighting. */
  excerpt?: string
}

export interface ArticleAnalysis {
  score: number // 0-100 editorial quality score
  readability: { flesch: number; grade: string; avgWordsPerSentence: number }
  summary: string
  suggestions: Suggestion[]
}

export interface RewriteResult {
  html: string
  summary: string
  changes: string[]
}

const SYSTEM_PROMPT = `You are the senior editorial AI for 026news, a digital news outlet.
Your job is to help journalists write clear, correct, cohesive, and engaging news copy
in the publication's house style: concise sentences, active voice, factual tone,
short paragraphs, descriptive subheadings, and a confident Kenyan/pan-African news voice.

You always respond with valid JSON only.`

function buildFewShot(exemplars: { title: string; excerpt: string }[]): string {
  if (!exemplars.length) return ''
  const blocks = exemplars
    .map((e, i) => `Example ${i + 1} — "${e.title}"\n${e.excerpt}`)
    .join('\n\n')
  return `\n\nHOUSE STYLE EXEMPLARS (use these as tone/voice references):\n${blocks}`
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getFeedExemplars(limit = 4): Promise<{ title: string; excerpt: string }[]> {
  try {
    const supabase = await createAdminClient()
    const { data } = await supabase
      .from('articles')
      .select('title, excerpt, views')
      .eq('status', 'published')
      .not('excerpt', 'is', null)
      .order('views', { ascending: false })
      .limit(limit)
    return (data ?? [])
      .map((a: { title: string; excerpt: string | null }) => ({
        title: a.title,
        excerpt: stripHtml(a.excerpt ?? '').slice(0, 280),
      }))
      .filter((a) => a.excerpt.length > 40)
  } catch {
    return []
  }
}

const MODE_INSTRUCTIONS: Record<EnhanceMode, string> = {
  grammar:
    'Focus on grammar, spelling, punctuation and factual phrasing errors. Fix without changing meaning.',
  style:
    'Focus on word choice, clarity, voice, concision and engagement. Tighten weak phrasing.',
  cohesion:
    'Focus on flow, transitions, logical ordering and paragraph structure so the piece reads as one cohesive whole.',
  paraphrase:
    'Rewrite the piece preserving all facts and meaning but with fresh phrasing and structure.',
  full:
    'Improve grammar, style, cohesion and structure together, paraphrasing where it helps. Preserve all facts.',
}

export async function analyzeArticle(params: {
  title: string
  content: string
  mode?: EnhanceMode
}): Promise<ArticleAnalysis> {
  const { title, content, mode = 'full' } = params
  const plain = stripHtml(content)
  if (plain.length < 40) {
    return {
      score: 0,
      readability: { flesch: 0, grade: '—', avgWordsPerSentence: 0 },
      summary: 'Article is too short to analyze.',
      suggestions: [],
    }
  }

  const exemplars = await getFeedExemplars()
  const fewShot = buildFewShot(exemplars)

  const userMsg = `Analyze this news article for ${mode} quality.
Return JSON of shape:
{
  "score": number (0-100 editorial quality),
  "readability": { "flesch": number, "grade": string, "avgWordsPerSentence": number },
  "summary": string (2-3 sentence editorial assessment),
  "suggestions": [ { "type": "error"|"warning"|"info"|"success", "category": "grammar"|"style"|"cohesion"|"structure", "message": string, "suggestion": string, "priority": "critical"|"high"|"medium"|"low", "excerpt"?: string } ]
}

Title: ${title}

Body:
${plain.slice(0, 6000)}${fewShot}`

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMsg },
  ]

  const raw = await chatCompletion(messages, {
    temperature: 0.2,
    maxTokens: 1600,
    responseFormat: 'json_object',
  })
  return sanitizeAnalysis(raw, plain)
}

export async function rewriteArticle(params: {
  title: string
  content: string
  mode?: EnhanceMode
  preserveHtml?: boolean
}): Promise<RewriteResult> {
  const { title, content, mode = 'full', preserveHtml = true } = params
  const exemplars = await getFeedExemplars()
  const fewShot = buildFewShot(exemplars)

  const structureNote = preserveHtml
    ? 'Preserve the original HTML structure (headings <h2>/<h3>, <p>, <blockquote>, <ul>/<ol>, <img>, <a>). Do NOT wrap in markdown code fences. Return only the improved HTML.'
    : 'Return plain improved text.'

  const userMsg = `Improve the following article for: ${MODE_INSTRUCTIONS[mode]}.
${structureNote}
Keep all facts, names, figures and quotes accurate. Maintain the 026news house voice.
After the HTML, on a new line, write a delimiter "===CHANGES===" then a bullet list of the most important changes you made.

Title: ${title}

Body HTML:
${content.slice(0, 12000)}${fewShot}`

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMsg },
  ]

  const raw = await chatCompletion(messages, {
    temperature: 0.4,
    maxTokens: 4000,
  })
  return parseRewrite(raw)
}

function sanitizeAnalysis(raw: string, fallbackPlain: string): ArticleAnalysis {
  try {
    const json = JSON.parse(raw) as Partial<ArticleAnalysis>
    return {
      score: clamp(Number(json.score) || 0, 0, 100),
      readability: {
        flesch: Number(json.readability?.flesch) || 0,
        grade: json.readability?.grade || '—',
        avgWordsPerSentence: Number(json.readability?.avgWordsPerSentence) || 0,
      },
      summary: json.summary || 'Analysis complete.',
      suggestions: Array.isArray(json.suggestions) ? json.suggestions.slice(0, 25) : [],
    }
  } catch {
    return {
      score: 0,
      readability: { flesch: 0, grade: '—', avgWordsPerSentence: 0 },
      summary: 'Could not parse analysis.',
      suggestions: [],
    }
  }
}

function parseRewrite(raw: string): RewriteResult {
  const idx = raw.indexOf('===CHANGES===')
  if (idx === -1) {
    return { html: raw.trim(), summary: '', changes: [] }
  }
  const html = raw.slice(0, idx).trim().replace(/^```(?:html)?/i, '').replace(/```$/i, '').trim()
  const changesText = raw.slice(idx + '===CHANGES==='.length)
  const changes = changesText
    .split('\n')
    .map((l) => l.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
  return { html, summary: '', changes }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
