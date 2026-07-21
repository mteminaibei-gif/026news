export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          analytics_id: number
          article_id: number | null
          comments_count: number | null
          likes: number | null
          shares: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          analytics_id?: number
          article_id?: number | null
          comments_count?: number | null
          likes?: number | null
          shares?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          analytics_id?: number
          article_id?: number | null
          comments_count?: number | null
          likes?: number | null
          shares?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "analytics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          ip_hash: string | null
          limit_id: number
          request_count: number
          user_id: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          ip_hash?: string | null
          limit_id?: number
          request_count?: number
          user_id?: number | null
          window_end?: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          ip_hash?: string | null
          limit_id?: number
          request_count?: number
          user_id?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      article_likes: {
        Row: {
          article_id: number
          created_at: string
          like_id: number
          user_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          like_id?: number
          user_id: number
        }
        Update: {
          article_id?: number
          created_at?: string
          like_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "article_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      article_reads: {
        Row: {
          article_id: number
          created_at: string
          read_id: number
          user_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          read_id?: number
          user_id: number
        }
        Update: {
          article_id?: number
          created_at?: string
          read_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_reads_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_reads_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "article_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      article_regions: {
        Row: {
          article_id: number
          article_region_id: number
          created_at: string
          priority: number
          region_code: Database["public"]["Enums"]["region_code"]
        }
        Insert: {
          article_id: number
          article_region_id?: number
          created_at?: string
          priority?: number
          region_code: Database["public"]["Enums"]["region_code"]
        }
        Update: {
          article_id?: number
          article_region_id?: number
          created_at?: string
          priority?: number
          region_code?: Database["public"]["Enums"]["region_code"]
        }
        Relationships: [
          {
            foreignKeyName: "article_regions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_regions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
        ]
      }
      article_revenue: {
        Row: {
          adsense_revenue: number
          article_id: number
          journalist_cut: number
          last_updated: string | null
          platform_cut: number
          revenue_id: number
          total_views_at_split: number | null
        }
        Insert: {
          adsense_revenue?: number
          article_id: number
          journalist_cut?: number
          last_updated?: string | null
          platform_cut?: number
          revenue_id?: number
          total_views_at_split?: number | null
        }
        Update: {
          adsense_revenue?: number
          article_id?: number
          journalist_cut?: number
          last_updated?: string | null
          platform_cut?: number
          revenue_id?: number
          total_views_at_split?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_revenue_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_revenue_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: true
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
        ]
      }
      article_tag_mappings: {
        Row: {
          article_id: number
          created_at: string
          mapping_id: number
          tag_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          mapping_id?: number
          tag_id: number
        }
        Update: {
          article_id?: number
          created_at?: string
          mapping_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_tag_mappings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_tag_mappings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_tag_mappings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "article_tags"
            referencedColumns: ["tag_id"]
          },
        ]
      }
      article_tags: {
        Row: {
          created_at: string
          tag_id: number
          tag_name: string
          tag_slug: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          tag_id?: number
          tag_name: string
          tag_slug: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          tag_id?: number
          tag_name?: string
          tag_slug?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      article_versions: {
        Row: {
          article_id: number
          author_id: number | null
          change_summary: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          status: Database["public"]["Enums"]["article_status"]
          title: string
          version_id: number
          version_number: number
        }
        Insert: {
          article_id: number
          author_id?: number | null
          change_summary?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          version_id?: number
          version_number?: number
        }
        Update: {
          article_id?: number
          author_id?: number | null
          change_summary?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          version_id?: number
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "article_versions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "article_versions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      articles: {
        Row: {
          article_id: number
          author_id: number | null
          category_id: number | null
          content: string
          content_hash: string | null
          created_at: string | null
          earnings: number | null
          excerpt: string | null
          featured: boolean
          featured_image: string | null
          is_aggregated: boolean
          is_region_priority: boolean
          like_count: number
          likes: number
          monetization_type: string | null
          pinned: boolean
          post_type: string
          priority: number
          published_at: string | null
          reading_time_minutes: number | null
          regions: Database["public"]["Enums"]["region_code"][] | null
          save_count: number
          share_count: number
          slug: string
          source_name: string | null
          source_reference: string | null
          source_url: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          article_id?: number
          author_id?: number | null
          category_id?: number | null
          content: string
          content_hash?: string | null
          created_at?: string | null
          earnings?: number | null
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          is_aggregated?: boolean
          is_region_priority?: boolean
          like_count?: number
          likes?: number
          monetization_type?: string | null
          pinned?: boolean
          post_type?: string
          priority?: number
          published_at?: string | null
          reading_time_minutes?: number | null
          regions?: Database["public"]["Enums"]["region_code"][] | null
          save_count?: number
          share_count?: number
          slug: string
          source_name?: string | null
          source_reference?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          article_id?: number
          author_id?: number | null
          category_id?: number | null
          content?: string
          content_hash?: string | null
          created_at?: string | null
          earnings?: number | null
          excerpt?: string | null
          featured?: boolean
          featured_image?: string | null
          is_aggregated?: boolean
          is_region_priority?: boolean
          like_count?: number
          likes?: number
          monetization_type?: string | null
          pinned?: boolean
          post_type?: string
          priority?: number
          published_at?: string | null
          reading_time_minutes?: number | null
          regions?: Database["public"]["Enums"]["region_code"][] | null
          save_count?: number
          share_count?: number
          slug?: string
          source_name?: string | null
          source_reference?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          admin_id: number | null
          created_at: string
          ip_address: string | null
          log_id: number
          new_data: Json | null
          old_data: Json | null
          record_id: number | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: number | null
          created_at?: string
          ip_address?: string | null
          log_id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: number | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: number | null
          created_at?: string
          ip_address?: string | null
          log_id?: number
          new_data?: Json | null
          old_data?: Json | null
          record_id?: number | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      categories: {
        Row: {
          category_id: number
          description: string | null
          icon: string | null
          name: string
          region_targeted: boolean
          regions: Database["public"]["Enums"]["region_code"][] | null
          slug: string | null
        }
        Insert: {
          category_id?: number
          description?: string | null
          icon?: string | null
          name: string
          region_targeted?: boolean
          regions?: Database["public"]["Enums"]["region_code"][] | null
          slug?: string | null
        }
        Update: {
          category_id?: number
          description?: string | null
          icon?: string | null
          name?: string
          region_targeted?: boolean
          regions?: Database["public"]["Enums"]["region_code"][] | null
          slug?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          is_deleted: boolean
          message_id: number
          room_id: number
          sender_id: number
        }
        Insert: {
          content: string
          created_at?: string
          is_deleted?: boolean
          message_id?: number
          room_id: number
          sender_id: number
        }
        Update: {
          content?: string
          created_at?: string
          is_deleted?: boolean
          message_id?: number
          room_id?: number
          sender_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          joined_at: string
          room_id: number
          user_id: number
        }
        Insert: {
          joined_at?: string
          room_id: number
          user_id: number
        }
        Update: {
          joined_at?: string
          room_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["room_id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: number
          description: string | null
          is_public: boolean
          name: string
          room_id: number
        }
        Insert: {
          created_at?: string
          created_by: number
          description?: string | null
          is_public?: boolean
          name: string
          room_id?: number
        }
        Update: {
          created_at?: string
          created_by?: number
          description?: string | null
          is_public?: boolean
          name?: string
          room_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: number | null
          comment_id: number
          comment_text: string
          created_at: string | null
          like_count: number
          parent_comment_id: number | null
          status: string | null
          user_id: number | null
        }
        Insert: {
          article_id?: number | null
          comment_id?: number
          comment_text: string
          created_at?: string | null
          like_count?: number
          parent_comment_id?: number | null
          status?: string | null
          user_id?: number | null
        }
        Update: {
          article_id?: number | null
          comment_id?: number
          comment_text?: string
          created_at?: string | null
          like_count?: number
          parent_comment_id?: number | null
          status?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["comment_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_moderation: {
        Row: {
          admin_notes: string | null
          content_id: number
          content_type: string
          created_at: string
          flagged_by: number | null
          moderation_id: number
          reason: string | null
          resolved_at: string | null
          resolved_by: number | null
          severity: Database["public"]["Enums"]["moderation_severity"]
          status: Database["public"]["Enums"]["moderation_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          content_id: number
          content_type: string
          created_at?: string
          flagged_by?: number | null
          moderation_id?: number
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: number | null
          severity?: Database["public"]["Enums"]["moderation_severity"]
          status?: Database["public"]["Enums"]["moderation_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          content_id?: number
          content_type?: string
          created_at?: string
          flagged_by?: number | null
          moderation_id?: number
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: number | null
          severity?: Database["public"]["Enums"]["moderation_severity"]
          status?: Database["public"]["Enums"]["moderation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_moderation_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_moderation_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_moderation_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      earnings: {
        Row: {
          amount: number
          article_id: number | null
          created_at: string | null
          earning_id: number
          payout_status: string | null
          source: string | null
          user_id: number | null
        }
        Insert: {
          amount: number
          article_id?: number | null
          created_at?: string | null
          earning_id?: number
          payout_status?: string | null
          source?: string | null
          user_id?: number | null
        }
        Update: {
          amount?: number
          article_id?: number | null
          created_at?: string | null
          earning_id?: number
          payout_status?: string | null
          source?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "earnings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "earnings_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          is_active: boolean
          subject: string
          template_id: number
          template_name: string
          template_slug: string
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body: string
          created_at?: string
          is_active?: boolean
          subject: string
          template_id?: number
          template_name: string
          template_slug: string
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          created_at?: string
          is_active?: boolean
          subject?: string
          template_id?: number
          template_name?: string
          template_slug?: string
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      gmail_integration: {
        Row: {
          access_token: string | null
          email: string | null
          expires_at: string | null
          id: number
          refresh_token: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          email?: string | null
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          email?: string | null
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      journalist_badges: {
        Row: {
          awarded_at: string
          badge_icon: string | null
          badge_id: number
          badge_name: string
          badge_type: string
          description: string | null
          threshold_views: number | null
          user_id: number
        }
        Insert: {
          awarded_at?: string
          badge_icon?: string | null
          badge_id?: number
          badge_name: string
          badge_type: string
          description?: string | null
          threshold_views?: number | null
          user_id: number
        }
        Update: {
          awarded_at?: string
          badge_icon?: string | null
          badge_id?: number
          badge_name?: string
          badge_type?: string
          description?: string | null
          threshold_views?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "journalist_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "journalist_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      journalist_rankings: {
        Row: {
          last_updated: string
          rank_position: number | null
          rank_tier: string | null
          ranking_id: number
          total_earnings: number
          total_views: number
          user_id: number
        }
        Insert: {
          last_updated?: string
          rank_position?: number | null
          rank_tier?: string | null
          ranking_id?: number
          total_earnings?: number
          total_views?: number
          user_id: number
        }
        Update: {
          last_updated?: string
          rank_position?: number | null
          rank_tier?: string | null
          ranking_id?: number
          total_earnings?: number
          total_views?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "journalist_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "journalist_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      journalists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          commission_rate: number
          created_at: string
          payment_method: Json | null
          total_earnings: number
          updated_at: string
          user_id: number
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number
          created_at?: string
          payment_method?: Json | null
          total_earnings?: number
          updated_at?: string
          user_id: number
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          commission_rate?: number
          created_at?: string
          payment_method?: Json | null
          total_earnings?: number
          updated_at?: string
          user_id?: number
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "journalists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "journalists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      likes: {
        Row: {
          article_id: number
          created_at: string
          like_id: number
          user_id: number
        }
        Insert: {
          article_id: number
          created_at?: string
          like_id?: never
          user_id: number
        }
        Update: {
          article_id?: number
          created_at?: string
          like_id?: never
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      listen_history: {
        Row: {
          created_at: string
          listen_id: number
          station_id: string
          station_name: string
          user_id: number
        }
        Insert: {
          created_at?: string
          listen_id?: number
          station_id: string
          station_name: string
          user_id: number
        }
        Update: {
          created_at?: string
          listen_id?: number
          station_id?: string
          station_name?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "listen_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "listen_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          is_read: boolean
          message_id: number
          receiver_id: number
          sender_id: number
        }
        Insert: {
          content: string
          created_at?: string
          is_read?: boolean
          message_id?: number
          receiver_id: number
          sender_id: number
        }
        Update: {
          content?: string
          created_at?: string
          is_read?: boolean
          message_id?: number
          receiver_id?: number
          sender_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: number | null
          created_at: string
          link: string | null
          message: string
          metadata: Json | null
          notification_id: number
          read: boolean
          title: string
          type: string
          user_id: number | null
        }
        Insert: {
          actor_id?: number | null
          created_at?: string
          link?: string | null
          message: string
          metadata?: Json | null
          notification_id?: number
          read?: boolean
          title: string
          type?: string
          user_id?: number | null
        }
        Update: {
          actor_id?: number | null
          created_at?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          notification_id?: number
          read?: boolean
          title?: string
          type?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: number
          token: string
          used_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: number
          token: string
          used_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: number
          token?: string
          used_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payout_records: {
        Row: {
          email_address: string | null
          error_message: string | null
          payout_amount: number
          payout_id: number
          payout_method: string
          phone_number: string | null
          processed_at: string | null
          requested_at: string
          status: string
          transaction_id: string | null
          user_id: number
        }
        Insert: {
          email_address?: string | null
          error_message?: string | null
          payout_amount: number
          payout_id?: number
          payout_method: string
          phone_number?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string | null
          user_id: number
        }
        Update: {
          email_address?: string | null
          error_message?: string | null
          payout_amount?: number
          payout_id?: number
          payout_method?: string
          phone_number?: string | null
          processed_at?: string | null
          requested_at?: string
          status?: string
          transaction_id?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payout_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          amount: number
          created_at: string
          initiated_by: number | null
          journalist_cut: number
          paid_at: string | null
          payment_method: string
          payment_ref: string | null
          payout_id: number
          period_end: string
          period_start: string
          platform_fee: number
          status: string
          user_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          initiated_by?: number | null
          journalist_cut: number
          paid_at?: string | null
          payment_method: string
          payment_ref?: string | null
          payout_id?: number
          period_end: string
          period_start: string
          platform_fee: number
          status?: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          initiated_by?: number | null
          journalist_cut?: number
          paid_at?: string | null
          payment_method?: string
          payment_ref?: string | null
          payout_id?: number
          period_end?: string
          period_start?: string
          platform_fee?: number
          status?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payout_requests_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payout_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      podcasts: {
        Row: {
          active: boolean
          author: string
          cover_color: string
          created_at: string
          description: string | null
          duration: string
          episodes: number
          feed_url: string | null
          podcast_id: number
          rank: number
          region: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          author: string
          cover_color?: string
          created_at?: string
          description?: string | null
          duration?: string
          episodes?: number
          feed_url?: string | null
          podcast_id?: never
          rank?: number
          region?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          author?: string
          cover_color?: string
          created_at?: string
          description?: string | null
          duration?: string
          episodes?: number
          feed_url?: string | null
          podcast_id?: never
          rank?: number
          region?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: number
          p256dh: string
          user_agent: string | null
          user_id: number | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: number
          p256dh: string
          user_agent?: string | null
          user_id?: number | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: number
          p256dh?: string
          user_agent?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recently_played: {
        Row: {
          cover_color: string | null
          id: number
          played_at: string
          source: string
          station: string
          title: string
          user_id: string | null
        }
        Insert: {
          cover_color?: string | null
          id?: never
          played_at?: string
          source?: string
          station: string
          title: string
          user_id?: string | null
        }
        Update: {
          cover_color?: string | null
          id?: never
          played_at?: string
          source?: string
          station?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          code: Database["public"]["Enums"]["region_code"]
          created_at: string
          flag: string | null
          name: string
          region_id: number
        }
        Insert: {
          code: Database["public"]["Enums"]["region_code"]
          created_at?: string
          flag?: string | null
          name: string
          region_id?: number
        }
        Update: {
          code?: Database["public"]["Enums"]["region_code"]
          created_at?: string
          flag?: string | null
          name?: string
          region_id?: number
        }
        Relationships: []
      }
      review_workflow: {
        Row: {
          action: string
          admin_id: number | null
          article_id: number | null
          review_id: number
          review_notes: string | null
          reviewed_at: string
        }
        Insert: {
          action: string
          admin_id?: number | null
          article_id?: number | null
          review_id?: number
          review_notes?: string | null
          reviewed_at?: string
        }
        Update: {
          action?: string
          admin_id?: number | null
          article_id?: number | null
          review_id?: number
          review_notes?: string | null
          reviewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_workflow_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_workflow_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "review_workflow_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "review_workflow_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
        ]
      }
      reviews: {
        Row: {
          action: string | null
          admin_id: number | null
          article_id: number | null
          review_id: number
          review_notes: string | null
          reviewed_at: string | null
        }
        Insert: {
          action?: string | null
          admin_id?: number | null
          article_id?: number | null
          review_id?: number
          review_notes?: string | null
          reviewed_at?: string | null
        }
        Update: {
          action?: string | null
          admin_id?: number | null
          article_id?: number | null
          review_id?: number
          review_notes?: string | null
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "reviews_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
        ]
      }
      rss_feeds: {
        Row: {
          category_id: number | null
          created_at: string
          error_count: number
          feed_id: number
          feed_url: string
          fetch_count: number
          is_active: boolean
          last_error: string | null
          last_fetched: string | null
          name: string
          regions: Database["public"]["Enums"]["region_code"][] | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          error_count?: number
          feed_id?: number
          feed_url: string
          fetch_count?: number
          is_active?: boolean
          last_error?: string | null
          last_fetched?: string | null
          name: string
          regions?: Database["public"]["Enums"]["region_code"][] | null
        }
        Update: {
          category_id?: number | null
          created_at?: string
          error_count?: number
          feed_id?: number
          feed_url?: string
          fetch_count?: number
          is_active?: boolean
          last_error?: string | null
          last_fetched?: string | null
          name?: string
          regions?: Database["public"]["Enums"]["region_code"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "rss_feeds_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      saved_articles: {
        Row: {
          article_id: number
          notes: string | null
          saved_at: string
          saved_id: number
          user_id: number
        }
        Insert: {
          article_id: number
          notes?: string | null
          saved_at?: string
          saved_id?: number
          user_id: number
        }
        Update: {
          article_id?: number
          notes?: string | null
          saved_at?: string
          saved_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "saved_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_trending_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "saved_articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "saved_articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sources: {
        Row: {
          api_url: string | null
          last_fetched: string | null
          name: string
          source_id: number
          status: string | null
        }
        Insert: {
          api_url?: string | null
          last_fetched?: string | null
          name: string
          source_id?: number
          status?: string | null
        }
        Update: {
          api_url?: string | null
          last_fetched?: string | null
          name?: string
          source_id?: number
          status?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          end_date: string | null
          next_billing_date: string | null
          payment_method: string | null
          plan_type: string | null
          recurring: boolean
          start_date: string | null
          status: string | null
          subscription_id: number
          user_id: number | null
        }
        Insert: {
          cancelled_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_type?: string | null
          recurring?: boolean
          start_date?: string | null
          status?: string | null
          subscription_id?: number
          user_id?: number | null
        }
        Update: {
          cancelled_at?: string | null
          end_date?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_type?: string | null
          recurring?: boolean
          start_date?: string | null
          status?: string | null
          subscription_id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      thread_members: {
        Row: {
          created_at: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          created_by: string
          id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          title?: string | null
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follow_id: number
          follower_id: number
          following_id: number
        }
        Insert: {
          created_at?: string
          follow_id?: number
          follower_id: number
          following_id: number
        }
        Update: {
          created_at?: string
          follow_id?: number
          follower_id?: number
          following_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_regions: {
        Row: {
          created_at: string
          is_default: boolean
          preferred_categories: number[] | null
          priority: number
          region_code: Database["public"]["Enums"]["region_code"]
          updated_at: string
          user_id: number
          user_region_id: number
        }
        Insert: {
          created_at?: string
          is_default?: boolean
          preferred_categories?: number[] | null
          priority?: number
          region_code: Database["public"]["Enums"]["region_code"]
          updated_at?: string
          user_id: number
          user_region_id?: number
        }
        Update: {
          created_at?: string
          is_default?: boolean
          preferred_categories?: number[] | null
          priority?: number
          region_code?: Database["public"]["Enums"]["region_code"]
          updated_at?: string
          user_id?: number
          user_region_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_regions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_regions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          article_count: number
          auth_id: string | null
          author_application: Json | null
          badge_level: string | null
          bio: string | null
          created_at: string | null
          created_with: string | null
          email: string
          email_verified: boolean | null
          follower_count: number
          following_count: number
          interests: string[] | null
          is_public_profile: boolean | null
          last_active: string | null
          last_login: string | null
          last_name_change_at: string | null
          location: string | null
          name: string
          name_change_count: number
          notification_prefs: Json | null
          password_hash: string
          phone: string | null
          preferred_categories: string[] | null
          profile_image: string | null
          rank_score: number
          region_preference: Json | null
          role: string
          show_online_status: boolean
          social_links: Json
          status: string | null
          total_views: number
          updated_at: string
          user_id: number
        }
        Insert: {
          article_count?: number
          auth_id?: string | null
          author_application?: Json | null
          badge_level?: string | null
          bio?: string | null
          created_at?: string | null
          created_with?: string | null
          email: string
          email_verified?: boolean | null
          follower_count?: number
          following_count?: number
          interests?: string[] | null
          is_public_profile?: boolean | null
          last_active?: string | null
          last_login?: string | null
          last_name_change_at?: string | null
          location?: string | null
          name: string
          name_change_count?: number
          notification_prefs?: Json | null
          password_hash: string
          phone?: string | null
          preferred_categories?: string[] | null
          profile_image?: string | null
          rank_score?: number
          region_preference?: Json | null
          role: string
          show_online_status?: boolean
          social_links?: Json
          status?: string | null
          total_views?: number
          updated_at?: string
          user_id?: number
        }
        Update: {
          article_count?: number
          auth_id?: string | null
          author_application?: Json | null
          badge_level?: string | null
          bio?: string | null
          created_at?: string | null
          created_with?: string | null
          email?: string
          email_verified?: boolean | null
          follower_count?: number
          following_count?: number
          interests?: string[] | null
          is_public_profile?: boolean | null
          last_active?: string | null
          last_login?: string | null
          last_name_change_at?: string | null
          location?: string | null
          name?: string
          name_change_count?: number
          notification_prefs?: Json | null
          password_hash?: string
          phone?: string | null
          preferred_categories?: string[] | null
          profile_image?: string | null
          rank_score?: number
          region_preference?: Json | null
          role?: string
          show_online_status?: boolean
          social_links?: Json
          status?: string | null
          total_views?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          channel_id: string
          channel_name: string
          created_at: string
          user_id: number
          watch_id: number
        }
        Insert: {
          channel_id: string
          channel_name: string
          created_at?: string
          user_id: number
          watch_id?: number
        }
        Update: {
          channel_id?: string
          channel_name?: string
          created_at?: string
          user_id?: number
          watch_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "watch_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_top_journalists"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    posts: {
      Row: {
        post_id: number
        user_id: number
        content: string
        image_urls: string[] | null
        tags: string[] | null
        like_count: number
        comment_count: number
        share_count: number
        created_at: string
        updated_at: string
      }
      Insert: {
        post_id?: number
        user_id: number
        content: string
        image_urls?: string[] | null
        tags?: string[] | null
        like_count?: number
        comment_count?: number
        share_count?: number
        created_at?: string
        updated_at?: string
      }
      Update: {
        post_id?: number
        user_id?: number
        content?: string
        image_urls?: string[] | null
        tags?: string[] | null
        like_count?: number
        comment_count?: number
        share_count?: number
        created_at?: string
        updated_at?: string
      }
      Relationships: []
    },
    post_likes: {
      Row: { like_id: number; post_id: number; user_id: number; created_at: string }
      Insert: { like_id?: number; post_id: number; user_id: number; created_at?: string }
      Update: { like_id?: number; post_id?: number; user_id?: number; created_at?: string }
      Relationships: []
    },
    post_comments: {
      Row: {
        comment_id: number; post_id: number; user_id: number
        parent_comment_id: number | null; comment_text: string
        like_count: number; created_at: string
      }
      Insert: {
        comment_id?: number; post_id: number; user_id: number
        parent_comment_id?: number | null; comment_text: string
        like_count?: number; created_at?: string
      }
      Update: {
        comment_id?: number; post_id?: number; user_id?: number
        parent_comment_id?: number | null; comment_text?: string
        like_count?: number; created_at?: string
      }
      Relationships: []
    },
    thread_posts: {
      Row: {
        post_id: number; thread_id: string; user_id: number
        content: string; image_urls: string[] | null
        like_count: number; created_at: string
      }
      Insert: {
        post_id?: number; thread_id: string; user_id: number
        content: string; image_urls?: string[] | null
        like_count?: number; created_at?: string
      }
      Update: {
        post_id?: number; thread_id?: string; user_id?: number
        content?: string; image_urls?: string[] | null
        like_count?: number; created_at?: string
      }
      Relationships: []
    },
    Views: {
      v_top_journalists: {
        Row: {
          article_count: number | null
          bio: string | null
          follower_count: number | null
          name: string | null
          profile_image: string | null
          published_count: number | null
          total_likes: number | null
          user_id: number | null
        }
        Relationships: []
      }
      v_trending_articles: {
        Row: {
          article_id: number | null
          author_name: string | null
          category_name: string | null
          created_at: string | null
          engagement_score: number | null
          excerpt: string | null
          featured_image: string | null
          like_count: number | null
          save_count: number | null
          share_count: number | null
          slug: string | null
          title: string | null
          views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_article_shares: { Args: { row_id: number }; Returns: number }
      increment_article_views: {
        Args: { p_article_id: number }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      notify_admins: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type?: string
        }
        Returns: undefined
      }
      notify_user: {
        Args: {
          p_link?: string
          p_message: string
          p_title: string
          p_type?: string
          p_user_id: number
        }
        Returns: undefined
      }
      update_journalist_rank: {
        Args: { p_user_id: number }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "inactive" | "banned"
      article_status: "draft" | "under_review" | "published" | "rejected"
      comment_status: "visible" | "hidden" | "flagged"
      earnings_source: "ads" | "subscriptions" | "sponsored"
      moderation_severity: "low" | "medium" | "high" | "critical"
      moderation_status: "pending" | "reviewed" | "resolved" | "dismissed"
      monetization_type: "free" | "paywall" | "sponsored" | "ad"
      payment_method: "mpesa" | "paypal" | "stripe"
      payout_status: "pending" | "paid"
      region_code: "ke" | "ng" | "za" | "gh" | "ug" | "tz" | "et" | "global"
      review_action: "approved" | "rejected" | "revision_requested"
      source_status: "active" | "inactive"
      subscription_plan: "free" | "premium" | "pro"
      subscription_status: "active" | "expired" | "cancelled"
      user_role: "admin" | "journalist" | "reader"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "inactive", "banned"],
      article_status: ["draft", "under_review", "published", "rejected"],
      comment_status: ["visible", "hidden", "flagged"],
      earnings_source: ["ads", "subscriptions", "sponsored"],
      moderation_severity: ["low", "medium", "high", "critical"],
      moderation_status: ["pending", "reviewed", "resolved", "dismissed"],
      monetization_type: ["free", "paywall", "sponsored", "ad"],
      payment_method: ["mpesa", "paypal", "stripe"],
      payout_status: ["pending", "paid"],
      region_code: ["ke", "ng", "za", "gh", "ug", "tz", "et", "global"],
      review_action: ["approved", "rejected", "revision_requested"],
      source_status: ["active", "inactive"],
      subscription_plan: ["free", "premium", "pro"],
      subscription_status: ["active", "expired", "cancelled"],
      user_role: ["admin", "journalist", "reader"],
    },
  },
} as const

/* ─── App-level helper types (re-added after type regeneration) ─── */
export type MonetizationType = Database['public']['Enums']['monetization_type']
export type UserRole = Database['public']['Enums']['user_role']
export type ArticleStatus = Database['public']['Enums']['article_status']
export type AccountStatus = Database['public']['Enums']['account_status']

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
export type SavedArticleRow = Database['public']['Tables']['saved_articles']['Row']
export type AuditLogRow = Database['public']['Tables']['audit_log']['Row']
export type ApiRateLimitRow = Database['public']['Tables']['api_rate_limits']['Row']
export type ArticleLikeRow = Database['public']['Tables']['article_likes']['Row']
export type UserFollowRow = Database['public']['Tables']['user_follows']['Row']
export type ArticleVersionRow = Database['public']['Tables']['article_versions']['Row']
export type ArticleTagRow = Database['public']['Tables']['article_tags']['Row']
export type ArticleTagMappingRow = Database['public']['Tables']['article_tag_mappings']['Row']
export type ContentModerationRow = Database['public']['Tables']['content_moderation']['Row']
export type EmailTemplateRow = Database['public']['Tables']['email_templates']['Row']
export type PayoutRecordRow = Database['public']['Tables']['payout_records']['Row']
export type PayoutRequestRow = Database['public']['Tables']['payout_requests']['Row']
export type PodcastRow = Database['public']['Tables']['podcasts']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']
export type RSSFeedRow = Database['public']['Tables']['rss_feeds']['Row']

export type ArticleWithAuthor = Database['public']['Tables']['articles']['Row'] & {
  author: Pick<Database['public']['Tables']['users']['Row'], 'user_id' | 'name' | 'profile_image' | 'bio' | 'role'> | null
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
  monetization_type: MonetizationType
  views: number | null
  likes: number | null
  shares: number | null
  comments_count: number | null
  created_at: string
  region_priority: number
}

/* ─── Social platform tables (added alongside supabase/migrations/0008_social.sql) ─── */
export interface PostsRow {
  post_id: number
  user_id: number
  content: string
  image_urls: string[] | null
  tags: string[] | null
  like_count: number
  comment_count: number
  share_count: number
  created_at: string
  updated_at: string
}
export interface PostLikesRow {
  like_id: number
  post_id: number
  user_id: number
  created_at: string
}
export interface PostCommentsRow {
  comment_id: number
  post_id: number
  user_id: number
  parent_comment_id: number | null
  comment_text: string
  like_count: number
  created_at: string
}
export interface ThreadPostsRow {
  post_id: number
  thread_id: string
  user_id: number
  content: string
  image_urls: string[] | null
  like_count: number
  created_at: string
}
