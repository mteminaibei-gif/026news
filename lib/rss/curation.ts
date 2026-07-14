/**
 * RSS Curation Engine
 *
 * Automatically categorizes and tags aggregated articles
 * based on keyword analysis of title + content.
 */

// ── Category keyword maps ──────────────────────────────────────
// Each category has weighted keyword patterns. Higher weight = stronger match.
const CATEGORY_KEYWORDS: Record<number, Array<{ patterns: RegExp[]; weight: number }>> = {
  // Kenya (65)
  65: [
    { patterns: [/kenya/i, /nairobi/i, /mombasa/i, /kisumu/i, /nakuru/i, /eldoret/i, /thika/i], weight: 10 },
    { patterns: [/kenyan/i, /kenyans/i, /kenyatta/i, /ruto/i, /raila/i, /odinga/i, /safaricom/i, /m-?pesa/i, /kra\b/i, /mpesa/i], weight: 8 },
    { patterns: [/east africa/i, /east african/i], weight: 3 },
  ],
  // Africa (66)
  66: [
    { patterns: [/africa/i, /african/i, /afro/i, /au\b/i, /african union/i], weight: 10 },
    { patterns: [/nigeria/i, /south africa/i, /ghana/i, /egypt/i, /ethiopia/i, /tanzania/i, /uganda/i, /rwanda/i, /congo/i, /mozambique/i, /zimbabwe/i, /zambia/i, /senegal/i], weight: 8 },
    { patterns: [/sub-?saharan/i, /sahel/i, /horn of africa/i, /maghreb/i], weight: 7 },
    { patterns: [/nairobi/i, /addis ababa/i, /lagos/i, /accra/i, /cairo/i, /dar es salaam/i], weight: 6 },
  ],
  // Politics (1)
  1: [
    { patterns: [/election/i, /vote/i, /voting/i, /ballot/i, /poll/i, /polling/i], weight: 10 },
    { patterns: [/president/i, /governor/i, /senator/i, /parliament/i, /legislature/i, /congress/i, /assembly/i], weight: 9 },
    { patterns: [/democrat/i, /republican/i, /political/i, /politics/i, /politician/i], weight: 8 },
    { patterns: [/govern[mentm]/i, /minister/i, /cabinet/i, /opposition/i, /coalition/i, /party\b/i], weight: 7 },
    { patterns: [/law/i, /bill/i, /legislation/i, /impeach/i, /vote/i, /referendum/i], weight: 6 },
    { patterns: [/diplom[aticy]/i, /embassy/i, /sanction/i, /treaty/i, /summit/i, /bilateral/i], weight: 5 },
  ],
  // Business (2)
  2: [
    { patterns: [/econom/i, /gdp/i, /inflation/i, /stock.?market/i, /share.?market/i, /trading/i, /investor/i], weight: 10 },
    { patterns: [/business/i, /compan[yie]/i, /corporat/i, /startup/i, /entrepreneur/i, /ventures/i], weight: 9 },
    { patterns: [/revenue/i, /profit/i, /earning/i, /fiscal/i, /budget/i, /tax/i, /tariff/i], weight: 8 },
    { patterns: [/bank/i, /banking/i, /finance/i, /financial/i, /insur/i, /credit/i, /loan/i, /debt/i], weight: 7 },
    { patterns: [/market/i, /trade/i, /export/i, /import/i, /commodit/i, /oil.?price/i], weight: 6 },
    { patterns: [/ipo/i, /share/i, /stock/i, /bond/i, /forex/i, /currency/i, /dollar/i, /shilling/i], weight: 5 },
  ],
  // Tech (3)
  3: [
    { patterns: [/ai\b/i, /artificial intelligence/i, /machine learning/i, /deep learning/i, /chatgpt/i, /openai/i, /claude/i, /gemini/i], weight: 10 },
    { patterns: [/tech/i, /technolog/i, /software/i, /hardware/i, /startup/i, /unicorn/i], weight: 9 },
    { patterns: [/cyber/i, /hack/i, /data.?breach/i, /privacy/i, /encryption/i, /malware/i, /ransomware/i], weight: 8 },
    { patterns: [/app[le]?\b/i, /google/i, /microsoft/i, /amazon/i, /meta/i, /facebook/i, /twitter/i, /x\.com/i, /tiktok/i, /samsung/i, /nvidia/i], weight: 7 },
    { patterns: [/5g/i, /internet/i, /broadband/i, /digital/i, /blockchain/i, /crypto/i, /bitcoin/i, /ethereum/i, /nft/i], weight: 6 },
    { patterns: [/robot/i, /autonomous/i, /drone/i, /innovat/i, /patent/i, /silicon.?valley/i], weight: 5 },
  ],
  // Science (4)
  4: [
    { patterns: [/scient/i, /research/i, /study.?find/i, /experiment/i, /laboratory/i, /lab\b/i], weight: 10 },
    { patterns: [/nasa/i, /space/i, /rocket/i, /satellite/i, /mars/i, /moon/i, /nasa/i, /esa\b/i], weight: 9 },
    { patterns: [/physic/i, /chemi/i, /biology/i, /genetic/i, /dna/i, /evolution/i, /atom/i], weight: 8 },
    { patterns: [/climate/i, /global.?warming/i, /carbon/i, /emission/i, /fossil/i, /renewable/i, /solar.?energy/i, /wind.?energy/i], weight: 7 },
    { patterns: [/discover/i, /breakthrough/i, /innovat/i, /technology/i, /quantum/i, / telescope/i], weight: 5 },
  ],
  // Sports (6)
  6: [
    { patterns: [/football/i, /soccer/i, /premier league/i, /champions league/i, /world cup/i, /fifa/i, /uefa/i], weight: 10 },
    { patterns: [/basketball/i, /nba\b/i, /rugby/i, /cricket/i, /tennis/i, /golf/i, /f1\b/i, /formula.?1/i, /boxing/i, /mma\b/i], weight: 9 },
    { patterns: [/athlet/i, /marathon/i, /olympic/i, /sport/i, /athlete/i, /player/i, /team\b/i], weight: 8 },
    { patterns: [/match/i, /game/i, /score/i, /goal/i, /win/i, /victory/i, /champion/i, /trophy/i, /league/i], weight: 7 },
    { patterns: [/coach/i, /manager/i, /transfer/i, /signing/i, /stadium/i, /tournament/i], weight: 6 },
  ],
  // Entertainment (5)
  5: [
    { patterns: [/film/i, /movie/i, /cinema/i, /hollywood/i, /bollywood/i, /netflix/i, /disney/i], weight: 10 },
    { patterns: [/music/i, /song/i, /album/i, /concert/i, /artist/i, /grammy/i, /billboard/i], weight: 9 },
    { patterns: [/celebrity/i, /celeb/i, /star/i, /actor/i, /actress/i, /singer/i, /rapper/i], weight: 8 },
    { patterns: [/tv.?show/i, /series/i, /episode/i, /stream/i, /reality.?tv/i, /award/i, /oscar/i], weight: 7 },
    { patterns: [/tiktok/i, /instagram/i, /viral/i, /trending/i, /meme/i, /influencer/i, /youtube/i], weight: 6 },
  ],
  // Health (67)
  67: [
    { patterns: [/health/i, /medical/i, /doctor/i, /hospital/i, /clinic/i, /patient/i], weight: 10 },
    { patterns: [/disease/i, /virus/i, /vaccine/i, /covid/i, /pandemic/i, /epidemic/i, /outbreak/i], weight: 9 },
    { patterns: [/mental.?health/i, /depression/i, /anxiety/i, /therapy/i, /counsel/i], weight: 8 },
    { patterns: [/drug/i, /medication/i, /pharm/i, /treatment/i, /cure/i, /diagnos/i], weight: 7 },
    { patterns: [/nutrition/i, /diet/i, /exercise/i, /fitness/i, /wellness/i, /obesity/i], weight: 6 },
    { patterns: [/who\b/i, /cdc/i, /health.?ministry/i, /public.?health/i, /maternal/i, /child.?health/i], weight: 5 },
  ],
  // World (64)
  64: [
    { patterns: [/international/i, /global/i, /world/i, /foreign/i, /overseas/i], weight: 10 },
    { patterns: [/united.?nations/i, /un\b/i, /nato/i, /eu\b/i, /european/i, /who\b/i], weight: 8 },
    { patterns: [/war/i, /conflict/i, /ceasefire/i, /refugee/i, /humanitarian/i, /sanction/i], weight: 7 },
    { patterns: [/trump/i, /biden/i, /putin/i, /xi.?jinping/i, /macron/i, /zelensky/i], weight: 6 },
  ],
  // Education (68)
  68: [
    { patterns: [/education/i, /school/i, /university/i, /student/i, /teacher/i, /curriculum/i], weight: 10 },
    { patterns: [/exam/i, /grade/i, /enrol/i, /campus/i, /academic/i, /scholarship/i, /lecture/i], weight: 9 },
    { patterns: [/learning/i, /literacy/i, /tuition/i, /diploma/i, /degree/i, /graduate/i], weight: 7 },
  ],
  // Agriculture (69)
  69: [
    { patterns: [/agricultur/i, /farm/i, /crop/i, /harvest/i, /food.?security/i, /fertiliz/i], weight: 10 },
    { patterns: [/livestock/i, /cattle/i, /poultry/i, /dairy/i, /fish/i, /fishing/i], weight: 9 },
    { patterns: [/irrigation/i, /seed/i, /soil/i, /pest/i, /fertiliz/i, /organic/i], weight: 8 },
  ],
  // Environment (73)
  73: [
    { patterns: [/environment/i, /ecolog/i, /biodivers/i, /deforest/i, /conservation/i], weight: 10 },
    { patterns: [/pollution/i, /plastic/i, /ocean/i, /forest/i, /wildlife/i, /endanger/i], weight: 9 },
    { patterns: [/climate.?change/i, /global.?warming/i, /carbon/i, /emission/i, /renewable/i, /sustainability/i], weight: 8 },
  ],
  // Crime & Justice (72)
  72: [
    { patterns: [/crime/i, /criminal/i, /murder/i, /kill/i, /shoot/i, /stab/i, /rob/i, /theft/i, /burgl/i], weight: 10 },
    { patterns: [/police/i, /arrest/i, /suspect/i, /court/i, /judge/i, /verdict/i, /sentence/i, /prison/i, /jail/i], weight: 9 },
    { patterns: [/fraud/i, /scam/i, /corrupt/i, /bribe/i, /money.?launder/i], weight: 8 },
    { patterns: [/investigat/i, /prosecut/i, /trial/i, /convict/i, /acquit/i, /bail/i], weight: 7 },
  ],
  // Opinion (71)
  71: [
    { patterns: [/opinion/i, /editorial/i, /commentary/i, /analysis/i, /perspective/i, /viewpoint/i], weight: 10 },
    { patterns: [/column/i, /op-?ed/i, /debate/i, /discuss/i, /argue/i, /critique/i], weight: 8 },
  ],
  // Real Estate (74)
  74: [
    { patterns: [/real.?estate/i, /property/i, /housing/i, /mortgage/i, /rent/i, /landlord/i, /tenant/i], weight: 10 },
    { patterns: [/construct/i, /build/i, /apartment/i, /house.?price/i, /land.?price/i, /developer/i], weight: 9 },
  ],
  // Lifestyle (70)
  70: [
    { patterns: [/lifestyle/i, /fashion/i, /beauty/i, /travel/i, /food/i, /recipe/i, /cooking/i], weight: 10 },
    { patterns: [/relationship/i, /dating/i, /marriage/i, /parenting/i, /family/i, /wellness/i], weight: 8 },
    { patterns: [/culture/i, /tradition/i, /festival/i, /holiday/i, /celebration/i], weight: 6 },
  ],
}

// ── Tag extraction keywords ─────────────────────────────────────
// Common news topic keywords that make good tags
const TAG_KEYWORDS: Array<{ pattern: RegExp; tag: string }> = [
  // Kenya-specific
  { pattern: /\bNairobi\b/i, tag: 'Nairobi' },
  { pattern: /\bMombasa\b/i, tag: 'Mombasa' },
  { pattern: /\bKisumu\b/i, tag: 'Kisumu' },
  { pattern: /\bNakuru\b/i, tag: 'Nakuru' },
  { pattern: /\bEldoret\b/i, tag: 'Eldoret' },
  { pattern: /\bRuto\b/i, tag: 'Ruto' },
  { pattern: /\bRaila\b/i, tag: 'Raila Odinga' },
  { pattern: /\bKenyatta\b/i, tag: 'Kenyatta' },
  { pattern: /\bSafaricom\b/i, tag: 'Safaricom' },
  { pattern: /\bM-?Pesa\b/i, tag: 'M-Pesa' },
  { pattern: /\bKRA\b/i, tag: 'KRA' },
  { pattern: /\bNSSF\b/i, tag: 'NSSF' },
  { pattern: /\bNHIF\b/i, tag: 'NHIF' },
  // Africa
  { pattern: /\bAU\b(?!\w)/, tag: 'African Union' },
  { pattern: /\bECOWAS\b/i, tag: 'ECOWAS' },
  // Global orgs
  { pattern: /\bUN\b(?!\w)/, tag: 'United Nations' },
  { pattern: /\bWHO\b(?!\w)/, tag: 'WHO' },
  { pattern: /\bIMF\b/i, tag: 'IMF' },
  { pattern: /\bWorld Bank\b/i, tag: 'World Bank' },
  { pattern: /\bWTO\b/i, tag: 'WTO' },
  { pattern: /\bNATO\b/i, tag: 'NATO' },
  { pattern: /\bEU\b(?!\w)/, tag: 'European Union' },
  { pattern: /\bG7\b/i, tag: 'G7' },
  { pattern: /\bG20\b/i, tag: 'G20' },
  // Tech companies
  { pattern: /\bOpenAI\b/i, tag: 'OpenAI' },
  { pattern: /\bChatGPT\b/i, tag: 'ChatGPT' },
  { pattern: /\bGoogle\b/i, tag: 'Google' },
  { pattern: /\bApple\b/i, tag: 'Apple' },
  { pattern: /\bMicrosoft\b/i, tag: 'Microsoft' },
  { pattern: /\bAmazon\b/i, tag: 'Amazon' },
  { pattern: /\bMeta\b/i, tag: 'Meta' },
  { pattern: /\bNvidia\b/i, tag: 'Nvidia' },
  { pattern: /\bTesla\b/i, tag: 'Tesla' },
  { pattern: /\bSamsung\b/i, tag: 'Samsung' },
  { pattern: /\bSpaceX\b/i, tag: 'SpaceX' },
  // Tech topics
  { pattern: /\bartificial intelligence\b/i, tag: 'Artificial Intelligence' },
  { pattern: /\bAI\b(?!\w)/, tag: 'AI' },
  { pattern: /\bmachine learning\b/i, tag: 'Machine Learning' },
  { pattern: /\bblockchain\b/i, tag: 'Blockchain' },
  { pattern: /\bcrypto(?:currency)?\b/i, tag: 'Cryptocurrency' },
  { pattern: /\bBitcoin\b/i, tag: 'Bitcoin' },
  { pattern: /\b5G\b/, tag: '5G' },
  { pattern: /\bcybersecurity\b/i, tag: 'Cybersecurity' },
  // Sports
  { pattern: /\bPremier League\b/i, tag: 'Premier League' },
  { pattern: /\bChampions League\b/i, tag: 'Champions League' },
  { pattern: /\bWorld Cup\b/i, tag: 'World Cup' },
  { pattern: /\bFIFA\b/i, tag: 'FIFA' },
  { pattern: /\bNBA\b/i, tag: 'NBA' },
  { pattern: /\bNFL\b/i, tag: 'NFL' },
  { pattern: /\bF1\b/, tag: 'Formula 1' },
  { pattern: /\bOlympics?\b/i, tag: 'Olympics' },
  { pattern: /\bMarathon\b/i, tag: 'Marathon' },
  { pattern: /\bHarambee Stars\b/i, tag: 'Harambee Stars' },
  { pattern: /\bKPL\b/, tag: 'Kenya Premier League' },
  // Health
  { pattern: /\bCOVID-?19\b/i, tag: 'COVID-19' },
  { pattern: /\bvaccine\b/i, tag: 'Vaccines' },
  { pattern: /\bmental health\b/i, tag: 'Mental Health' },
  // Climate
  { pattern: /\bclimate change\b/i, tag: 'Climate Change' },
  { pattern: /\brenewable energy\b/i, tag: 'Renewable Energy' },
  // Business
  { pattern: /\bIPO\b/, tag: 'IPO' },
  { pattern: /\bforex\b/i, tag: 'Forex' },
  { pattern: /\bNSE\b/, tag: 'Nairobi Stock Exchange' },
  // Crime
  { pattern: /\bfraud\b/i, tag: 'Fraud' },
  { pattern: /\bcorruption\b/i, tag: 'Corruption' },
  // Countries
  { pattern: /\bUganda\b/i, tag: 'Uganda' },
  { pattern: /\bTanzania\b/i, tag: 'Tanzania' },
  { pattern: /\bRwanda\b/i, tag: 'Rwanda' },
  { pattern: /\bEthiopia\b/i, tag: 'Ethiopia' },
  { pattern: /\bNigeria\b/i, tag: 'Nigeria' },
  { pattern: /\bSouth Africa\b/i, tag: 'South Africa' },
  { pattern: /\bGhana\b/i, tag: 'Ghana' },
  { pattern: /\bEgypt\b/i, tag: 'Egypt' },
  { pattern: /\bSomalia\b/i, tag: 'Somalia' },
  { pattern: /\bSudan\b/i, tag: 'Sudan' },
  { pattern: /\bDRC\b/, tag: 'DRC' },
  // Entertainment
  { pattern: /\bNetflix\b/i, tag: 'Netflix' },
  { pattern: /\bOscar/i, tag: 'Oscars' },
  { pattern: /\bGrammy/i, tag: 'Grammys' },
]


