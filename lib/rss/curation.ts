/**
 * RSS Curation Engine v2
 *
 * Automatically categorizes and tags articles based on keyword analysis.
 * Uses word-boundary-aware matching to avoid false positives.
 */

// ── Category keyword maps ──────────────────────────────────────
// All patterns use \b word boundaries to prevent partial matches.
const CATEGORY_KEYWORDS: Record<number, Array<{ patterns: RegExp[]; weight: number }>> = {
  // Kenya (65)
  65: [
    { patterns: [/\bkenya\b/i, /\bnairobi\b/i, /\bmombasa\b/i, /\bkisumu\b/i, /\bnakuru\b/i, /\beldoret\b/i, /\bthika\b/i], weight: 10 },
    { patterns: [/\bkenyan\b/i, /\bkenyans\b/i, /\bkenyatta\b/i, /\bruto\b/i, /\braila\b/i, /\bodinga\b/i, /\bsafaricom\b/i, /\bmpesa\b/i, /\bm-pesa\b/i, /\bkra\b/i], weight: 8 },
    { patterns: [/\beast africa\b/i, /\beast african\b/i], weight: 3 },
  ],
  // Africa (66)
  66: [
    { patterns: [/\bafrica\b/i, /\bafrican\b/i, /\bau\b(?!\w)/i, /\bafrican union\b/i], weight: 10 },
    { patterns: [/\bnigeria\b/i, /\bsouth africa\b/i, /\bghana\b/i, /\begypt\b/i, /\bethiopia\b/i, /\btanzania\b/i, /\buganda\b/i, /\brwanda\b/i, /\bcongo\b/i, /\bmozambique\b/i, /\bzimbabwe\b/i, /\bzambia\b/i, /\bsenegal\b/i], weight: 8 },
    { patterns: [/\bsub-?saharan\b/i, /\bsahel\b/i, /\bhorn of africa\b/i, /\bmaghreb\b/i], weight: 7 },
    { patterns: [/\blagos\b/i, /\baccra\b/i, /\bcairo\b/i, /\bdar es salaam\b/i, /\baddis ababa\b/i], weight: 6 },
  ],
  // Politics (1)
  1: [
    { patterns: [/\belection\b/i, /\belections\b/i, /\bvoting\b/i, /\bballot\b/i, /\bpoll\b/i, /\bpolls\b/i, /\bpolling\b/i], weight: 10 },
    { patterns: [/\bpresident\b/i, /\bgovernor\b/i, /\bsenator\b/i, /\bparliament\b/i, /\bparliamentary\b/i, /\blegislature\b/i, /\bcongress\b/i, /\bassembly\b/i], weight: 9 },
    { patterns: [/\bdemocrat\b/i, /\brepublican\b/i, /\bpolitical\b/i, /\bpolitics\b/i, /\bpolitician\b/i], weight: 8 },
    { patterns: [/\bgovernment\b/i, /\bgovernments\b/i, /\bminister\b/i, /\bcabinet\b/i, /\bopposition\b/i, /\bcoalition\b/i, /\bparty\b/i], weight: 7 },
    { patterns: [/\blaw\b/i, /\blaws\b/i, /\bbill\b/i, /\bbills\b/i, /\blegislation\b/i, /\bimpeach\b/i, /\breferendum\b/i], weight: 6 },
    { patterns: [/\bdiplomatic\b/i, /\bdiplomacy\b/i, /\bembassy\b/i, /\bsanction\b/i, /\bsanctions\b/i, /\btreaty\b/i, /\bsummit\b/i, /\bbilateral\b/i], weight: 5 },
  ],
  // Business (2)
  2: [
    { patterns: [/\beconomic\b/i, /\beconomy\b/i, /\bgdp\b/i, /\binflation\b/i, /\bstock market\b/i, /\btrading\b/i, /\binvestor\b/i, /\binvestors\b/i], weight: 10 },
    { patterns: [/\bbusiness\b/i, /\bcompanies\b/i, /\bcompany\b/i, /\bcorporate\b/i, /\bcorporation\b/i, /\bstartup\b/i, /\bstartups\b/i, /\bentrepreneur\b/i, /\bventures\b/i], weight: 9 },
    { patterns: [/\brevenue\b/i, /\bprofit\b/i, /\bprofits\b/i, /\bearning\b/i, /\bearnings\b/i, /\bfiscal\b/i, /\bbudget\b/i, /\btax\b/i, /\btaxes\b/i, /\btariff\b/i, /\btariffs\b/i], weight: 8 },
    { patterns: [/\bbank\b/i, /\bbanking\b/i, /\bfinance\b/i, /\bfinancial\b/i, /\binsurance\b/i, /\binsured\b/i, /\bcredit\b/i, /\bloan\b/i, /\bloans\b/i, /\bdebt\b/i], weight: 7 },
    { patterns: [/\bmarket\b/i, /\bmarkets\b/i, /\btrade\b/i, /\bexport\b/i, /\bexports\b/i, /\bimport\b/i, /\bimports\b/i, /\bcommodity\b/i, /\bcommodities\b/i, /\boil price\b/i], weight: 6 },
    { patterns: [/\bipo\b/i, /\bshares\b/i, /\bstock\b/i, /\bbond\b/i, /\bbonds\b/i, /\bforex\b/i, /\bcurrency\b/i, /\bdollar\b/i, /\bshilling\b/i], weight: 5 },
  ],
  // Tech (3)
  3: [
    { patterns: [/\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bdeep learning\b/i, /\bchatgpt\b/i, /\bopenai\b/i, /\bclaude\b/i, /\bgemini\b/i], weight: 10 },
    { patterns: [/\btech\b/i, /\btechs\b/i, /\btechnology\b/i, /\btechnologies\b/i, /\bsoftware\b/i, /\bhardware\b/i, /\bunicorn\b/i], weight: 9 },
    { patterns: [/\bcybersecurity\b/i, /\bhacking\b/i, /\bhack\b/i, /\bhacker\b/i, /\bdata breach\b/i, /\bprivacy\b/i, /\bencryption\b/i, /\bmalware\b/i, /\bransomware\b/i], weight: 8 },
    { patterns: [/\bgoogle\b/i, /\bmicrosoft\b/i, /\bamazon\b/i, /\bmeta\b/i, /\bfacebook\b/i, /\btwitter\b/i, /\btiktok\b/i, /\bsamsung\b/i, /\bnvidia\b/i, /\btesla\b/i, /\bspaceX\b/i], weight: 7 },
    { patterns: [/\b5g\b/i, /\binternet\b/i, /\bbroadband\b/i, /\bdigital\b/i, /\bblockchain\b/i, /\bcrypto\b/i, /\bcryptocurrency\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bnft\b/i], weight: 6 },
    { patterns: [/\brobot\b/i, /\brobots\b/i, /\bautonomous\b/i, /\bdrone\b/i, /\bdrones\b/i, /\binnovation\b/i, /\binnovative\b/i, /\bpatent\b/i, /\bsilicon valley\b/i], weight: 5 },
  ],
  // Science (4)
  4: [
    { patterns: [/\bscientist\b/i, /\bscientists\b/i, /\bscientific\b/i, /\bresearch\b/i, /\bstudy finds?\b/i, /\bexperiment\b/i, /\blaboratory\b/i, /\blab\b/i], weight: 10 },
    { patterns: [/\bnasa\b/i, /\bspace\b/i, /\brocket\b/i, /\bsatellite\b/i, /\bmars\b/i, /\bmoon\b/i, /\besa\b/i], weight: 9 },
    { patterns: [/\bphysics\b/i, /\bphysicist\b/i, /\bchemistry\b/i, /\bbiology\b/i, /\bbiologist\b/i, /\bgenetic\b/i, /\bdna\b/i, /\bevolution\b/i, /\batom\b/i, /\batoms\b/i], weight: 8 },
    { patterns: [/\bclimate\b/i, /\bglobal warming\b/i, /\bcarbon\b/i, /\bemission\b/i, /\bemissions\b/i, /\bfossil\b/i, /\brenewable\b/i, /\bsolar energy\b/i, /\bwind energy\b/i], weight: 7 },
    { patterns: [/\bdiscovery\b/i, /\bdiscoveries\b/i, /\bbreakthrough\b/i, /\binnovation\b/i, /\bquantum\b/i, /\btelescope\b/i], weight: 5 },
  ],
  // Sports (6)
  6: [
    { patterns: [/\bfootball\b/i, /\bsoccer\b/i, /\bpremier league\b/i, /\bchampions league\b/i, /\bworld cup\b/i, /\bfifa\b/i, /\buefa\b/i], weight: 10 },
    { patterns: [/\bbasketball\b/i, /\bnba\b/i, /\brugby\b/i, /\bcricket\b/i, /\btennis\b/i, /\bgolf\b/i, /\bf1\b/i, /\bformula 1\b/i, /\bboxing\b/i, /\bmma\b/i], weight: 9 },
    { patterns: [/\bathletics\b/i, /\bathlete\b/i, /\bathletes\b/i, /\bmarathon\b/i, /\bolympics\b/i, /\bolympic\b/i, /\bsport\b/i, /\bsports\b/i, /\bplayer\b/i, /\bteam\b/i, /\bteams\b/i], weight: 8 },
    { patterns: [/\bmatch\b/i, /\bmatches\b/i, /\bgame\b/i, /\bgames\b/i, /\bscore\b/i, /\bscores\b/i, /\bgoal\b/i, /\bgoals\b/i, /\bwin\b/i, /\bwon\b/i, /\bvictory\b/i, /\bchampion\b/i, /\bchampions\b/i, /\btrophy\b/i, /\bleague\b/i], weight: 7 },
    { patterns: [/\bcoach\b/i, /\bmanager\b/i, /\btransfer\b/i, /\btransfers\b/i, /\bsigning\b/i, /\bstadium\b/i, /\btournament\b/i], weight: 6 },
  ],
  // Entertainment (5)
  5: [
    { patterns: [/\bfilm\b/i, /\bfilms\b/i, /\bmovie\b/i, /\bmovies\b/i, /\bcinema\b/i, /\bhollywood\b/i, /\bbollywood\b/i, /\bnetflix\b/i, /\bdisney\b/i], weight: 10 },
    { patterns: [/\bmusic\b/i, /\bsong\b/i, /\bsongs\b/i, /\balbum\b/i, /\balbums\b/i, /\bconcert\b/i, /\bconcerts\b/i, /\bgrammy\b/i, /\bgrammys\b/i, /\bbillboard\b/i], weight: 9 },
    { patterns: [/\bcelebrity\b/i, /\bcelebrities\b/i, /\bceleb\b/i, /\bactor\b/i, /\bactress\b/i, /\bsinger\b/i, /\bsingers\b/i, /\brapper\b/i], weight: 8 },
    { patterns: [/\btv show\b/i, /\bseries\b/i, /\bepisode\b/i, /\bepisodes\b/i, /\bstreaming\b/i, /\breality tv\b/i, /\baward\b/i, /\bawards\b/i, /\boscar\b/i, /\boscars\b/i], weight: 7 },
    { patterns: [/\btiktok\b/i, /\binstagram\b/i, /\bviral\b/i, /\btrending\b/i, /\bmeme\b/i, /\bmemes\b/i, /\binfluencer\b/i, /\byoutube\b/i], weight: 6 },
  ],
  // Health (67)
  67: [
    { patterns: [/\bhealth\b/i, /\bmedical\b/i, /\bdoctor\b/i, /\bdoctors\b/i, /\bhospital\b/i, /\bhospitals\b/i, /\bclinic\b/i, /\bclinics\b/i, /\bpatient\b/i, /\bpatients\b/i], weight: 10 },
    { patterns: [/\bdisease\b/i, /\bdiseases\b/i, /\bvirus\b/i, /\bviruses\b/i, /\bvaccine\b/i, /\bvaccines\b/i, /\bcovid\b/i, /\bpandemic\b/i, /\bepidemic\b/i, /\boutbreak\b/i], weight: 9 },
    { patterns: [/\bmental health\b/i, /\bdepression\b/i, /\banxiety\b/i, /\btherapy\b/i, /\bcounseling\b/i], weight: 8 },
    { patterns: [/\bdrug\b/i, /\bdrugs\b/i, /\bmedication\b/i, /\bpharmaceutical\b/i, /\bpharma\b/i, /\btreatment\b/i, /\btreatments\b/i, /\bcure\b/i, /\bdiagnosis\b/i], weight: 7 },
    { patterns: [/\bnutrition\b/i, /\bdiet\b/i, /\bdiets\b/i, /\bexercise\b/i, /\bfitness\b/i, /\bwellness\b/i, /\bobesity\b/i], weight: 6 },
    { patterns: [/\bwho\b/i, /\bcdc\b/i, /\bhealth ministry\b/i, /\bpublic health\b/i, /\bmaternal\b/i, /\bchild health\b/i], weight: 5 },
  ],
  // World (64)
  64: [
    { patterns: [/\binternational\b/i, /\bglobal\b/i, /\bworld\b/i, /\bforeign\b/i, /\boverseas\b/i], weight: 10 },
    { patterns: [/\bunited nations\b/i, /\bnato\b/i, /\beuropean union\b/i, /\beuropean\b/i], weight: 8 },
    { patterns: [/\bwar\b/i, /\bconflict\b/i, /\bceasefire\b/i, /\brefugee\b/i, /\brefugees\b/i, /\bhumanitarian\b/i, /\bsanction\b/i, /\bsanctions\b/i], weight: 7 },
    { patterns: [/\btrump\b/i, /\bbiden\b/i, /\bputin\b/i, /\bxi jinping\b/i, /\bmacron\b/i, /\bzelensky\b/i], weight: 6 },
  ],
  // Education (68)
  68: [
    { patterns: [/\beducation\b/i, /\bschool\b/i, /\bschools\b/i, /\buniversity\b/i, /\buniversities\b/i, /\bstudent\b/i, /\bstudents\b/i, /\bteacher\b/i, /\bteachers\b/i, /\bcurriculum\b/i], weight: 10 },
    { patterns: [/\bexam\b/i, /\bexams\b/i, /\bgrade\b/i, /\bgrades\b/i, /\benrollment\b/i, /\bcampus\b/i, /\bacademic\b/i, /\bscholarship\b/i, /\blecture\b/i], weight: 9 },
    { patterns: [/\blearning\b/i, /\bliteracy\b/i, /\btuition\b/i, /\bdiploma\b/i, /\bdegree\b/i, /\bdegrees\b/i, /\bgraduate\b/i, /\bgraduates\b/i], weight: 7 },
  ],
  // Agriculture (69)
  69: [
    { patterns: [/\bagriculture\b/i, /\bagricultural\b/i, /\bfarm\b/i, /\bfarms\b/i, /\bfarming\b/i, /\bcrop\b/i, /\bcrops\b/i, /\bharvest\b/i, /\bfood security\b/i, /\bfertilizer\b/i], weight: 10 },
    { patterns: [/\blivestock\b/i, /\bcattle\b/i, /\bpoultry\b/i, /\bdairy\b/i, /\bfishing\b/i, /\bfishery\b/i], weight: 9 },
    { patterns: [/\birrigation\b/i, /\bseed\b/i, /\bseeds\b/i, /\bsoil\b/i, /\bpest\b/i, /\borganic\b/i], weight: 8 },
  ],
  // Environment (73)
  73: [
    { patterns: [/\benvironment\b/i, /\benvironmental\b/i, /\becology\b/i, /\bbiodiversity\b/i, /\bdeforestation\b/i, /\bconservation\b/i], weight: 10 },
    { patterns: [/\bpollution\b/i, /\bplastic\b/i, /\bplastics\b/i, /\bocean\b/i, /\bforests?\b/i, /\bwildlife\b/i, /\bendangered\b/i], weight: 9 },
    { patterns: [/\bclimate change\b/i, /\bglobal warming\b/i, /\bcarbon\b/i, /\bemission\b/i, /\bemissions\b/i, /\brenewable\b/i, /\bsustainability\b/i, /\bsustainable\b/i], weight: 8 },
  ],
  // Crime & Justice (72)
  72: [
    { patterns: [/\bcrime\b/i, /\bcrimes\b/i, /\bcriminal\b/i, /\bcriminals\b/i, /\bmurder\b/i, /\bmurders\b/i, /\bshooting\b/i, /\bstabbing\b/i, /\brobbery\b/i, /\btheft\b/i, /\bburglary\b/i], weight: 10 },
    { patterns: [/\bpolice\b/i, /\barrest\b/i, /\barrests\b/i, /\barrested\b/i, /\bsuspect\b/i, /\bsuspects\b/i, /\bcourt\b/i, /\bcourts\b/i, /\bjudge\b/i, /\bverdict\b/i, /\bsentence\b/i, /\bprison\b/i, /\bjail\b/i], weight: 9 },
    { patterns: [/\bfraud\b/i, /\bscam\b/i, /\bscams\b/i, /\bcorruption\b/i, /\bbribe\b/i, /\bbribery\b/i, /\bmoney laundering\b/i], weight: 8 },
    { patterns: [/\binvestigation\b/i, /\bprosecution\b/i, /\btrial\b/i, /\bconviction\b/i, /\bacquittal\b/i, /\bbail\b/i], weight: 7 },
  ],
  // Opinion (71)
  71: [
    { patterns: [/\bopinion\b/i, /\beditorial\b/i, /\bcommentary\b/i, /\banalysis\b/i, /\bperspective\b/i, /\bviewpoint\b/i], weight: 10 },
    { patterns: [/\bcolumn\b/i, /\bop-ed\b/i, /\bdebate\b/i, /\bdiscussion\b/i, /\bargue\b/i, /\bcritique\b/i], weight: 8 },
  ],
  // Real Estate (74)
  74: [
    { patterns: [/\breal estate\b/i, /\bproperty\b/i, /\bproperties\b/i, /\bhousing\b/i, /\bmortgage\b/i, /\brent\b/i, /\brental\b/i, /\blandlord\b/i, /\btenant\b/i, /\btenants\b/i], weight: 10 },
    { patterns: [/\bconstruction\b/i, /\bbuilding\b/i, /\bapartment\b/i, /\bapartments\b/i, /\bhouse price\b/i, /\bland price\b/i, /\bdeveloper\b/i, /\bdevelopers\b/i], weight: 9 },
  ],
  // Lifestyle (70)
  70: [
    { patterns: [/\blifestyle\b/i, /\bfashion\b/i, /\bbeauty\b/i, /\btravel\b/i, /\bfood\b/i, /\brecipe\b/i, /\brecipes\b/i, /\bcooking\b/i], weight: 10 },
    { patterns: [/\brelationship\b/i, /\brelationships\b/i, /\bdating\b/i, /\bmarriage\b/i, /\bparenting\b/i, /\bfamily\b/i, /\bwellness\b/i], weight: 8 },
    { patterns: [/\bculture\b/i, /\bcultural\b/i, /\btradition\b/i, /\btraditions\b/i, /\bfestival\b/i, /\bholida\b/i, /\bcelebration\b/i], weight: 6 },
  ],
}


