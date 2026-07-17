'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'


type Role = 'reader' | 'journalist'

interface ApiError {
  field?: string
  message: string
}

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('reader')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    portfolioUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '', general: '' }))
  }

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError('')
    setErrors({})

    const localErrors: Record<string, string> = {}
    if (!form.name.trim()) localErrors.name = 'Full name is required.'
    if (!form.email.trim()) localErrors.email = 'Email is required.'
    if (form.password.length < 8)
      localErrors.password = 'Password must be at least 8 characters.'
    else if (!PASSWORD_REGEX.test(form.password))
      localErrors.password = 'Password must include uppercase, lowercase, and a number.'
    if (form.password !== form.confirmPassword)
      localErrors.confirmPassword = 'Passwords do not match.'
    if (role === 'journalist' && !form.organization.trim())
      localErrors.organization = 'Organization is required for journalists.'
    if (role === 'journalist' && !form.portfolioUrl.trim())
      localErrors.portfolio = 'Portfolio URL is required for journalists.'
    else if (role === 'journalist' && form.portfolioUrl.trim()) {
      try { new URL(form.portfolioUrl.trim().startsWith('http') ? form.portfolioUrl.trim() : `https://${form.portfolioUrl.trim()}`) }
      catch { localErrors.portfolio = 'Please enter a valid URL.' }
    }
    if (Object.keys(localErrors).length) {
      setErrors(localErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role,
          organization: role === 'journalist' ? form.organization.trim() : undefined,
          portfolio: role === 'journalist' ? form.portfolioUrl.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const fieldErrors: Record<string, string> = {}
        ;(data.errors as ApiError[] | undefined)?.forEach((err) => {
          if (err.field) fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
        setGeneralError(data.error || 'Could not create your account. Please try again.')
        setLoading(false)
        return
      }
      router.push(`/verify-email?email=${encodeURIComponent(form.email.trim())}`)
    } catch {
      setGeneralError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-head">
            <h1>Create your account</h1>
            <p>Join 026Newsblog to read, follow and publish. It takes less than a minute.</p>
          </div>

          <div className="role-toggle" role="tablist" aria-label="Account type">
            <button
              type="button"
              role="tab"
              aria-selected={role === 'reader'}
              className={role === 'reader' ? 'active' : ''}
              onClick={() => setRole('reader')}
            >
              Reader
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === 'journalist'}
              className={role === 'journalist' ? 'active' : ''}
              onClick={() => setRole('journalist')}
            >
              Journalist
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
              {errors.name && <em className="field-error">{errors.name}</em>}
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <em className="field-error">{errors.email}</em>}
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Upper, lower & number required"
                autoComplete="new-password"
              />
              {errors.password && <em className="field-error">{errors.password}</em>}
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <em className="field-error">{errors.confirmPassword}</em>
              )}
            </label>

            {role === 'journalist' && (
              <>
                <label className="field">
                  <span>Organization</span>
                  <input
                    type="text"
                    value={form.organization}
                    onChange={(e) => update('organization', e.target.value)}
                    placeholder="Newsroom or publication"
                  />
                  {errors.organization && (
                    <em className="field-error">{errors.organization}</em>
                  )}
                </label>

                <label className="field">
                  <span>Portfolio URL</span>
                  <input
                    type="url"
                    value={form.portfolioUrl}
                    onChange={(e) => update('portfolioUrl', e.target.value)}
                    placeholder="https://your-work.com"
                  />
                  {errors.portfolio && (
                    <em className="field-error">{errors.portfolio}</em>
                  )}
                </label>
              </>
            )}

            {generalError && <div className="form-error">{generalError}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-foot">
            Already have an account?{' '}
            <Link href="/login" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <style jsx>{`
        .auth-page {
          min-height: calc(100vh - 56px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          background: var(--bg, #f6f8f7);
        }
        .auth-card {
          width: 100%;
          max-width: 460px;
          background: var(--card, #ffffff);
          border: 1px solid var(--border, #e4e9e7);
          border-radius: 16px;
          padding: 36px 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
        }
        .auth-head h1 {
          font-family: var(--font-display, 'Space Grotesk'), sans-serif;
          font-size: 26px;
          margin: 0 0 8px;
          color: var(--foreground, #111);
        }
        .auth-head p {
          margin: 0 0 22px;
          color: var(--muted, #6b776f);
          font-size: 14px;
          line-height: 1.5;
        }
        .role-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 4px;
          background: var(--surface, #eef2f0);
          border-radius: 10px;
          margin-bottom: 22px;
        }
        .role-toggle button {
          border: none;
          background: transparent;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          color: var(--muted, #6b776f);
          transition: all 0.15s ease;
        }
        .role-toggle button.active {
          background: var(--card, #fff);
          color: var(--primary, #0f766e);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .field {
          display: block;
          margin-bottom: 16px;
        }
        .field > span {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--foreground, #111);
        }
        .field input {
          width: 100%;
          padding: 11px 13px;
          border: 1px solid var(--border, #d7dedb);
          border-radius: 10px;
          font-size: 14px;
          background: var(--card, #fff);
          color: var(--foreground, #111);
        }
        .field input:focus {
          outline: none;
          border-color: var(--primary, #0f766e);
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }
        .field-error {
          display: block;
          margin-top: 5px;
          font-size: 12px;
          font-style: normal;
          color: #d8453a;
        }
        .form-error {
          background: #fdeceb;
          color: #b5372f;
          border: 1px solid #f5c4bf;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .submit-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: var(--primary, #0f766e);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .submit-btn:hover {
          opacity: 0.92;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: progress;
        }
        .auth-foot {
          text-align: center;
          margin: 20px 0 0;
          font-size: 14px;
          color: var(--muted, #6b776f);
        }
        .link {
          color: var(--primary, #0f766e);
          font-weight: 700;
          text-decoration: none;
        }
      `}</style>
    </>
  )
}
