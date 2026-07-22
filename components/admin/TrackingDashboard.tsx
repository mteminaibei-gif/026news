'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Eye, Users, MousePointerClick, TrendingUp, BarChart3 } from 'lucide-react'

type PageView = { page: string; count: number }
type AdStat = { impressions: number; clicks: number }
type TrackingData = {
  activeUsers: number
  totalViews: number
  pageViews: PageView[]
  adStats: Record<string, AdStat>
}

export function TrackingDashboard({ secret }: { secret: string }) {
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/track?secret=${encodeURIComponent(secret)}`)
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setLastUpdate(new Date())
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [secret])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="skeleton" style={{ width: 200, height: 24, borderRadius: 8 }} />
      </div>
    )
  }

  const totalAdImpressions = Object.values(data?.adStats ?? {}).reduce((s, a) => s + a.impressions, 0)
  const totalAdClicks = Object.values(data?.adStats ?? {}).reduce((s, a) => s + a.clicks, 0)
  const ctr = totalAdImpressions > 0 ? ((totalAdClicks / totalAdImpressions) * 100).toFixed(1) : '0.0'

  return (
    <div className="tracking-dashboard">
      <div className="tracking-header">
        <div>
          <h2 className="tracking-title">Live Traffic & Ads</h2>
          <p className="tracking-sub">Real-time user activity and ad performance</p>
        </div>
        <button onClick={() => { setLoading(true); refresh() }} className="tracking-refresh" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      <div className="tracking-live-dot">
        <span className="pulse-dot" /> Live — updated {lastUpdate.toLocaleTimeString()}
      </div>

      <div className="tracking-stats">
        <div className="tracking-stat">
          <div className="tracking-stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="tracking-stat-value">{data?.activeUsers ?? 0}</div>
            <div className="tracking-stat-label">Active Users</div>
          </div>
        </div>
        <div className="tracking-stat">
          <div className="tracking-stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <Eye size={20} />
          </div>
          <div>
            <div className="tracking-stat-value">{data?.totalViews ?? 0}</div>
            <div className="tracking-stat-label">Total Page Views</div>
          </div>
        </div>
        <div className="tracking-stat">
          <div className="tracking-stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="tracking-stat-value">{totalAdImpressions}</div>
            <div className="tracking-stat-label">Ad Impressions</div>
          </div>
        </div>
        <div className="tracking-stat">
          <div className="tracking-stat-icon" style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>
            <MousePointerClick size={20} />
          </div>
          <div>
            <div className="tracking-stat-value">{ctr}%</div>
            <div className="tracking-stat-label">Ad CTR</div>
          </div>
        </div>
      </div>

      <div className="tracking-grid">
        <div className="tracking-card">
          <h3 className="tracking-card-title"><BarChart3 size={16} /> Most Visited Pages</h3>
          {(data?.pageViews ?? []).length === 0 ? (
            <p className="tracking-empty">No page views recorded yet.</p>
          ) : (
            <div className="tracking-page-list">
              {(data?.pageViews ?? []).slice(0, 20).map(({ page, count }, i) => {
                const maxCount = data?.pageViews?.[0]?.count ?? 1
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={page} className="tracking-page-row">
                    <div className="tracking-page-info">
                      <span className="tracking-page-rank">{i + 1}</span>
                      <span className="tracking-page-path">{page}</span>
                    </div>
                    <div className="tracking-page-bar-wrap">
                      <div className="tracking-page-bar" style={{ width: `${pct}%` }} />
                      <span className="tracking-page-count">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="tracking-card">
          <h3 className="tracking-card-title"><TrendingUp size={16} /> Ad Performance</h3>
          {Object.keys(data?.adStats ?? {}).length === 0 ? (
            <p className="tracking-empty">No ad impressions recorded yet.</p>
          ) : (
            <div className="tracking-ad-list">
              {Object.entries(data?.adStats ?? {}).map(([adId, stats]) => (
                <div key={adId} className="tracking-ad-row">
                  <div className="tracking-ad-id">{adId}</div>
                  <div className="tracking-ad-stats">
                    <div className="tracking-ad-stat">
                      <span className="tracking-ad-stat-val">{stats.impressions}</span>
                      <span className="tracking-ad-stat-lbl">impressions</span>
                    </div>
                    <div className="tracking-ad-stat">
                      <span className="tracking-ad-stat-val">{stats.clicks}</span>
                      <span className="tracking-ad-stat-lbl">clicks</span>
                    </div>
                    <div className="tracking-ad-stat">
                      <span className="tracking-ad-stat-val">
                        {stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : '0.0'}%
                      </span>
                      <span className="tracking-ad-stat-lbl">CTR</span>
                    </div>
                  </div>
                  <div className="tracking-ad-bar-wrap">
                    <div
                      className="tracking-ad-bar"
                      style={{
                        width: `${stats.impressions > 0 ? Math.min(100, (stats.clicks / stats.impressions) * 100 * 5) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