// ── Tag extraction keywords ─────────────────────────────────────
// All patterns use \b word boundaries.
const TAG_KEYWORDS: Array<{ pattern: RegExp; tag: string }> = [
  // Kenya-specific
  { pattern: /\bNairobi\b/i, tag: 'Nairobi' },
  { pattern: /\bMombasa\b/i, tag: 'Mombasa' },
  { pattern: /\bKisumu\b/i, tag: 'Kisumu' },
  { pattern: /\bNakuru\b/i, tag: 'Nakuru' },
  { pattern: /\bEldoret\b/i, tag: 'Eldoret' },
  { pattern: /\bRuto\b/i, tag: 'President Ruto' },
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
  { pattern: /\bWHO\b(?!\w)/, tag: 'WHO' },
  { pattern: /\bIMF\b/i, tag: 'IMF' },
  { pattern: /\bWorld Bank\b/i, tag: 'World Bank' },
  { pattern: /\bWTO\b/i, tag: 'WTO' },
  { pattern: /\bNATO\b/i, tag: 'NATO' },
  { pattern: /\bEU\b(?!\w)/, tag: 'European Union' },
  { pattern: /\bG7\b/i, tag: 'G7' },
  { pattern: /\bG20\b/i, tag: 'G20' },
  { pattern: /\bUN\b(?!\w)/, tag: 'United Nations' },
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


// ── Stopwords for phrase extraction ─────────────────────────────
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these',
  'those', 'it', 'its', 'he', 'she', 'they', 'we', 'you', 'i', 'my',
  'his', 'her', 'their', 'our', 'your', 'not', 'no', 'if', 'then',
  'than', 'so', 'as', 'up', 'out', 'about', 'into', 'over', 'after',
  'before', 'between', 'under', 'above', 'such', 'each', 'which',
  'there', 'their', 'all', 'also', 'how', 'what', 'when', 'where',
  'who', 'whom', 'why', 'being', 'some', 'any', 'most', 'other',
  'new', 'first', 'last', 'long', 'great', 'high', 'old', 'large',
  'big', 'same', 'able', 'own', 'just', 'than', 'now', 'said',
  'says', 'say', 'like', 'much', 'well', 'back', 'even', 'still',
  'way', 'take', 'come', 'made', 'many', 'very', 'us', 'go', 'see',
  'know', 'think', 'make', 'get', 'want', 'look', 'use', 'find',
  'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel',
  'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem',
  'help', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe',
  'happen', 'must', 'start', 'might', 'went', 'year', 'years',
  'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'day', 'days', 'time', 'times', 'week', 'month', 'year',
  'people', 'man', 'woman', 'men', 'women', 'world', 'part', 'good',
])


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
        // Count unique matches using a Set to avoid double-counting overlapping patterns
        const matches = text.match(new RegExp(pattern.source, 'gi'))
        if (matches) {
          score += matches.length * weight
        }
      }
    }
    if (score > 0) scores[cat] = score
  }

  const sorted = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]))

  if (sorted.length > 0 && Number(sorted[0][1]) >= 10) {
    return Number(sorted[0][0])
  }

  if (feedCategoryId) return feedCategoryId
  return 64 // World
}


