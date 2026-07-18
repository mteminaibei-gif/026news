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
  score: number
  confidence: 'high' | 'medium' | 'low'
  matchedTerms: string[]
}

export interface CategorizationResult {
  bestCategoryId: number
  scores: CategoryScore[]
  confidence: 'high' | 'medium' | 'low'
  matchedTerms: string[]
}

interface KeywordEntry {
  patterns: RegExp[]
  weight: number
}

// Category IDs correspond to the rows inserted by migration 20260718091047.
// IDs 80-91 in insertion order after the old rows are deleted.
const CATEGORY_KEYWORDS: Record<number, KeywordEntry[]> = {
  // World Updates
  80: [
    { patterns: [/\binternational\b/i, /\bglobal\b/i, /\bworld\b/i, /\bforeign\b/i, /\boverseas\b/i], weight: 10 },
    { patterns: [/\bunited nations\b/i, /\bnato\b/i, /\beuropean union\b/i, /\beuropean\b/i, /\bbrics\b/i], weight: 9 },
    { patterns: [/\bwar\b/i, /\bconflict\b/i, /\bceasefire\b/i, /\brefugee\b/i, /\bhumanitarian\b/i, /\bsanction\b/i, /\bsanctions\b/i], weight: 8 },
    { patterns: [/\btrump\b/i, /\bbiden\b/i, /\bputin\b/i, /\bxi jinping\b/i, /\bmacron\b/i, /\bzelensky\b/i, /\bmodi\b/i], weight: 7 },
    { patterns: [/\breuters\b/i, /\bap\b(?!\w)/i, /\bagence france-presse\b/i, /\bbc world\b/i], weight: 6 },
    { patterns: [/\bdiplomatic\b/i, /\bdiplomacy\b/i, /\bembassy\b/i, /\btreaty\b/i, /\bsummit\b/i, /\bbilateral\b/i, /\bmultilateral\b/i], weight: 5 },
  ],
  // Kenya Focus
  81: [
    { patterns: [/\bkenya\b/i, /\bnairobi\b/i, /\bmombasa\b/i, /\bkisumu\b/i, /\bnakuru\b/i, /\beldoret\b/i, /\bthika\b/i, /\bmeru\b/i], weight: 10 },
    { patterns: [/\bkenyan\b/i, /\bkenyans\b/i, /\bkenyatta\b/i, /\bruto\b/i, /\braila\b/i, /\bodinga\b/i, /\bsafaricom\b/i, /\bmpesa\b/i, /\bm-pesa\b/i, /\bkra\b/i], weight: 9 },
    { patterns: [/\bcounty\b/i, /\bgovernor\b.*\bkenya\b/i, /\bnational assembly\b/i, /\bsenate\b.*\bkenya\b/i], weight: 8 },
    { patterns: [/\bnysc\b/i, /\bhelb\b/i, /\bnhif\b/i, /\bntsa\b/i, /\bkdf\b/i, /\bepra\b/i], weight: 7 },
    { patterns: [/\beast africa\b/i, /\beast african\b/i, /\beac\b/i], weight: 4 },
  ],
  // Politics & Governance
  82: [
    { patterns: [/\belection\b/i, /\belections\b/i, /\bvoting\b/i, /\bballot\b/i, /\bpoll\b/i, /\bpolls\b/i, /\bpolling\b/i], weight: 10 },
    { patterns: [/\bpresident\b/i, /\bgovernor\b/i, /\bsenator\b/i, /\bparliament\b/i, /\bparliamentary\b/i, /\blegislature\b/i, /\bcongress\b/i, /\bassembly\b/i], weight: 9 },
    { patterns: [/\bdemocrat\b/i, /\brepublican\b/i, /\bpolitical\b/i, /\bpolitics\b/i, /\bpolitician\b/i, /\bpartisan\b/i], weight: 8 },
    { patterns: [/\bgovernment\b/i, /\bgovernments\b/i, /\bminister\b/i, /\bcabinet\b/i, /\bopposition\b/i, /\bcoalition\b/i, /\bparty\b/i], weight: 7 },
    { patterns: [/\blaw\b/i, /\blaws\b/i, /\bbill\b/i, /\bbills\b/i, /\blegislation\b/i, /\bimpeach\b/i, /\breferendum\b/i, /\bconstitution\b/i], weight: 6 },
    { patterns: [/\bspeaker\b/i, /\bmajority leader\b/i, /\bminority leader\b/i, /\bwhip\b/i, /\bcaucus\b/i, /\bfloor\b/i], weight: 5 },
  ],
  // Business & Economy
  83: [
    { patterns: [/\beconomic\b/i, /\beconomy\b/i, /\bgdp\b/i, /\binflation\b/i, /\bstock market\b/i, /\btrading\b/i, /\binvestor\b/i, /\binvestors\b/i], weight: 10 },
    { patterns: [/\bbusiness\b/i, /\bcompanies\b/i, /\bcompany\b/i, /\bcorporate\b/i, /\bcorporation\b/i, /\bstartup\b/i, /\bstartups\b/i, /\bentrepreneur\b/i, /\bventures\b/i], weight: 9 },
    { patterns: [/\brevenue\b/i, /\bprofit\b/i, /\bprofits\b/i, /\bearning\b/i, /\bearnings\b/i, /\bfiscal\b/i, /\bbudget\b/i, /\btax\b/i, /\btaxes\b/i, /\btariff\b/i, /\btariffs\b/i], weight: 8 },
    { patterns: [/\bbank\b/i, /\bbanking\b/i, /\bfinance\b/i, /\bfinancial\b/i, /\binsurance\b/i, /\bcredit\b/i, /\bloan\b/i, /\bdebt\b/i, /\bcentral bank\b/i], weight: 7 },
    { patterns: [/\bmarket\b/i, /\bmarkets\b/i, /\btrade\b/i, /\bexport\b/i, /\bexports\b/i, /\bimport\b/i, /\bcommodity\b/i, /\boil price\b/i], weight: 6 },
    { patterns: [/\bipo\b/i, /\bshares\b/i, /\bstock\b/i, /\bbond\b/i, /\bforex\b/i, /\bcurrency\b/i, /\bdollar\b/i, /\bshilling\b/i, /\bnse\b/i], weight: 5 },
  ],
  // Tech & Innovation
  84: [
    { patterns: [/\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bdeep learning\b/i, /\bchatgpt\b/i, /\bopenai\b/i, /\bclaude\b/i, /\bgemini\b/i, /\bgrok\b/i], weight: 10 },
    { patterns: [/\btech\b/i, /\btechs\b/i, /\btechnology\b/i, /\btechnologies\b/i, /\bsoftware\b/i, /\bhardware\b/i, /\bunicorn\b/i, /\bsaas\b/i], weight: 9 },
    { patterns: [/\bcybersecurity\b/i, /\bhacking\b/i, /\bhack\b/i, /\bhacker\b/i, /\bdata breach\b/i, /\bprivacy\b/i, /\bencryption\b/i, /\bmalware\b/i, /\bransomware\b/i], weight: 8 },
    { patterns: [/\bgoogle\b/i, /\bmicrosoft\b/i, /\bamazon\b/i, /\bmeta\b/i, /\bapple\b/i, /\btiktok\b/i, /\bsamsung\b/i, /\bnvidia\b/i, /\btesla\b/i, /\bspaceX\b/i, /\bxiaomi\b/i], weight: 7 },
    { patterns: [/\b5g\b/i, /\binternet\b/i, /\bbroadband\b/i, /\bdigital\b/i, /\bblockchain\b/i, /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bweb3\b/i], weight: 6 },
    { patterns: [/\brobot\b/i, /\brobots\b/i, /\bautonomous\b/i, /\bdrone\b/i, /\bdrones\b/i, /\binnovation\b/i, /\bstartup\b/i, /\bpatent\b/i, /\bsilicon valley\b/i, /\bapp\b/i], weight: 5 },
  ],
  // Health & Wellness
  85: [
    { patterns: [/\bhealth\b/i, /\bmedical\b/i, /\bdoctor\b/i, /\bdoctors\b/i, /\bhospital\b/i, /\bhospitals\b/i, /\bclinic\b/i, /\bpatient\b/i, /\bpatients\b/i], weight: 10 },
    { patterns: [/\bdisease\b/i, /\bdiseases\b/i, /\bvirus\b/i, /\bvaccines?\b/i, /\bcovid\b/i, /\bpandemic\b/i, /\bepidemic\b/i, /\boutbreak\b/i, /\binfection\b/i], weight: 9 },
    { patterns: [/\bmental health\b/i, /\bdepression\b/i, /\banxiety\b/i, /\btherapy\b/i, /\bcounseling\b/i, /\bstress\b/i, /\bburnout\b/i], weight: 8 },
    { patterns: [/\bdrug\b/i, /\bdrugs\b/i, /\bmedication\b/i, /\bpharmaceutical\b/i, /\bpharma\b/i, /\btreatment\b/i, /\bcure\b/i, /\bdiagnosis\b/i, /\bsurgery\b/i], weight: 7 },
    { patterns: [/\bnutrition\b/i, /\bdiet\b/i, /\bexercise\b/i, /\bfitness\b/i, /\bwellness\b/i, /\bobesity\b/i, /\bworkout\b/i, /\byoga\b/i, /\bmeditation\b/i], weight: 6 },
    { patterns: [/\bwho\b/i, /\bcdc\b/i, /\bhealth ministry\b/i, /\bpublic health\b/i, /\bmaternal\b/i, /\bnutrition\b/i], weight: 5 },
  ],
  // Arts & Culture
  86: [
    { patterns: [/\bfilm\b/i, /\bfilms\b/i, /\bmovie\b/i, /\bmovies\b/i, /\bcinema\b/i, /\bhollywood\b/i, /\bbollywood\b/i, /\bnetflix\b/i, /\bdisney\b/i], weight: 10 },
    { patterns: [/\bmusic\b/i, /\bsong\b/i, /\bsongs\b/i, /\balbum\b/i, /\balbums\b/i, /\bconcert\b/i, /\bconcerts\b/i, /\bgrammy\b/i, /\bbillboard\b/i], weight: 9 },
    { patterns: [/\bcelebrity\b/i, /\bcelebrities\b/i, /\bactor\b/i, /\bactress\b/i, /\bsinger\b/i, /\brapper\b/i, /\bartiste\b/i], weight: 8 },
    { patterns: [/\btv show\b/i, /\bseries\b/i, /\bepisode\b/i, /\bstreaming\b/i, /\breality tv\b/i, /\baward\b/i, /\bawards\b/i, /\boscar\b/i], weight: 7 },
    { patterns: [/\barts?\b/i, /\bculture\b/i, /\bcultural\b/i, /\btradition\b/i, /\btraditions\b/i, /\bliterature\b/i, /\bpoetry\b/i, /\btheatre\b/i, /\btheater\b/i], weight: 6 },
    { patterns: [/\bfestival\b/i, /\bcarnival\b/i, /\bexhibition\b/i, /\bmuseum\b/i, /\bgallery\b/i, /\bdance\b/i, /\bchoreograph\b/i], weight: 5 },
  ],
  // Sports Arena
  87: [
    { patterns: [/\bfootball\b/i, /\bsoccer\b/i, /\bpremier league\b/i, /\bchampions league\b/i, /\bworld cup\b/i, /\bfifa\b/i, /\buefa\b/i, /\bla liga\b/i], weight: 10 },
    { patterns: [/\bbasketball\b/i, /\bnba\b/i, /\brugby\b/i, /\bcricket\b/i, /\btennis\b/i, /\bgolf\b/i, /\bf1\b/i, /\bformula 1\b/i, /\bboxing\b/i, /\bmma\b/i, /\bufc\b/i], weight: 9 },
    { patterns: [/\bathletics\b/i, /\bathlete\b/i, /\bathletes\b/i, /\bmarathon\b/i, /\bolympics\b/i, /\bolympic\b/i, /\bsport\b/i, /\bsports\b/i, /\bplayer\b/i, /\bteam\b/i], weight: 8 },
    { patterns: [/\bmatch\b/i, /\bgame\b/i, /\bscore\b/i, /\bgoal\b/i, /\bwon\b/i, /\bdefeated\b/i, /\bvictory\b/i, /\bchampion\b/i, /\btrophy\b/i, /\bleague\b/i], weight: 7 },
    { patterns: [/\bcoach\b/i, /\bmanager\b/i, /\btransfer\b/i, /\btransfers\b/i, /\bsigning\b/i, /\bstadium\b/i, /\btournament\b/i, /\bqualifier\b/i], weight: 6 },
  ],
  // Opinion & Analysis
  88: [
    { patterns: [/\bopinion\b/i, /\beditorial\b/i, /\bcommentary\b/i, /\banalysis\b/i, /\bperspective\b/i, /\bviewpoint\b/i, /\bop-ed\b/i], weight: 10 },
    { patterns: [/\bcolumn\b/i, /\bdebate\b/i, /\bdiscussion\b/i, /\bargue\b/i, /\bcritique\b/i, /\breview\b/i, /\bcomment\b/i], weight: 8 },
    { patterns: [/\bwe argue\b/i, /\bin our view\b/i, /\bthe case for\b/i, /\bthe case against\b/i, /\bwhy\b.*\bshould\b/i], weight: 6 },
  ],
  // Trending Now
  89: [
    { patterns: [/\bviral\b/i, /\btrending\b/i, /\bmemes?\b/i, /\bviral video\b/i, /\bblow up\b/i, /\bblowing up\b/i, /\bbroke the internet\b/i], weight: 10 },
    { patterns: [/\btiktok\b/i, /\binstagram\b/i, /\byoutube\b/i, /\btwitter\b/i, /\bx\.com\b/i, /\bsnapchat\b/i, /\breddit\b/i], weight: 8 },
    { patterns: [/\bsocial media\b/i, /\bonline\b/i, /\bcyber\b/i, /\bhashtag\b/i, /\bchallenge\b/i, /\bdance challenge\b/i, /\bprank\b/i], weight: 7 },
    { patterns: [/\bcelebrity\b/i, /\bceleb\b/i, /\binfluencer\b/i, /\bcontent creator\b/i, /\bvlogger\b/i, /\bstreamer\b/i], weight: 6 },
  ],
  // Features & Profiles
  90: [
    { patterns: [/\bprofile\b/i, /\binterview\b/i, /\bbiography\b/i, /\blife story\b/i, /\binspirational\b/i, /\bjourney\b/i], weight: 10 },
    { patterns: [/\bin depth\b/i, /\bin-depth\b/i, /\blong.read\b/i, /\bfeature\b/i, /\bfeatures\b/i, /\bexclusive\b/i, /\bspecial report\b/i], weight: 9 },
    { patterns: [/\bpioneer\b/i, /\btrailblazer\b/i, /\bvisionary\b/i, /\bleader\b/i, /\bicon\b/i, /\blegend\b/i, /\bpioneer\b/i], weight: 8 },
    { patterns: [/\bhuman interest\b/i, /\bcommunity\b/i, /\bgrassroots\b/i, /\blocal hero\b/i, /\brags to riches\b/i, /\bovercoming\b/i], weight: 7 },
  ],
  // Environment & Climate
  91: [
    { patterns: [/\benvironment\b/i, /\benvironmental\b/i, /\becology\b/i, /\bbiodiversity\b/i, /\bdeforestation\b/i, /\bconservation\b/i], weight: 10 },
    { patterns: [/\bclimate change\b/i, /\bglobal warming\b/i, /\bcarbon\b/i, /\bemission\b/i, /\bemissions\b/i, /\brenewable\b/i, /\bsustainability\b/i, /\bsustainable\b/i], weight: 9 },
    { patterns: [/\bpollution\b/i, /\bplastic\b/i, /\bocean\b/i, /\bforests?\b/i, /\bwildlife\b/i, /\bendangered\b/i, /\bcoral reef\b/i], weight: 8 },
    { patterns: [/\bsolar\b/i, /\bwind energy\b/i, /\bgeothermal\b/i, /\bhydro\b/i, /\bclean energy\b/i, /\bgreen\b/i, /\bnet zero\b/i, /\bcarbon neutral\b/i], weight: 7 },
    { patterns: [/\bdrought\b/i, /\bflood\b/i, /\bfloods\b/i, /\bwildfire\b/i, /\bheatwave\b/i, /\bweather\b/i, /\bstorm\b/i, /\bcyclone\b/i], weight: 6 },
  ],
}

