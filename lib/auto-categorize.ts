// ============================================================================
//  Intelligent auto-categorization
//
//  Improvements over the previous version:
//   • Term-frequency (TF) scoring instead of raw match counts — longer
//     articles no longer dominate just because they have more words.
//   • Dynamic taxonomy: categories can be supplied at runtime (from the DB)
//     instead of being hard-coded to IDs 80–91. A built-in default
//     taxonomy is used as a fallback when none is supplied.
//   • Title / excerpt / tag weighting (title hits matter most).
//   • Multi-category output: a primary category plus ranked secondary
//     categories, each with a confidence band.
//   • Novel-theme detection: when an article clearly belongs to a topic
//     that no existing category covers, the engine can auto-generate a
//     new category (name + slug + keywords) so future articles on the
//     same theme land in the right place.
//   • Graceful fallbacks (Trending Now / a supplied "default" category).
// ============================================================================

export interface CategorizationInput {
  title: string
  content: string
  excerpt?: string | null
  tags?: string[] | null
  sourceName?: string | null
  sourceReference?: string | null
  currentCategoryId?: number | null
}

export interface CategoryScore {
  categoryId: number
  name?: string
  slug?: string
  score: number
  confidence: 'high' | 'medium' | 'low'
  matchedTerms: string[]
}

export interface CategorizationResult {
  bestCategoryId: number
  scores: CategoryScore[]
  confidence: 'high' | 'medium' | 'low'
  matchedTerms: string[]
  /** Set when a brand-new category should be created for this article. */
  suggestedNewCategory?: { name: string; slug: string; keywords: string[]; sampleTerms: string[] }
}

// ── Keyword taxonomy ────────────────────────────────────────────────────────
// Each category: a list of { keywords, weight }. `weight` reflects how
// strongly a match points at that category. A keyword may be a plain word
// (matched as a whole word) or a phrase (matched literally).

export interface CategoryKeyword {
  keywords: string[]
  weight: number
}

export interface CategoryDef {
  id: number | 'NEW'
  name: string
  slug: string
  keywords: CategoryKeyword[]
}

