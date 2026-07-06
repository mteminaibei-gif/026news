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

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: number
          name: string
          email: string
          password_hash: string
          role: UserRole
          bio: string | null
          profile_image: string | null
          created_at: string
          status: AccountStatus
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'user_id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      categories: {
        Row: {
          category_id: number
          name: string
          description: string | null
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'category_id'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      articles: {
        Row: {
          article_id: number
          title: string
          slug: string
          content: string
          category_id: number | null
          author_id: number | null
          source_reference: string | null
          status: ArticleStatus
          monetization_type: MonetizationType
          featured_image: string | null
          views: number
          earnings: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['articles']['Row'], 'article_id' | 'created_at' | 'updated_at' | 'views' | 'earnings'>
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// ─── Convenience joined types (what queries return with joins) ───────────────

export type ArticleWithAuthor = Database['public']['Tables']['articles']['Row'] & {
  author: Pick<Database['public']['Tables']['users']['Row'], 'user_id' | 'name' | 'profile_image' | 'bio'> | null
  category: Pick<Database['public']['Tables']['categories']['Row'], 'name'> | null
  analytics: Pick<Database['public']['Tables']['analytics']['Row'], 'views' | 'likes' | 'shares' | 'comments_count'> | null
}

export type ArticleRow = Database['public']['Tables']['articles']['Row']
export type UserRow = Database['public']['Tables']['users']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CommentRow = Database['public']['Tables']['comments']['Row']
export type EarningsRow = Database['public']['Tables']['earnings']['Row']
export type ReviewRow = Database['public']['Tables']['review_workflow']['Row']
export type AnalyticsRow = Database['public']['Tables']['analytics']['Row']
