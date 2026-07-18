/**
 * RSS Curation Engine v3
 *
 * Automatically categorizes and tags articles based on keyword analysis.
 * Uses word-boundary-aware matching to avoid false positives.
 *
 * Category IDs match the 12-category taxonomy from migration 20260718091047:
 *   80 World Updates          81 Kenya Focus           82 Politics & Governance
 *   83 Business & Economy     84 Tech & Innovation     85 Health & Wellness
 *   86 Arts & Culture         87 Sports Arena          88 Opinion & Analysis
 *   89 Trending Now           90 Features & Profiles   91 Environment & Climate
 */

// ── Category keyword maps ──────────────────────────────────────
const CATEGORY_KEYWORDS: Record<number, Array<{ patterns: RegExp[]; weight: number }>> = {
  // World Updates (80)
  80: [
    { patterns: [/\binternational\b/i, /\bglobal\b/i, /\bworld\b/i, /\bforeign\b/i, /\boverseas\b/i], weight: 10 },
    { patterns: [/\bunited nations\b/i, /\bnato\b/i, /\beuropean union\b/i, /\beuropean\b/i, /\bbrics\b/i], weight: 9 },
    { patterns: [/\bwar\b/i, /\bconflict\b/i, /\bceasefire\b/i, /\brefugee\b/i, /\bhumanitarian\b/i, /\bsanction\b/i, /\bsanctions\b/i], weight: 8 },
    { patterns: [/\btrump\b/i, /\bbiden\b/i, /\bputin\b/i, /\bxi jinping\b/i, /\bmacron\b/i, /\bzelensky\b/i, /\bmodi\b/i], weight: 7 },
    { patterns: [/\breuters\b/i, /\bap\b(?!\w)/i, /\bagence france-presse\b/i, /\bbc world\b/i], weight: 6 },
    { patterns: [/\bafrica\b/i, /\bafrican\b/i, /\bau\b(?!\w)/i, /\bafrican union\b/i, /\bnigeria\b/i, /\bsouth africa\b/i, /\bghana\b/i, /\begypt\b/i, /\bethiopia\b/i, /\btanzania\b/i, /\buganda\b/i, /\brwanda\b/i, /\bcongo\b/i], weight: 7 },
    { patterns: [/\bdiplomatic\b/i, /\bdiplomacy\b/i, /\bembassy\b/i, /\btreaty\b/i, /\bsummit\b/i, /\bbilateral\b/i, /\bmultilateral\b/i], weight: 5 },
  ],
  // Kenya Focus (81)
  81: [
    { patterns: [/\bkenya\b/i, /\bnairobi\b/i, /\bmombasa\b/i, /\bkisumu\b/i, /\bnakuru\b/i, /\beldoret\b/i, /\bthika\b/i, /\bmeru\b/i], weight: 10 },
    { patterns: [/\bkenyan\b/i, /\bkenyans\b/i, /\bkenyatta\b/i, /\bruto\b/i, /\braila\b/i, /\bodinga\b/i, /\bsafaricom\b/i, /\bmpesa\b/i, /\bm-pesa\b/i, /\bkra\b/i], weight: 9 },
    { patterns: [/\bcounty\b/i, /\bgovernor\b.*\bkenya\b/i, /\bnational assembly\b/i, /\bsenate\b.*\bkenya\b/i], weight: 8 },
    { patterns: [/\bnysc\b/i, /\bhelb\b/i, /\bnhif\b/i, /\bntsa\b/i, /\bkdf\b/i, /\bepra\b/i], weight: 7 },
    { patterns: [/\beast africa\b/i, /\beast african\b/i, /\beac\b/i], weight: 4 },
  ],
  // Politics & Governance (82)
  82: [
    { patterns: [/\belection\b/i, /\belections\b/i, /\bvoting\b/i, /\bballot\b/i, /\bpoll\b/i, /\bpolls\b/i, /\bpolling\b/i], weight: 10 },
    { patterns: [/\bpresident\b/i, /\bgovernor\b/i, /\bsenator\b/i, /\bparliament\b/i, /\bparliamentary\b/i, /\blegislature\b/i, /\bcongress\b/i, /\bassembly\b/i], weight: 9 },
    { patterns: [/\bdemocrat\b/i, /\brepublican\b/i, /\bpolitical\b/i, /\bpolitics\b/i, /\bpolitician\b/i, /\bpartisan\b/i], weight: 8 },
    { patterns: [/\bgovernment\b/i, /\bgovernments\b/i, /\bminister\b/i, /\bcabinet\b/i, /\bopposition\b/i, /\bcoalition\b/i, /\bparty\b/i], weight: 7 },
    { patterns: [/\blaw\b/i, /\blaws\b/i, /\bbill\b/i, /\bbills\b/i, /\blegislation\b/i, /\bimpeach\b/i, /\breferendum\b/i, /\bconstitution\b/i], weight: 6 },
    { patterns: [/\bcrime\b/i, /\bcriminal\b/i, /\bmurder\b/i, /\bpolice\b/i, /\barrest\b/i, /\bsuspect\b/i, /\bcourt\b/i, /\bjudge\b/i, /\bverdict\b/i, /\bprison\b/i, /\bjail\b/i], weight: 5 },
    { patterns: [/\bfraud\b/i, /\bscam\b/i, /\bcorruption\b/i, /\bbribe\b/i, /\bmoney laundering\b/i], weight: 5 },
    { patterns: [/\bspeaker\b/i, /\bmajority leader\b/i, /\bminority leader\b/i, /\bwhip\b/i, /\bcaucus\b/i], weight: 4 },
  ],
  // Business & Economy (83)
  83: [
    { patterns: [/\beconomic\b/i, /\beconomy\b/i, /\bgdp\b/i, /\binflation\b/i, /\bstock market\b/i, /\btrading\b/i, /\binvestor\b/i, /\binvestors\b/i], weight: 10 },
    { patterns: [/\bbusiness\b/i, /\bcompanies\b/i, /\bcompany\b/i, /\bcorporate\b/i, /\bcorporation\b/i, /\bstartup\b/i, /\bstartups\b/i, /\bentrepreneur\b/i, /\bventures\b/i], weight: 9 },
    { patterns: [/\brevenue\b/i, /\bprofit\b/i, /\bprofits\b/i, /\bearning\b/i, /\bearnings\b/i, /\bfiscal\b/i, /\bbudget\b/i, /\btax\b/i, /\btaxes\b/i, /\btariff\b/i, /\btariffs\b/i], weight: 8 },
    { patterns: [/\bbank\b/i, /\bbanking\b/i, /\bfinance\b/i, /\bfinancial\b/i, /\binsurance\b/i, /\bcredit\b/i, /\bloan\b/i, /\bdebt\b/i, /\bcentral bank\b/i], weight: 7 },
    { patterns: [/\bmarket\b/i, /\bmarkets\b/i, /\btrade\b/i, /\bexport\b/i, /\bexports\b/i, /\bimport\b/i, /\bcommodity\b/i, /\boil price\b/i], weight: 6 },
    { patterns: [/\bipo\b/i, /\bshares\b/i, /\bstock\b/i, /\bbond\b/i, /\bforex\b/i, /\bcurrency\b/i, /\bdollar\b/i, /\bshilling\b/i, /\bnse\b/i], weight: 5 },
    { patterns: [/\breal estate\b/i, /\bproperty\b/i, /\bhousing\b/i, /\bmortgage\b/i, /\brent\b/i, /\brental\b/i, /\blandlord\b/i, /\btenant\b/i], weight: 5 },
    { patterns: [/\bconstruction\b/i, /\bbuilding\b/i, /\bapartment\b/i, /\bdeveloper\b/i, /\bdevelopers\b/i], weight: 4 },
  ],
  // Tech & Innovation (84)
  84: [
    { patterns: [/\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bdeep learning\b/i, /\bchatgpt\b/i, /\bopenai\b/i, /\bclaude\b/i, /\bgemini\b/i, /\bgrok\b/i], weight: 10 },
    { patterns: [/\btech\b/i, /\btechs\b/i, /\btechnology\b/i, /\btechnologies\b/i, /\bsoftware\b/i, /\bhardware\b/i, /\bunicorn\b/i, /\bsaas\b/i], weight: 9 },
    { patterns: [/\bcybersecurity\b/i, /\bhacking\b/i, /\bhack\b/i, /\bhacker\b/i, /\bdata breach\b/i, /\bprivacy\b/i, /\bencryption\b/i, /\bmalware\b/i, /\bransomware\b/i], weight: 8 },
    { patterns: [/\bgoogle\b/i, /\bmicrosoft\b/i, /\bamazon\b/i, /\bmeta\b/i, /\bapple\b/i, /\btiktok\b/i, /\bsamsung\b/i, /\bnvidia\b/i, /\btesla\b/i, /\bspaceX\b/i, /\bxiaomi\b/i], weight: 7 },
    { patterns: [/\b5g\b/i, /\binternet\b/i, /\bbroadband\b/i, /\bdigital\b/i, /\bblockchain\b/i, /\bcrypto\b/i, /\bbitcoin\b/i, /\bethereum\b/i, /\bweb3\b/i], weight: 6 },
    { patterns: [/\brobot\b/i, /\brobots\b/i, /\bautonomous\b/i, /\bdrone\b/i, /\bdrones\b/i, /\binnovation\b/i, /\bpatent\b/i, /\bsilicon valley\b/i, /\bapp\b/i], weight: 5 },
    { patterns: [/\bscientist\b/i, /\bscientists\b/i, /\bscientific\b/i, /\bresearch\b/i, /\bstudy finds?\b/i, /\bexperiment\b/i, /\blaboratory\b/i], weight: 5 },
    { patterns: [/\bnasa\b/i, /\bspace\b/i, /\brocket\b/i, /\bsatellite\b/i, /\bmars\b/i, /\bmoon\b/i, /\bquantum\b/i], weight: 4 },
  ],
  // Health & Wellness (85)
  85: [
    { patterns: [/\bhealth\b/i, /\bmedical\b/i, /\bdoctor\b/i, /\bdoctors\b/i, /\bhospital\b/i, /\bhospitals\b/i, /\bclinic\b/i, /\bpatient\b/i, /\bpatients\b/i], weight: 10 },
    { patterns: [/\bdisease\b/i, /\bdiseases\b/i, /\bvirus\b/i, /\bvaccines?\b/i, /\bcovid\b/i, /\bpandemic\b/i, /\bepidemic\b/i, /\boutbreak\b/i, /\binfection\b/i], weight: 9 },
    { patterns: [/\bmental health\b/i, /\bdepression\b/i, /\banxiety\b/i, /\btherapy\b/i, /\bcounseling\b/i, /\bstress\b/i, /\bburnout\b/i], weight: 8 },
    { patterns: [/\bdrug\b/i, /\bdrugs\b/i, /\bmedication\b/i, /\bpharmaceutical\b/i, /\bpharma\b/i, /\btreatment\b/i, /\bcure\b/i, /\bdiagnosis\b/i, /\bsurgery\b/i], weight: 7 },
    { patterns: [/\bnutrition\b/i, /\bdiet\b/i, /\bexercise\b/i, /\bfitness\b/i, /\bwellness\b/i, /\bobesity\b/i, /\bworkout\b/i, /\byoga\b/i, /\bmeditation\b/i], weight: 6 },
    { patterns: [/\bwho\b/i, /\bcdc\b/i, /\bhealth ministry\b/i, /\bpublic health\b/i, /\bmaternal\b/i], weight: 5 },
  ],
  // Arts & Culture (86)
  86: [
    { patterns: [/\bfilm\b/i, /\bfilms\b/i, /\bmovie\b/i, /\bmovies\b/i, /\bcinema\b/i, /\bhollywood\b/i, /\bbollywood\b/i, /\bnetflix\b/i, /\bdisney\b/i], weight: 10 },
    { patterns: [/\bmusic\b/i, /\bsong\b/i, /\bsongs\b/i, /\balbum\b/i, /\balbums\b/i, /\bconcert\b/i, /\bconcerts\b/i, /\bgrammy\b/i, /\bbillboard\b/i], weight: 9 },
    { patterns: [/\bcelebrity\b/i, /\bcelebrities\b/i, /\bactor\b/i, /\bactress\b/i, /\bsinger\b/i, /\brapper\b/i, /\bartiste\b/i], weight: 8 },
    { patterns: [/\btv show\b/i, /\bseries\b/i, /\bepisode\b/i, /\bstreaming\b/i, /\breality tv\b/i, /\baward\b/i, /\bawards\b/i, /\boscar\b/i], weight: 7 },
    { patterns: [/\barts?\b/i, /\bculture\b/i, /\bcultural\b/i, /\btradition\b/i, /\btraditions\b/i, /\bliterature\b/i, /\bpoetry\b/i, /\btheatre\b/i, /\btheater\b/i], weight: 6 },
    { patterns: [/\bfestival\b/i, /\bcarnival\b/i, /\bexhibition\b/i, /\bmuseum\b/i, /\bgallery\b/i, /\bdance\b/i], weight: 5 },
    { patterns: [/\blifestyle\b/i, /\bfashion\b/i, /\bbeauty\b/i, /\btravel\b/i, /\bfood\b/i, /\brecipe\b/i, /\bcooking\b/i], weight: 4 },
    { patterns: [/\brelationship\b/i, /\bmarriage\b/i, /\bparenting\b/i, /\bfamily\b/i], weight: 3 },
  ],
  // Sports Arena (87)
  87: [
    { patterns: [/\bfootball\b/i, /\bsoccer\b/i, /\bpremier league\b/i, /\bchampions league\b/i, /\bworld cup\b/i, /\bfifa\b/i, /\buefa\b/i, /\bla liga\b/i], weight: 10 },
    { patterns: [/\bbasketball\b/i, /\bnba\b/i, /\brugby\b/i, /\bcricket\b/i, /\btennis\b/i, /\bgolf\b/i, /\bf1\b/i, /\bformula 1\b/i, /\bboxing\b/i, /\bmma\b/i, /\bufc\b/i], weight: 9 },
    { patterns: [/\bathletics\b/i, /\bathlete\b/i, /\bathletes\b/i, /\bmarathon\b/i, /\bolympics\b/i, /\bolympic\b/i, /\bsport\b/i, /\bsports\b/i, /\bplayer\b/i, /\bteam\b/i], weight: 8 },
    { patterns: [/\bmatch\b/i, /\bgame\b/i, /\bscore\b/i, /\bgoal\b/i, /\bwon\b/i, /\bdefeated\b/i, /\bvictory\b/i, /\bchampion\b/i, /\btrophy\b/i, /\bleague\b/i], weight: 7 },
    { patterns: [/\bcoach\b/i, /\bmanager\b/i, /\btransfer\b/i, /\btransfers\b/i, /\bsigning\b/i, /\bstadium\b/i, /\btournament\b/i, /\bqualifier\b/i], weight: 6 },
  ],
  // Opinion & Analysis (88)
  88: [
    { patterns: [/\bopinion\b/i, /\beditorial\b/i, /\bcommentary\b/i, /\banalysis\b/i, /\bperspective\b/i, /\bviewpoint\b/i, /\bop-ed\b/i], weight: 10 },
    { patterns: [/\bcolumn\b/i, /\bdebate\b/i, /\bdiscussion\b/i, /\bargue\b/i, /\bcritique\b/i, /\breview\b/i, /\bcomment\b/i], weight: 8 },
    { patterns: [/\bwe argue\b/i, /\bin our view\b/i, /\bthe case for\b/i, /\bthe case against\b/i, /\bwhy\b.*\bshould\b/i], weight: 6 },
  ],
  // Trending Now (89)
  89: [
    { patterns: [/\bviral\b/i, /\btrending\b/i, /\bmemes?\b/i, /\bviral video\b/i, /\bblow up\b/i, /\bblowing up\b/i, /\bbroke the internet\b/i], weight: 10 },
    { patterns: [/\btiktok\b/i, /\binstagram\b/i, /\byoutube\b/i, /\btwitter\b/i, /\bx\.com\b/i, /\bsnapchat\b/i, /\breddit\b/i], weight: 8 },
    { patterns: [/\bsocial media\b/i, /\bonline\b/i, /\bcyber\b/i, /\bhashtag\b/i, /\bchallenge\b/i, /\bdance challenge\b/i, /\bprank\b/i], weight: 7 },
    { patterns: [/\bcelebrity\b/i, /\bceleb\b/i, /\binfluencer\b/i, /\bcontent creator\b/i, /\bvlogger\b/i, /\bstreamer\b/i], weight: 6 },
  ],
  // Features & Profiles (90)
  90: [
    { patterns: [/\bprofile\b/i, /\binterview\b/i, /\bbiography\b/i, /\blife story\b/i, /\binspirational\b/i, /\bjourney\b/i], weight: 10 },
    { patterns: [/\bin depth\b/i, /\bin-depth\b/i, /\blong.read\b/i, /\bfeature\b/i, /\bfeatures\b/i, /\bexclusive\b/i, /\bspecial report\b/i], weight: 9 },
    { patterns: [/\bpioneer\b/i, /\btrailblazer\b/i, /\bvisionary\b/i, /\bleader\b/i, /\bicon\b/i, /\blegend\b/i], weight: 8 },
    { patterns: [/\bhuman interest\b/i, /\bcommunity\b/i, /\bgrassroots\b/i, /\blocal hero\b/i, /\brags to riches\b/i, /\bovercoming\b/i], weight: 7 },
    { patterns: [/\beducation\b/i, /\bschool\b/i, /\buniversity\b/i, /\bstudent\b/i, /\bteacher\b/i, /\bcurriculum\b/i, /\bscholarship\b/i], weight: 5 },
  ],
  // Environment & Climate (91)
  91: [
    { patterns: [/\benvironment\b/i, /\benvironmental\b/i, /\becology\b/i, /\bbiodiversity\b/i, /\bdeforestation\b/i, /\bconservation\b/i], weight: 10 },
    { patterns: [/\bclimate change\b/i, /\bglobal warming\b/i, /\bcarbon\b/i, /\bemission\b/i, /\bemissions\b/i, /\brenewable\b/i, /\bsustainability\b/i, /\bsustainable\b/i], weight: 9 },
    { patterns: [/\bpollution\b/i, /\bplastic\b/i, /\bocean\b/i, /\bforests?\b/i, /\bwildlife\b/i, /\bendangered\b/i, /\bcoral reef\b/i], weight: 8 },
    { patterns: [/\bsolar\b/i, /\bwind energy\b/i, /\bgeothermal\b/i, /\bhydro\b/i, /\bclean energy\b/i, /\bgreen\b/i, /\bnet zero\b/i], weight: 7 },
    { patterns: [/\bdrought\b/i, /\bflood\b/i, /\bfloods\b/i, /\bwildfire\b/i, /\bheatwave\b/i, /\bweather\b/i, /\bstorm\b/i, /\bcyclone\b/i], weight: 6 },
    { patterns: [/\bagriculture\b/i, /\bagricultural\b/i, /\bfarm\b/i, /\bfarms\b/i, /\bfarming\b/i, /\bcrop\b/i, /\bcrops\b/i, /\bharvest\b/i, /\bfood security\b/i, /\bfertilizer\b/i], weight: 5 },
    { patterns: [/\blivestock\b/i, /\bcattle\b/i, /\bpoultry\b/i, /\bdairy\b/i, /\bfishing\b/i], weight: 4 },
  ],
}


// ── Tag extraction keywords ─────────────────────────────────────
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
 * Category IDs: 80-91 (new 12-category taxonomy).
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

  const sorted = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]))

  if (sorted.length > 0 && Number(sorted[0][1]) >= 10) {
    return Number(sorted[0][0])
  }

  if (feedCategoryId) return feedCategoryId
  return 80 // World Updates
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
  const found = new Map<string, string>()
  for (const { pattern, tag } of TAG_KEYWORDS) {
    if (found.size >= maxTags) break
    if (pattern.test(title)) {
      const normalized = tag.toLowerCase()
      if (!found.has(normalized)) found.set(normalized, tag)
    }
  }

  for (const { pattern, tag } of TAG_KEYWORDS) {
    if (found.size >= maxTags) break
    if (pattern.test(content)) {
      const normalized = tag.toLowerCase()
      if (!found.has(normalized)) found.set(normalized, tag)
    }
  }

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

function extractPhrases(text: string, max: number): string[] {
  const words = text.replace(/<[^>]+>/g, ' ').split(/\s+/)
  const phrases: string[] = []
  const seen = new Set<string>()

  for (let i = 0; i < words.length - 1 && phrases.length < max * 3; i++) {
    const w1 = words[i].replace(/[^a-zA-Z]/g, '')
    const w2 = words[i + 1]?.replace(/[^a-zA-Z]/g, '')
    if (!w1 || !w2) continue
    if (w1.length < 3 || w2.length < 3) continue

    if (!/^[A-Z]/.test(w1) || !/^[A-Z]/.test(w2)) continue

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
