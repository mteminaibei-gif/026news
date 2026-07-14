/**
 * News vs Article Classification Algorithm
 *
 * Analyzes title, content, source, and word count to determine
 * if a post is short-form "news" or long-form "article".
 *
 * News: brief updates, breaking stories, factual reporting (< 500 words typical)
 * Article: in-depth analysis, opinion, features, investigative pieces (> 500 words)
 */

export type PostType = 'news' | 'article'

// ── Source-based signals ────────────────────────────────────────
// News-agency wire patterns vs long-form publication patterns
const NEWS_SOURCE_PATTERNS: RegExp[] = [
  /reuters/i,
  /associated press/i,
  /\bap news\b/i,
  /\bbc news\b/i,
  /breaking/i,
  /wire\b/i,
  /flash\b/i,
  /alert/i,
  /headline/i,
  /bulletin/i,
  /brief/i,
  /update\b/i,
  /developing/i,
]

const ARTICLE_SOURCE_PATTERNS: RegExp[] = [
  /opinion/i,
  /editorial/i,
  /analysis/i,
  /commentary/i,
  /feature/i,
  /investigation/i,
  /longread/i,
  /long.?read/i,
  /deep.?dive/i,
  /profile/i,
  /essay/i,
  /magazine/i,
]

// ── Title-based signals ─────────────────────────────────────────
const NEWS_TITLE_PATTERNS: RegExp[] = [
  // Breaking/urgent markers
  /\bbreaking\b/i,
  /\bjust.?in\b/i,
  /\bupdate\b/i,
  /\bdeveloping\b/i,
  /\bflash\b/i,
  /\burgent\b/i,
  /\balert\b/i,
  // Factual reporting patterns
  /\bsays?\b/i,
  /\bconfirms?\b/i,
  /\bannounces?\b/i,
  /\breport(s|ed|ing)\b/i,
  /\breveals?\b/i,
  // Time-sensitive
  /\btoday\b/i,
  /\bbreaking news\b/i,
  /\bright now\b/i,
  /\bthis (morning|afternoon|evening)\b/i,
  // Numbers/data in headlines (typical of news)
  /^\d+/,
  /\$\d/,
  /\d+%/,
  /ksh\b/i,
]

const ARTICLE_TITLE_PATTERNS: RegExp[] = [
  // Analytical framing
  /\bwhy\b/i,
  /\bhow\b/i,
  /\bwhat\b/i,
  /\bthe (future|rise|fall|truth|case|problem|cost|hidden|untold)\b/i,
  /\binside\b/i,
  /\bbeyond\b/i,
  /\bthe (real|secret|hidden|untold|true)\b/i,
  // Opinion/analysis markers
  /\bopinion\b/i,
  /\banalysis\b/i,
  /\bperspective\b/i,
  /\bcommentary\b/i,
  /\beditorial\b/i,
  // Feature story patterns
  /\bjourney\b/i,
  /\bstory of\b/i,
  /\bin.?depth\b/i,
  /\bprofile:?\b/i,
  // Question headlines (often articles)
  /\?$/
]

// ── Content-based signals ───────────────────────────────────────
const NEWS_CONTENT_PATTERNS: RegExp[] = [
  // Journalistic inverted pyramid (who, what, when, where)
  /\b(according to|officials? (said|stated|confirmed)|sources? (said|told|confirmed))\b/i,
  // Time references
  /\b(on (monday|tuesday|wednesday|thursday|friday|saturday|sunday)|earlier today|yesterday|this week)\b/i,
  // Attribution patterns
  /\b(told reporters?|in a (statement|press conference)|spokesperson)\b/i,
  // Short factual structure
  /\b(was (arrested|killed|injured|elected|appointed|fired|resigned))\b/i,
]

const ARTICLE_CONTENT_PATTERNS: RegExp[] = [
  // Analytical/long-form markers
  /\b(this is (the |a )?story|the question is|the problem is|the truth is)\b/i,
  /\b(in an (interview|exclusive)|sitting down|spoke at length)\b/i,
  // Substantive analysis
  /\b(investigation|analysis|feature|profile|essay|opinion|editorial)\b/i,
  // Multiple perspectives
  /\b(on the one hand|critics? (argue|say|believe|contend)|proponents? (argue|say|believe))\b/i,
  // Historical context
  /\b(historically|over the (past|last|decades?)|in recent years|since \d{4})\b/i,
  // Data-heavy analysis
  /\b(according to (data|research|studies|a (study|report)))\b/i,
]

// ── Public API ──────────────────────────────────────────────────

export interface ClassificationInput {
  title: string
  content: string
  sourceUrl?: string | null
  sourceName?: string | null
  feedCategoryId?: number | null
}

export interface ClassificationResult {
  postType: PostType
  confidence: number // 0-1
  signals: string[]  // what contributed to the decision
}

