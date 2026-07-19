/**
 * Groq API client for 026news
 * Supports multiple models: fast (llama-3.1-8b), balanced (llama-3.1-70b), premium (mixtral-8x7b)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqOptions {
  model?: 'fast' | 'balanced' | 'premium'
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}

const MODEL_MAP = {
  fast: 'llama-3.1-8b-instant',
  balanced: 'llama-3.1-70b-versatile',
  premium: 'mixtral-8x7b-32768',
} as const

export function groqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}

export async function groqChat(
  messages: GroqMessage[],
  opts: GroqOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const model = MODEL_MAP[opts.model ?? 'balanced']
  const temperature = opts.temperature ?? 0.2
  const maxTokens = opts.maxTokens ?? 4096

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format:
        opts.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
    }),
  })

  if (!res.ok) {
    const error = await res.text().catch(() => '')
    throw new Error(`Groq request failed (${res.status}): ${error.slice(0, 500)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Groq returned empty response')
  return content
}

export async function groqChatJSON<T>(
  messages: GroqMessage[],
  opts: GroqOptions = {}
): Promise<T> {
  const raw = await groqChat(messages, {
    ...opts,
    responseFormat: 'json_object',
  })

  try {
    return JSON.parse(raw) as T
  } catch {
    // Try to extract JSON from markdown code fences
    const match = raw.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
    if (match) {
      return JSON.parse(match[1]) as T
    }
    throw new Error('Groq returned invalid JSON')
  }
}

export function aiConfigured(): boolean {
  return groqConfigured()
}