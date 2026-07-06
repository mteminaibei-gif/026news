'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Topbar } from '@/components/layout/Topbar'
import { MOCK_USERS } from '@/lib/mock-data'

const JOURNALIST = MOCK_USERS.find(u => u.role === 'journalist')!

export default function JournalistProfilePage() {
  const [name, setName] = useState(JOURNALIST.name)
  const [bio, setBio] = useState(JOURNALIST.bio ?? '')
  const [email, setEmail] = useState(JOURNALIST.email)
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
      <Topbar title="My Profile" user={JOURNALIST} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-[#0a1628] to-[#1a3a6e] relative">
            <div className="absolute bottom-0 left-6 translate-y-1/2">
              <div className="relative">
                <Image
                  src={JOURNALIST.profile_image ?? ''}
                  alt={JOURNALIST.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover ring-4 ring-white"
                />
                <button
                  aria-label="Change profile photo"
                  className="absolute bottom-0 right-0 w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✏️
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="pt-14 px-6 pb-8">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6">Edit Profile</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={300}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/300</p>
              </div>
            </div>

            {/* Social links */}
            <h3 className="text-sm font-extrabold text-gray-700 mt-6 mb-4">Social Links</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {['Twitter / X', 'LinkedIn', 'Website', 'Instagram'].map(platform => (
                <div key={platform}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{platform}</label>
                  <input
                    type="url"
                    placeholder={`https://...`}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            {/* Password section */}
            <h3 className="text-sm font-extrabold text-gray-700 mt-6 mb-4">Change Password</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1" htmlFor="current-pw">Current Password</label>
                <input id="current-pw" type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1" htmlFor="new-pw">New Password</label>
                <input id="new-pw" type="password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Save Changes
              </button>
              {saved && (
                <span className="text-sm text-green-600 font-semibold">✓ Profile saved!</span>
              )}
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-red-100">
          <h3 className="text-sm font-extrabold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-5 py-2 rounded-lg text-sm border border-red-200 transition-colors">
            Delete Account
          </button>
        </div>
      </main>
    </div>
  )
}