// ── Public functions ────────────────────────────────────────────

/**
 * Determines the best category for an article based on keyword analysis.
 * Falls back to the feed's default category if no strong match is found.
 */
export function categorizeArticle(
  title: string,
  content: string,
  feedCategoryId: number | null,
): number {
  const text = `${title} ${title} ${content}` // title weighted 2x
  const scores: Record<number, number> = {}

  for (const [catId, keywordSets] of Object.entries(CATEGORY_KEYWORDS)) {
    const cat = Number(catId)
    let score = 0
    for (const { patterns, weight } of keywordSets) {
      for (const pattern of patterns) {
        const matches = text.match(new RegExp(pattern.source, 'gi'))
        if (matches) {
          score += matches.length * weight
        }
      }
    }
    if (score > 0) scores[cat] = score
  }

  // Find the highest-scoring category
  const sorted = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]))

  if (sorted.length > 0 && Number(sorted[0][1]) >= 10) {
    return Number(sorted[0][0])
  }

  // If the feed has a default category and no strong keyword match, use it
  if (feedCategoryId) {
    return feedCategoryId
  }

  // Fallback to World
  return 64
}


/**
 * Extracts relevant tags from article title + content.
 * Returns up to `maxTags` unique, normalized tags.
 */
export function extractTags(
  title: string,
  content: string,
  maxTags: number = 8,
): string[] {
  const text = `${title} ${content}`
  const found = new Map<string, string>() // normalized -> display name

  for (const { pattern, tag } of TAG_KEYWORDS) {
    if (found.size >= maxTags) break
    if (pattern.test(text)) {
      const normalized = tag.toLowerCase()
      if (!found.has(normalized)) {
        found.set(normalized, tag)
      }
    }
  }

  // If we still need more tags, extract capitalized multi-word phrases
  if (found.size < maxTags) {
    const phrases = extractPhrases(text, maxTags - found.size)
    for (const phrase of phrases) {
      if (found.size >= maxTags) break
      const normalized = phrase.toLowerCase()
      if (!found.has(normalized) && phrase.length > 2 && phrase.length < 40) {
        found.set(normalized, phrase)
      }
    }
  }

  return Array.from(found.values())
}