/**
 * Classifies a post as 'news' or 'article' based on multiple signals.
 */
export function classifyPost(input: ClassificationInput): ClassificationResult {
  const { title, content, sourceUrl, sourceName } = input
  let newsScore = 0
  let articleScore = 0
  const signals: string[] = []

  // 1. Word count (strongest signal)
  const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  if (wordCount < 300) {
    newsScore += 3
    signals.push(`short content (${wordCount} words)`)
  } else if (wordCount < 600) {
    newsScore += 1
    articleScore += 1
    signals.push(`medium content (${wordCount} words)`)
  } else if (wordCount < 1200) {
    articleScore += 2
    signals.push(`long content (${wordCount} words)`)
  } else {
    articleScore += 4
    signals.push(`very long content (${wordCount} words)`)
  }

  // 2. Source name patterns
  if (sourceName) {
    for (const pattern of NEWS_SOURCE_PATTERNS) {
      if (pattern.test(sourceName)) {
        newsScore += 2
        signals.push(`news source: ${sourceName}`)
        break
      }
    }
    for (const pattern of ARTICLE_SOURCE_PATTERNS) {
      if (pattern.test(sourceName)) {
        articleScore += 2
        signals.push(`article source: ${sourceName}`)
        break
      }
    }
  }

  // 3. Source URL patterns
  if (sourceUrl) {
    const url = sourceUrl.toLowerCase()
    if (url.includes('/opinion/') || url.includes('/analysis/') || url.includes('/feature/')) {
      articleScore += 2
      signals.push('article URL pattern')
    }
    if (url.includes('/news/') || url.includes('/breaking/') || url.includes('/latest/')) {
      newsScore += 1
      signals.push('news URL pattern')
    }
  }

  // 4. Title patterns
  let newsTitleHits = 0
  for (const pattern of NEWS_TITLE_PATTERNS) {
    if (pattern.test(title)) newsTitleHits++
  }
  if (newsTitleHits >= 2) {
    newsScore += 2
    signals.push(`news-style title (${newsTitleHits} matches)`)
  } else if (newsTitleHits === 1) {
    newsScore += 1
  }

  let articleTitleHits = 0
  for (const pattern of ARTICLE_TITLE_PATTERNS) {
    if (pattern.test(title)) articleTitleHits++
  }
  if (articleTitleHits >= 2) {
    articleScore += 2
    signals.push(`article-style title (${articleTitleHits} matches)`)
  } else if (articleTitleHits === 1) {
    articleScore += 1
  }

  // 5. Content patterns
  let newsContentHits = 0
  for (const pattern of NEWS_CONTENT_PATTERNS) {
    if (pattern.test(content)) newsContentHits++
  }
  if (newsContentHits >= 2) {
    newsScore += 2
    signals.push(`news-style content (${newsContentHits} matches)`)
  }

  let articleContentHits = 0
  for (const pattern of ARTICLE_CONTENT_PATTERNS) {
    if (pattern.test(content)) articleContentHits++
  }
  if (articleContentHits >= 2) {
    articleScore += 2
    signals.push(`article-style content (${articleContentHits} matches)`)
  }

  // 6. Paragraph density (news = fewer paragraphs, articles = more)
  const paragraphs = content.replace(/<[^>]+>/g, '').split(/\n\n+/).filter(p => p.trim().length > 20)
  if (paragraphs.length <= 3) {
    newsScore += 1
    signals.push('few paragraphs (news structure)')
  } else if (paragraphs.length >= 8) {
    articleScore += 1
    signals.push('many paragraphs (article structure)')
  }

  // 7. Quote density (articles tend to have more quotes)
  const quoteMatches = content.match(/[""][^""]+[""]/g) ?? []
  if (quoteMatches.length >= 3) {
    articleScore += 1
    signals.push(`multiple quotes (${quoteMatches.length})`)
  }

  // Decision
  const total = newsScore + articleScore
  const confidence = total > 0 ? Math.abs(newsScore - articleScore) / total : 0.5

  const postType: PostType = newsScore > articleScore ? 'news' : 'article'

  return { postType, confidence, signals }
}

/**
 * Quick classification for batch processing (lighter, faster).
 */
export function quickClassify(title: string, content: string, wordCount: number): PostType {
  if (wordCount < 300) return 'news'
  if (wordCount > 800) return 'article'

  let score = 0
  if (/\b(breaking|just.?in|update|developing|says?|confirms?|announces?)\b/i.test(title)) score += 2
  if (/\b(why|how|the (future|rise|truth|case)|inside|beyond|analysis|opinion)\b/i.test(title)) score -= 2
  if (/\b(according to|officials? said|sources? told|reporters?)\b/i.test(content)) score += 1
  if (/\b(this is the story|the question is|investigation|analysis|feature)\b/i.test(content)) score -= 1

  return score >= 0 ? 'news' : 'article'
}
