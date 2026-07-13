'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, Send, RefreshCw, ArrowLeft, Inbox } from 'lucide-react'

type ListMsg = {
  id: string
  threadId: string
  snippet: string
  headers: Record<string, string>
}
type Detail = {
  id: string
  threadId: string
  headers: Record<string, string>
  body: string
  isHtml: boolean
}

function fmtDate(s?: string) {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleString()
}

function GmailInboxPage() {
  const params = useSearchParams()
  const justConnected = params.get('connected') === '1'
  const errorParam = params.get('error')

  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(null)
  const [messages, setMessages] = useState<ListMsg[]>([])
  const [selected, setSelected] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(errorParam ? mapError(errorParam) : null)

  const [replyTo, setReplyTo] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ ok?: boolean; msg?: string } | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gmail/status')
      const data = await res.json()
      setStatus({ connected: data.connected, email: data.email ?? null })
    } catch {
      setStatus({ connected: false, email: null })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch('/api/gmail/messages?max=25')
      if (res.status === 409) {
        setStatus({ connected: false, email: null })
        return
      }
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      setMessages([])
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    if (status?.connected) loadMessages()
  }, [status, loadMessages])

  const openMessage = useCallback(async (id: string) => {
    setDetailLoading(true)
    setSelected(null)
    setSendStatus(null)
    try {
      const res = await fetch(`/api/gmail/messages/${id}`)
      const data = await res.json()
      setSelected(data)
      setReplyTo(stripName(data.headers.From ?? ''))
      setReplySubject(ensureReplySubject(data.headers.Subject ?? ''))
      setReplyBody('')
    } catch {
      setError('Failed to load message.')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const sendReply = useCallback(async () => {
    if (!replyTo || !replySubject || !replyBody) {
      setSendStatus({ ok: false, msg: 'Fill in recipient, subject and message.' })
      return
    }
    setSending(true)
    setSendStatus(null)
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyTo,
          subject: replySubject,
          html: replyBody.replace(/\n/g, '<br/>'),
          threadId: selected?.threadId,
          inReplyTo: selected?.headers['Message-ID'],
          references: selected?.headers['Message-ID'],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendStatus({ ok: false, msg: data.error ?? 'Send failed.' })
      } else {
        setSendStatus({ ok: true, msg: 'Sent.' })
        setReplyBody('')
      }
    } catch {
      setSendStatus({ ok: false, msg: 'Network error.' })
    } finally {
      setSending(false)
    }
  }, [replyTo, replySubject, replyBody, selected])

  if (loading) {
    return <Shell><p style={{ color: 'var(--text-tertiary)' }}>Loading…</p></Shell>
  }

  if (!status?.connected) {
    return (
      <Shell>
        <div style={card}>
          <div style={{ fontSize: 38, marginBottom: 8 }}><Inbox size={38} /></div>
          <h1 style={{ fontSize: '1.4rem', margin: '0 0 8px' }}>Connect your Gmail inbox</h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 0 20px' }}>
            Link a Gmail account to read and reply to tips, reader mail and press enquiries
            right from the admin panel. Only admins can connect and access this inbox.
          </p>
          {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}
          <a
            href="/api/gmail/auth"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--primary)', color: '#fff', padding: '12px 20px',
              borderRadius: 10, fontWeight: 700, textDecoration: 'none',
            }}
          >
            <Mail size={18} /> Connect Gmail
          </a>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: 16 }}>
            You'll be sent to Google to grant access, then redirected back here.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', margin: 0 }}>Gmail Inbox</h1>
          <p style={{ color: 'var(--text-tertiary)', margin: '4px 0 0', fontSize: '0.85rem' }}>
            {status.email}
          </p>
        </div>
        <button
          onClick={loadMessages}
          disabled={listLoading}
          style={secondaryBtn}
        >
          <RefreshCw size={15} /> {listLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 16, alignItems: 'start' }}>
        {/* List */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {messages.length === 0 && !listLoading && (
            <p style={{ color: 'var(--text-tertiary)', padding: 20 }}>No messages in INBOX.</p>
          )}
          {messages.map((m) => (
            <button
              key={m.id}
              onClick={() => openMessage(m.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '14px 16px', border: 'none', borderBottom: '1px solid var(--border)',
                background: selected?.id === m.id ? 'var(--sidebar-active)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.headers.From ?? 'Unknown'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {m.headers.Subject ?? '(no subject)'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>{m.snippet}</div>
            </button>
          ))}
        </div>

        {/* Detail / reply */}
        <div style={card}>
          {!selected && !detailLoading && (
            <p style={{ color: 'var(--text-tertiary)' }}>Select a message to read it.</p>
          )}
          {detailLoading && <p style={{ color: 'var(--text-tertiary)' }}>Loading message…</p>}

          {selected && (
            <div>
              <button onClick={() => setSelected(null)} style={{ ...secondaryBtn, marginBottom: 12 }}>
                <ArrowLeft size={15} /> Back
              </button>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{selected.headers.Subject ?? '(no subject)'}</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', margin: '0 0 12px' }}>
                From: {selected.headers.From} · {fmtDate(selected.headers.Date)}
              </p>
              <div
                style={{
                  background: 'var(--bg-base)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 14, fontSize: '0.9rem', lineHeight: 1.5,
                  maxHeight: 320, overflow: 'auto', marginBottom: 16,
                }}
                dangerouslySetInnerHTML={{
                  __html: selected.isHtml ? selected.body : `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(selected.body)}</pre>`,
                }}
              />

              <h3 style={{ fontSize: '0.95rem', margin: '0 0 10px' }}>Reply</h3>
              <label style={labelStyle}>To</label>
              <input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Subject</label>
              <input value={replySubject} onChange={(e) => setReplySubject(e.target.value)} style={inputStyle} />
              <label style={labelStyle}>Message</label>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <button onClick={sendReply} disabled={sending} style={primaryBtn}>
                  <Send size={15} /> {sending ? 'Sending…' : 'Send reply'}
                </button>
                {sendStatus && (
                  <span style={{ color: sendStatus.ok ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>
                    {sendStatus.msg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  )
}

// ─── helpers / styles ──────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {children}
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 24,
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'var(--primary)', color: '#fff', border: 'none',
  padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
}

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border)', padding: '8px 14px',
  borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--text-tertiary)', margin: '10px 0 4px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--bg-base)',
  color: 'var(--text-primary)', fontSize: '0.9rem',
}

function stripName(from: string): string {
  const match = from.match(/<(.+?)>/)
  return match ? match[1] : from.trim()
}
function ensureReplySubject(subject: string): string {
  return subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}
function mapError(e: string): string {
  switch (e) {
    case 'missing_client_id': return 'Gmail is not configured on the server (missing GMAIL_CLIENT_ID).'
    case 'invalid_state': return 'OAuth state mismatch. Please try connecting again.'
    case 'exchange_failed': return 'Failed to exchange the Google authorization code.'
    default: return 'Something went wrong.'
  }
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: 'var(--text-tertiary)' }}>Loading…</div>}>
      <GmailInboxPage />
    </Suspense>
  )
}
