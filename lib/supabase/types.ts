export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'journalist' | 'reader'
export type ArticleStatus = 'draft' | 'under_review' | 'published' | 'rejected'
export type MonetizationType = 'free' | 'paywall' | 'sponsored' | 'ad'
export type ReviewAction = 'approved' | 'rejected' | 'revision_requested'
export type PayoutStatus = 'pending' | 'paid'
export type EarningsSource = 'ads' | 'subscriptions' | 'sponsored'
export type SubscriptionPlan = 'free' | 'premium' | 'pro'
export type PaymentMethod = 'mpesa' | 'paypal' | 'stripe'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'
export type CommentStatus = 'visible' | 'hidden' | 'flagged'
export type AccountStatus = 'active' | 'inactive' | 'banned'
export type RegionCode = 'ke' | 'ng' | 'za' | 'gh' | 'ug' | 'tz' | 'et' | 'global'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: number
          auth_id: string | null
          name: string
          email: string
          password_hash: string
          role: UserRole
          bio: string | null
          profile_image: string | null
          social_links: {
            organization?: string | null
            portfolio?: string | null
            phone?: string | null
            twitter?: string | null
            linkedin?: string | null
            website?: string | null
          } | null
          region_preference: {
            default_region: RegionCode | null
            preferred_regions: RegionCode[]
            region_priority: { [key in RegionCode]?: number }
          } | null
          created_at: string
          updated_at: string
          status: AccountStatus
          total_views: number
          rank_score: number
          badge_level: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'user_id' | 'created_at' | 'updated_at' | 'total_views' | 'rank_score' | 'badge_level'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      categories: {
        Row: {
          category_id: number
          name: string
          slug: string
          description: string | null
          icon: string | null
          region_targeted: boolean
          regions: RegionCode[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'category_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      articles: {
        Row: {
          article_id: number
          title: string
          slug: string
          content: string
          excerpt: string | null
          category_id: number | null
          author_id: number | null
          source_reference: string | null
          source_url: string | null
          source_name: string | null
          status: ArticleStatus
          monetization_type: MonetizationType
          featured_image: string | null
          tags: string[]
          featured: boolean
          views: number
          likes: number
          earnings: number
          published_at: string | null
          created_at: string
          updated_at: string
          regions: RegionCode[]
          is_region_priority: boolean
        }
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'article_id' | 'created_at' | 'updated_at' | 'views' | 'likes' | 'earnings'>
        Update: Partial<Database['public']['Tables']['articles']['Insert']>
      }
      comments: {
        Row: {
          comment_id: number
          article_id: number | null
          user_id: number | null
          comment_text: string
          created_at: string
          status: CommentStatus
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'comment_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      earnings: {
        Row: {
          earning_id: number
          user_id: number | null
          article_id: number | null
          amount: number
          source: EarningsSource
          payout_status: PayoutStatus
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['earnings']['Row'], 'earning_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['earnings']['Insert']>
      }
      review_workflow: {
        Row: {
          review_id: number
          article_id: number | null
          admin_id: number | null
          review_notes: string | null
          action: ReviewAction
          reviewed_at: string
        }
        Insert: Omit<Database['public']['Tables']['review_workflow']['Row'], 'review_id' | 'reviewed_at'>
        Update: Partial<Database['public']['Tables']['review_workflow']['Insert']>
      }
      subscriptions: {
        Row: {
          subscription_id: number
          user_id: number | null
          plan_type: SubscriptionPlan
          payment_method: PaymentMethod
          start_date: string
          end_date: string
          status: SubscriptionStatus
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'subscription_id'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      sources: {
        Row: {
          source_id: number
          name: string
          api_url: string
          last_fetched: string | null
          status: 'active' | 'inactive'
        }
        Insert: Omit<Database['public']['Tables']['sources']['Row'], 'source_id'>
        Update: Partial<Database['public']['Tables']['sources']['Insert']>
      }
      analytics: {
        Row: {
          analytics_id: number
          article_id: number | null
          views: number
          likes: number
          shares: number
          comments_count: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['analytics']['Row'], 'analytics_id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['analytics']['Insert']>
      }
      journalist_rankings: {
        Row: {
          ranking_id: number
          user_id: number
          total_views: number
          total_earnings: number
          rank_position: number | null
          rank_tier: string | null
          last_updated: string
        }
        Insert: Omit<Database['public']['Tables']['journalist_rankings']['Row'], 'ranking_id' | 'last_updated'>
        Update: Partial<Database['public']['Tables']['journalist_rankings']['Insert']>
      }
      payout_records: {
        Row: {
          payout_id: number
          user_id: number
          payout_amount: number
          payout_method: string
          phone_number: string | null
          email_address: string | null
          status: string
          transaction_id: string | null
          error_message: string | null
          requested_at: string
          processed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['payout_records']['Row'], 'payout_id' | 'requested_at'>
        Update: Partial<Database['public']['Tables']['payout_records']['Insert']>
      }
      payout_requests: {
        Row: {
          payout_id: number
          user_id: number
          amount: number
          platform_fee: number
          journalist_cut: number
          payment_method: string
          payment_ref: string | null
          status: string
          period_start: string
          period_end: string
          initiated_by: number | null
          created_at: string
          paid_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['payout_requests']['Row'], 'payout_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payout_requests']['Insert']>
      }
      journalist_badges: {
        Row: {
          badge_id: number
          user_id: number
          badge_type: string
          badge_name: string
          badge_icon: string | null
          description: string | null
          threshold_views: number | null
          awarded_at: string
        }
        Insert: Omit<Database['public']['Tables']['journalist_badges']['Row'], 'badge_id' | 'awarded_at'>
        Update: Partial<Database['public']['Tables']['journalist_badges']['Insert']>
      }
      rss_feeds: {
        Row: {
          feed_id: number
          name: string
          feed_url: string
          category_id: number | null
          is_active: boolean
          last_fetched: string | null
          fetch_count: number
          error_count: number
          last_error: string | null
          regions: RegionCode[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['rss_feeds']['Row'], 'feed_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['rss_feeds']['Insert']>
      }
      regions: {
        Row: {
          region_id: number
          code: RegionCode
          name: string
          flag: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['regions']['Row'], 'region_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['regions']['Insert']>
      }
      user_regions: {
        Row: {
          user_region_id: number
          user_id: number
          region_code: RegionCode
          is_default: boolean
          priority: number
          preferred_categories: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_regions']['Row'], 'user_region_id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_regions']['Insert']>
      }
      article_regions: {
        Row: {
          article_region_id: number
          article_id: number
          region_code: RegionCode
          priority: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['article_regions']['Row'], 'article_region_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['article_regions']['Insert']>
      }
      article_revenue: {
        Row: {
          revenue_id: number
          article_id: number
          adsense_revenue: number
          journalist_cut: number
          platform_fee: number
          last_updated: string
        }
        Insert: Omit<Database['public']['Tables']['article_revenue']['Row'], 'revenue_id' | 'last_updated'>
        Update: Partial<Database['public']['Tables']['article_revenue']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Convenience joined types (what queries return with joins) ───────────────

export type ArticleWithAuthor = Database['public']['Tables']['articles']['Row'] & {
  author: Pick<Database['public']['Tables']['users']['Row'], 'user_id' | 'name' | 'profile_image' | 'bio'> | null
  category: Pick<Database['public']['Tables']['categories']['Row'], 'name' | 'regions'> | null
  analytics: Pick<Database['public']['Tables']['analytics']['Row'], 'views' | 'likes' | 'shares' | 'comments_count'> | null
  regions: Database['public']['Tables']['regions']['Row'][] | null
}

export type UserWithRegion = Database['public']['Tables']['users']['Row'] & {
  regions: Database['public']['Tables']['user_regions']['Row'][] | null
}

export type ArticleWithRegion = Database['public']['Tables']['articles']['Row'] & {
  regions: Database['public']['Tables']['regions']['Row'][] | null
  author: Pick<Database['public']['Tables']['users']['Row'], 'user_id' | 'name' | 'profile_image' | 'bio'> | null
  category: Pick<Database['public']['Tables']['categories']['Row'], 'name' | 'regions'> | null
}

export type RegionPrioritizedArticle = {
  article_id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  category_id: number | null
  author_id: number | null
  source_reference: string | null
  status: ArticleStatus
  monetization_type: MonetizationType
  featured_image: string | null
  tags: string[]
  views: number
  likes: number
  earnings: number
  published_at: string | null
  created_at: string
  regions: RegionCode[]
  author_name: string | null
  author_image: string | null
  category_name: string | null
  region_match_score: number
}

export type ArticleRow = Database['public']['Tables']['articles']['Row']
export type UserRow = Database['public']['Tables']['users']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CommentRow = Database['public']['Tables']['comments']['Row']
export type EarningsRow = Database['public']['Tables']['earnings']['Row']
export type ReviewRow = Database['public']['Tables']['review_workflow']['Row']
export type AnalyticsRow = Database['public']['Tables']['analytics']['Row']
export type RegionRow = Database['public']['Tables']['regions']['Row']
export type UserRegionRow = Database['public']['Tables']['user_regions']['Row']
export type ArticleRegionRow = Database['public']['Tables']['article_regions']['Row']
