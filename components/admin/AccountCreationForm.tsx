'use client'

import { useState } from 'react'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  name: string
  role: 'reader' | 'journalist'
  phone: string
  location: string
  bio: string
}

interface AccountCreationFormProps {
  onSuccess?: (user: any) => void
  onClose?: () => void
}

export function AccountCreationForm({ onSuccess, onClose }: AccountCreationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'reader',
    phone: '',
    location: '',
    bio: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return 'Email is required'
    if (!formData.email.includes('@')) return 'Invalid email format'
    if (!formData.password) return 'Password is required'
    if (formData.password.length < 8) return 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    if (!formData.name.trim()) return 'Name is required'
    if (formData.name.trim().length < 2) return 'Name must be at least 2 characters'
    return null
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          name: formData.name.trim(),
          role: formData.role,
          phone: formData.phone.trim() || undefined,
          location: formData.location.trim() || undefined,
          bio: formData.bio.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create account')
        return
      }

      setSuccess(`✓ ${formData.role} account created successfully!`)
      
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'reader',
        phone: '',
        location: '',
        bio: '',
      })

      if (onSuccess) {
        onSuccess(data.user)
      }

      setTimeout(() => {
        if (onClose) onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { borderColor: 'var(--border)', ['--tw-ring-color' as string]: 'var(--primary)' }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--primary-light)', border: '1px solid var(--success)', color: 'var(--success)' }}>
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Full Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., John Kamau"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="e.g., john@example.com"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Account Type *
        </label>
        <div className="flex gap-3">
          {[
            { value: 'reader', label: '👤 Reader', description: 'Can read and comment on articles' },
            { value: 'journalist', label: '✍️ Author', description: 'Can write and publish articles' },
          ].map(option => (
            <label
              key={option.value}
              className="flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all"
              style={{
                borderColor: formData.role === option.value ? 'var(--primary)' : 'var(--border)',
                background: formData.role === option.value ? 'var(--primary-light)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={formData.role === option.value}
                onChange={handleChange}
                className="sr-only"
                disabled={loading}
              />
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{option.label}</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{option.description}</div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Password *
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 8 characters"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={inputStyle}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5"
            style={{ color: 'var(--text-tertiary)' }}
            disabled={loading}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Confirm Password *
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="e.g., +254 712 345 678"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
          Location (Optional)
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Nairobi, Kenya"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={inputStyle}
          disabled={loading}
        />
      </div>

      {formData.role === 'journalist' && (
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
            Professional Bio (Optional)
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Brief professional background..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={inputStyle}
            disabled={loading}
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 text-white font-bold py-2.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-hover))' }}
        >
          {loading ? '⏳ Creating...' : `✓ Create ${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}`}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 font-bold py-2.5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
