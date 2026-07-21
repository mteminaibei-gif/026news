'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser, useProfile } from '@/lib/hooks/useAuth'
import { useReaderStats } from '@/lib/hooks/useReaderStats'
import { StatCard, Card, EmptyState } from '@/components/ui'
import { BookOpen, Clock, MessageSquare, Heart, Zap, Users, TrendingUp, Target } from 'lucide-react'

interface CategoryStat {
  name: string
  count: number
  percentage: number
}

interface GoalProgress {
  name: string
  current: number
  target: number
  unit: string
}

interface ReadingItem {
  title: string
  author: string
  reads: number
  minutes: number
}

// Animated count-up hook
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = target
    if (from === to) return

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (to - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

export default function ReaderStatsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { data: user } = useUser()
  const { data: profile } = useProfile(user?.email ?? undefined)

  const [userId, setUserId] = useState<number | null>(null)
  const [categories, setCategories] = useState<CategoryStat[]>([])
  const [goals, setGoals] = useState<GoalProgress[]>([])
  const [mostRead, setMostRead] = useState<ReadingItem[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user ID
  useEffect(() => {
    ;(async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login?redirect=/stats')
        return
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_id', authUser.id)
        .single()

      if (userProfile?.user_id) {
        setUserId(userProfile.user_id)
      }
    })()
  }, [supabase, router])

  // Load stats
  useEffect(() => {
    if (!userId) return

    ;(async () => {
      try {
        setLoading(true)

        // Fetch reading data
        const [reads, comments, likes, saved, following] = await Promise.all([
          supabase.from('article_reads').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('article_likes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('saved_articles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        ])

        // Mock category data
        const mockCategories: CategoryStat[] = [
          { name: 'Technology', count: 72, percentage: 72 },
          { name: 'Business', count: 48, percentage: 48 },
          { name: 'Science', count: 35, percentage: 35 },
          { name: 'Culture', count: 28, percentage: 28 },
          { name: 'Sports', count: 20, percentage: 20 },
        ]

        const mockGoals: GoalProgress[] = [
          { name: 'Daily Articles', current: 3, target: 5, unit: 'articles' },
          { name: 'Weekly Minutes', current: 85, target: 120, unit: 'min' },
          { name: 'Comments', current: 8, target: 10, unit: 'comments' },
          { name: 'New Topics', current: 2, target: 3, unit: 'topics' },
        ]

        const mockMostRead: ReadingItem[] = [
          {
            title: 'AI-Powered Journalism Is Reshaping How Stories Reach Readers',
            author: 'Amara Mwangi',
            reads: 3,
            minutes: 15,
          },
          { title: "M-Pesa's Next Chapter: Expanding Beyond Payments", author: 'Wanjiku Muthoni', reads: 2, minutes: 22 },
          { title: "How Nairobi Became Africa's Silicon Savannah", author: 'James Kariuki', reads: 2, minutes: 14 },
          { title: "Marathon Dominance: Inside Kenya's Training Methods", author: 'Eliud Sang', reads: 1, minutes: 9 },
          { title: 'Gengetone to Global: Kenyan Music Conquering Charts', author: 'DJ Mwas', reads: 1, minutes: 5 },
        ]

        setCategories(mockCategories)
        setGoals(mockGoals)
        setMostRead(mockMostRead)
        setStreak(5)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    })()
  }, [userId, supabase])

  // Animated values
  const animatedReads = useCountUp(142)
  const animatedTime = useCountUp(12)
  const animatedComments = useCountUp(67)
  const animatedLikes = useCountUp(89)

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
        Loading stats…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Your Reading Stats
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Track your reading habits and discover patterns in what you consume.
          </p>
        </div>

        {/* Streak Section */}
        <Card
          variant="elevated"
          padding="lg"
          style={{
            background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary-muted) 100%)',
            border: '1px solid var(--primary)',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div style={{ fontSize: '3rem' }}>🔥</div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
              {streak} Day Streak!
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              You've read articles {streak} days in a row. Keep it going!
            </p>
            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.75rem', fontSize: '0.875rem' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div
                  key={day + i}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '0.25rem',
                    background: i < streak ? 'var(--primary)' : 'var(--border)',
                    color: i < streak ? '#fff' : 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <StatCard
            label="Articles Read"
            value={animatedReads}
            icon={<BookOpen size={20} />}
            change={{ value: '+18', direction: 'up', period: 'this week' }}
          />
          <StatCard
            label="Time Reading"
            value={`${animatedTime}.4h`}
            icon={<Clock size={20} />}
            change={{ value: '+2.1h', direction: 'up', period: 'this week' }}
          />
          <StatCard
            label="Comments Posted"
            value={animatedComments}
            icon={<MessageSquare size={20} />}
            change={{ value: '+8', direction: 'up', period: 'this week' }}
          />
          <StatCard
            label="Articles Liked"
            value={animatedLikes}
            icon={<Heart size={20} />}
            change={{ value: '+12', direction: 'up', period: 'this week' }}
          />
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Reading by Category */}
          <Card variant="elevated">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Reading by Category
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.map(cat => (
                <div key={cat.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {cat.percentage}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: '0.5rem',
                      background: 'var(--bg-muted)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${cat.percentage}%`,
                        background: 'var(--primary)',
                        borderRadius: '0.5rem',
                        transition: 'width 0.3s ease-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reading Goals */}
          <Card variant="elevated">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              Reading Goals
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {goals.map(goal => (
                <div key={goal.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {goal.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {goal.current}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: '0.5rem',
                      background: 'var(--bg-muted)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (goal.current / goal.target) * 100)}%`,
                        background: goal.current >= goal.target ? 'var(--success)' : 'var(--primary)',
                        borderRadius: '0.5rem',
                        transition: 'width 0.3s ease-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Most Read This Month */}
        <Card variant="elevated">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Most Read This Month
          </h3>

          {mostRead.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No articles read yet"
              description="Start reading to see your top articles here"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mostRead.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--bg-muted)',
                    borderRadius: '0.5rem',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '0.5rem',
                      background: 'var(--primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {item.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                      {item.author}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Read {item.reads} times</span>
                      <span>·</span>
                      <span>{item.minutes} min total</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
