/**
 * Minimal OpenAI chat client for 026news.
 * Uses the Chat Completions API via fetch — no external SDK dependency required.
 * Reads OPENAI_API_KEY from the environment (server-only).
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
}

export class OpenAIUnconfiguredError extends Error {
  constructor() {
    super('OPENAI_API_KEY is not configured on the server.')
    this.name = 'OpenAIUnconfiguredError'
  }
}

/**
 * Calls the OpenAI Chat Completions endpoint and returns the assistant text.
 * Throws OpenAIUnconfiguredError when no key is present so callers can degrade gracefully.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new OpenAIUnconfiguredError()

  const model = opts.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  const temperature = opts.temperature ?? 0.2
  const maxTokens = opts.maxTokens ?? 2048

  const res = await fetch(OPENAI_URL, {
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
        opts.responseFormat === 'json_object'
          ? { type: 'json_object' }
          : undefined,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 500)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned an empty response.')
  return content
}

export function aiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