/**
 * Full curation pipeline: categorize + tag an article.
 * Returns the category ID and tags array.
 */
export function curateArticle(
  title: string,
  content: string,
  feedCategoryId: number | null,
): { categoryId: number; tags: string[] } {
  return {
    categoryId: categorizeArticle(title, content, feedCategoryId),
    tags: extractTags(title, content),
  }
}


// ── Internal helpers ────────────────────────────────────────────

/**
 * Extracts common noun phrases from text as potential tags.
 */
function extractPhrases(text: string, max: number): string[] {
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/)
  const phrases: string[] = []
  const seen = new Set<string>()

  // Look for 2-3 word capitalized phrases (likely proper nouns / named entities)
  for (let i = 0; i < words.length - 1 && phrases.length < max * 3; i++) {
    const w1 = words[i].replace(/[^a-zA-Z]/g, '')
    const w2 = words[i + 1]?.replace(/[^a-zA-Z]/g, '')
    if (!w1 || !w2) continue

    // Check for capitalized phrases (proper nouns)
    if (/^[A-Z]/.test(w1) && /^[A-Z]/.test(w2)) {
      const phrase = `${w1} ${w2}`
      const norm = phrase.toLowerCase()
      if (!seen.has(norm) && w1.length > 1 && w2.length > 1) {
        seen.add(norm)
        phrases.push(phrase)
      }
    }
  }

  return phrases.slice(0, max)
}
