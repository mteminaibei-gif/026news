import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Camera, Check, Mail, MapPin, MessageSquare, User, Users, X, TrendingUp, Heart, Bookmark, ExternalLink, Shield, Bell, Globe, Lock, Eye, Star, Save, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [profileViews, setProfileViews] = useState(0)
  
  const [stats, setStats] = useState({
    totalArticles: 142,
    totalComments: 67,
    totalLikes: 89,
    totalFollowing: 15,
    totalFollowers: 128,
    profileViews: 2847,
    joinDate: 'January 2026',
    lastActive: '2 hours ago'
  })
  
  const [savedArticles, setSavedArticles] = useState([])
  const [likedArticles, setLikedArticles] = useState([])
  const [comments, setComments] = useState([])
  const [followingList, setFollowingList] = useState([])
  const [followersList, setFollowersList] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [activityData, setActivityData] = useState([])
  const [userInterests, setUserInterests] = useState([])
  const [userWebsites, setUserWebsites] = useState([])
  
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'liked' | 'comments' | 'following' | 'activity' | 'settings'>('profile')
  const [showEditModal, setShowEditModal] = useState(false)
  const [newInterest, setNewInterest] = useState('')
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('en')
  const [selectedTheme, setSelectedTheme] = useState('kenya-red')
  
  const userInitials = user ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
  const isOwnProfile = true
  const displayName = user?.name || 'Unnamed User'
  const displayRole = user?.role || 'Reader'
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'
  
  const verificationStatus = {
    email: emailVerified,
    phone: phoneVerified,
    id: user?.is_verified || false
  }
  
  const hasProfileImage = () => {
    return user?.profile_image || user?.avatar_url || false
  }
  
  const getProfileImage = () => {
    return user?.profile_image || user?.avatar_url || ''
  }
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }
  
  useEffect(() => {
    loadAllProfileData()
    loadInterests()
    const themeFromStorage = localStorage.getItem('026-theme')
    if (themeFromStorage) setTheme(themeFromStorage)
    const languageFromStorage = localStorage.getItem('026-language')
    if (languageFromStorage) setLanguage(languageFromStorage)
    trackProfileView()
  }, [])
  
  const loadAllProfileData = async () => {
    try {
      await Promise.all([
        loadProfile(),
        loadStatsData(),
        loadSavedArticles(),
        loadLikedArticles(),
        loadCommentsData(),
        loadFollowingData(),
        loadNotificationsData(),
        loadActivityData(),
        loadWebsitesData()
      ])
    } catch (err) {
      console.error('Error loading profile data:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const loadProfile = async () => {
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
        .single()
      
      if (profile) {
        setUser(profile as UserProfile)
        setName(profile.name || '')
        setBio(profile.bio || '')
        setLocation(profile.location || '')
        setIsPublic(profile.is_public_profile || false)
        setEmailVerified(true)
        setPhoneVerified(true)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }
  
  const loadStatsData = async () => {
    try {
      const mockStats = {
        totalArticles: 142,
        totalComments: 67,
        totalLikes: 89,
        totalFollowing: 15,
        totalFollowers: 128,
        profileViews: 2847,
        joinDate: 'January 2026',
        lastActive: '2 hours ago'
      }
      setStats(mockStats)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }
  
  const trackProfileView = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return
      
      setProfileViews(prev => prev + 1)
    } catch (err) {
      console.error('Error tracking profile view:', err)
    }
  }
  
  const loadSavedArticles = async () => {
    try {
      const mockSavedArticles = [
        {
          article_id: 1,
          title: 'How Nairobi Became Africa\'s Silicon Savannah',
          slug: 'nairobi-silicon-savannah',
          thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop',
          category: 'Technology',
          category_color: 'var(--accent)',
          author_name: 'James Kariuki',
          author_avatar: '',
          created_at: '2024-01-15',
          read_time: 7,
          is_liked: true,
          is_saved: true,
          likes: 24
        },
        {
          article_id: 2,
          title: 'M-Pesa\\'s Next Chapter: Expanding Beyond Payments',
          slug: 'mpesa-next-chapter',
          thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=200&fit=crop',
          category: 'Business',
          category_color: 'var(--primary)',
          author_name: 'Wanjiku Muthoni',
          author_avatar: '',
          created_at: '2024-01-12',
          read_time: 11,
          is_liked: false,
          is_saved: true,
          likes: 18
        },
        {
          article_id: 3,
          title: 'Why Every African Startup Is Building an AI Product Right Now',
          slug: 'african-startup-ai',
          thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop',
          category: 'Technology',
          category_color: 'var(--accent)',
          author_name: 'Olusegun Femi',
          author_avatar: '',
          created_at: '2024-01-10',
          read_time: 6,
          is_liked: true,
          is_saved: true,
          likes: 42
        },
        {
          article_id: 4,
          title: 'CRISPR Gene Therapy Trials Show 94% Success Rate',
          slug: 'crispr-gene-therapy-success',
          thumbnail: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&h=200&fit=crop',
          category: 'Science',
          category_color: 'var(--success)',
          author_name: 'Dr. Fatima Ndegwa',
          author_avatar: '',
          created_at: '2024-01-08',
          read_time: 12,
          is_liked: true,
          is_saved: true,
          likes: 67
        }
      ]
      setSavedArticles(mockSavedArticles)
    } catch (err) {
      console.error('Error loading saved articles:', err)
    }
  }
  
  const loadLikedArticles = async () => {
    try {
      const mockLikedArticles = [
        {
          article_id: 5,
          title: 'The $500M AgriTech Bet: Can Technology Solve Food Security?',
          slug: 'agritech-food-security-bet',
          thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&h=200&fit=crop',
          category: 'Business',
          category_color: 'var(--primary)',
          author_name: 'Grace Akinyi',
          author_avatar: '',
          created_at: '2024-01-05',
          read_time: 8,
          is_liked: true,
          is_saved: false,
          likes: 38
        },
        {
          article_id: 6,
          title: 'Gengetone to Global: How Kenyan Music Producers Are Conquering Charts',
          slug: 'kenyan-music-producers-global',
          thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=200&fit=crop',
          category: 'Culture',
          category_color: 'var(--accent-light)',
          author_name: 'DJ Mwas',
          author_avatar: '',
          created_at: '2024-01-03',
          read_time: 5,
          is_liked: true,
          is_saved: false,
          likes: 29
        }
      ]
      setLikedArticles(mockLikedArticles)
    } catch (err) {
      console.error('Error loading liked articles:', err)
    }
  }
  
  const loadCommentsData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return
      
      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single()
      
      if (!profile) return
      
      const { data: userComments } = await supabase
        .from('comments')
        .select('*, article:articles(title, slug)')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (userComments) {
        const formattedComments = (userComments as any[]).map(comment => ({
          comment_id: comment.id,
          comment_text: comment.content,
          created_at: comment.created_at,
          article: comment.articles
        }))
        setComments(formattedComments)
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }
  
  const loadFollowingData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return
      
      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single()
      
      if (!profile) return
      
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id, followed_at')
        .eq('follower_id', profile.user_id)
      
      const { data: followers } = await supabase
        .from('user_follows')
        .select('follower_id, followed_at')
        .eq('following_id', profile.user_id)
      
      const mockFollowing = [
        {
          user_id: 101,
          name: 'Aisha Omar',
          avatar: '',
          role: 'Journalist',
          is_following: true,
          followers_count: 245
        },
        {
          user_id: 102,
          name: 'David Kimani',
          avatar: '',
          role: 'Reader',
          is_following: true,
          followers_count: 89
        },
        {
          user_id: 103,
          name: 'Sarah Njeri',
          avatar: '',
          role: 'Author',
          is_following: false,
          followers_count: 432
        }
      ]
      
      const mockFollowers = [
        {
          user_id: 101,
          name: 'Aisha Omar',
          avatar: '',
          role: 'Journalist',
          is_following: false,
          followers_count: 12
        },
        {
          user_id: 201,
          name: 'John Doe',
          avatar: '',
          role: 'Reader',
          is_following: true,
          followers_count: 67
        }
      ]
      
      setFollowingList(mockFollowing)
      setFollowersList(mockFollowers)
    } catch (err) {
      console.error('Error loading following data:', err)
    }
  }
  
  const loadNotificationsData = async () => {
    try {
      const mockNotifications = [
        {
          id: '1',
          type: 'new_submission',
          title: 'New article submission',
          message: '\"How Nairobi Became Africa\'s Silicon Savannah\" is awaiting review.',
          time: '20 min ago',
          read: false,
          action_url: '/admin/review/1',
          actor_name: 'James Kariuki',
          actor_avatar: '',
          article_title: 'How Nairobi Became Africa\'s Silicon Savannah',
          icon: '📝'
        },
        {
          id: '2',
          type: 'comment_reply',
          title: 'Sarah Njeri commented on your article',
          message: 'Great insights on the tech scene in Kenya!',
          time: '1 hour ago',
          read: true,
          action_url: '/article/nairobi-silicon-savannah#comments',
          actor_name: 'Sarah Njeri',
          actor_avatar: '',
          article_title: 'How Nairobi Became Africa\'s Silicon Savannah',
          icon: '💬'
        },
        {
          id: '3',
          type: 'verification',
          title: 'Email verified successfully',
          message: 'Your email address has been verified. You can now receive important updates.',
          time: 'Yesterday',
          read: false,
          action_url: '/profile',
          actor_name: '',
          actor_avatar: '',
          icon: '✅'
        },
        {
          id: '4',
          type: 'milestone',
          title: 'Profile milestone reached!',
          message: 'You\\'ve read 100+ articles and saved 50+ stories. Keep up the great work!',
          time: '2 days ago',
          read: false,
          action_url: '/profile',
          icon: '🎯'
        }
      ]
      
      setNotifications(mockNotifications)
      setUnreadNotifCount(mockNotifications.filter(n => !n.read).length)
    } catch (err) {
      console.error('Error loading notifications:', err)
    }
  }
  
  const loadActivityData = async () => {
    try {
      const today = new Date()
      const activity = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        const minutes = Math.floor(Math.random() * 120) + 30
        const articles = Math.floor(minutes / 5)
        
        activity.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          minutes_read: minutes,
          articles
        })
      }
      
      setActivityData(activity)
    } catch (err) {
      console.error('Error loading activity data:', err)
    }
  }
  
  const loadWebsitesData = async () => {
    try {
      const mockWebsites = [
        { name: 'Personal Blog', url: 'https://blog.example.com' },
        { name: 'Twitter', url: 'https://twitter.com/example' },
        { name: 'LinkedIn', url: 'https://linkedin.com/in/example' }
      ]
      setUserWebsites(mockWebsites)
    } catch (err) {
      console.error('Error loading websites:', err)
    }
  }
  
  const loadInterests = async () => {
    try {
      const mockInterests = [
        { id: 'tech', name: 'Technology', icon: '💻', color: 'var(--primary)' },
        { id: 'business', name: 'Business', icon: '📊', color: 'var(--accent)' },
        { id: 'politics', name: 'Politics', icon: '🏛️', color: 'var(--error)' },
        { id: 'sports', name: 'Sports', icon: '⚽', color: 'var(--success)' },
        { id: 'culture', name: 'Culture', icon: '🎭', color: 'var(--warning)' },
        { id: 'science', name: 'Science', icon: '🔬', color: 'var(--primary-light)' },
        { id: 'health', name: 'Health', icon: '❤️', color: 'var(--accent-light)' },
        { id: 'travel', name: 'Travel', icon: '✈️', color: 'var(--warning)' }
      ]}
      setUserInterests(mockInterests)
    } catch (err) {
      console.error('Error loading interests:', err)
    }
  }
  
  const handleSaveProfile = async (e: React.FormEvent) => {
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
        .single()
      
      if (!profile) return
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name,
          bio,
          location,
          is_public_profile: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)
      
      if (updateError) {
        setError('Failed to update profile')
        return
      }
      
      setSuccess('Profile updated successfully!')
      await loadProfile()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('An error occurred while saving')
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    
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
        .single()
      
      if (!profile) return
      
      const fileName = `avatars/${profile.user_id}-${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })
      
      if (uploadError) {
        setError('Failed to upload image')
        return
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)
      
      await supabase
        .from('users')
        .update({ profile_image: publicUrl })
        .eq('user_id', profile.user_id)
      
      await loadProfile()
      setSuccess('Profile picture updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to upload image')
      console.error('Error uploading image:', err)
    } finally {
      setSaving(false)
    }
  }
  
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('026-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  const toggleTheme = () => {
    const themes = ['light', 'dark']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const newTheme = themes[nextIndex]
    setTheme(newTheme)
    localStorage.setItem('026-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }
  
  const selectTheme = (themeName: string) => {
    setSelectedTheme(themeName)
    setTheme(themeName)
    localStorage.setItem('026-theme', themeName)
    document.documentElement.setAttribute('data-theme', themeName)
  }
  
  const followUser = async (userId: number) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return
      
      await supabase
        .from('user_follows')
        .insert({
          follower_id: authUser.id,
          following_id: userId
        })
      
      setFollowingList(prev => prev.map(user =>
        user.user_id === userId 
          ? { ...user, is_following: true, followers_count: user.followers_count + 1 }
          : user
      ))
    } catch (err) {
      console.error('Error following user:', err)
    }
  }
  
  const unfollowUser = async (userId: number) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser?.id) return
      
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', authUser.id)
        .eq('following_id', userId)
      
      setFollowingList(prev => prev.map(user =>
        user.user_id === userId 
          ? { ...user, is_following: false, followers_count: Math.max(0, user.followers_count - 1) }
          : user
      ))
    } catch (err) {
      console.error('Error unfollowing user:', err)
    }
  }
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
    setUnreadNotifCount(prev => Math.max(0, prev - 1))
  }
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadNotifCount(0)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--primary)' }}>Loading profile...</div>
      </div>
    )
  }
  
  const activityChartData = () => {
    const colors = [
      'var(--primary-light)',
      'var(--primary)',
      'var(--accent)',
      'var(--success)',
      'var(--warning)',
      'var(--error)'
    ]
    
    return activityData.map((item, index) => ({
      day: item.date.split(' ')[0],
      value: item.minutes_read,
      color: colors[index % colors.length]
    }))
  }
  
  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative mb-8 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--bg-elevated), var(--primary))' }}>
          <div className="relative p-8 md:p-12 pb-24">
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => selectTheme('light')}
                className="p-2 rounded-lg transition-all"
                style={{ 
                  background: selectedTheme === 'light' ? 'var(--bg-surface)' : 'transparent',
                  color: selectedTheme === 'light' ? 'var(--primary)' : 'var(--text-tertiary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42 1.42"/>
                </svg>
              </button>
              <button
                onClick={() => selectTheme('dark')}
                className="p-2 rounded-lg transition-all"
                style={{ 
                  background: selectedTheme === 'dark' ? 'var(--bg-surface)' : 'transparent',
                  color: selectedTheme === 'dark' ? 'var(--primary)' : 'var(--text-tertiary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 items-end">
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                  {hasProfileImage() ? (
                    <Image
                      src={getProfileImage()}
                      alt={displayName}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--primary-light)' }}>
                      <span className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>{userInitials}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} style={{ color: 'var(--primary)' }} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>{displayName}</h1>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-semibold capitalize"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                  >
                    {displayRole}
                  </span>
                  {verificationStatus.email && (
                    <div className="flex items-center gap-1" title="Email verified">
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    </div>
                  )}
                  {verificationStatus.phone && (
                    <div className="flex items-center gap-1" title="Phone verified">
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    </div>
                  )}
                </div>
                <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>{displayName}@example.com</p>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Joined {joinDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{formatNumber(stats.profileViews)} profile views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{stats.totalFollowing} following</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} style={{ color: 'var(--text-tertiary)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{stats.totalFollowers} followers</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-6 py-3 rounded-2xl font-medium transition-all flex items-center gap-2"
                    style={{ background: 'var(--primary)', color: 'var(--bg-elevated)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 5H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h5m2-6h5m2-6v9a2 2 0 0 1-2 2h-5M8 9l3 3 3-3M8 12l3 3 3-3"/>
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl font-medium transition-all flex items-center gap-2"
                    style={isFollowing 
                      ? { background: 'var(--bg-inset)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                      : { background: 'var(--primary)', color: 'var(--bg-elevated)' }
                    }
                  >
                    {isFollowing ? (
                      <>
                        <X size={16} />
                        Following
                      </>
                    ) : (
                      <>
                        <Users size={16} />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            {error && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                  {error}
                </div>
              </div>
            )}
            {success && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-sm px-4 py-3 rounded-xl" style={{ background: 'var(--success-light)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                  {success}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex overflow-x-auto mb-6 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[
            { key: 'profile', label: 'Profile', icon: User },
            { key: 'saved', label: 'Saved Articles', icon: Bookmark },
            { key: 'liked', label: 'Liked', icon: Heart },
            { key: 'comments', label: 'Comments', icon: MessageSquare },
            { key: 'following', label: 'Following', icon: Users },
            { key: 'activity', label: 'Activity', icon: TrendingUp },
            { key: 'settings', label: 'Settings', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className="flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all whitespace-nowrap"
                style={activeTab === tab.key
                  ? { color: 'var(--primary)', borderBottom: '2px solid var(--primary)', background: 'var(--bg-surface)' }
                  : { color: 'var(--text-tertiary)', background: 'transparent' }
                }
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {(tab.key === 'saved' || tab.key === 'liked' || tab.key === 'comments') && (
                  <span className="px-2 py-1 text-xs rounded-full font-semibold" style={{ 
                    background: activeTab === tab.key ? 'var(--primary-light)' : 'var(--bg-inset)',
                    color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-tertiary)'
                  }}>
                    {tab.key === 'saved' ? stats.totalArticles : tab.key === 'liked' ? stats.totalLikes : stats.totalComments}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Profile Information</h2>
              <div className="space-y-4">
                {bio ? (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{bio}</p>
                ) : (
                  <div className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No bio available...</div>
                )}
                
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin size={14} />
                  {location || 'Location not set'}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Verification Status</h3>
                <div className="flex flex-wrap gap-2">
                  {verificationStatus.email && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                      <Check size={12} />
                      Email Verified
                    </div>
                  )}
                  {verificationStatus.phone && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                      <Check size={12} />
                      Phone Verified
                    </div>
                  )}
                  {verificationStatus.id && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <Shield size={12} />
                      ID Verified
                    </div>
                  )}
                  {!(verificationStatus.email || verificationStatus.phone || verificationStatus.id) && (
                    <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Please verify your account</div>
                  )}
                </div>
              </div>
              
              {userWebsites.length > 0 && (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Web & Social</h3>
                  <div className="flex flex-wrap gap-2">
                    {userWebsites.map((website, index) => (
                      <a
                        key={index}
                        href={website.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:scale-105"
                        style={{ background: 'var(--bg-inset)', color: 'var(--text-secondary)' }}
                      >
                        <ExternalLink size={12} />
                        {website.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {userInterests.length > 0 && (
              <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {userInterests.map((interest, index) => (
                    <div
                      key={interest.id}
                      className="px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 cursor-pointer"
                      style={{ 
                        background: interest.color || 'var(--bg-inset)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {interest.icon && <span className="mr-2">{interest.icon}</span>}
                      {interest.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markNotificationAsRead(notification.id)}
                    className={`flex gap-3 p-3 rounded-xl transition-all cursor-pointer ${!notification.read ? 'bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500' : ''}`}
                    style={!notification.read ? { background: 'var(--primary-light)' } : {}}
                  >
                    <div className="text-lg">{notification.icon}</div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{notification.title}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{notification.message}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{notification.time}</p>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <Bell size={32} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {activeTab === 'settings' && (
              <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Theme Settings</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectTheme('light')}
                    className="p-2 rounded-lg border-2 transition-all"
                    style={{ 
                      borderColor: selectedTheme === 'light' ? 'var(--primary)' : 'var(--border)',
                      background: selectedTheme === 'light' ? 'var(--primary-light)' : 'var(--bg-surface)'
                    }}
                  >
                    <div className="w-6 h-6 rounded-full mb-1 mx-auto" style={{ background: 'white', border: '1px solid var(--border)' }}></div>
                    <div className="text-xs font-medium" style={{ color: selectedTheme === 'light' ? 'var(--primary)' : 'var(--text-secondary)' }}>Light</div>
                  </button>
                  <button
                    onClick={() => selectTheme('dark')}
                    className="p-2 rounded-lg border-2 transition-all"
                    style={{ 
                      borderColor: selectedTheme === 'dark' ? 'var(--primary)' : 'var(--border)',
                      background: selectedTheme === 'dark' ? 'var(--bg-elevated)' : 'var(--bg-surface)'
                    }}
                  >
                    <div className="w-6 h-6 rounded-full mb-1 mx-auto" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}></div>
                    <div className="text-xs font-medium" style={{ color: selectedTheme === 'dark' ? 'var(--primary)' : 'var(--text-secondary)' }}>Dark</div>
                  </button>
                  <button
                    onClick={() => selectTheme('kenya-red')}
                    className="p-2 rounded-lg border-2 transition-all"
                    style={{ 
                      borderColor: selectedTheme === 'kenya-red' ? 'var(--kenya-red)' : 'var(--border)',
                      background: selectedTheme === 'kenya-red' ? 'var(--kenya-red)' : 'var(--bg-surface)'
                    }}
                  >
                    <div className="w-6 h-6 rounded-full mb-1 mx-auto" style={{ background: 'var(--kenya-red)' }}></div>
                    <div className="text-xs font-medium" style={{ color: selectedTheme === 'kenya-red' ? 'white' : 'var(--text-secondary)' }}>Kenya Red</div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Latest Activity</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-inset)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{stats.profileViews} profile views this month</div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Profile engagement increased</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>+12%</div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>vs last month</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-inset)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <User size={16} style={{ color: 'var(--success)' }} />
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{stats.totalFollowing} following</div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Connections growing</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: 'var(--success)' }}>+5%</div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>vs last month</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-inset)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Heart size={16} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div>
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>Love Score: 89%</div>
                          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Community engagement</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>+23%</div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>vs last month</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
                  <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Reading Activity</h2>
                  <div className="flex justify-between mb-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    <span>This week's reading minutes</span>
                    <span>{stats.totalArticles} articles read</span>
                  </div>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {activityChartData().map((item, index) => {
                      const height = Math.max(20, (item.value / 120) * 100)
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div 
                            className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80"
                            style={{ 
                              height: `${height}%`,
                              background: item.color
                            }}
                          />
                          <span className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{item.day}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {activeTab === 'profile' && (
                  <div className="rounded-3xl p-6" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-lg)' }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Account Type</h2>
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--primary-light)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          <Shield size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: 'var(--primary)' }}>Premium (Free)</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>All features available</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Last updated</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--primary)' }}>Today</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Saved Articles</h2>
                {savedArticles.map((article) => (
                  <Link
                    key={article.article_id}
                    href={`/article/${article.slug}`}
                    className="block rounded-2xl p-6 transition-all hover:shadow-lg"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex gap-4">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        width={140}
                        height={100}
                        className="rounded-xl object-cover"
                        unoptimized
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <span 
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{ background: `${article.category_color}20`, color: article.category_color }}
                          >
                            {article.category}
                          </span>
                          {article.is_liked && (
                            <Heart size={16} fill="currentColor" className="text-red-500" />
                          )}
                        </div>
                        <h3 className="font-bold mb-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>by {article.author_name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{article.created_at} • {article.read_time} min read</span>
                          <button className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>Read →</button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {activeTab === 'liked' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Liked Articles</h2>
                {likedArticles.map((article) => (
                  <div key={article.article_id} className="rounded-2xl p-6 transition-all hover:shadow-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex gap-4">
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        width={140}
                        setColor(255, 106, 0)} * /
                    )
                    }
                    // Handle when the object has 'icon' property
                    if ('icon' in item) {
                      return item
                    }
                    // Fallback for items without icon
                    return {
                      icon: '📚',
                      name: 'Unknown'
                    }
                  }}
                ))}
              </div>
            )
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage