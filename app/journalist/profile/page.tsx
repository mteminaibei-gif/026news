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

export default function JournalistProfilePage() {
  const supabase = createClient()

  const [profile, setProfile]         = useState<Profile | null>(null)
  const [badges, setBadges]           = useState<BadgeRow[]>([])
  const [name, setName]               = useState('')
  const [bio, setBio]                 = useState('')
  const [organization, setOrganization] = useState('')
  const [portfolio, setPortfolio]     = useState('')
  const [phone, setPhone]             = useState('')
  const [twitter, setTwitter]         = useState('')
  const [linkedin, setLinkedin]       = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

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
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="My Profile" user={{ name: profile.name, profile_image: profile.profile_image }} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-[#0a1628] to-[#1a3a6e]" />
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-10 mb-4">
              {profile.profile_image ? (
                <Image
                  src={profile.profile_image}
                  alt={profile.name}
                  width={80} height={80}
                  className="rounded-full ring-4 ring-white object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-full ring-4 ring-white bg-gray-200 flex items-center justify-center text-2xl font-black text-gray-500 shrink-0">
                  {profile.name.charAt(0)}
                </div>
              )}
              <div className="pb-1">
                <h2 className="text-lg font-extrabold text-gray-900">{profile.name}</h2>
                <p className="text-xs text-gray-400">{profile.email}</p>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map(b => <BadgePill key={b.badge_type} type={b.badge_type} label={b.badge_label} />)}
              </div>
            )}

            {/* Rank */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-orange-500 font-bold">🏆 Rank Score: {Math.round(profile.rank_score ?? 0).toLocaleString()}</span>
              {profile.badge_level && (
                <BadgePill type={profile.badge_level} label={`Level: ${profile.badge_level}`} />
              )}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Edit Profile</h3>

          {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          {saved && <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">✅ Profile saved successfully.</div>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Organization</label>
              <input type="text" value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="Your news outlet"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Bio</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell readers about yourself and what you cover…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Portfolio / Website</label>
              <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                placeholder="https://yoursite.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Phone / M-Pesa</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+254..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">X / Twitter</label>
              <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)}
                placeholder="@handle"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">LinkedIn</label>
              <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>

      </main>
    </div>
  )
}
