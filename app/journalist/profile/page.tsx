'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { BadgePill } from '@/components/ui/BadgePill'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  user_id: number; name: string; email: string; bio: string | null
  profile_image: string | null; badge_level: string | null; rank_score: number
  social_links: { organization?: string; portfolio?: string; phone?: string; twitter?: string; linkedin?: string } | null
}
type BadgeRow = { badge_type: string; badge_label: string }

const inputCls = 'w-full border border-[#e8f5ea] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4caf28] focus:ring-2 focus:ring-[#4caf28]/20 transition-all duration-300'

export default function JournalistProfilePage() {
  const supabase = createClient()

  const [profile, setProfile]           = useState<Profile | null>(null)
  const [badges, setBadges]             = useState<BadgeRow[]>([])
  const [name, setName]                 = useState('')
  const [bio, setBio]                   = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio]       = useState('')
  const [phone, setPhone]               = useState('')
  const [twitter, setTwitter]           = useState('')
  const [linkedin, setLinkedin]         = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('user_id, name, email, bio, profile_image, badge_level, rank_score, social_links')
        .eq('email', user.email ?? '')
        .single()
      if (!data) return
      const p = data as unknown as Profile
      setProfile(p)
      setName(p.name)
      setBio(p.bio ?? '')
      setOrganization(p.social_links?.organization ?? '')
      setPortfolio(p.social_links?.portfolio ?? '')
      setPhone(p.social_links?.phone ?? '')
      setTwitter(p.social_links?.twitter ?? '')
      setLinkedin(p.social_links?.linkedin ?? '')
      const { data: bdg } = await supabase
        .from('journalist_badges').select('badge_type, badge_label').eq('user_id', p.user_id)
      setBadges((bdg ?? []) as BadgeRow[])
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/journalist/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, organization, portfolio, phone, twitter, linkedin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Network error — try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#1a5c2a]/50">
          <div className="w-8 h-8 border-2 border-[#1a5c2a]/30 border-t-[#1a5c2a] rounded-full animate-spin" />
          <span className="text-sm">Loading profile…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Topbar title="My Profile" user={{ name: profile.name, profile_image: profile.profile_image }} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">

        {/* Profile hero card */}
        <div className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="h-28 bg-gradient-to-r from-[#1a5c2a] via-[#2d8a47] to-[#4caf28]" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              {profile.profile_image ? (
                <Image
                  src={profile.profile_image} alt={profile.name}
                  width={80} height={80}
                  className="rounded-full ring-4 ring-white object-cover shrink-0 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full ring-4 ring-white bg-[#e8f5ea] flex items-center justify-center text-2xl font-black text-[#1a5c2a] shrink-0 shadow-md">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-lg font-extrabold text-gray-900">{profile.name}</h2>
                <p className="text-xs text-gray-400">{profile.email}</p>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#f5c518] font-bold">🏆 Rank Score: {Math.round(profile.rank_score ?? 0).toLocaleString()}</span>
              {profile.badge_level && (
                <BadgePill type={profile.badge_level} label={`Level: ${profile.badge_level}`} />
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="bg-white/90 backdrop-blur-sm border border-[#e8f5ea] rounded-2xl shadow-sm p-6 space-y-4 transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1 h-5 rounded-full bg-[#1a5c2a]" />
            <h3 className="text-sm font-bold text-[#1a5c2a]">Edit Profile</h3>
          </div>

          {error && (
            <div role="alert" className="bg-[#fde8e8] border border-[#c8102e]/20 text-[#c8102e] text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {saved && (
            <div role="status" className="bg-[#e8f5ea] border border-[#4caf28]/30 text-[#1a5c2a] text-sm px-4 py-3 rounded-xl">
              ✅ Profile saved successfully.
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Organization</label>
              <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="Your news outlet" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell readers about yourself and what you cover…"
              className={inputCls + ' resize-none'} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Portfolio / Website</label>
              <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                placeholder="https://yoursite.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone / M-Pesa</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">X / Twitter</label>
              <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)}
                placeholder="@handle" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn</label>
              <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/…" className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-[#e8f5ea]">
            <button type="submit" disabled={saving}
              className="bg-[#1a5c2a] hover:bg-[#2d8a47] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-sm text-[#1a5c2a] font-semibold">✓ Saved!</span>
            )}
          </div>
        </form>

      </main>
    </div>
  )
}
