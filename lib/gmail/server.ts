import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { APP_URL } from '@/lib/constants/app'

/**
 * Server-only Gmail integration.
 *
 * The app owns a single Gmail account (the newsroom inbox). Admins connect it
 * once via OAuth; tokens are encrypted at rest (AES-256-GCM) in the
 * `gmail_integration` table and refreshed transparently. All access goes
 * through the Gmail REST API with `fetch` (no extra dependency).
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'
const ALGO = 'aes-256-gcm'

// ─── Encryption ──────────────────────────────────────────────────────────────
function getKey(): Buffer {
  const secret = process.env.GMAIL_ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('GMAIL_ENCRYPTION_SECRET is not configured')
  }
  // Derive a stable 32-byte key from the secret.
  return Buffer.from(secret.padEnd(32, '0').slice(0, 32))
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`
}

export function decrypt(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':')
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ])
  return dec.toString('utf-8')
}

// ─── Token storage ────────────────────────────────────────────────────────────
type StoredTokens = {
  access: string
  refresh: string
  email: string
  expiresAt: number
}

type GmailRow = {
  access_token: string | null
  refresh_token: string | null
  email: string | null
  expires_at: string | null
}

async function loadRow(): Promise<StoredTokens | null> {
  const supabase = await createAdminClient()
  const result = await supabase
    .from('gmail_integration')
    .select('access_token, refresh_token, email, expires_at')
    .eq('id', 1)
    .maybeSingle()
  const data = result.data as GmailRow | null

  if (!data || !data.access_token || !data.refresh_token) return null

  return {
    access: decrypt(data.access_token),
    refresh: decrypt(data.refresh_token),
    email: data.email ?? '',
    expiresAt: new Date(data.expires_at as string).getTime(),
  }
}

async function saveTokens(tokens: {
  access_token: string
  refresh_token?: string
  email: string
  expires_at: number
}): Promise<void> {
  const supabase = await createAdminClient()

  // Preserve an existing refresh token if Google didn't return a new one.
  const existing = await loadRow()
  const refresh_token = tokens.refresh_token ?? existing?.refresh ?? ''

  await supabase.from('gmail_integration').upsert(
    {
      id: 1,
      access_token: encrypt(tokens.access_token),
      refresh_token: encrypt(refresh_token),
      email: tokens.email,
      expires_at: new Date(tokens.expires_at).toISOString(),
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: 'id' }
  )
}

// ─── Access token management ───────────────────────────────────────────────────
export async function isConnected(): Promise<boolean> {
  try {
    const row = await loadRow()
    return !!row
  } catch {
    return false
  }
}

export async function getConnectedEmail(): Promise<string | null> {
  const row = await loadRow()
  return row?.email ?? null
}

type OAuthTokens = {
  access_token: string
  refresh_token?: string
  expires_in: number
  email: string
}

async function refreshTokens(refreshToken: string): Promise<OAuthTokens> {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId ?? '',
      client_secret: clientSecret ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  if (!res.ok) {
    throw new Error(`Gmail token refresh failed: ${res.status}`)
  }
  const json = (await res.json()) as {
    access_token: string
    expires_in: number
  }
  return {
    access_token: json.access_token,
    expires_in: json.expires_in,
    email: (await loadRow())?.email ?? '',
  }
}

// Returns a valid (refreshed if needed) access token + connected email.
async function getValidAuth(): Promise<{ token: string; email: string }> {
  const row = await loadRow()
  if (!row) throw new Error('NOT_CONNECTED')

  // Refresh if expiring within 60s.
  if (Date.now() > row.expiresAt - 60_000) {
    const refreshed = await refreshTokens(row.refresh)
    const expiresAt = Date.now() + refreshed.expires_in * 1000
    await saveTokens({
      access_token: refreshed.access_token,
      email: refreshed.email || row.email,
      expires_at: expiresAt,
    })
    return { token: refreshed.access_token, email: refreshed.email || row.email }
  }

  return { token: row.access, email: row.email }
}

// ─── Low-level Gmail API ───────────────────────────────────────────────────────
async function gmailFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { token } = await getValidAuth()
  const res = await fetch(`${GMAIL_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gmail API ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

// ─── Public API ────────────────────────────────────────────────────────────────
export type GmailHeader = { name: string; value: string }
export type GmailListMessage = {
  id: string
  threadId: string
  snippet: string
  headers: Record<string, string>
}

export async function listMessages(max = 20): Promise<{
  messages: GmailListMessage[]
  nextPageToken?: string
}> {
  const data = await gmailFetch<{
    messages?: { id: string; threadId: string; snippet: string; payload: { headers: GmailHeader[] } }[]
    nextPageToken?: string
  }>(
    `/messages?maxResults=${max}&labelIds=INBOX&format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`
  )

  const messages = (data.messages ?? []).map((m) => ({
    id: m.id,
    threadId: m.threadId,
    snippet: m.snippet ?? '',
    headers: Object.fromEntries(m.payload.headers.map((h) => [h.name, h.value])),
  }))

  return { messages, nextPageToken: data.nextPageToken }
}

export type GmailMessageDetail = {
  id: string
  threadId: string
  snippet: string
  headers: Record<string, string>
  body: string
  isHtml: boolean
}

function extractBody(payload: {
  body?: { data?: string }
  parts?: unknown[]
  mimeType?: string
}): { body: string; isHtml: boolean } {
  if (payload.body?.data) {
    const isHtml = (payload.mimeType ?? '').includes('html')
    return {
      body: Buffer.from(payload.body.data, 'base64url').toString('utf-8'),
      isHtml,
    }
  }
  const parts = (payload.parts ?? []) as {
    mimeType?: string
    body?: { data?: string }
    parts?: unknown[]
  }[]
  // Prefer HTML, fall back to plain.
  const html = parts.find((p) => p.mimeType === 'text/html')
  const plain = parts.find((p) => p.mimeType === 'text/plain')
  const chosen = html ?? plain
  if (chosen) {
    if (chosen.body?.data) {
      return {
        body: Buffer.from(chosen.body.data, 'base64url').toString('utf-8'),
        isHtml: !!html,
      }
    }
    if (chosen.parts) return extractBody(chosen as never)
  }
  return { body: '', isHtml: false }
}

export async function getMessage(id: string): Promise<GmailMessageDetail> {
  const data = await gmailFetch<{
    id: string
    threadId: string
    snippet: string
    payload: { headers: GmailHeader[]; mimeType?: string; body?: { data?: string }; parts?: unknown[] }
  }>(`/messages/${id}?format=full`)

  const headers = Object.fromEntries(data.payload.headers.map((h) => [h.name, h.value]))
  const { body, isHtml } = extractBody(data.payload as never)

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet ?? '',
    headers,
    body,
    isHtml,
  }
}

export type SendArgs = {
  to: string
  subject: string
  html: string
  threadId?: string
  inReplyTo?: string
  references?: string
}

export async function sendEmail(args: SendArgs): Promise<{ id: string; threadId: string }> {
  const { token, email } = await getValidAuth()

  const lines = [
    `From: ${email}`,
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
  ]
  if (args.inReplyTo) lines.push(`In-Reply-To: ${args.inReplyTo}`)
  if (args.references) lines.push(`References: ${args.references}`)
  const rfc822 = lines.join('\r\n') + '\r\n\r\n' + args.html
  const raw = Buffer.from(rfc822, 'utf-8').toString('base64url')

  const body: Record<string, unknown> = { raw }
  if (args.threadId) body.threadId = args.threadId

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gmail send failed ${res.status}: ${text.slice(0, 300)}`)
  }
  return (await res.json()) as { id: string; threadId: string }
}

// ─── OAuth bootstrap (used by auth + callback routes) ──────────────────────────
export async function exchangeCodeForTokens(code: string): Promise<{ email: string }> {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const redirectUri =
    process.env.GMAIL_REDIRECT_URI ??
    `${APP_URL}/api/gmail/callback`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId ?? '',
      client_secret: clientSecret ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gmail OAuth exchange failed ${res.status}: ${text.slice(0, 300)}`)
  }
  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  // Fetch the connected address for the "From:" header.
  const profRes = await fetch(`${GMAIL_API}/profile`, {
    headers: { Authorization: `Bearer ${json.access_token}` },
  })
  const profile = profRes.ok
    ? ((await profRes.json()) as { emailAddress?: string })
    : {}

  await saveTokens({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    email: profile.emailAddress ?? '',
    expires_at: Date.now() + json.expires_in * 1000,
  })

  return { email: profile.emailAddress ?? '' }
}

export function buildConsentUrl(state: string): string {
  const clientId = process.env.GMAIL_CLIENT_ID
  const redirectUri =
    process.env.GMAIL_REDIRECT_URI ??
    `${APP_URL}/api/gmail/callback`
  const scope = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ].join(' ')

  const params = new URLSearchParams({
    client_id: clientId ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