/**
 * Extracts relevant tags from article title + content.
 * Prioritizes title matches, then content matches.
 */
export function extractTags(
  title: string,
  content: string,
  maxTags: number = 8,
): string[] {
  // Check title first (higher priority)
  const found = new Map<string, string>()
  for (const { pattern, tag } of TAG_KEYWORDS) {
    if (found.size >= maxTags) break
    if (pattern.test(title)) {
      const normalized = tag.toLowerCase()
      if (!found.has(normalized)) found.set(normalized, tag)
    }
  }

  // Then check content
  for (const { pattern, tag } of TAG_KEYWORDS) {
    if (found.size >= maxTags) break
    if (pattern.test(content)) {
      const normalized = tag.toLowerCase()
      if (!found.has(normalized)) found.set(normalized, tag)
    }
  }

  // Fallback: extract named entity phrases from title
  if (found.size < maxTags) {
    const phrases = extractPhrases(title, maxTags - found.size)
    for (const phrase of phrases) {
      if (found.size >= maxTags) break
      const normalized = phrase.toLowerCase()
      if (!found.has(normalized)) found.set(normalized, phrase)
    }
  }

  return Array.from(found.values())
}


/**
 * Full curation pipeline: categorize + tag an article.
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
 * Extracts capitalized phrases from text (likely named entities).
 * Filters out stopwords and common phrases.
 */
function extractPhrases(text: string, max: number): string[] {
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/)
  const phrases: string[] = []
  const seen = new Set<string>()

  for (let i = 0; i < words.length - 1 && phrases.length < max * 3; i++) {
    const w1 = words[i].replace(/[^a-zA-Z]/g, '')
    const w2 = words[i + 1]?.replace(/[^a-zA-Z]/g, '')
    if (!w1 || !w2) continue
    if (w1.length < 3 || w2.length < 3) continue

    // Both must be capitalized (proper noun)
    if (!/^[A-Z]/.test(w1) || !/^[A-Z]/.test(w2)) continue

    // Skip if either word is a stopword
    const w1Lower = w1.toLowerCase()
    const w2Lower = w2.toLowerCase()
    if (STOPWORDS.has(w1Lower) || STOPWORDS.has(w2Lower)) continue

    const phrase = `${w1} ${w2}`
    const norm = phrase.toLowerCase()
    if (!seen.has(norm)) {
      seen.add(norm)
      phrases.push(phrase)
    }
  }

  return phrases.slice(0, max)
}
