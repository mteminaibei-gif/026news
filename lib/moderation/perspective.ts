/**
 * Perspective API client for content moderation
 * Provides toxicity analysis using Google's Perspective API
 */

export interface PerspectiveAttributes {
  TOXICITY?: number
  SEVERE_TOXICITY?: number
  IDENTITY_ATTACK?: number
  THREAT?: number
  INSULT?: number
  PROFANITY?: number
}

export interface PerspectiveConfig {
  apiKey: string
  enabled: boolean
  thresholds: {
    TOXICITY: number
    SEVERE_TOXICITY: number
    IDENTITY_ATTACK: number
    THREAT: number
    INSULT: number
    PROFANITY: number
  }
}

export interface ModerationResult {
  allowed: boolean
  flagged: boolean
  scores: PerspectiveAttributes
  flaggedCategories: string[]
  recommendedAction: 'allow' | 'review' | 'reject'
}

const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze'

/**
 * Analyze text using Perspective API
 */
export async function analyzeText(
  text: string,
  config: PerspectiveConfig
): Promise<PerspectiveAttributes> {
  if (!config.enabled || !config.apiKey) {
    return {}
  }

  const requestedAttributes = Object.keys(config.thresholds).reduce((acc, key) => {
    acc[key] = {}
    return acc
  }, {} as Record<string, unknown>)

  const response = await fetch(`${PERSPECTIVE_API_URL}?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comment: { text },
      requestedAttributes,
      languages: ['en'],
      doNotStore: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Perspective API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const scores: PerspectiveAttributes = {}

  for (const [key, value] of Object.entries(data.attributeScores ?? {})) {
    scores[key as keyof PerspectiveAttributes] = (value as { summaryScore: { value: number } }).summaryScore.value
  }

  return scores
}

/**
 * Evaluate content against Perspective API thresholds
 */
export function evaluateModeration(
  scores: PerspectiveAttributes,
  config: PerspectiveConfig
): ModerationResult {
  const flaggedCategories: string[] = []
  const scoresRecord = scores as Record<string, number>

  for (const [category, threshold] of Object.entries(config.thresholds)) {
    const score = scoresRecord[category] ?? 0
    if (score >= threshold) {
      flaggedCategories.push(category)
    }
  }

  const flagged = flaggedCategories.length > 0
  let recommendedAction: ModerationResult['recommendedAction'] = 'allow'

  if (flagged) {
    // Check for severe categories that should trigger reject
    const severeCategories = ['SEVERE_TOXICITY', 'THREAT']
    const hasSevere = flaggedCategories.some(c => severeCategories.includes(c))
    
    if (hasSevere) {
      recommendedAction = 'reject'
    } else {
      recommendedAction = 'review'
    }
  }

  return {
    allowed: !flagged || recommendedAction === 'allow',
    flagged,
    scores,
    flaggedCategories,
    recommendedAction,
  }
}

/**
 * Create Perspective config from admin settings
 */
export function createPerspectiveConfig(perspective: {
  api_key: string
  enabled: boolean
  toxicity_threshold: number
  severe_toxicity_threshold: number
  identity_attack_threshold: number
  threat_threshold: number
  insult_threshold: number
  profanity_threshold: number
}): PerspectiveConfig {
  return {
    apiKey: perspective.api_key,
    enabled: perspective.enabled,
    thresholds: {
      TOXICITY: perspective.toxicity_threshold,
      SEVERE_TOXICITY: perspective.severe_toxicity_threshold,
      IDENTITY_ATTACK: perspective.identity_attack_threshold,
      THREAT: perspective.threat_threshold,
      INSULT: perspective.insult_threshold,
      PROFANITY: perspective.profanity_threshold,
    },
  }
}

/**
 * Moderate content using Perspective API
 * Returns moderation result with recommended action
 */
export async function moderateContent(
  text: string,
  perspectiveSettings: {
    api_key: string
    enabled: boolean
    toxicity_threshold: number
    severe_toxicity_threshold: number
    identity_attack_threshold: number
    threat_threshold: number
    insult_threshold: number
    profanity_threshold: number
  }
): Promise<ModerationResult> {
  const config = createPerspectiveConfig(perspectiveSettings)
  
  if (!config.enabled || !config.apiKey || !text.trim()) {
    return {
      allowed: true,
      flagged: false,
      scores: {},
      flaggedCategories: [],
      recommendedAction: 'allow',
    }
  }

  try {
    const scores = await analyzeText(text, config)
    return evaluateModeration(scores, config)
  } catch (error) {
    console.error('Perspective API moderation failed:', error)
    // Fail open - allow content if API fails
    return {
      allowed: true,
      flagged: false,
      scores: {},
      flaggedCategories: ['API_ERROR'],
      recommendedAction: 'allow',
    }
  }
}