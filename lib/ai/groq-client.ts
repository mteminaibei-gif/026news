/**
 * Unified Groq AI Client for 026news
 * Single client for all AI functions: SEO, content enhancement, grammar, moderation
 */

import Groq from 'groq-sdk'

let groqClient: Groq | null = null

function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

export const GROQ_MODELS = {
  fast: 'llama-3.1-8b-instant',           // Ultra-fast, good for simple tasks
  balanced: 'llama-3.1-70b-versatile',    // Best balance of speed/quality
  best: 'llama-3.3-70b-versatile',        // Best quality, slightly slower
} as const

export type GroqModel = keyof typeof GROQ_MODELS

interface ChatOptions {
  model?: GroqModel
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json_object'
  systemPrompt?: string
}

/**
 * Core chat completion function
 */
export async function groqChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: ChatOptions = {}
): Promise<string> {
  const model = options.model ?? 'balanced'
  const temperature = options.temperature ?? 0.2
  const maxTokens = options.maxTokens ?? 2048

  const fullMessages = options.systemPrompt
    ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
    : messages

  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODELS[model],
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
    response_format: options.responseFormat === 'json_object' ? { type: 'json_object' } : undefined,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Groq returned empty response')
  return content
}

/**
 * JSON-structured chat completion with validation
 */
export async function groqChatJSON<T>(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: ChatOptions = {}
): Promise<T> {
  const result = await groqChat(messages, { ...options, responseFormat: 'json_object' })
  try {
    return JSON.parse(result) as T
  } catch (e) {
    console.error('Failed to parse Groq JSON response:', result)
    throw new Error('Failed to parse AI response as JSON')
  }
}

/**
 * Check if Groq is configured
 */
export function groqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}

/**
 * Get available models for admin UI
 */
export function getAvailableModels() {
  return Object.entries(GROQ_MODELS).map(([key, value]) => ({
    id: key,
    name: value,
    description: key === 'fast' ? 'Fastest (8B)' : key === 'balanced' ? 'Balanced (70B)' : 'Best Quality (70B latest)',
  }))
}