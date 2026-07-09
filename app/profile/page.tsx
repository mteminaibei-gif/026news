'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, User, Mail, MapPin, Calendar, MessageSquare, LogOut, Save, Loader2 } from 'lucide-react'

interface UserProfile {
  user_id: number
  name: string
  email: string
  bio: string | null
  profile_image: string | null
  location: string | null
  role: string
  created_at: string
  is_public_profile: boolean
}

interface Comment {
  comment_id: number
  comment_text: string
  created_at: string
  article: {
    title: string
    slug: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'comments'>('profile')

  useEffect(() => {
    loadProfile()
    loadComments()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) {
        router.push('/login?redirect=/profile')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single() as { data: UserProfile | null }

      if (profile) {
        setUser(profile)
        setName(profile.name || '')
        setBio(profile.bio || '')
        setLocation(profile.location || '')
        setIsPublic(profile.is_public_profile || false)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single() as { data: { user_id: number } | null }

      if (!profile) return

      const { data: userComments } = await supabase
        .from('comments')
        .select('*, article:articles(title, slug)')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (userComments) {
        setComments(userComments as unknown as Comment[])
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single() as { data: { user_id: number } | null }

      if (!profile) return

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          bio,
          location,
          is_public_profile: isPublic,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('user_id', profile.user_id)

      if (updateError) {
        setError('Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      await loadProfile()
    } catch (err) {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single() as { data: { user_id: number } | null }

      if (!profile) return

      // Upload to Supabase Storage
      const fileName = `avatars/${profile.user_id}-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError('Failed to upload image')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update user profile
      await supabase
        .from('users')
        .update({ profile_image: publicUrl } as never)
        .eq('user_id', profile.user_id)

      await loadProfile()
      setSuccess('Profile picture updated!')
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-[#1a5c2a]">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#1a5c2a]">My Profile</h1>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'profile'
                ? 'bg-[#1a5c2a] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User size={16} className="inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              activeTab === 'comments'
                ? 'bg-[#1a5c2a] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={16} className="inline mr-2" />
            My Comments ({comments.length})
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {user?.profile_image ? (
                    <Image
                      src={user.profile_image}
                      alt={user.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#1a5c2a]/10">
                      <User size={40} className="text-[#1a5c2a]/40" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-0 right-0 bg-[#1a5c2a] text-white p-2 rounded-full hover:bg-[#13411f] transition-colors shadow-lg"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-[#1a5c2a]/10 text-[#1a5c2a] text-xs font-medium rounded-full capitalize">
                    {user?.role}
                  </span>
                  {user?.location && (
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin size={12} />
                      {user.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-xl mb-4">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#1a5c2a] focus:ring-2 focus:ring-[#1a5c2a]/20 outline-none resize-none"
                />
              </div>

              {/* Public Profile Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#1a5c2a] focus:ring-[#1a5c2a]"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  <strong>Make my profile public</strong>
                  <br />
                  <span className="text-gray-500">Allow others to see your profile and comments</span>
                </label>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-2 text-gray-400 text-sm pt-4 border-t border-gray-100">
                <Calendar size={14} />
                <span>Member since {new Date(user?.created_at || '').toLocaleDateString()}</span>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#1a5c2a] hover:bg-[#13411f] text-white font-bold py-4 rounded-2xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#1a5c2a]/20 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">My Comments</h2>
            
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">You haven&apos;t made any comments yet</p>
                <Link href="/" className="text-[#1a5c2a] font-medium hover:underline mt-2 inline-block">
                  Browse articles and share your thoughts
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.comment_id} className="p-4 bg-gray-50 rounded-xl">
                    <Link
                      href={`/article/${comment.article?.slug}`}
                      className="font-medium text-[#1a5c2a] hover:underline text-sm"
                    >
                      {comment.article?.title || 'Article'}
                    </Link>
                    <p className="text-gray-700 mt-2">{comment.comment_text}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(comment.created_at).toLocaleDateString()} at{' '}
                      {new Date(comment.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}