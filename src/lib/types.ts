// ============================================================
// types.ts — Всі типи даних додатку DImarket
// Містить: типи бази даних, alias-типи, константи мов і валют
//
// СТРУКТУРА:
// 1. Json — базовий тип для Supabase JSON полів
// 2. Database — повна схема таблиць Supabase
// 3. Alias-типи — короткі імена для таблиць
// 4. Розширені типи — для UI (з join-ами)
// 5. Нові типи — ролі, збережені, двосторонні відгуки
// 6. Константи — валюти та мови
// ============================================================

// Базовий JSON-тип для полів Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// РОЛІ КОРИСТУВАЧІВ
// client            — замовник
// professional      — майстер / фахівець
// company           — компанія послуг
// owner             — власник платформи
// manufacturer      — виробник (CA module)
// commercial_agent  — комерційний представник (CA module)
// ============================================================
export type UserRole =
  | 'client'
  | 'professional'
  | 'company'
  | 'owner'
  | 'manufacturer'
  | 'commercial_agent'

// ============================================================
// СХЕМА БАЗИ ДАНИХ
// ============================================================
export interface Database {
  public: {
    Tables: {

      // ----------------------------------------------------------
      // categories — категорії оголошень і послуг
      // ----------------------------------------------------------
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          icon: string | null
          description: string | null
          created_at: string
          cover_image_url: string | null
          sort_order: number
          is_main: boolean
          is_service: boolean
          icon_key: string | null
          name_i18n: Json
          description_i18n: Json
          services_count: number
          professionals_count: number
          avg_rating: number | null
          completed_projects_count: number
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          icon?: string | null
          description?: string | null
          created_at?: string
          cover_image_url?: string | null
          sort_order?: number
          is_main?: boolean
          is_service?: boolean
          icon_key?: string | null
          name_i18n?: Json
          description_i18n?: Json
          services_count?: number
          professionals_count?: number
          avg_rating?: number | null
          completed_projects_count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          parent_id?: string | null
          icon?: string | null
          description?: string | null
          created_at?: string
          cover_image_url?: string | null
          sort_order?: number
          is_main?: boolean
          is_service?: boolean
          icon_key?: string | null
          name_i18n?: Json
          description_i18n?: Json
          services_count?: number
          professionals_count?: number
          avg_rating?: number | null
          completed_projects_count?: number
          updated_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // profiles — профілі всіх користувачів
      // Включає клієнтів, майстрів, компанії та власника
      // ----------------------------------------------------------
      profiles: {
        Row: {
          id: string
          full_name: string | null
          bio: string | null
          phone: string | null
          location: string | null
          avatar_url: string | null
          profile_photo: string | null
          website: string | null

          // Роль користувача — визначає сценарій використання
          user_role: UserRole | null

          // Сумісність зі старим кодом
          is_professional: boolean
          is_site_owner: boolean

          // Рейтинг і відгуки
          rating: number
          total_reviews: number

          // Рейтинг клієнта (від майстрів)
          client_rating: number | null
          client_total_reviews: number | null

          // Верифікація — платна або адміном
          is_verified: boolean | null
          verified_at: string | null
          verification_level: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'
          email_verified_at: string | null
          phone_verified_at: string | null

          // Преміум профіль — платне підняття у видачі
          is_premium: boolean | null
          premium_expires_at: string | null

          // Featured — виділений у каталозі
          is_featured: boolean | null
          featured_expires_at: string | null

          // Monetization / Stripe subscriptions
          plan_id: string | null
          stripe_customer_id: string | null
          stripe_account_id: string | null
          stripe_connect_charges_enabled: boolean
          stripe_connect_payouts_enabled: boolean
          stripe_connect_details_submitted: boolean
          stripe_connect_onboarded_at: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_period_end: string | null
          lead_credits: number | null
          support_tier: string | null

          // Статистика
          profile_views: number | null
          response_rate: number | null

          // Налаштування
          portfolio_images: string[] | null
          notifications_enabled: boolean | null
          preferred_language: string | null
          preferred_currency: string | null

          work_subcategory_slugs: string[]
          completed_jobs: number
          languages: string[]
          availability_status: 'available' | 'busy' | 'limited' | 'unavailable'
          service_latitude: number | null
          service_longitude: number | null
          service_radius_km: number | null
          referred_by: string | null
          telegram_link_code: string | null
          email_digest_enabled: boolean | null
          notification_prefs: Json
          trust_score: number | null

          created_at: string
          updated_at: string
          deleted_at: string | null
          deleted_by: string | null
          hidden_at: string | null
          hidden_by: string | null
          /** Owner/manual catalog priority — independent from user rating */
          ranking_priority: number
        }
        Insert: {
          id: string
          full_name?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          avatar_url?: string | null
          profile_photo?: string | null
          website?: string | null
          user_role?: UserRole | null
          is_professional?: boolean
          is_site_owner?: boolean
          rating?: number
          total_reviews?: number
          client_rating?: number | null
          client_total_reviews?: number | null
          is_verified?: boolean | null
          verified_at?: string | null
          verification_level?: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'
          email_verified_at?: string | null
          phone_verified_at?: string | null
          is_premium?: boolean | null
          premium_expires_at?: string | null
          is_featured?: boolean | null
          featured_expires_at?: string | null
          plan_id?: string
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          stripe_connect_charges_enabled?: boolean
          stripe_connect_payouts_enabled?: boolean
          stripe_connect_details_submitted?: boolean
          stripe_connect_onboarded_at?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_period_end?: string | null
          lead_credits?: number
          support_tier?: string
          profile_views?: number | null
          response_rate?: number | null
          portfolio_images?: string[] | null
          notifications_enabled?: boolean | null
          preferred_language?: string | null
          preferred_currency?: string | null
          work_subcategory_slugs?: string[]
          completed_jobs?: number
          languages?: string[]
          availability_status?: 'available' | 'busy' | 'limited' | 'unavailable'
          service_latitude?: number | null
          service_longitude?: number | null
          service_radius_km?: number | null
          referred_by?: string | null
          telegram_link_code?: string | null
          email_digest_enabled?: boolean | null
          notification_prefs?: Json
          trust_score?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          ranking_priority?: number
        }
        Update: {
          id?: string
          full_name?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          avatar_url?: string | null
          profile_photo?: string | null
          website?: string | null
          user_role?: UserRole | null
          is_professional?: boolean
          is_site_owner?: boolean
          rating?: number
          total_reviews?: number
          client_rating?: number | null
          client_total_reviews?: number | null
          is_verified?: boolean | null
          verified_at?: string | null
          verification_level?: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'
          email_verified_at?: string | null
          phone_verified_at?: string | null
          is_premium?: boolean | null
          premium_expires_at?: string | null
          is_featured?: boolean | null
          featured_expires_at?: string | null
          plan_id?: string
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          stripe_connect_charges_enabled?: boolean
          stripe_connect_payouts_enabled?: boolean
          stripe_connect_details_submitted?: boolean
          stripe_connect_onboarded_at?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_period_end?: string | null
          lead_credits?: number
          support_tier?: string
          profile_views?: number | null
          response_rate?: number | null
          portfolio_images?: string[] | null
          notifications_enabled?: boolean | null
          preferred_language?: string | null
          preferred_currency?: string | null
          work_subcategory_slugs?: string[]
          completed_jobs?: number
          languages?: string[]
          availability_status?: 'available' | 'busy' | 'limited' | 'unavailable'
          service_latitude?: number | null
          service_longitude?: number | null
          service_radius_km?: number | null
          referred_by?: string | null
          telegram_link_code?: string | null
          email_digest_enabled?: boolean | null
          notification_prefs?: Json
          trust_score?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          ranking_priority?: number
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // listings — оголошення
      // Типи: пошук майстра, пропозиція послуг, продаж, пошук товару
      // ----------------------------------------------------------
      listings: {
        Row: {
          id: string
          title: string
          description: string
          category_id: string | null
          listing_type: 'service_request' | 'service_offer' | 'item_sale' | 'item_wanted'
          price: number | null
          currency: string
          location: string
          contact_name: string
          contact_phone: string | null
          contact_email: string | null
          author_id: string | null
          duration_days: number
          expires_at: string
          is_premium: boolean

          // Promoted — платне виділення у видачі
          is_promoted: boolean | null
          promoted_expires_at: string | null

          views_count: number
          status: 'active' | 'expired' | 'sold' | 'deleted'
          created_at: string
          updated_at: string
          visibility_radius:
            | 'city'
            | 'district'
            | 'region'
            | 'country'
            | 'state'
            | 'land'
            | 'global'
            | null
          subcategory_slugs: string[]
          budget_min: number | null
          budget_max: number | null
          deadline_type: 'flexible' | 'asap' | 'date' | null
          deadline_at: string | null
          urgency: 'low' | 'normal' | 'high' | 'urgent' | null
          preferred_language: string | null
          wizard_completed: boolean
          postal_code: string | null
          country_name: string | null
          city_name: string | null
          latitude: number | null
          longitude: number | null
          hired_professional_id: string | null
          pipeline_stage: string | null
          pipeline_completed_at: string | null
          review_prompted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category_id?: string | null
          listing_type: 'service_request' | 'service_offer' | 'item_sale' | 'item_wanted'
          price?: number | null
          currency?: string
          location: string
          contact_name: string
          contact_phone?: string | null
          contact_email?: string | null
          author_id?: string | null
          duration_days?: number
          expires_at: string
          is_premium?: boolean
          is_promoted?: boolean | null
          promoted_expires_at?: string | null
          views_count?: number
          status?: 'active' | 'expired' | 'sold' | 'deleted'
          created_at?: string
          updated_at?: string
          visibility_radius?:
            | 'city'
            | 'district'
            | 'region'
            | 'country'
            | 'state'
            | 'land'
            | 'global'
            | null
          subcategory_slugs?: string[]
          budget_min?: number | null
          budget_max?: number | null
          deadline_type?: 'flexible' | 'asap' | 'date' | null
          deadline_at?: string | null
          urgency?: 'low' | 'normal' | 'high' | 'urgent' | null
          preferred_language?: string | null
          wizard_completed?: boolean
          postal_code?: string | null
          country_name?: string | null
          city_name?: string | null
          latitude?: number | null
          longitude?: number | null
          hired_professional_id?: string | null
          pipeline_stage?: string | null
          pipeline_completed_at?: string | null
          review_prompted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category_id?: string | null
          listing_type?: 'service_request' | 'service_offer' | 'item_sale' | 'item_wanted'
          price?: number | null
          currency?: string
          location?: string
          contact_name?: string
          contact_phone?: string | null
          contact_email?: string | null
          author_id?: string | null
          duration_days?: number
          expires_at?: string
          is_premium?: boolean
          is_promoted?: boolean | null
          promoted_expires_at?: string | null
          views_count?: number
          status?: 'active' | 'expired' | 'sold' | 'deleted'
          created_at?: string
          updated_at?: string
          visibility_radius?:
            | 'city'
            | 'district'
            | 'region'
            | 'country'
            | 'state'
            | 'land'
            | 'global'
            | null
          subcategory_slugs?: string[]
          budget_min?: number | null
          budget_max?: number | null
          deadline_type?: 'flexible' | 'asap' | 'date' | null
          deadline_at?: string | null
          urgency?: 'low' | 'normal' | 'high' | 'urgent' | null
          preferred_language?: string | null
          wizard_completed?: boolean
          postal_code?: string | null
          country_name?: string | null
          city_name?: string | null
          latitude?: number | null
          longitude?: number | null
          hired_professional_id?: string | null
          pipeline_stage?: string | null
          pipeline_completed_at?: string | null
          review_prompted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_hired_professional_id_fkey"
            columns: ["hired_professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      project_files: {
        Row: {
          id: string
          listing_id: string
          url: string
          storage_path: string | null
          mime_type: string | null
          file_name: string | null
          kind: 'photo' | 'video' | 'pdf' | 'plan' | 'other'
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          url: string
          storage_path?: string | null
          mime_type?: string | null
          file_name?: string | null
          kind?: 'photo' | 'video' | 'pdf' | 'plan' | 'other'
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          url?: string
          storage_path?: string | null
          mime_type?: string | null
          file_name?: string | null
          kind?: 'photo' | 'video' | 'pdf' | 'plan' | 'other'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }

      project_applications: {
        Row: {
          id: string
          listing_id: string
          professional_id: string
          status: 'saved' | 'applied' | 'withdrawn' | 'accepted' | 'rejected' | 'ready' | 'needs_inspection' | 'declined'
          message: string | null
          saved: boolean
          hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          professional_id: string
          status?: 'saved' | 'applied' | 'withdrawn' | 'accepted' | 'rejected' | 'ready' | 'needs_inspection' | 'declined'
          message?: string | null
          saved?: boolean
          hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          professional_id?: string
          status?: 'saved' | 'applied' | 'withdrawn' | 'accepted' | 'rejected' | 'ready' | 'needs_inspection' | 'declined'
          message?: string | null
          saved?: boolean
          hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_applications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      quotes: {
        Row: {
          id: string
          application_id: string
          listing_id: string
          professional_id: string
          materials: unknown
          labor: unknown
          equipment: unknown
          vat_percent: number
          discount: number
          currency: string
          subtotal: number
          total: number
          notes: string | null
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          signed_at: string | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          listing_id: string
          professional_id: string
          materials?: unknown
          labor?: unknown
          equipment?: unknown
          vat_percent?: number
          discount?: number
          currency?: string
          subtotal?: number
          total?: number
          notes?: string | null
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          signed_at?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          listing_id?: string
          professional_id?: string
          materials?: unknown
          labor?: unknown
          equipment?: unknown
          vat_percent?: number
          discount?: number
          currency?: string
          subtotal?: number
          total?: number
          notes?: string | null
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          signed_at?: string | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "project_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // listing_images — фото до оголошень
      // ----------------------------------------------------------
      listing_images: {
        Row: {
          id: string
          listing_id: string
          image_url: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          image_url: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          image_url?: string
          display_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // portfolio_items — портфоліо майстра або компанії
      // ----------------------------------------------------------
      portfolio_items: {
        Row: {
          id: string
          profile_id: string
          title: string
          description: string | null
          image_url: string | null
          video_url: string | null
          before_url: string | null
          after_url: string | null
          media_type: 'image' | 'video' | 'certificate' | 'before_after'
          category_slug: string | null
          like_count: number
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          description?: string | null
          image_url?: string | null
          video_url?: string | null
          before_url?: string | null
          after_url?: string | null
          media_type?: 'image' | 'video' | 'certificate' | 'before_after'
          category_slug?: string | null
          like_count?: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          video_url?: string | null
          before_url?: string | null
          after_url?: string | null
          media_type?: 'image' | 'video' | 'certificate' | 'before_after'
          category_slug?: string | null
          like_count?: number
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      portfolio_likes: {
        Row: {
          id: string
          portfolio_item_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_item_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_item_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // reviews — відгуки
      // Двосторонні: клієнт → майстер і майстер → клієнт
      // reviewer_role вказує хто залишив відгук
      // target_role вказує кому залишили відгук
      // ----------------------------------------------------------
      reviews: {
        Row: {
          id: string
          professional_id: string
          reviewer_id: string | null
          reviewer_name: string
          reviewer_email: string | null
          reviewer_role: 'client' | 'professional' | 'company' | null
          rating: number
          comment: string | null
          listing_id: string | null
          is_approved: boolean | null
          is_hidden: boolean | null
          work_quality: number | null
          communication: number | null
          speed: number | null
          reliability: number | null
          would_recommend: boolean | null
          moderation_flag: boolean | null
          media_urls: Array<{ url: string; type: 'image' | 'video' }> | string[] | null
          like_count: number
          is_verified_customer: boolean
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          reviewer_id?: string | null
          reviewer_name: string
          reviewer_email?: string | null
          reviewer_role?: 'client' | 'professional' | 'company' | null
          rating: number
          comment?: string | null
          listing_id?: string | null
          is_approved?: boolean | null
          is_hidden?: boolean | null
          work_quality?: number | null
          communication?: number | null
          speed?: number | null
          reliability?: number | null
          would_recommend?: boolean | null
          moderation_flag?: boolean | null
          media_urls?: Array<{ url: string; type: 'image' | 'video' }> | string[] | null
          like_count?: number
          is_verified_customer?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          reviewer_id?: string | null
          reviewer_name?: string
          reviewer_email?: string | null
          reviewer_role?: 'client' | 'professional' | 'company' | null
          rating?: number
          comment?: string | null
          listing_id?: string | null
          is_approved?: boolean | null
          is_hidden?: boolean | null
          work_quality?: number | null
          communication?: number | null
          speed?: number | null
          reliability?: number | null
          would_recommend?: boolean | null
          moderation_flag?: boolean | null
          media_urls?: Array<{ url: string; type: 'image' | 'video' }> | string[] | null
          like_count?: number
          is_verified_customer?: boolean
          created_at?: string
        }
        Relationships: []
      }

      review_likes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }

      review_replies: {
        Row: {
          id: string
          review_id: string
          author_id: string
          author_name: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          author_id: string
          author_name: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          author_id?: string
          author_name?: string
          body?: string
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // messages — повідомлення між користувачами
      // Кожне оголошення має свій conversation_id
      // ----------------------------------------------------------
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string | null
          sender_name: string | null
          sender_email: string | null
          recipient_id: string
          listing_id: string | null
          content: string
          is_read: boolean
          // Чи заблокований відправник
          is_blocked: boolean | null
          delivery_status: 'sent' | 'delivered' | 'read'
          attachment_count: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id?: string | null
          sender_name?: string | null
          sender_email?: string | null
          recipient_id: string
          listing_id?: string | null
          content: string
          is_read?: boolean
          is_blocked?: boolean | null
          delivery_status?: 'sent' | 'delivered' | 'read'
          attachment_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_email?: string | null
          recipient_id?: string
          listing_id?: string | null
          content?: string
          is_read?: boolean
          is_blocked?: boolean | null
          delivery_status?: 'sent' | 'delivered' | 'read'
          attachment_count?: number
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // saved_items — збережені оголошення, профілі та B2B сутності
      // item_type: listing | profile | manufacturer | agent | opportunity
      // ----------------------------------------------------------
      saved_items: {
        Row: {
          id: string
          user_id: string
          item_type: 'listing' | 'profile' | 'manufacturer' | 'agent' | 'opportunity'
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'listing' | 'profile' | 'manufacturer' | 'agent' | 'opportunity'
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'listing' | 'profile' | 'manufacturer' | 'agent' | 'opportunity'
          item_id?: string
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // ad_campaigns — рекламні кампанії
      // Розширено: медіа, кілька розміщень, geo-таргетинг
      // ----------------------------------------------------------
      ad_campaigns: {
        Row: {
          id: string
          advertiser_id: string
          title: string
          description: string | null

          // Медіа — зображення, gif або відео
          image_url: string
          media_url: string | null
          media_type: 'image' | 'gif' | 'video' | null

          link_url: string

          // Одне розміщення (сумісність) і масив розміщень (нове)
          placement: 'home' | 'listings' | 'sidebar' | 'footer' | 'mobile_sticky'
          placements: string[] | null

          // Географія
          geo_scope: 'city' | 'region' | 'country' | 'global' | 'cities' | 'regions' | 'countries'
          country_code: string | null
          country_name: string | null
          region_name: string | null
          city_name: string | null
          countries: string[] | null
          cities: string[] | null
          slot_media: Json
          media_style: Json

          // Період показу
          starts_at: string | null
          ends_at: string | null

          // Статус і модерація
          status: 'draft' | 'pending_review' | 'pending_payment' | 'active' | 'paused' | 'rejected' | 'expired' | 'deleted'
          review_note: string | null
          approved_by: string | null
          approved_at: string | null

          // Статистика
          impressions: number | null
          clicks: number | null

          // Оплата через Stripe
          stripe_payment_id: string | null
          price_paid: number | null
          currency_paid: string | null

          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          advertiser_id: string
          title: string
          description?: string | null
          image_url: string
          media_url?: string | null
          media_type?: 'image' | 'gif' | 'video' | null
          link_url: string
          placement: 'home' | 'listings' | 'sidebar' | 'footer' | 'mobile_sticky'
          placements?: string[] | null
          geo_scope: 'city' | 'region' | 'country' | 'global' | 'cities' | 'regions' | 'countries'
          country_code?: string | null
          country_name?: string | null
          region_name?: string | null
          city_name?: string | null
          countries?: string[] | null
          cities?: string[] | null
          slot_media?: Json
          media_style?: Json
          starts_at?: string | null
          ends_at?: string | null
          status?: 'draft' | 'pending_review' | 'pending_payment' | 'active' | 'paused' | 'rejected' | 'expired' | 'deleted'
          review_note?: string | null
          approved_by?: string | null
          approved_at?: string | null
          impressions?: number | null
          clicks?: number | null
          stripe_payment_id?: string | null
          price_paid?: number | null
          currency_paid?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          advertiser_id?: string
          title?: string
          description?: string | null
          image_url?: string
          media_url?: string | null
          media_type?: 'image' | 'gif' | 'video' | null
          link_url?: string
          placement?: 'home' | 'listings' | 'sidebar' | 'footer' | 'mobile_sticky'
          placements?: string[] | null
          geo_scope?: 'city' | 'region' | 'country' | 'global' | 'cities' | 'regions' | 'countries'
          country_code?: string | null
          country_name?: string | null
          region_name?: string | null
          city_name?: string | null
          countries?: string[] | null
          cities?: string[] | null
          slot_media?: Json
          media_style?: Json
          starts_at?: string | null
          ends_at?: string | null
          status?: 'draft' | 'pending_review' | 'pending_payment' | 'active' | 'paused' | 'rejected' | 'expired' | 'deleted'
          review_note?: string | null
          approved_by?: string | null
          approved_at?: string | null
          impressions?: number | null
          clicks?: number | null
          stripe_payment_id?: string | null
          price_paid?: number | null
          currency_paid?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // feedback_messages — звернення через "Зв'язатися з нами"
      // ----------------------------------------------------------
      feedback_messages: {
        Row: {
          id: string
          sender_id: string | null
          name: string
          email: string
          phone: string | null
          subject: string
          message: string
          status: 'new' | 'in_progress' | 'resolved' | 'archived'
          is_read: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          sender_id?: string | null
          name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          status?: 'new' | 'in_progress' | 'resolved' | 'archived'
          is_read?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          status?: 'new' | 'in_progress' | 'resolved' | 'archived'
          is_read?: boolean
          created_at?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // professional_categories — категорії майстра/компанії
      // ----------------------------------------------------------
      professional_categories: {
        Row: {
          id: string
          profile_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // app_site_stats — статистика платформи (одна строка)
      // ----------------------------------------------------------
      app_site_stats: {
        Row: {
          id: number
          total_visits: number
          total_listings_created: number
          total_successful_listings: number
          total_professionals: number
          country_ranking: Json
          updated_at: string
        }
        Insert: {
          id?: number
          total_visits?: number
          total_listings_created?: number
          total_successful_listings?: number
          total_professionals?: number
          country_ranking?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          total_visits?: number
          total_listings_created?: number
          total_successful_listings?: number
          total_professionals?: number
          country_ranking?: Json
          updated_at?: string
        }
        Relationships: []
      }

      project_escrows: {
        Row: {
          id: string
          listing_id: string
          quote_id: string | null
          customer_id: string
          professional_id: string
          amount: number
          currency: string
          status: 'pending_checkout' | 'authorized' | 'captured' | 'canceled' | 'refunded'
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          authorized_at: string | null
          released_at: string | null
          created_at: string
          updated_at: string | null
          platform_fee_bps: number
          platform_fee_amount: number | null
          transfer_amount: number | null
          stripe_transfer_id: string | null
          payout_status: 'none' | 'pending' | 'transferred' | 'failed' | 'skipped_no_connect'
          payout_error: string | null
          paid_out_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          quote_id?: string | null
          customer_id: string
          professional_id: string
          amount: number
          currency?: string
          status?: 'pending_checkout' | 'authorized' | 'captured' | 'canceled' | 'refunded'
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          authorized_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string | null
          platform_fee_bps?: number
          platform_fee_amount?: number | null
          transfer_amount?: number | null
          stripe_transfer_id?: string | null
          payout_status?: 'none' | 'pending' | 'transferred' | 'failed' | 'skipped_no_connect'
          payout_error?: string | null
          paid_out_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          quote_id?: string | null
          customer_id?: string
          professional_id?: string
          amount?: number
          currency?: string
          status?: 'pending_checkout' | 'authorized' | 'captured' | 'canceled' | 'refunded'
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          authorized_at?: string | null
          released_at?: string | null
          created_at?: string
          updated_at?: string | null
          platform_fee_bps?: number
          platform_fee_amount?: number | null
          transfer_amount?: number | null
          stripe_transfer_id?: string | null
          payout_status?: 'none' | 'pending' | 'transferred' | 'failed' | 'skipped_no_connect'
          payout_error?: string | null
          paid_out_at?: string | null
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // payments — платежі через Stripe
      // Зберігає всі транзакції для реклами та premium послуг
      // ----------------------------------------------------------
      payments: {
        Row: {
          id: string
          user_id: string
          // Тип платежу — за що саме
          payment_type: 'ad_campaign' | 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost' | 'subscription' | 'featured_profile' | 'sponsored_project' | 'lead_credits' | 'google_ads' | 'project_escrow'
          // ID пов'язаного об'єкта
          reference_id: string | null
          amount: number
          currency: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_type: 'ad_campaign' | 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost' | 'subscription' | 'featured_profile' | 'sponsored_project' | 'lead_credits' | 'google_ads' | 'project_escrow'
          reference_id?: string | null
          amount: number
          currency: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_type?: 'ad_campaign' | 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost' | 'subscription' | 'featured_profile' | 'sponsored_project' | 'lead_credits' | 'google_ads' | 'project_escrow'
          reference_id?: string | null
          amount?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
        }
        Relationships: []
      }

      sponsored_projects: {
        Row: {
          id: string
          listing_id: string
          sponsor_user_id: string
          status: string
          starts_at: string
          expires_at: string
          stripe_session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          sponsor_user_id: string
          status?: string
          starts_at?: string
          expires_at: string
          stripe_session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          sponsor_user_id?: string
          status?: string
          starts_at?: string
          expires_at?: string
          stripe_session_id?: string | null
          created_at?: string
        }
        Relationships: []
      }

      lead_credit_ledger: {
        Row: {
          id: string
          user_id: string
          delta: number
          balance_after: number
          reason: string
          reference_id: string | null
          payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          delta: number
          balance_after: number
          reason: string
          reference_id?: string | null
          payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          delta?: number
          balance_after?: number
          reason?: string
          reference_id?: string | null
          payment_id?: string | null
          created_at?: string
        }
        Relationships: []
      }

      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          billing_interval: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          billing_interval?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          billing_interval?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_eur_month: number
          price_eur_year: number | null
          lead_credits_monthly: number
          featured_profile: boolean
          premium_profile: boolean
          sponsored_projects_monthly: number
          banner_ad_discount_pct: number
          google_ads_included: boolean
          support_tier: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          price_eur_month?: number
          price_eur_year?: number | null
          lead_credits_monthly?: number
          featured_profile?: boolean
          premium_profile?: boolean
          sponsored_projects_monthly?: number
          banner_ad_discount_pct?: number
          google_ads_included?: boolean
          support_tier?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_eur_month?: number
          price_eur_year?: number | null
          lead_credits_monthly?: number
          featured_profile?: boolean
          premium_profile?: boolean
          sponsored_projects_monthly?: number
          banner_ad_discount_pct?: number
          google_ads_included?: boolean
          support_tier?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }

      google_ads_requests: {
        Row: {
          id: string
          user_id: string
          business_name: string | null
          website_url: string | null
          monthly_budget_eur: number | null
          goals: string | null
          status: string
          notes: string | null
          stripe_session_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name?: string | null
          website_url?: string | null
          monthly_budget_eur?: number | null
          goals?: string | null
          status?: string
          notes?: string | null
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string | null
          website_url?: string | null
          monthly_budget_eur?: number | null
          goals?: string | null
          status?: string
          notes?: string | null
          stripe_session_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // announcements — глобальні повідомлення в шапці
      // Власник може додавати банери для всіх користувачів
      // ----------------------------------------------------------
      announcements: {
        Row: {
          id: string
          message: string
          type: 'info' | 'warning' | 'success' | 'promo'
          is_active: boolean
          starts_at: string | null
          ends_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          type?: 'info' | 'warning' | 'success' | 'promo'
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'promo'
          is_active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // manufacturer_profiles — B2B manufacturer company profiles (CA module)
      // ----------------------------------------------------------
      manufacturer_profiles: {
        Row: {
          id: string
          profile_id: string
          slug: string
          company_name: string
          logo_url: string | null
          description: string | null
          website: string | null
          country: string | null
          headquarters: string | null
          contact_person: string | null
          public_email: string | null
          public_phone: string | null
          show_public_contacts: boolean
          categories: string[]
          products: string[]
          target_markets: string[]
          countries_available: string[]
          languages: string[]
          minimum_experience_years: number | null
          required_experience: string | null
          commission_model: string | null
          commission_min: number | null
          commission_max: number | null
          exclusive_representation: boolean
          non_exclusive_representation: boolean
          distributor_available: boolean
          agent_required: boolean
          company_size: string | null
          founded_year: number | null
          certifications: string[]
          catalog_url: string | null
          images: string[]
          verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          slug: string
          company_name: string
          logo_url?: string | null
          description?: string | null
          website?: string | null
          country?: string | null
          headquarters?: string | null
          contact_person?: string | null
          public_email?: string | null
          public_phone?: string | null
          show_public_contacts?: boolean
          categories?: string[]
          products?: string[]
          target_markets?: string[]
          countries_available?: string[]
          languages?: string[]
          minimum_experience_years?: number | null
          required_experience?: string | null
          commission_model?: string | null
          commission_min?: number | null
          commission_max?: number | null
          exclusive_representation?: boolean
          non_exclusive_representation?: boolean
          distributor_available?: boolean
          agent_required?: boolean
          company_size?: string | null
          founded_year?: number | null
          certifications?: string[]
          catalog_url?: string | null
          images?: string[]
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          slug?: string
          company_name?: string
          logo_url?: string | null
          description?: string | null
          website?: string | null
          country?: string | null
          headquarters?: string | null
          contact_person?: string | null
          public_email?: string | null
          public_phone?: string | null
          show_public_contacts?: boolean
          categories?: string[]
          products?: string[]
          target_markets?: string[]
          countries_available?: string[]
          languages?: string[]
          minimum_experience_years?: number | null
          required_experience?: string | null
          commission_model?: string | null
          commission_min?: number | null
          commission_max?: number | null
          exclusive_representation?: boolean
          non_exclusive_representation?: boolean
          distributor_available?: boolean
          agent_required?: boolean
          company_size?: string | null
          founded_year?: number | null
          certifications?: string[]
          catalog_url?: string | null
          images?: string[]
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturer_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // agent_profiles — B2B commercial agent profiles (CA module)
      // ----------------------------------------------------------
      agent_profiles: {
        Row: {
          id: string
          profile_id: string
          slug: string
          full_name: string
          profile_photo_url: string | null
          company_name: string | null
          description: string | null
          country: string | null
          city: string | null
          service_regions: string[]
          languages: string[]
          categories: string[]
          industries: string[]
          years_experience: number | null
          previous_experience: string | null
          client_types: string[]
          territory: string | null
          representation_type: string | null
          current_manufacturers: string[]
          available_for_new_brands: boolean
          preferred_commission: string | null
          portfolio_urls: string[]
          website: string | null
          linkedin_url: string | null
          show_public_contacts: boolean
          public_email: string | null
          public_phone: string | null
          verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          slug: string
          full_name: string
          profile_photo_url?: string | null
          company_name?: string | null
          description?: string | null
          country?: string | null
          city?: string | null
          service_regions?: string[]
          languages?: string[]
          categories?: string[]
          industries?: string[]
          years_experience?: number | null
          previous_experience?: string | null
          client_types?: string[]
          territory?: string | null
          representation_type?: string | null
          current_manufacturers?: string[]
          available_for_new_brands?: boolean
          preferred_commission?: string | null
          portfolio_urls?: string[]
          website?: string | null
          linkedin_url?: string | null
          show_public_contacts?: boolean
          public_email?: string | null
          public_phone?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          slug?: string
          full_name?: string
          profile_photo_url?: string | null
          company_name?: string | null
          description?: string | null
          country?: string | null
          city?: string | null
          service_regions?: string[]
          languages?: string[]
          categories?: string[]
          industries?: string[]
          years_experience?: number | null
          previous_experience?: string | null
          client_types?: string[]
          territory?: string | null
          representation_type?: string | null
          current_manufacturers?: string[]
          available_for_new_brands?: boolean
          preferred_commission?: string | null
          portfolio_urls?: string[]
          website?: string | null
          linkedin_url?: string | null
          show_public_contacts?: boolean
          public_email?: string | null
          public_phone?: string | null
          verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // representation_opportunities — Open representation vacancies posted by manufacturers
      // ----------------------------------------------------------
      representation_opportunities: {
        Row: {
          id: string
          manufacturer_id: string
          title: string
          description: string
          category: string | null
          products: string[]
          target_country: string | null
          target_regions: string[]
          target_customer_types: string[]
          required_experience: string | null
          required_languages: string[]
          commission_type: string | null
          commission_range: string | null
          exclusive: boolean
          contract_type: string | null
          travel_required: boolean
          remote_possible: boolean
          minimum_requirements: string | null
          application_deadline: string | null
          status: 'draft' | 'published' | 'paused' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manufacturer_id: string
          title: string
          description?: string
          category?: string | null
          products?: string[]
          target_country?: string | null
          target_regions?: string[]
          target_customer_types?: string[]
          required_experience?: string | null
          required_languages?: string[]
          commission_type?: string | null
          commission_range?: string | null
          exclusive?: boolean
          contract_type?: string | null
          travel_required?: boolean
          remote_possible?: boolean
          minimum_requirements?: string | null
          application_deadline?: string | null
          status?: 'draft' | 'published' | 'paused' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manufacturer_id?: string
          title?: string
          description?: string
          category?: string | null
          products?: string[]
          target_country?: string | null
          target_regions?: string[]
          target_customer_types?: string[]
          required_experience?: string | null
          required_languages?: string[]
          commission_type?: string | null
          commission_range?: string | null
          exclusive?: boolean
          contract_type?: string | null
          travel_required?: boolean
          remote_possible?: boolean
          minimum_requirements?: string | null
          application_deadline?: string | null
          status?: 'draft' | 'published' | 'paused' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representation_opportunities_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // representation_applications — Agent applications to representation opportunities
      // ----------------------------------------------------------
      representation_applications: {
        Row: {
          id: string
          opportunity_id: string
          agent_id: string
          manufacturer_id: string
          message: string
          status: 'pending' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          agent_id: string
          manufacturer_id: string
          message?: string
          status?: 'pending' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          agent_id?: string
          manufacturer_id?: string
          message?: string
          status?: 'pending' | 'viewed' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representation_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "representation_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "representation_applications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "representation_applications_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // agent_invitations — Manufacturer invitations sent to commercial agents
      // ----------------------------------------------------------
      agent_invitations: {
        Row: {
          id: string
          manufacturer_id: string
          agent_id: string
          opportunity_id: string | null
          message: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          manufacturer_id: string
          agent_id: string
          opportunity_id?: string | null
          message?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          manufacturer_id?: string
          agent_id?: string
          opportunity_id?: string | null
          message?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_invitations_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "representation_opportunities"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // commercial_entity_reports — Safety reports on manufacturers, agents, opportunities, messages
      // ----------------------------------------------------------
      commercial_entity_reports: {
        Row: {
          id: string
          reporter_id: string
          entity_type: 'manufacturer' | 'agent' | 'opportunity' | 'message'
          entity_id: string
          reason: 'spam' | 'fraud' | 'fake_company' | 'incorrect_information' | 'abuse' | 'other'
          details: string | null
          status: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          entity_type: 'manufacturer' | 'agent' | 'opportunity' | 'message'
          entity_id: string
          reason: 'spam' | 'fraud' | 'fake_company' | 'incorrect_information' | 'abuse' | 'other'
          details?: string | null
          status?: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          entity_type?: 'manufacturer' | 'agent' | 'opportunity' | 'message'
          entity_id?: string
          reason?: 'spam' | 'fraud' | 'fake_company' | 'incorrect_information' | 'abuse' | 'other'
          details?: string | null
          status?: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_entity_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // commercial_analytics_events — B2B funnel analytics events
      // ----------------------------------------------------------
      commercial_analytics_events: {
        Row: {
          id: string
          event_name: string
          actor_id: string | null
          entity_type: string | null
          entity_id: string | null
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          event_name: string
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          event_name?: string
          actor_id?: string | null
          entity_type?: string | null
          entity_id?: string | null
          meta?: Json
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // bookings — Calendar bookings between customers and professionals
      // ----------------------------------------------------------
      bookings: {
        Row: {
          id: string
          professional_id: string
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          starts_at: string
          ends_at: string
          status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
          notes: string | null
          google_event_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          starts_at: string
          ends_at: string
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
          notes?: string | null
          google_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          starts_at?: string
          ends_at?: string
          status?: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
          notes?: string | null
          google_event_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // booking_blocked_dates — Dates a professional has blocked on the booking calendar
      // ----------------------------------------------------------
      booking_blocked_dates: {
        Row: {
          id: string
          professional_id: string
          blocked_date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          blocked_date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          blocked_date?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_blocked_dates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // google_calendar_connections — OAuth tokens for Google Calendar sync
      // ----------------------------------------------------------
      google_calendar_connections: {
        Row: {
          user_id: string
          access_token: string
          refresh_token: string | null
          token_expiry: string | null
          calendar_id: string
          scope: string | null
          connected_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          access_token: string
          refresh_token?: string | null
          token_expiry?: string | null
          calendar_id?: string
          scope?: string | null
          connected_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          access_token?: string
          refresh_token?: string | null
          token_expiry?: string | null
          calendar_id?: string
          scope?: string | null
          connected_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // conversations — 1:1 chat threads between two profiles, optionally tied to a listing
      // ----------------------------------------------------------
      conversations: {
        Row: {
          id: string
          listing_id: string | null
          participant_a: string
          participant_b: string
          last_message_preview: string | null
          last_message_at: string | null
          typing_user_id: string | null
          typing_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          participant_a: string
          participant_b: string
          last_message_preview?: string | null
          last_message_at?: string | null
          typing_user_id?: string | null
          typing_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          participant_a?: string
          participant_b?: string
          last_message_preview?: string | null
          last_message_at?: string | null
          typing_user_id?: string | null
          typing_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // ai_job_sessions — Persisted AI job-lead wizard sessions
      // ----------------------------------------------------------
      ai_job_sessions: {
        Row: {
          id: string
          user_id: string | null
          locale: string
          status: 'active' | 'completed' | 'abandoned' | 'published'
          draft: Json
          extracted: Json
          listing_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          locale?: string
          status?: 'active' | 'completed' | 'abandoned' | 'published'
          draft?: Json
          extracted?: Json
          listing_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          locale?: string
          status?: 'active' | 'completed' | 'abandoned' | 'published'
          draft?: Json
          extracted?: Json
          listing_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // ai_job_messages — Chat turns inside an AI job-lead session
      // ----------------------------------------------------------
      ai_job_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          meta: Json
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          meta?: Json
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          meta?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_job_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_job_sessions"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // ai_generated_jobs — Draft jobs produced from an AI session
      // ----------------------------------------------------------
      ai_generated_jobs: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          listing_id: string | null
          draft: Json
          title: string | null
          description: string | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          listing_id?: string | null
          draft?: Json
          title?: string | null
          description?: string | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          listing_id?: string | null
          draft?: Json
          title?: string | null
          description?: string | null
          published_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_jobs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_job_sessions"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // contractor_verifications — Contractor identity / business verification records
      // ----------------------------------------------------------
      contractor_verifications: {
        Row: {
          id: string
          profile_id: string
          status: 'unverified' | 'pending' | 'verified' | 'rejected'
          business_name: string | null
          vat_number: string | null
          trade_license_ref: string | null
          insurance_ref: string | null
          trust_score: number | null
          reviewer_id: string | null
          review_notes: string | null
          submitted_at: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          business_name?: string | null
          vat_number?: string | null
          trade_license_ref?: string | null
          insurance_ref?: string | null
          trust_score?: number | null
          reviewer_id?: string | null
          review_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          status?: 'unverified' | 'pending' | 'verified' | 'rejected'
          business_name?: string | null
          vat_number?: string | null
          trade_license_ref?: string | null
          insurance_ref?: string | null
          trust_score?: number | null
          reviewer_id?: string | null
          review_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // verification_documents — Uploaded documents attached to a contractor verification
      // ----------------------------------------------------------
      verification_documents: {
        Row: {
          id: string
          verification_id: string
          doc_type: string
          storage_path: string
          public_url: string
          file_name: string | null
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          doc_type: string
          storage_path: string
          public_url: string
          file_name?: string | null
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          doc_type?: string
          storage_path?: string
          public_url?: string
          file_name?: string | null
          mime_type?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "contractor_verifications"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // verification_reviews — Moderator actions on contractor verifications
      // ----------------------------------------------------------
      verification_reviews: {
        Row: {
          id: string
          verification_id: string
          reviewer_id: string
          action: 'approve' | 'reject' | 'request_info'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          reviewer_id: string
          action: 'approve' | 'reject' | 'request_info'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          reviewer_id?: string
          action?: 'approve' | 'reject' | 'request_info'
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_reviews_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "contractor_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // match_scores — Normalized contractor-to-listing match scores
      // ----------------------------------------------------------
      match_scores: {
        Row: {
          id: string
          listing_id: string
          contractor_id: string
          score: number
          reasons: string[]
          rank_position: number | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          contractor_id: string
          score?: number
          reasons?: string[]
          rank_position?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          contractor_id?: string
          score?: number
          reasons?: string[]
          rank_position?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // message_attachments — Files attached to chat messages
      // ----------------------------------------------------------
      message_attachments: {
        Row: {
          id: string
          message_id: string
          storage_path: string
          public_url: string
          file_name: string | null
          mime_type: string | null
          file_size_bytes: number | null
          attachment_type: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          storage_path: string
          public_url: string
          file_name?: string | null
          mime_type?: string | null
          file_size_bytes?: number | null
          attachment_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          storage_path?: string
          public_url?: string
          file_name?: string | null
          mime_type?: string | null
          file_size_bytes?: number | null
          attachment_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // notification_tokens — Web Push endpoints per user
      // ----------------------------------------------------------
      notification_tokens: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // notifications — In-app notifications
      // ----------------------------------------------------------
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'message' | 'lead' | 'verification' | 'review' | 'listing' | 'match' | 'system' | 'booking' | 'payment' | 'project' | 'quote'
          title: string
          body: string
          link_path: string | null
          reference_type: string | null
          reference_id: string | null
          is_read: boolean
          email_sent: boolean
          push_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'message' | 'lead' | 'verification' | 'review' | 'listing' | 'match' | 'system' | 'booking' | 'payment' | 'project' | 'quote'
          title: string
          body: string
          link_path?: string | null
          reference_type?: string | null
          reference_id?: string | null
          is_read?: boolean
          email_sent?: boolean
          push_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'message' | 'lead' | 'verification' | 'review' | 'listing' | 'match' | 'system' | 'booking' | 'payment' | 'project' | 'quote'
          title?: string
          body?: string
          link_path?: string | null
          reference_type?: string | null
          reference_id?: string | null
          is_read?: boolean
          email_sent?: boolean
          push_sent?: boolean
          created_at?: string
        }
        Relationships: []
      }

      // ----------------------------------------------------------
      // review_reports — User reports on reviews
      // ----------------------------------------------------------
      review_reports: {
        Row: {
          id: string
          review_id: string
          reporter_id: string | null
          reason: string
          details: string | null
          status: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          reporter_id?: string | null
          reason: string
          details?: string | null
          status?: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          reporter_id?: string | null
          reason?: string
          details?: string | null
          status?: 'open' | 'reviewed' | 'dismissed' | 'actioned'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // referral_codes — Professional/company invite codes
      // ----------------------------------------------------------
      referral_codes: {
        Row: {
          id: string
          user_id: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // referral_redemptions — Who redeemed a referral code
      // ----------------------------------------------------------
      referral_redemptions: {
        Row: {
          id: string
          code_id: string
          referrer_id: string
          referred_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          code_id: string
          referrer_id: string
          referred_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          code_id?: string
          referrer_id?: string
          referred_user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_redemptions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_redemptions_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      // ----------------------------------------------------------
      // scb_account_links — SCB Light cross-app account linking
      // ----------------------------------------------------------
      scb_account_links: {
        Row: {
          dimarket_user_id: string
          scb_user_id: string | null
          email: string
          status: 'provisioned' | 'existing_email' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          dimarket_user_id: string
          scb_user_id?: string | null
          email: string
          status?: 'provisioned' | 'existing_email' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          dimarket_user_id?: string
          scb_user_id?: string | null
          email?: string
          status?: 'provisioned' | 'existing_email' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scb_account_links_dimarket_user_id_fkey"
            columns: ["dimarket_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }

      geo_catalog: {
        Row: {
          id: number
          country: string
          region: string
          city: string
          sort_order: number
        }
        Insert: {
          id?: number
          country: string
          region?: string
          city: string
          sort_order?: number
        }
        Update: {
          id?: number
          country?: string
          region?: string
          city?: string
          sort_order?: number
        }
        Relationships: []
      }

      ai_matches: {
        Row: {
          id: string
          user_id: string | null
          listing_id: string | null
          criteria: Json
          matches: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          listing_id?: string | null
          criteria?: Json
          matches?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          listing_id?: string | null
          criteria?: Json
          matches?: Json
          created_at?: string
        }
        Relationships: []
      }

      pro_performance_profiles: {
        Row: {
          professional_id: string
          jobs_completed: number
          avg_quote_total: number | null
          avg_duration_days: number | null
          on_time_rate: number | null
          satisfaction_rate: number | null
          return_rate: number | null
          recommend_rate: number | null
          specialty_slugs: string[] | null
          last_computed_at: string | null
          updated_at: string
        }
        Insert: {
          professional_id: string
          jobs_completed?: number
          avg_quote_total?: number | null
          avg_duration_days?: number | null
          on_time_rate?: number | null
          satisfaction_rate?: number | null
          return_rate?: number | null
          recommend_rate?: number | null
          specialty_slugs?: string[] | null
          last_computed_at?: string | null
          updated_at?: string
        }
        Update: {
          professional_id?: string
          jobs_completed?: number
          avg_quote_total?: number | null
          avg_duration_days?: number | null
          on_time_rate?: number | null
          satisfaction_rate?: number | null
          return_rate?: number | null
          recommend_rate?: number | null
          specialty_slugs?: string[] | null
          last_computed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_performance_profiles_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      active_geo: {
        Row: {
          country: string | null
          region: string | null
          city: string | null
          user_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      consume_lead_credit: {
        Args: {
          p_user_id: string
          p_amount?: number
          p_reason?: string
          p_reference_id?: string | null
        }
        Returns: number
      }
      admin_list_subscriptions: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          user_id: string
          full_name: string | null
          plan_id: string
          billing_interval: string
          status: string
          stripe_subscription_id: string | null
          current_period_end: string | null
          lead_credits: number
          created_at: string
        }[]
      }
      grant_lead_credits: {
        Args: {
          p_user_id: string
          p_amount: number
          p_reason: string
          p_reference_id?: string | null
          p_payment_id?: string | null
        }
        Returns: number
      }
      register_app_visit: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_geo_location: {
        Args: {
          p_country: string
          p_region: string
          p_city: string
        }
        Returns: undefined
      }
      get_public_footer_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_telegram_link_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      track_ad_impression: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      track_ad_click: {
        Args: { campaign_id: string }
        Returns: undefined
      }
      refresh_profile_rating: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
      upsert_pro_performance_profile: {
        Args: {
          p_professional_id: string
          p_jobs_completed: number
          p_avg_quote_total?: number | null
          p_avg_duration_days?: number | null
          p_on_time_rate?: number | null
          p_satisfaction_rate?: number | null
          p_return_rate?: number | null
          p_recommend_rate?: number | null
          p_specialty_slugs: string[]
        }
        Returns: undefined
      }
      notify_job_match_professionals: {
        Args: {
          p_listing_id: string
          p_profile_ids: string[]
        }
        Returns: number
      }
      owner_delete_commercial_entity: {
        Args: {
          p_kind: string
          p_id: string
          p_delete_auth?: boolean
        }
        Returns: Json
      }
      ensure_conversation: {
        Args: {
          p_other_user_id: string
          p_listing_id?: string | null
        }
        Returns: string
      }
      ensure_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      apply_referral_code: {
        Args: {
          p_code: string
          p_referred_user_id: string
        }
        Returns: boolean
      }
      get_professional_booking_availability: {
        Args: {
          p_professional_id: string
          p_from: string
          p_to: string
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_type: string
          p_title: string
          p_body: string
          p_link_path?: string | null
          p_reference_type?: string | null
          p_reference_id?: string | null
        }
        Returns: string
      }
      record_profile_view: {
        Args: { p_profile_id: string }
        Returns: number
      }
      admin_boost_master_rating: {
        Args: {
          search_name: string
          stars?: number
        }
        Returns: Json
      }
      admin_verify_master: {
        Args: {
          search_name: string
          verified?: boolean
        }
        Returns: Json
      }
      admin_top_masters: {
        Args: { p_limit?: number }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// ALIAS-ТИПИ — короткі імена для зручності
// ============================================================
export type Category            = Database['public']['Tables']['categories']['Row']
export type Profile             = Database['public']['Tables']['profiles']['Row']
export type Listing             = Database['public']['Tables']['listings']['Row']
export type ListingImage        = Database['public']['Tables']['listing_images']['Row']
export type PortfolioItem       = Database['public']['Tables']['portfolio_items']['Row']
export type Review              = Database['public']['Tables']['reviews']['Row']
export type Message             = Database['public']['Tables']['messages']['Row']
export type AdCampaign          = Database['public']['Tables']['ad_campaigns']['Row']
export type FeedbackMessage     = Database['public']['Tables']['feedback_messages']['Row']
export type AppSiteStats        = Database['public']['Tables']['app_site_stats']['Row']
export type SavedItem           = Database['public']['Tables']['saved_items']['Row']
export type Payment             = Database['public']['Tables']['payments']['Row']
export type Announcement        = Database['public']['Tables']['announcements']['Row']
export type ProjectFile         = Database['public']['Tables']['project_files']['Row']
export type ProjectApplication  = Database['public']['Tables']['project_applications']['Row']
export type Quote               = Database['public']['Tables']['quotes']['Row']
export type ManufacturerProfile = Database['public']['Tables']['manufacturer_profiles']['Row']
export type AgentProfileRow     = Database['public']['Tables']['agent_profiles']['Row']
export type Booking             = Database['public']['Tables']['bookings']['Row']
export type DbConversation      = Database['public']['Tables']['conversations']['Row']
export type AppNotificationRow  = Database['public']['Tables']['notifications']['Row']
export type ReferralCode        = Database['public']['Tables']['referral_codes']['Row']
export type ScbAccountLink      = Database['public']['Tables']['scb_account_links']['Row']
export type VerificationLevel   = Profile['verification_level']

// ============================================================
// РОЗШИРЕНІ ТИПИ — для UI з join-ами
// ============================================================

// Оголошення з фото та категорією — для карток у каталозі
export interface ListingWithImages extends Listing {
  images: ListingImage[]
  category?: Category
}

// Профіль з портфоліо — для сторінки майстра
export interface ProfileWithPortfolio extends Profile {
  portfolio_items: PortfolioItem[]
}

// Збережений елемент з деталями — для сторінки Favorites
export interface SavedListing extends SavedItem {
  listing?: ListingWithImages
}

export interface SavedProfile extends SavedItem {
  profile?: Profile
}

// Розмова (чат) — групує повідомлення по conversation_id
export interface Conversation {
  conversation_id: string
  listing_id: string | null
  other_user_id: string
  other_user_name: string | null
  last_message: string
  last_message_at: string
  unread_count: number
}

// Тип елемента рейтингу країн для статистики
export interface CountryRankingItem {
  country: string
  score: number
  professionals: number
  listings: number
  responses: number
}

// ============================================================
// ТИПИ МОНЕТИЗАЦІЇ
// ============================================================

// Пакети для платного просування
export type BoostPackage = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  duration_days: number
  type: 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost'
}

// ============================================================
// КОНСТАНТИ — валюти та мови
// ============================================================

// Популярні валюти світу
export const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'CHF', symbol: '₣',  name: 'Swiss Franc' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'UAH', symbol: '₴',  name: 'Ukrainian Hryvnia' },
  { code: 'RUB', symbol: '₽',  name: 'Russian Ruble' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'RON', symbol: 'lei',name: 'Romanian Leu' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'KZT', symbol: '₸',  name: 'Kazakhstani Tenge' },
  { code: 'AED', symbol: 'د.إ',name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const

// 25 мов інтерфейсу
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'uk', name: 'Українська' },
  { code: 'ru', name: 'Русский' },
  { code: 'pl', name: 'Polski' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ro', name: 'Română' },
  { code: 'cs', name: 'Čeština' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'hu', name: 'Magyar' },
  { code: 'bg', name: 'Български' },
  { code: 'sr', name: 'Српски' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'et', name: 'Eesti' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'kk', name: 'Қазақша' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
] as const