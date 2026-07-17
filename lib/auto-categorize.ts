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

const CATEGORY_KEYWORDS: Record<number, KeywordEntry[]> = {
  65: [
    { patterns: [/\bkenya\b/i, /\bnairobi\b/i, /\bmombasa\b/i, /\bkisumu\b/i, /\bnakuru\b/i, /\beldoret\b/i, /\bthika\b/i], weight: 10 },
    { patterns: [/\bkenyan\b/i, /\bkenyans\b/i, /\bkenyatta\b/i, /\bruto\b/i, /\braila\b/i, /\bodinga\b/i, /\bsafaricom\b/i, /\bmpesa\b/i, /\bm-pesa\b/i, /\bkra\b/i], weight: 8 },
    { patterns: [/\beast africa\b/i, /\beast african\b/i], weight: 3 },
  ],
  66: [
    { patterns: [/\bafrica\b/i, /\bafrican\b/i, /\bau\b(?!\w)/i, /\bafrican union\b/i], weight: 10 },
    { patterns: [/\bnigeria\b/i, /\bsouth africa\b/i, /\bghana\b/i, /\begypt\b/i, /\bethiopia\b/i, /\btanzania\b/i, /\buganda\b/i, /\brwanda\b/i, /\bcongo\b/i, /\bmozambique\b/i, /\bzimbabwe\b/i, /\bzambia\b/i, /\bsenegal\b/i], weight: 8 },
    { patterns: [/\bsub-?saharan\b/i, /\bsahel\b/i, /\bhorn of africa\b/i, /\bmaghreb\b/i], weight: 7 },
    { patterns: [/\blagos\b/i, /\baccra\b/i, /\bcairo\b/i, /\bdar es salaam\b/i, /\baddis ababa\b/i], weight: 6 },
  ],
  1: [
    { patterns: [/\belection\b/i, /\belections\b/i, /\bvoting\b/i, /\bballot\b/i, /\bpoll\b/i, /\bpolls\b/i, /\bpolling\b/i], weight: 10 },
    { patterns: [/\bpresident\b/i, /\bgovernor\b/i, /\bsenator\b/i, /\bparliament\b/i, /\bparliamentary\b/i, /\blegislature\b/i, /\bcongress\b/i, /\bassembly\b/i], weight: 9 },
    { patterns: [/\bdemocrat\b/i, /\brepublican\b/i, /\bpolitical\b/i, /\bpolitics\b/i, /\bpolitician\b/i], weight: 8 },
    { patterns: [/\bgovernment\b/i, /\bgovernments\b/i, /\bminister\b/i, /\bcabinet\b/i, /\bopposition\b/i, /\bcoalition\b/i, /\bparty\b/i], weight: 7 },
    { patterns: [/\blaw\b/i, /\blaws\b/i, /\bbill\b/i, /\bbills\b/i, /\blegislation\b/i, /\bimpeach\b/i, /\breferendum\b/i], weight: 6 },
    { patterns: [/\bdiplomatic\b/i, /\bdiplomacy\b/i, /\bembassy\b/i, /\bsanction\b/i, /\bsanctions\b/i, /\btreaty\b/i, /\bsummit\b/i, /\bbilateral\b/i], weight: 5 },
  ],
  2: [
    { patterns: [/\beconomic\b/i, /\beconomy\b/i, /\bgdp\b/i, /\binflation\b/i, /\bstock market\b/i, /\btrading\b/i, /\binvestor\b/i, /\binvestors\b/i], weight: 10 },
    { patterns: [/\bbusiness\b/i, /\bcompanies\b/i, /\bcompany\b/i, /\bcorporate\b/i, /\bcorporation\b/i, /\bstartup\b/i, /\bstartups\b/i, /\bentrepreneur\b/i, /\bventures\b/i], weight: 9 },
    { patterns: [/\brevenue\b/i, /\bprofit\b/i, /\bprofits\b/i, /\bearning\b/i, /\bearnings\b/i, /\bfiscal\b/i, /\bbudget\b/i, /\btax\b/i, /\btaxes\b/i, /\btariff\b/i, /\btariffs\b/i], weight: 8 },
    { patterns: [/\bbank\b/i, /\bbanking\b/i, /\bfinance\b/i, /\bfinancial\b/i, /\binsurance\b/i, /\binsured\b/i, /\bcredit\b/i, /\bloan\b/i, /\bloans\b/i, /\bdebt\b/i], weight: 7 },
    { patterns: [/\bmarket\b/i, /\bmarkets\b/i, /\btrade\b/i, /\bexport\b/i, /\bexports\b/i, /\bimport\b/i, /\bimports\b/i, /\bcommodity\b/i, /\bcommodities\b/i, /\boil price\b/i], weight: 6 },
    { patterns: [/\bipo\b/i, /\bshares\b/i, /\bstock\b/i, /\bbond\b/i, /\bbonds\b/i, /\bforex\b/i, /\bcurrency\b/i, /\bdollar\b/i, /\bshilling\b/i], weight: 5 },
  ],
  3: [
    { patterns: [/\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bdeep learning\b/i, /\bchatgpt\b/i, /\bopenai\b/i, /\bclaude\b/i, /\bgemini\b/i], weight: 10 },
    { patterns: [/\btech\b/i, /\btechs\b/i, /\btechnology\b/i, /\btechnologies\b/i, /\bsoftware\b/i, /\bhardware\b/i, /\bunicorn\b/i], weight: 9 },
    { patterns: [/\bcybersecurity\b/i, /\bhacking\b/i, /\bhack\b/i, /\bhacker\b/i, /\bdata breach\b/i, /\bprivacy\b/i, /\bencryption\b/i, /\bmalware\b/i, /\bransomware\b/i], weight: 8 },
    { patterns: [/\bgoogle\b/i, /\bmicrosoft\b/i, /\bamazon\b/i, /\bmeta\b/i, /\bfacebook\b/i, /\btwitter\b/i, /\btiktok\b/i, /\bsamsung\b/i, /\bnvidia\b/i, /\btesla\b/i, /\bspaceX\b/i], weight: 7 },
    { patterns: [/\b5g\b/i, /\binternet\b/i, /\bbroadband\b/i, /\bdigital\b/i, /\bblockchain\b/i, /\bcrypto\b/i, /\bcryptocurrency\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bnft\b/i], weight: 6 },
    { patterns: [/\brobot\b/i, /\brobots\b/i, /\bautonomous\b/i, /\bdrone\b/i, /\bdrones\b/i, /\binnovation\b/i, /\binnovative\b/i, /\bpatent\b/i, /\bsilicon valley\b/i], weight: 5 },
  ],
  4: [
    { patterns: [/\bscientist\b/i, /\bscientists\b/i, /\bscientific\b/i, /\bresearch\b/i, /\bstudy finds?\b/i, /\bexperiment\b/i, /\blaboratory\b/i, /\blab\b/i], weight: 10 },
    { patterns: [/\bnasa\b/i, /\bspace\b/i, /\brocket\b/i, /\bsatellite\b/i, /\bmars\b/i, /\bmoon\b/i, /\besa\b/i], weight: 9 },
    { patterns: [/\bphysics\b/i, /\bphysicist\b/i, /\bchemistry\b/i, /\bbiology\b/i, /\bbiologist\b/i, /\bgenetic\b/i, /\bdna\b/i, /\bevolution\b/i, /\batom\b/i, /\batoms\b/i], weight: 8 },
    { patterns: [/\bclimate\b/i, /\bglobal warming\b/i, /\bcarbon\b/i, /\bemission\b/i, /\bemissions\b/i, /\bfossil\b/i, /\brenewable\b/i, /\bsolar energy\b/i, /\bwind energy\b/i], weight: 7 },
    { patterns: [/\bdiscovery\b/i, /\bdiscoveries\b/i, /\bbreakthrough\b/i, /\binnovation\b/i, /\bquantum\b/i, /\btelescope\b/i], weight: 5 },
  ],
  6: [
    { patterns: [/\bfootball\b/i, /\bsoccer\b/i, /\bpremier league\b/i, /\bchampions league\b/i, /\bworld cup\b/i, /\bfifa\b/i, /\buefa\b/i], weight: 10 },
    { patterns: [/\bbasketball\b/i, /\bnba\b/i, /\brugby\b/i, /\bcricket\b/i, /\btennis\b/i, /\bgolf\b/i, /\bf1\b/i, /\bformula 1\b/i, /\bboxing\b/i, /\bmma\b/i], weight: 9 },
    { patterns: [/\bathletics\b/i, /\bathlete\b/i, /\bathletes\b/i, /\bmarathon\b/i, /\bolympics\b/i, /\bolympic\b/i, /\bsport\b/i, /\bsports\b/i, /\bplayer\b/i, /\bteam\b/i, /\bteams\b/i], weight: 8 },
    { patterns: [/\bmatch\b/i, /\bmatches\b/i, /\bgame\b/i, /\bgames\b/i, /\bscore\b/i, /\bscores\b/i, /\bgoal\b/i, /\bgoals\b/i, /\bwin\b/i, /\bwon\b/i, /\bvictory\b/i, /\bchampion\b/i, /\bchampions\b/i, /\btrophy\b/i, /\bleague\b/i], weight: 7 },
    { patterns: [/\bcoach\b/i, /\bmanager\b/i, /\btransfer\b/i, /\btransfers\b/i, /\bsigning\b/i, /\bstadium\b/i, /\btournament\b/i], weight: 6 },
  ],
  5: [
    { patterns: [/\bfilm\b/i, /\bfilms\b/i, /\bmovie\b/i, /\bmovies\b/i, /\bcinema\b/i, /\bhollywood\b/i, /\bbollywood\b/i, /\bnetflix\b/i, /\bdisney\b/i], weight: 10 },
    { patterns: [/\bmusic\b/i, /\bsong\b/i, /\bsongs\b/i, /\balbum\b/i, /\balbums\b/i, /\bconcert\b/i, /\bconcerts\b/i, /\bgrammy\b/i, /\bgrammys\b/i, /\bbillboard\b/i], weight: 9 },
    { patterns: [/\bcelebrity\b/i, /\bcelebrities\b/i, /\bceleb\b/i, /\bactor\b/i, /\bactress\b/i, /\bsinger\b/i, /\bsingers\b/i, /\brapper\b/i], weight: 8 },
    { patterns: [/\btv show\b/i, /\bseries\b/i, /\bepisode\b/i, /\bepisodes\b/i, /\bstreaming\b/i, /\breality tv\b/i, /\baward\b/i, /\bawards\b/i, /\boscar\b/i, /\boscars\b/i], weight: 7 },
    { patterns: [/\btiktok\b/i, /\binstagram\b/i, /\bviral\b/i, /\btrending\b/i, /\bmeme\b/i, /\bmemes\b/i, /\binfluencer\b/i, /\byoutube\b/i], weight: 6 },
  ],
  67: [
    { patterns: [/\bhealth\b/i, /\bmedical\b/i, /\bdoctor\b/i, /\bdoctors\b/i, /\bhospital\b/i, /\bhospitals\b/i, /\bclinic\b/i, /\bclinics\b/i, /\bpatient\b/i, /\bpatients\b/i], weight: 10 },
    { patterns: [/\bdisease\b/i, /\bdiseases\b/i, /\bvirus\b/i, /\bviruses\b/i, /\bvaccine\b/i, /\bvaccines\b/i, /\bcovid\b/i, /\bpandemic\b/i, /\bepidemic\b/i, /\boutbreak\b/i], weight: 9 },
    { patterns: [/\bmental health\b/i, /\bdepression\b/i, /\banxiety\b/i, /\btherapy\b/i, /\bcounseling\b/i], weight: 8 },
    { patterns: [/\bdrug\b/i, /\bdrugs\b/i, /\bmedication\b/i, /\bpharmaceutical\b/i, /\bpharma\b/i, /\btreatment\b/i, /\btreatments\b/i, /\bcure\b/i, /\bdiagnosis\b/i], weight: 7 },
    { patterns: [/\bnutrition\b/i, /\bdiet\b/i, /\bdiets\b/i, /\bexercise\b/i, /\bfitness\b/i, /\bwellness\b/i, /\bobesity\b/i], weight: 6 },
    { patterns: [/\bwho\b/i, /\bcdc\b/i, /\bhealth ministry\b/i, /\bpublic health\b/i, /\bmaternal\b/i, /\bchild health\b/i], weight: 5 },
  ],
  64: [
    { patterns: [/\binternational\b/i, /\bglobal\b/i, /\bworld\b/i, /\bforeign\b/i, /\boverseas\b/i], weight: 10 },
    { patterns: [/\bunited nations\b/i, /\bnato\b/i, /\beuropean union\b/i, /\beuropean\b/i], weight: 8 },
    { patterns: [/\bwar\b/i, /\bconflict\b/i, /\bceasefire\b/i, /\brefugee\b/i, /\brefugees\b/i, /\bhumanitarian\b/i, /\bsanction\b/i, /\bsanctions\b/i], weight: 7 },
    { patterns: [/\btrump\b/i, /\bbiden\b/i, /\bputin\b/i, /\bxi jinping\b/i, /\bmacron\b/i, /\bzelensky\b/i], weight: 6 },
    { patterns: [/\breuters\b/i, /\bap\b(?!\w)/i, /\bagence france-presse\b/i], weight: 5 },
  ],
  68: [
    { patterns: [/\beducation\b/i, /\bschool\b/i, /\bschools\b/i, /\buniversity\b/i, /\buniversities\b/i, /\bstudent\b/i, /\bstudents\b/i, /\bteacher\b/i, /\bteachers\b/i, /\bcurriculum\b/i], weight: 10 },
    { patterns: [/\bexam\b/i, /\bexams\b/i, /\bgrade\b/i, /\bgrades\b/i, /\benrollment\b/i, /\bcampus\b/i, /\bacademic\b/i, /\bscholarship\b/i, /\blecture\b/i], weight: 9 },
    { patterns: [/\blearning\b/i, /\bliteracy\b/i, /\btuition\b/i, /\bdiploma\b/i, /\bdegree\b/i, /\bdegrees\b/i, /\bgraduate\b/i, /\bgraduates\b/i], weight: 7 },
  ],
  69: [
    { patterns: [/\bagriculture\b/i, /\bagricultural\b/i, /\bfarm\b/i, /\bfarms\b/i, /\bfarming\b/i, /\bcrop\b/i, /\bcrops\b/i, /\bharvest\b/i, /\bfood security\b/i, /\bfertilizer\b/i], weight: 10 },
    { patterns: [/\blivestock\b/i, /\bcattle\b/i, /\bpoultry\b/i, /\bdairy\b/i, /\bfishing\b/i, /\bfishery\b/i], weight: 9 },
    { patterns: [/\birrigation\b/i, /\bseed\b/i, /\bseeds\b/i, /\bsoil\b/i, /\bpest\b/i, /\borganic\b/i], weight: 8 },
  ],
  73: [
    { patterns: [/\benvironment\b/i, /\benvironmental\b/i, /\becology\b/i, /\bbiodiversity\b/i, /\bdeforestation\b/i, /\bconservation\b/i], weight: 10 },
    { patterns: [/\bpollution\b/i, /\bplastic\b/i, /\bplastics\b/i, /\bocean\b/i, /\bforests?\b/i, /\bwildlife\b/i, /\bendangered\b/i], weight: 9 },
    { patterns: [/\bclimate change\b/i, /\bglobal warming\b/i, /\bcarbon\b/i, /\bemission\b/i, /\bemissions\b/i, /\brenewable\b/i, /\bsustainability\b/i, /\bsustainable\b/i], weight: 8 },
  ],
  72: [
    { patterns: [/\bcrime\b/i, /\bcrimes\b/i, /\bcriminal\b/i, /\bcriminals\b/i, /\bmurder\b/i, /\bmurders\b/i, /\bshooting\b/i, /\bstabbing\b/i, /\brobbery\b/i, /\btheft\b/i, /\bburglary\b/i], weight: 10 },
    { patterns: [/\bpolice\b/i, /\barrest\b/i, /\barrests\b/i, /\barrested\b/i, /\bsuspect\b/i, /\bsuspects\b/i, /\bcourt\b/i, /\bcourts\b/i, /\bjudge\b/i, /\bverdict\b/i, /\bsentence\b/i, /\bprison\b/i, /\bjail\b/i], weight: 9 },
    { patterns: [/\bfraud\b/i, /\bscam\b/i, /\bscams\b/i, /\bcorruption\b/i, /\bbribe\b/i, /\bbribery\b/i, /\bmoney laundering\b/i], weight: 8 },
    { patterns: [/\binvestigation\b/i, /\bprosecution\b/i, /\btrial\b/i, /\bconviction\b/i, /\bacquittal\b/i, /\bbail\b/i], weight: 7 },
  ],
  71: [
    { patterns: [/\bopinion\b/i, /\beditorial\b/i, /\bcommentary\b/i, /\banalysis\b/i, /\bperspective\b/i, /\bviewpoint\b/i], weight: 10 },
    { patterns: [/\bcolumn\b/i, /\bop-ed\b/i, /\bdebate\b/i, /\bdiscussion\b/i, /\bargue\b/i, /\bcritique\b/i], weight: 8 },
  ],
  74: [
    { patterns: [/\breal estate\b/i, /\bproperty\b/i, /\bproperties\b/i, /\bhousing\b/i, /\bmortgage\b/i, /\brent\b/i, /\brental\b/i, /\blandlord\b/i, /\btenant\b/i, /\btenants\b/i], weight: 10 },
    { patterns: [/\bconstruction\b/i, /\bbuilding\b/i, /\bapartment\b/i, /\bapartments\b/i, /\bhouse price\b/i, /\bland price\b/i, /\bdeveloper\b/i, /\bdevelopers\b/i], weight: 9 },
  ],
  70: [
    { patterns: [/\blifestyle\b/i, /\bfashion\b/i, /\bbeauty\b/i, /\btravel\b/i, /\bfood\b/i, /\brecipe\b/i, /\brecipes\b/i, /\bcooking\b/i], weight: 10 },
    { patterns: [/\brelationship\b/i, /\brelationships\b/i, /\bdating\b/i, /\bmarriage\b/i, /\bparenting\b/i, /\bfamily\b/i, /\bwellness\b/i], weight: 8 },
    { patterns: [/\bculture\b/i, /\bcultural\b/i, /\btradition\b/i, /\btraditions\b/i, /\bfestival\b/i, /\bholida\b/i, /\bcelebration\b/i], weight: 6 },
  ],
}

const CATEGORY_NAMES: Record<number, string> = {
  65: 'Kenya', 66: 'Africa', 1: 'Politics', 2: 'Business',
  3: 'Tech', 4: 'Science', 6: 'Sports', 5: 'Entertainment',
  67: 'Health', 64: 'World', 68: 'Education', 69: 'Agriculture',
  73: 'Environment', 72: 'Crime & Justice', 71: 'Opinion',
  74: 'Real Estate', 70: 'Lifestyle',
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
    bestCategoryId = 64
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