const CATEGORY_NAMES: Record<number, string> = {
  80: 'World Updates',         81: 'Kenya Focus',         82: 'Politics & Governance',
  83: 'Business & Economy',    84: 'Tech & Innovation',   85: 'Health & Wellness',
  86: 'Arts & Culture',        87: 'Sports Arena',        88: 'Opinion & Analysis',
  89: 'Trending Now',          90: 'Features & Profiles', 91: 'Environment & Climate',
}

function countMatches(text: string, patterns: RegExp[]): { count: number; terms: string[] } {
  const terms = new Set<string>()
  let count = 0
  for (const pattern of patterns) {
    const matches = text.match(new RegExp(pattern.source, 'gi'))
    if (matches) {
      count += matches.length
      const example = matches[0].toLowerCase()
      if (example.length > 2) terms.add(example)
    }
  }
  return { count, terms: Array.from(terms) }
}

export function autoCategorize(input: CategorizationInput): CategorizationResult {
  const { title, content, excerpt, tags, sourceName, sourceReference, currentCategoryId } = input
  const allScores: Record<number, { score: number; terms: Set<string> }> = {}

  const cleanContent = (content || '').replace(/<[^>]+>/g, ' ').toLowerCase()
  const cleanExcerpt = (excerpt || '').replace(/<[^>]+>/g, ' ').toLowerCase()
  const cleanTitle = (title || '').toLowerCase()
  const cleanTags = (tags || []).map(t => t.toLowerCase())
  const cleanSource = (sourceName || sourceReference || '').toLowerCase()

  for (const [catIdStr, keywordSets] of Object.entries(CATEGORY_KEYWORDS)) {
    const catId = Number(catIdStr)
    let score = 0
    const matchedTerms = new Set<string>()

    for (const { patterns, weight } of keywordSets) {
      const titleMatch = countMatches(cleanTitle, patterns)
      score += titleMatch.count * weight * 3
      titleMatch.terms.forEach(t => matchedTerms.add(t))

      const excerptMatch = countMatches(cleanExcerpt, patterns)
      score += excerptMatch.count * weight * 2
      excerptMatch.terms.forEach(t => matchedTerms.add(t))

      const contentMatch = countMatches(cleanContent, patterns)
      score += contentMatch.count * weight
      contentMatch.terms.forEach(t => matchedTerms.add(t))

      for (const tag of cleanTags) {
        for (const pattern of patterns) {
          if (pattern.test(tag)) {
            score += weight * 5
            matchedTerms.add(tag)
          }
        }
      }

      const sourceMatch = countMatches(cleanSource, patterns)
      score += sourceMatch.count * weight * 2
      sourceMatch.terms.forEach(t => matchedTerms.add(t))
    }

    if (score > 0) {
      allScores[catId] = { score, terms: matchedTerms }
    }
  }

  const sorted = Object.entries(allScores)
    .map(([id, data]) => ({
      categoryId: Number(id),
      score: data.score,
      terms: Array.from(data.terms),
    }))
    .sort((a, b) => b.score - a.score)

  const topScore = sorted[0]?.score || 0
  const categories: CategoryScore[] = sorted.slice(0, 3).map(s => ({
    categoryId: s.categoryId,
    score: s.score,
    confidence: s.score >= 30 ? 'high' : s.score >= 15 ? 'medium' : 'low',
    matchedTerms: s.terms,
  }))

  const best = categories[0]
  let confidence: 'high' | 'medium' | 'low'
  let bestCategoryId: number

  if (topScore >= 30) {
    confidence = 'high'
    bestCategoryId = best.categoryId
  } else if (topScore >= 15) {
    confidence = 'medium'
    bestCategoryId = best.categoryId
  } else if (topScore >= 5) {
    confidence = 'low'
    bestCategoryId = best.categoryId
  } else if (currentCategoryId) {
    confidence = 'low'
    bestCategoryId = currentCategoryId
  } else {
    confidence = 'low'
    bestCategoryId = 89
  }

  return {
    bestCategoryId,
    scores: categories,
    confidence,
    matchedTerms: best?.matchedTerms || [],
  }
}