const DEFAULT_TAXONOMY: CategoryDef[] = [
  {
    id: 80, name: 'World Updates', slug: 'world-updates',
    keywords: [
      { keywords: ['international', 'global', 'world', 'foreign', 'overseas'], weight: 10 },
      { keywords: ['united nations', 'un', 'nato', 'european union', 'european', 'brics'], weight: 9 },
      { keywords: ['war', 'conflict', 'ceasefire', 'refugee', 'humanitarian', 'sanction', 'sanctions'], weight: 8 },
      { keywords: ['trump', 'biden', 'putin', 'xi jinping', 'macron', 'zelensky', 'modi'], weight: 7 },
      { keywords: ['reuters', 'associated press', 'agence france-presse', 'bbc world'], weight: 6 },
      { keywords: ['diplomatic', 'diplomacy', 'embassy', 'treaty', 'summit', 'bilateral', 'multilateral'], weight: 5 },
    ],
  },
  {
    id: 81, name: 'Kenya Focus', slug: 'kenya-focus',
    keywords: [
      { keywords: ['kenya', 'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'meru'], weight: 10 },
      { keywords: ['kenyan', 'kenyans', 'kenyatta', 'ruto', 'raila', 'odinga', 'safaricom', 'mpesa', 'm-pesa', 'kra'], weight: 9 },
      { keywords: ['county', 'governor', 'national assembly', 'senate'], weight: 8 },
      { keywords: ['nysc', 'helb', 'nhif', 'ntsa', 'kdf', 'epra'], weight: 7 },
      { keywords: ['east africa', 'east african', 'eac'], weight: 4 },
    ],
  },
  {
    id: 82, name: 'Politics & Governance', slug: 'politics-governance',
    keywords: [
      { keywords: ['election', 'elections', 'voting', 'ballot', 'poll', 'polls', 'polling'], weight: 10 },
      { keywords: ['president', 'governor', 'senator', 'parliament', 'parliamentary', 'legislature', 'congress', 'assembly'], weight: 9 },
      { keywords: ['democrat', 'republican', 'political', 'politics', 'politician', 'partisan'], weight: 8 },
      { keywords: ['government', 'governments', 'minister', 'cabinet', 'opposition', 'coalition', 'party'], weight: 7 },
      { keywords: ['law', 'laws', 'bill', 'bills', 'legislation', 'impeach', 'referendum', 'constitution'], weight: 6 },
      { keywords: ['speaker', 'majority leader', 'minority leader', 'whip', 'caucus', 'floor'], weight: 5 },
    ],
  },
  {
    id: 83, name: 'Business & Economy', slug: 'business-economy',
    keywords: [
      { keywords: ['economic', 'economy', 'gdp', 'inflation', 'stock market', 'trading', 'investor', 'investors'], weight: 10 },
      { keywords: ['business', 'companies', 'company', 'corporate', 'corporation', 'startup', 'startups', 'entrepreneur', 'ventures'], weight: 9 },
      { keywords: ['revenue', 'profit', 'profits', 'earning', 'earnings', 'fiscal', 'budget', 'tax', 'taxes', 'tariff', 'tariffs'], weight: 8 },
      { keywords: ['bank', 'banking', 'finance', 'financial', 'insurance', 'credit', 'loan', 'debt', 'central bank'], weight: 7 },
      { keywords: ['market', 'markets', 'trade', 'export', 'exports', 'import', 'commodity', 'oil price'], weight: 6 },
      { keywords: ['ipo', 'shares', 'stock', 'bond', 'forex', 'currency', 'dollar', 'shilling', 'nse'], weight: 5 },
    ],
  },
  {
    id: 84, name: 'Tech & Innovation', slug: 'tech-innovation',
    keywords: [
      { keywords: ['artificial intelligence', 'machine learning', 'deep learning', 'chatgpt', 'openai', 'claude', 'gemini', 'grok'], weight: 10 },
      { keywords: ['tech', 'technology', 'technologies', 'software', 'hardware', 'unicorn', 'saas'], weight: 9 },
      { keywords: ['cybersecurity', 'hacking', 'hacker', 'data breach', 'privacy', 'encryption', 'malware', 'ransomware'], weight: 8 },
      { keywords: ['google', 'microsoft', 'amazon', 'meta', 'apple', 'tiktok', 'samsung', 'nvidia', 'tesla', 'spacex', 'xiaomi'], weight: 7 },
      { keywords: ['5g', 'internet', 'broadband', 'digital', 'blockchain', 'crypto', 'bitcoin', 'ethereum', 'web3'], weight: 6 },
      { keywords: ['robot', 'robots', 'autonomous', 'drone', 'drones', 'innovation', 'patent', 'silicon valley', 'app'], weight: 5 },
    ],
  },
  {
    id: 85, name: 'Health & Wellness', slug: 'health-wellness',
    keywords: [
      { keywords: ['health', 'medical', 'doctor', 'doctors', 'hospital', 'hospitals', 'clinic', 'patient', 'patients'], weight: 10 },
      { keywords: ['disease', 'diseases', 'virus', 'vaccine', 'vaccines', 'covid', 'pandemic', 'epidemic', 'outbreak', 'infection'], weight: 9 },
      { keywords: ['mental health', 'depression', 'anxiety', 'therapy', 'counseling', 'stress', 'burnout'], weight: 8 },
      { keywords: ['drug', 'drugs', 'medication', 'pharmaceutical', 'pharma', 'treatment', 'cure', 'diagnosis', 'surgery'], weight: 7 },
      { keywords: ['nutrition', 'diet', 'exercise', 'fitness', 'wellness', 'obesity', 'workout', 'yoga', 'meditation'], weight: 6 },
      { keywords: ['who', 'cdc', 'health ministry', 'public health', 'maternal'], weight: 5 },
    ],
  },
  {
    id: 86, name: 'Arts & Culture', slug: 'arts-culture',
    keywords: [
      { keywords: ['film', 'films', 'movie', 'movies', 'cinema', 'hollywood', 'bollywood', 'netflix', 'disney'], weight: 10 },
      { keywords: ['music', 'song', 'songs', 'album', 'albums', 'concert', 'concerts', 'grammy', 'billboard'], weight: 9 },
      { keywords: ['celebrity', 'celebrities', 'actor', 'actress', 'singer', 'rapper', 'artiste'], weight: 8 },
      { keywords: ['tv show', 'series', 'episode', 'streaming', 'reality tv', 'award', 'awards', 'oscar'], weight: 7 },
      { keywords: ['arts', 'culture', 'cultural', 'tradition', 'traditions', 'literature', 'poetry', 'theatre', 'theater'], weight: 6 },
      { keywords: ['festival', 'carnival', 'exhibition', 'museum', 'gallery', 'dance', 'choreograph'], weight: 5 },
    ],
  },
  {
    id: 87, name: 'Sports Arena', slug: 'sports-arena',
    keywords: [
      { keywords: ['football', 'soccer', 'premier league', 'champions league', 'world cup', 'fifa', 'uefa', 'la liga'], weight: 10 },
      { keywords: ['basketball', 'nba', 'rugby', 'cricket', 'tennis', 'golf', 'f1', 'formula 1', 'boxing', 'mma', 'ufc'], weight: 9 },
      { keywords: ['athletics', 'athlete', 'athletes', 'marathon', 'olympics', 'olympic', 'sport', 'sports', 'player', 'team'], weight: 8 },
      { keywords: ['match', 'game', 'score', 'goal', 'won', 'defeated', 'victory', 'champion', 'trophy', 'league'], weight: 7 },
      { keywords: ['coach', 'manager', 'transfer', 'transfers', 'signing', 'stadium', 'tournament', 'qualifier'], weight: 6 },
    ],
  },
  {
    id: 88, name: 'Opinion & Analysis', slug: 'opinion-analysis',
    keywords: [
      { keywords: ['opinion', 'editorial', 'commentary', 'analysis', 'perspective', 'viewpoint', 'op-ed'], weight: 10 },
      { keywords: ['column', 'debate', 'discussion', 'argue', 'critique', 'review', 'comment'], weight: 8 },
      { keywords: ['we argue', 'in our view', 'the case for', 'the case against', 'why should'], weight: 6 },
    ],
  },
  {
    id: 89, name: 'Trending Now', slug: 'trending-now',
    keywords: [
      { keywords: ['viral', 'trending', 'meme', 'memes', 'viral video', 'blow up', 'blowing up', 'broke the internet'], weight: 10 },
      { keywords: ['instagram', 'youtube', 'twitter', 'x.com', 'snapchat', 'reddit'], weight: 8 },
      { keywords: ['social media', 'online', 'cyber', 'hashtag', 'challenge', 'dance challenge', 'prank'], weight: 7 },
      { keywords: ['celebrity', 'celeb', 'influencer', 'content creator', 'vlogger', 'streamer'], weight: 6 },
    ],
  },
  {
    id: 90, name: 'Features & Profiles', slug: 'features-profiles',
    keywords: [
      { keywords: ['profile', 'interview', 'biography', 'life story', 'inspirational', 'journey'], weight: 10 },
      { keywords: ['in depth', 'in-depth', 'long read', 'long-read', 'feature', 'features', 'exclusive', 'special report'], weight: 9 },
      { keywords: ['pioneer', 'trailblazer', 'visionary', 'leader', 'icon', 'legend'], weight: 8 },
      { keywords: ['human interest', 'community', 'grassroots', 'local hero', 'rags to riches', 'overcoming'], weight: 7 },
    ],
  },
  {
    id: 91, name: 'Environment & Climate', slug: 'environment-climate',
    keywords: [
      { keywords: ['environment', 'environmental', 'ecology', 'biodiversity', 'deforestation', 'conservation'], weight: 10 },
      { keywords: ['climate change', 'global warming', 'carbon', 'emission', 'emissions', 'renewable', 'sustainability', 'sustainable'], weight: 9 },
      { keywords: ['pollution', 'plastic', 'ocean', 'forest', 'forests', 'wildlife', 'endangered', 'coral reef'], weight: 8 },
      { keywords: ['solar', 'wind energy', 'geothermal', 'hydro', 'clean energy', 'green', 'net zero', 'carbon neutral'], weight: 7 },
      { keywords: ['drought', 'flood', 'floods', 'wildfire', 'heatwave', 'weather', 'storm', 'cyclone'], weight: 6 },
    ],
  },
]

export const CATEGORY_NAMES: Record<number, string> = Object.fromEntries(
  DEFAULT_TAXONOMY.map(c => [c.id, c.name])
)

// ── Novel-theme detection lexicon ────────────────────────────────────────────
// Used only when an article is clearly topical but NO existing category
// scores high. Each entry is "topic → seed keywords". If a cluster of
// related terms dominates the text we can mint a new category.

const NOVEL_TOPICS: { name: string; slug: string; keywords: string[] }[] = [
  { name: 'Education', slug: 'education', keywords: ['education', 'school', 'university', 'students', 'teachers', 'curriculum', 'exam', 'learning', 'scholarship', 'lecturer', 'professor', 'classroom'] },
  { name: 'Crime & Justice', slug: 'crime-justice', keywords: ['crime', 'police', 'arrest', 'murder', 'theft', 'robbery', 'fraud', 'court', 'trial', 'jailed', 'sentenced', 'investigation', 'detective', 'homicide'] },
  { name: 'Science', slug: 'science', keywords: ['scientist', 'research', 'study', 'physics', 'chemistry', 'biology', 'space', 'nasa', 'astronomy', 'genes', 'quantum', 'laboratory', 'discovery'] },
  { name: 'Travel & Tourism', slug: 'travel-tourism', keywords: ['travel', 'tourism', 'tourist', 'hotel', 'safari', 'destination', 'vacation', 'flight', 'airline', 'airport', 'holiday', 'resort'] },
  { name: 'Food & Drink', slug: 'food-drink', keywords: ['food', 'cuisine', 'recipe', 'restaurant', 'chef', 'cooking', 'dining', 'meal', 'culinary', 'beverage', 'wine', 'coffee'] },
  { name: 'Real Estate', slug: 'real-estate', keywords: ['real estate', 'property', 'housing', 'mortgage', 'rent', 'land', 'construction', 'building', 'realtor', 'tenant', 'landlord'] },
  { name: 'Religion & Faith', slug: 'religion-faith', keywords: ['religion', 'church', 'mosque', 'faith', 'spiritual', 'worship', 'bible', 'quran', 'prayer', 'sermon', 'congregation', 'bishop', 'imam'] },
  { name: 'Agriculture', slug: 'agriculture', keywords: ['agriculture', 'farming', 'farmers', 'crop', 'harvest', 'livestock', 'irrigation', 'food security', 'horticulture', 'plantation'] },
  { name: 'Transport & Infrastructure', slug: 'transport-infrastructure', keywords: ['transport', 'roads', 'railway', 'rail', 'highway', 'aviation', 'infrastructure', 'bridge', 'port', 'traffic', 'commute', 'transit'] },
  { name: 'Gaming', slug: 'gaming', keywords: ['gaming', 'video game', 'videogame', 'playstation', 'xbox', 'nintendo', 'esports', 'gamer', 'console', 'fortnite', 'call of duty'] },
]

// ── Text helpers ────────────────────────────────────────────────────────────

function stripHtml(html?: string | null): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const WORD_RE = /[a-z0-9]+(?:['’-][a-z0-9]+)*/g

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(WORD_RE) || []).filter(w => w.length > 1)
}

function wordCount(text: string): number {
  return tokenize(text).length
}

// Pre-compiled matchers: phrase (multi-word) and term (single-word) lists.
function buildMatchers(keywords: string[]) {
  const phrases: { re: RegExp; kw: string }[] = []
  const terms = new Set<string>()
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase()
    if (!k) continue
    if (k.includes(' ')) {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      phrases.push({ re: new RegExp(`\\b${escaped}\\b`, 'i'), kw: k })
    } else {
      terms.add(k)
    }
  }
  return { phrases, terms }
}

// Count how many distinct keywords from a matcher set appear in `tokens`
// plus any phrase matches inside the raw text. Returns { hits, density }.
function scoreAgainst(tokens: string[], rawText: string, matchers: { phrases: { re: RegExp; kw: string }[]; terms: Set<string> }) {
  let hits = 0
  const matched = new Set<string>()

  for (const t of tokens) {
    if (matchers.terms.has(t)) {
      hits++
      matched.add(t)
    }
  }
  for (const p of matchers.phrases) {
    if (p.re.test(rawText)) {
      hits++
      matched.add(p.kw)
    }
  }
  return { hits, matched }
}

// TF-style normalisation: a hit in a 50-word article should weigh the same
// as the same number of hits in a 2000-word article. We cap the effective
// document length so short pieces are not over-penalised.
function normalize(hits: number, docWords: number): number {
  if (hits === 0) return 0
  const effLen = Math.max(docWords, 60)
  const tf = hits / effLen
  // mild diminishing returns for very high frequencies
  return Math.log1p(tf * 100) * 10
}

// ── Core categorizer ────────────────────────────────────────────────────────

export interface CategorizeOptions {
  /** Dynamic taxonomy (e.g. loaded from the DB). Falls back to defaults. */
  taxonomy?: CategoryDef[]
  /** Category id to fall back to when nothing matches (default: 89 Trending). */
  defaultCategoryId?: number
  /** If true, allow the engine to propose a brand-new category. */
  allowAutoCreate?: boolean
}

export function autoCategorize(
  input: CategorizationInput,
  options: CategorizeOptions = {}
): CategorizationResult {
  const {
    taxonomy = DEFAULT_TAXONOMY,
    defaultCategoryId = 89,
    allowAutoCreate = false,
  } = options

  const title = (input.title || '').toLowerCase()
  const excerpt = stripHtml(input.excerpt).toLowerCase()
  const content = stripHtml(input.content).toLowerCase()
  const tags = (input.tags || []).map(t => t.toLowerCase())
  const source = (input.sourceName || input.sourceReference || '').toLowerCase()

  // Document sizes (for TF normalisation).
  const titleTokens = tokenize(title)
  const excerptTokens = tokenize(excerpt)
  const contentTokens = tokenize(content)
  const totalWords = titleTokens.length + excerptTokens.length + contentTokens.length + content.split(/\s+/).length * 0

  const results: {
    def: CategoryDef
    score: number
    terms: Set<string>
  }[] = []

  for (const def of taxonomy) {
    const matchers = buildMatchers(def.keywords.flatMap(k => k.keywords))
    let score = 0
    const terms = new Set<string>()

    const t = scoreAgainst(titleTokens, title, matchers)
    score += normalize(t.hits, Math.max(titleTokens.length, 4)) * 3 // title boost
    t.matched.forEach(x => terms.add(x))

    const e = scoreAgainst(excerptTokens, excerpt, matchers)
    score += normalize(e.hits, Math.max(excerptTokens.length, 15)) * 2
    e.matched.forEach(x => terms.add(x))

    const c = scoreAgainst(contentTokens, content, matchers)
    score += normalize(c.hits, Math.max(contentTokens.length, 60))
    c.matched.forEach(x => terms.add(x))

    // Tags are strong signals — weight them heavily.
    for (const tag of tags) {
      const m = scoreAgainst(tokenize(tag), tag, matchers)
      if (m.hits > 0) {
        score += 8 * m.hits
        m.matched.forEach(x => terms.add(x))
      }
    }

    // Source reputation (e.g. a wire service) is a weak signal.
    const s = scoreAgainst(tokenize(source), source, matchers)
    score += normalize(s.hits, Math.max(tokenize(source).length, 10)) * 2
    s.matched.forEach(x => terms.add(x))

    if (score > 0) {
      results.push({ def, score, terms })
    }
  }

  results.sort((a, b) => b.score - a.score)

  const topScore = results[0]?.score ?? 0
  const scores: CategoryScore[] = results.slice(0, 3).map(r => ({
    categoryId: r.def.id as number,
    name: r.def.name,
    slug: r.def.slug,
    score: Math.round(r.score * 100) / 100,
    confidence: r.score >= 25 ? 'high' : r.score >= 12 ? 'medium' : 'low',
    matchedTerms: Array.from(r.terms).slice(0, 12),
  }))

  const best = scores[0]
  let confidence: 'high' | 'medium' | 'low'
  let bestCategoryId: number
  let suggested: { name: string; slug: string; keywords: string[]; sampleTerms: string[] } | undefined

  if (topScore >= 25) {
    confidence = 'high'
    bestCategoryId = best.categoryId as number
  } else if (topScore >= 12) {
    confidence = 'medium'
    bestCategoryId = best.categoryId as number
  } else if (input.currentCategoryId) {
    confidence = 'low'
    bestCategoryId = input.currentCategoryId
  } else if (allowAutoCreate) {
    // Nothing matched well — try to detect a novel theme to auto-create.
    const novel = detectNovelTheme(input)
    if (novel) {
      suggested = novel
      confidence = 'medium'
      bestCategoryId = defaultCategoryId
    } else {
      confidence = 'low'
      bestCategoryId = defaultCategoryId
    }
  } else {
    confidence = 'low'
    bestCategoryId = defaultCategoryId
  }

  return {
    bestCategoryId,
    scores,
    confidence,
    matchedTerms: best?.matchedTerms || [],
    suggestedNewCategory: suggested,
  }
}

// ── Novel-theme detection ────────────────────────────────────────────────────

export function detectNovelTheme(
  input: CategorizationInput
): { name: string; slug: string; keywords: string[]; sampleTerms: string[] } | null {
  const text = `${input.title || ''} ${stripHtml(input.excerpt)} ${stripHtml(input.content)}`.toLowerCase()
  const tokens = tokenize(text)
  if (tokens.length < 20) return null

  let bestTopic: { name: string; slug: string; keywords: string[] } | null = null
  let bestHits = 0
  let bestTerms: string[] = []

  for (const topic of NOVEL_TOPICS) {
    const matchers = buildMatchers(topic.keywords)
    const { hits, matched } = scoreAgainst(tokens, text, matchers)
    if (hits > bestHits) {
      bestHits = hits
      bestTopic = topic
      bestTerms = Array.from(matched)
    }
  }

  // Require a meaningful cluster (>= 3 distinct term hits and enough density).
  if (!bestTopic || bestHits < 3) return null
  const density = bestHits / Math.max(tokens.length, 60)
  if (density < 0.02) return null

  return {
    name: bestTopic.name,
    slug: bestTopic.slug,
    keywords: bestTopic.keywords,
    sampleTerms: bestTerms.slice(0, 12),
  }
}

// ── Auto-create + assign (DB-backed) ─────────────────────────────────────────

/**
 * Categorize an article and, if no existing category fits well, create a new
 * one and assign the article to it. Returns the final category id.
 *
 * `createCategory` is supplied by the caller (e.g. an admin supabase client)
 * so this module stays free of any DB dependency.
 */
export interface SmartCategorizationResult {
  bestCategoryId: number | 'NEW'
  scores: CategoryScore[]
  confidence: 'high' | 'medium' | 'low'
  matchedTerms: string[]
  suggestedNewCategory?: { name: string; slug: string; keywords: string[]; sampleTerms: string[] }
}

export async function categorizeWithAutoCreate(
  input: CategorizationInput,
  createCategory: (name: string, slug: string) => Promise<number | null>,
  options: CategorizeOptions = {}
): Promise<SmartCategorizationResult> {
  const result = autoCategorize(input, { ...options, allowAutoCreate: true })

  if (result.suggestedNewCategory) {
    const { name, slug } = result.suggestedNewCategory
    const newId = await createCategory(name, slug)
    if (newId) {
      return {
        ...result,
        bestCategoryId: newId,
        scores: [{ categoryId: newId, name, slug, score: 20, confidence: 'medium', matchedTerms: result.matchedTerms }],
        confidence: 'medium',
      }
    }
    // Fallback if creation failed.
    return { ...result, bestCategoryId: options.defaultCategoryId ?? 89, confidence: 'low' }
  }

  return { ...result, bestCategoryId: result.bestCategoryId }
}

export function getCategoryName(id: number): string {
  return CATEGORY_NAMES[id] || 'Other'
}

export function getAllCategoryIds(): number[] {
  return DEFAULT_TAXONOMY.map(c => c.id as number)
}

export { DEFAULT_TAXONOMY }

// ── Auto Tag Extraction ──────────────────────────────────────────────────────

const TAG_KEYWORDS: Record<string, string[]> = {
  'politics':       ['politics', 'governance', 'election', 'parliament', 'democracy', 'campaign', 'ballot'],
  'economy':        ['economy', 'business', 'finance', 'markets', 'trade', 'investment', 'gdp', 'inflation'],
  'technology':     ['technology', 'digital', 'innovation', 'ai', 'startups', 'software', 'internet', 'cyber'],
  'health':         ['health', 'healthcare', 'medicine', 'wellness', 'hospital', 'vaccine', 'disease'],
  'sports':         ['sports', 'football', 'athletics', 'rugby', 'cricket', 'tennis', 'basketball', 'f1'],
  'climate':        ['climate', 'environment', 'sustainability', 'renewable', 'energy', 'emissions', 'solar'],
  'education':      ['education', 'school', 'university', 'research', 'student', 'learning', 'exam'],
  'crime':          ['crime', 'security', 'police', 'arrest', 'murder', 'theft', 'corruption', 'fraud'],
  'court':          ['court', 'judiciary', 'legal', 'judge', 'ruling', 'trial', 'conviction', 'appeal'],
  'kenya':          ['kenya', 'nairobi', 'mombasa', 'kisumu', 'kakamega', 'eldoret', 'thika'],
  'africa':         ['africa', 'african', 'african union', 'ecowas', 'sadc', 'east africa', 'west africa'],
  'energy':         ['energy', 'oil', 'gas', 'petroleum', 'power', 'electricity', 'geothermal'],
  'agriculture':    ['agriculture', 'farming', 'food security', 'livestock', 'crop', 'harvest', 'irrigation'],
  'transport':      ['transport', 'infrastructure', 'roads', 'railway', 'aviation', 'airport', 'highway'],
  'banking':        ['banking', 'fintech', 'mobile money', 'mpesa', 'm-pesa', 'safaricom', 'atm'],
  'real-estate':    ['property', 'real estate', 'housing', 'mortgage', 'rent', 'construction', 'building'],
  'manufacturing':  ['manufacturing', 'factory', 'production', 'industrial', 'assembly'],
  'media':          ['media', 'journalism', 'press', 'broadcasting', 'newspaper', 'television', 'radio'],
  'tourism':        ['tourism', 'travel', 'hotel', 'safari', 'tourist', 'destination', 'hospitality'],
  'fashion':        ['fashion', 'clothing', 'design', 'style', 'trend', 'apparel', 'couture'],
  'food':           ['food', 'cuisine', 'recipe', 'restaurant', 'chef', 'cooking', 'dining'],
  'religion':       ['religion', 'church', 'mosque', 'faith', 'spiritual', 'worship', 'bible', 'quran'],
}

export function autoExtractTags(title: string, content: string, existingTags: string[] = []): string[] {
  const text = `${title} ${stripHtml(content)}`.toLowerCase()
  const existing = new Set(existingTags.map(t => t.toLowerCase()))
  const suggested: string[] = []

  const scored: { tag: string; score: number }[] = []

  for (const [keyword, tags] of Object.entries(TAG_KEYWORDS)) {
    if (text.includes(keyword)) {
      for (const tag of tags) {
        if (!existing.has(tag) && !suggested.includes(tag)) {
          // Score: title match = 10, content match = 3
          const inTitle = title.toLowerCase().includes(tag)
          const count = (text.match(new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')) || []).length
          const score = (inTitle ? 10 : 0) + Math.min(count, 10) * 3
          scored.push({ tag, score })
        }
      }
    }
  }

  scored.sort((a, b) => b.score - a.score)
  for (const s of scored) {
    if (suggested.length >= 8) break
    suggested.push(s.tag)
  }

  return suggested
}

// ── Content Layout Optimization ──────────────────────────────────────────────

function countWordsInText(text: string): number {
  return tokenize(text).length
}

export function optimizeContentLayout(html: string): string {
  // Only optimize content longer than 400 words
  const plain = stripHtml(html)
  if (countWordsInText(plain) < 400) return html

  const result = html

  // Split into paragraphs (double newline or </p> tags)
  const paragraphs = result.split(/\n\n+|<\/p>\s*<p[^>]*>/gi).filter(p => {
    const text = stripHtml(p).trim()
    return text.length > 0
  })

  if (paragraphs.length < 4) return html

  const optimized: string[] = []
  let wordCountSinceHeading = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const text = stripHtml(para).trim()
    const words = countWordsInText(text)
    wordCountSinceHeading += words

    // Add subheading every ~300 words (and at least 3 paragraphs since last heading)
    if (wordCountSinceHeading >= 300 && i > 0 && i < paragraphs.length - 1) {
      const headingWords = text.split(/\s+/).slice(0, 5).join(' ')
      const heading = headingWords.charAt(0).toUpperCase() + headingWords.slice(1).replace(/[.,!?;:]+$/, '')
      optimized.push(`\n<h2>${heading}</h2>\n`)
      wordCountSinceHeading = 0
    }

    // Break very long paragraphs (>200 words) into two
    if (words > 200) {
      const sentences = text.split(/(?<=[.!?])\s+/)
      const mid = Math.floor(sentences.length / 2)
      const firstHalf = sentences.slice(0, mid).join(' ')
      const secondHalf = sentences.slice(mid).join(' ')
      optimized.push(`<p>${firstHalf}</p>\n\n<p>${secondHalf}</p>`)
    } else {
      // Wrap bare text in <p> if it isn't already
      const wrapped = para.trim().startsWith('<') ? para : `<p>${para}</p>`
      optimized.push(wrapped)
    }
  }

  return optimized.join('\n\n')
}
