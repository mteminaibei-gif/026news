'use client'

import { useState, useRef } from 'react'
import { uploadProfileImage } from '@/lib/storage'
import { useUserSettings } from '@/lib/hooks/useUserSettings'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { SettingsLayout, SettingsSection, SettingRow } from '@/components/settings'
import { Toggle, Button, Input, Card } from '@/components/ui'
import { User, Bell, Lock, Share2, Palette, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'connected', label: 'Connected', icon: Share2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'delete', label: 'Delete Account', icon: Trash2 },
]

export default function SettingsPage() {
  const { data: authUser } = useUser()
  const { data: profile } = useProfile(authUser?.email)
  const { settings: initialSettings, loading, error: loadError, updateSettings } = useUserSettings(authUser?.email)

  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)

  const [settings, setSettings] = useState(initialSettings || {
    name: '',
    bio: '',
    profile_image: null,
    email: '',
    first_name: '',
    last_name: '',
    website: '',
    email_notifications: true,
    comment_notifications: true,
    follow_notifications: false,
    push_notifications: true,
    weekly_digest: true,
    theme: 'system' as const,
    profile_visibility: true,
    reading_history: true,
    two_factor: false,
    show_online_status: true,
  })

  const avatarInputRef = useRef<HTMLInputElement>(null)

  const patch = (updates: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      await updateSettings(settings)
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while saving.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    if (!profile?.user_id) {
      setError('Sign in again to change your photo')
      return
    }

    try {
      setSaving(true)
      const { url } = await uploadProfileImage(file, profile.user_id)
      patch({ profile_image: url })
      setError('')
    } catch (err) {
      setError('Failed to upload avatar')
    } finally {
      setSaving(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
        }}
      >
        <div className="page-spinner" />
      </div>
    )
  }

  const initials = (settings.name || settings.first_name || 'U').charAt(0).toUpperCase()

  const glassCardStyle = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(140%)' as any,
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(140%)' as any,
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--glow-soft)',
    overflow: 'hidden',
  }

  return (
    <>
      <SettingsLayout
        tabs={SETTINGS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Settings"
        description="Manage your account and preferences"
      >
        {error && (
          <div style={{ ...glassCardStyle, background: 'var(--error-light)', border: '1px solid var(--error)', marginBottom: '1.5rem', backdropFilter: 'none' }}>
            <p style={{ color: 'var(--error)', fontSize: '0.875rem', padding: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {error}
            </p>
          </div>
        )}

        {saved && (
          <div style={{ ...glassCardStyle, background: 'var(--success-light)', border: '1px solid var(--success)', marginBottom: '1.5rem', backdropFilter: 'none' }}>
            <p style={{ color: 'var(--success)', fontSize: '0.875rem', padding: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} /> Settings saved successfully
            </p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <SettingsSection
            title="Your Profile"
            description="Your public profile information visible to other readers and authors."
          >
            <div style={glassCardStyle}>
              <div className="profile-edit-row" style={{ padding: '1.5rem' }}>
                <div className="profile-avatar-edit">
                  <div className="profile-avatar">
                    {settings.profile_image ? (
                      <img
                        src={settings.profile_image}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }}
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <button
                    type="button"
                    className="avatar-edit-btn"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Change photo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="profile-fields">
                  <div className="field">
                    <label className="field-label">First Name</label>
                    <Input value={settings.first_name ?? ''} onChange={e => patch({ first_name: e.target.value })} placeholder="First name" />
                  </div>
                  <div className="field">
                    <label className="field-label">Last Name</label>
                    <Input value={settings.last_name ?? ''} onChange={e => patch({ last_name: e.target.value })} placeholder="Last name" />
                  </div>
                  <div className="field field-full">
                    <label className="field-label">Username</label>
                    <Input value={settings.name} onChange={e => patch({ name: e.target.value })} placeholder="username" />
                  </div>
                  <div className="field field-full">
                    <label className="field-label">Bio</label>
                    <textarea
                      className="field-input"
                      value={settings.bio}
                      onChange={e => patch({ bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="field field-full">
                    <label className="field-label">Website</label>
                    <Input
                      value={settings.website ?? ''}
                      onChange={e => patch({ website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      type="url"
                    />
                  </div>
                  <div className="field field-full">
                    <SettingRow
                      label="Show Online Status"
                      description="Other users can see when you are online. Turn off to appear offline."
                      action={
                        <Toggle
                          checked={settings.show_online_status ?? true}
                          onChange={v => patch({ show_online_status: v })}
                        />
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <SettingsSection
            title="Notification Preferences"
            description="Control what you get notified about and how."
          >
            <div style={glassCardStyle}>
              <SettingRow
                label="Daily Digest Email"
                description="Top stories delivered to your inbox every morning"
                action={<Toggle checked={settings.email_notifications} onChange={v => patch({ email_notifications: v })} />}
              />
              <SettingRow
                label="Push Notifications"
                description="Breaking news and stories from authors you follow"
                action={<Toggle checked={settings.push_notifications} onChange={v => patch({ push_notifications: v })} />}
              />
              <SettingRow
                label="Comment Replies"
                description="When someone replies to your comments"
                action={<Toggle checked={settings.comment_notifications} onChange={v => patch({ comment_notifications: v })} />}
              />
              <SettingRow
                label="New Followers"
                description="When someone follows your profile"
                action={<Toggle checked={settings.follow_notifications} onChange={v => patch({ follow_notifications: v })} />}
              />
              <SettingRow
                label="Weekly Reading Report"
                description="Your reading stats and recommendations every Sunday"
                action={<Toggle checked={settings.weekly_digest} onChange={v => patch({ weekly_digest: v })} />}
                divider={false}
              />
            </div>
          </SettingsSection>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <SettingsSection title="Security" description="Keep your account secure.">
            <div style={glassCardStyle}>
              <SettingRow
                label="Email"
                description="Your account email address"
                value={settings.email || authUser?.email || ''}
                action={<Button variant="ghost" size="sm">Change</Button>}
              />
              <SettingRow
                label="Password"
                description="Last changed 3 months ago"
                action={<Button variant="ghost" size="sm">Update</Button>}
              />
              <SettingRow
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                action={<Toggle checked={settings.two_factor} onChange={v => patch({ two_factor: v })} />}
              />
              <SettingRow
                label="Active Sessions"
                description="2 devices currently logged in"
                action={<Button variant="ghost" size="sm">Manage</Button>}
                divider={false}
              />
            </div>
          </SettingsSection>
        )}

        {/* Connected Accounts Tab */}
        {activeTab === 'connected' && (
          <SettingsSection title="Connected Accounts" description="Link external accounts for faster login and sharing.">
            <div style={glassCardStyle}>
              <div className="connected-list" style={{ padding: '1rem' }}>
                <div className="connected-item">
                  <div className="connected-icon" style={{ background: 'oklch(92% 0.02 0)' }}>
                    <svg viewBox="0 0 24 24" width={20} height={20}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  </div>
                  <div className="connected-info">
                    <div className="connected-name">Google</div>
                    <div className="connected-detail">{settings.email || 'Not connected'}</div>
                  </div>
                  <span className="connected-status linked">Connected</span>
                </div>
                <div className="connected-item">
                  <div className="connected-icon" style={{ background: 'oklch(92% 0.01 180)' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)', width: 20, height: 20 }}><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21.5c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" /></svg>
                  </div>
                  <div className="connected-info">
                    <div className="connected-name">GitHub</div>
                    <div className="connected-detail">Not connected</div>
                  </div>
                  <span className="connected-status unlinked">Connect</span>
                </div>
                <div className="connected-item">
                  <div className="connected-icon" style={{ background: 'oklch(92% 0.04 145)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="oklch(50% 0.14 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                  </div>
                  <div className="connected-info">
                    <div className="connected-name">M-Pesa</div>
                    <div className="connected-detail">+254 712 ***678</div>
                  </div>
                  <span className="connected-status linked">Connected</span>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <SettingsSection title="Appearance" description="Customize how 026Newsblog looks for you.">
            <div style={glassCardStyle}>
              <div style={{ marginBottom: '2rem', padding: '1.5rem 1.5rem 0' }}>
                <p className="field-label" style={{ marginBottom: '1rem' }}>Theme</p>
                <div className="theme-options">
                  {[
                    { value: 'light', label: 'Light', preview: 'linear-gradient(135deg, oklch(97% 0.008 180), oklch(92% 0.01 180))', border: 'oklch(88% 0.008 180)' },
                    { value: 'dark', label: 'Dark', preview: 'linear-gradient(135deg, oklch(14% 0.015 175), oklch(20% 0.02 175))', border: 'oklch(28% 0.015 175)' },
                    { value: 'system', label: 'System', preview: 'linear-gradient(135deg, oklch(97% 0.008 180) 50%, oklch(14% 0.015 175) 50%)', border: 'oklch(88% 0.008 180)' },
                  ].map(opt => (
                    <div
                      key={opt.value}
                      className={`theme-option${settings.theme === opt.value ? ' active' : ''}`}
                      onClick={() => patch({ theme: opt.value as 'light' | 'dark' | 'system' })}
                    >
                      <div className="theme-preview" style={{ background: opt.preview, border: `1px solid ${opt.border}` }} />
                      <span className="theme-option-name">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <SettingRow
                  label="Reduce Motion"
                  description="Minimize animations throughout the interface"
                  action={<Toggle checked={false} onChange={() => {}} />}
                />
                <SettingRow
                  label="Compact View"
                  description="Show more articles with smaller cards"
                  action={<Toggle checked={false} onChange={() => {}} />}
                  divider={false}
                />
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Delete Account Tab */}
        {activeTab === 'delete' && (
          <SettingsSection
            title="Danger Zone"
            description="Irreversible actions. Proceed with caution."
          >
            <div
              className="danger-section"
              style={{
                border: '1px solid var(--error)',
                background: 'var(--error-light)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--error)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--error)', marginBottom: '0.5rem' }}>
                  Deactivate Account
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Temporarily deactivate your account. You can reactivate it anytime.
                </p>
                <Button variant="danger" size="sm">
                  Deactivate Account
                </Button>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--error)', marginBottom: '0.5rem' }}>
                  Delete Account Permanently
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="danger" size="sm">
                  Delete Account Permanently
                </Button>
              </div>
            </div>
          </SettingsSection>
        )}
      </SettingsLayout>

      {dirty && (
        <div className="save-bar" style={{
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(calc(var(--glass-blur) + 6px)) saturate(150%)' as any,
          WebkitBackdropFilter: 'blur(calc(var(--glass-blur) + 6px)) saturate(150%)' as any,
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--glow-soft)',
        }}>
          <span className="save-bar-text"><span className="save-dot" />You have unsaved changes</span>
          <Button variant="ghost" size="sm" onClick={() => { setSettings(initialSettings || settings); setDirty(false); }}>Discard</Button>
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      )}
    </>
  )
}