export function getCategoryName(id: number): string {
  return CATEGORY_NAMES[id] || 'Other'
}

export function getAllCategoryIds(): number[] {
  return Object.keys(CATEGORY_NAMES).map(Number)
}

export { CATEGORY_NAMES }

// ── Auto Tag Extraction ────────────────────────────────────────────

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
  'manufacturing':  ['manufacturing', 'factory', 'production', 'industrial', 'factory', 'assembly'],
  'media':          ['media', 'journalism', 'press', 'broadcasting', 'newspaper', 'television', 'radio'],
  'tourism':        ['tourism', 'travel', 'hotel', 'safari', 'tourist', 'destination', 'hospitality'],
  'fashion':        ['fashion', 'clothing', 'design', 'style', 'trend', 'apparel', 'couture'],
  'food':           ['food', 'cuisine', 'recipe', 'restaurant', 'chef', 'cooking', 'dining'],
  'religion':       ['religion', 'church', 'mosque', 'faith', 'spiritual', 'worship', 'bible', 'quran'],
}

export function autoExtractTags(title: string, content: string, existingTags: string[] = []): string[] {
  const text = `${title} ${content.replace(/<[^>]+>/g, ' ')}`.toLowerCase()
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

// ── Content Layout Optimization ────────────────────────────────────

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
}

function countWordsInText(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length
}

export function optimizeContentLayout(html: string): string {
  // Only optimize content longer than 400 words
  const plain = stripHtmlTags(html)
  if (countWordsInText(plain) < 400) return html

  let result = html

  // Split into paragraphs (double newline or </p> tags)
  const paragraphs = result.split(/\n\n+|<\/p>\s*<p[^>]*>/gi).filter(p => {
    const text = stripHtmlTags(p).trim()
    return text.length > 0
  })

  if (paragraphs.length < 4) return html

  const optimized: string[] = []
  let wordCountSinceHeading = 0

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const text = stripHtmlTags(para).trim()
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
