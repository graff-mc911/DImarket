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

          created_at: string
          updated_at: string
          trust_score: number | null
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
          created_at?: string
          updated_at?: string
          trust_score?: number | null
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
          created_at?: string
          updated_at?: string
          trust_score?: number | null
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          created_at: string
          delivery_status: string | null
          attachment_count: number | null
          typing_user_id: string | null
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
          created_at?: string
          delivery_status?: string | null
          attachment_count?: number | null
          typing_user_id?: string | null
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
          created_at?: string
          delivery_status?: string | null
          attachment_count?: number | null
          typing_user_id?: string | null
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
          geo_scope: 'city' | 'region' | 'country' | 'countries' | 'regions' | 'global'
          country_code: string | null
          country_name: string | null
          region_name: string | null
          city_name: string | null
          countries: string[] | null
          cities: string[] | null

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
          slot_media: Json
          regions: string[] | null
          manufacturer_profile_id: string | null
          agent_profile_id: string | null
          target_categories: string[]
          media_style: Json | null
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
          geo_scope: 'city' | 'region' | 'country' | 'countries' | 'regions' | 'global'
          country_code?: string | null
          country_name?: string | null
          region_name?: string | null
          city_name?: string | null
          countries?: string[] | null
          cities?: string[] | null
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
          slot_media?: Json
          regions?: string[] | null
          manufacturer_profile_id?: string | null
          agent_profile_id?: string | null
          target_categories?: string[]
          media_style?: Json | null
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
          geo_scope?: 'city' | 'region' | 'country' | 'countries' | 'regions' | 'global'
          country_code?: string | null
          country_name?: string | null
          region_name?: string | null
          city_name?: string | null
          countries?: string[] | null
          cities?: string[] | null
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
          slot_media?: Json
          regions?: string[] | null
          manufacturer_profile_id?: string | null
          agent_profile_id?: string | null
          target_categories?: string[]
          media_style?: Json | null
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
        Relationships: []
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

      ad_image_assets: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string
          file_size_bytes: number
          id: string
          mime_type: string
          original_path: string
          original_url: string
          status: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string
          created_at?: string
          error_message?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          original_path?: string
          original_url?: string
          status?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string | null
          mime_type?: string | null
          original_path?: string | null
          original_url?: string | null
          status?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      ad_image_variants: {
        Row: {
          asset_id: string
          created_at: string
          height: number
          id: string
          public_url: string
          storage_path: string
          variant_key: Json
          width: number
        }
        Insert: {
          asset_id?: string
          created_at?: string
          height?: number
          id?: string
          public_url?: string
          storage_path?: string
          variant_key?: Json
          width?: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string | null
          height?: number | null
          id?: string | null
          public_url?: string | null
          storage_path?: string | null
          variant_key?: Json | null
          width?: number | null
        }
        Relationships: []
      }

      agent_invitations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          manufacturer_id: string
          message: string
          opportunity_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string
          created_at?: string
          id?: string
          manufacturer_id?: string
          message?: string
          opportunity_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string | null
          manufacturer_id?: string | null
          message?: string | null
          opportunity_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      agent_profiles: {
        Row: {
          available_for_new_brands: boolean | null
          categories: Json
          city: Json | null
          client_types: Json
          company_name: Json | null
          country: Json | null
          created_at: string | null
          current_manufacturers: Json
          description: string | null
          full_name: string | null
          id: string | null
          industries: Json
          is_published: boolean | null
          languages: Json
          linkedin_url: Json | null
          portfolio_urls: Json
          preferred_commission: Json | null
          previous_experience: Json | null
          profile_id: string | null
          profile_photo_url: Json | null
          public_email: Json | null
          public_phone: Json | null
          representation_type: Json | null
          service_regions: Json
          show_public_contacts: boolean | null
          slug: string | null
          territory: Json | null
          updated_at: string | null
          verification_status: string | null
          website: Json | null
          years_experience: Json | null
        }
        Insert: {
          available_for_new_brands?: boolean | null
          categories?: Json
          city?: Json | null
          client_types?: Json
          company_name?: Json | null
          country?: Json | null
          created_at?: string | null
          current_manufacturers?: Json
          description?: string | null
          full_name?: string | null
          id?: string | null
          industries?: Json
          is_published?: boolean | null
          languages?: Json
          linkedin_url?: Json | null
          portfolio_urls?: Json
          preferred_commission?: Json | null
          previous_experience?: Json | null
          profile_id?: string | null
          profile_photo_url?: Json | null
          public_email?: Json | null
          public_phone?: Json | null
          representation_type?: Json | null
          service_regions?: Json
          show_public_contacts?: boolean | null
          slug?: string | null
          territory?: Json | null
          updated_at?: string | null
          verification_status?: string | null
          website?: Json | null
          years_experience?: Json | null
        }
        Update: {
          available_for_new_brands?: boolean | null
          categories?: Json | null
          city?: Json | null
          client_types?: Json | null
          company_name?: Json | null
          country?: Json | null
          created_at?: string | null
          current_manufacturers?: Json | null
          description?: string | null
          full_name?: string | null
          id?: string | null
          industries?: Json | null
          is_published?: boolean | null
          languages?: Json | null
          linkedin_url?: Json | null
          portfolio_urls?: Json | null
          preferred_commission?: Json | null
          previous_experience?: Json | null
          profile_id?: string | null
          profile_photo_url?: Json | null
          public_email?: Json | null
          public_phone?: Json | null
          representation_type?: Json | null
          service_regions?: Json | null
          show_public_contacts?: boolean | null
          slug?: string | null
          territory?: Json | null
          updated_at?: string | null
          verification_status?: string | null
          website?: Json | null
          years_experience?: Json | null
        }
        Relationships: []
      }

      ai_fraud_reports: {
        Row: {
          created_at: string
          details: Json
          flags: string[]
          id: string
          moderation_status: string
          reporter_id: string
          risk_score: number
          target_id: string
          target_type: string
          trust_score: number
        }
        Insert: {
          created_at?: string
          details?: Json
          flags?: string[]
          id?: string
          moderation_status?: string
          reporter_id?: string
          risk_score?: number
          target_id?: string
          target_type?: string
          trust_score?: number
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          flags?: string[] | null
          id?: string | null
          moderation_status?: string | null
          reporter_id?: string | null
          risk_score?: number | null
          target_id?: string | null
          target_type?: string | null
          trust_score?: number | null
        }
        Relationships: []
      }

      ai_generated_jobs: {
        Row: {
          created_at: string
          description: string
          draft: Json
          id: string
          listing_id: string
          published_at: string
          session_id: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          draft?: Json
          id?: string
          listing_id?: string
          published_at?: string
          session_id?: string
          title?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          draft?: Json | null
          id?: string | null
          listing_id?: string | null
          published_at?: string | null
          session_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      ai_job_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          meta: Json
          role: string
          session_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          meta?: Json
          role?: string
          session_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          meta?: Json | null
          role?: string | null
          session_id?: string | null
        }
        Relationships: []
      }

      ai_job_sessions: {
        Row: {
          created_at: string
          draft: Json
          extracted: Json
          id: string
          listing_id: string | null
          locale: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          draft?: Json
          extracted?: Json
          id?: string
          listing_id?: string | null
          locale?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          draft?: Json | null
          extracted?: Json | null
          id?: string | null
          listing_id?: string | null
          locale?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      ai_matches: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          listing_id: string
          matches: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          listing_id?: string
          matches?: Json
          user_id?: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          id?: string | null
          listing_id?: string | null
          matches?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }

      booking_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          id: string
          professional_id: string
          reason: string | null
        }
        Insert: {
          blocked_date?: string
          created_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string | null
          created_at?: string | null
          id?: string | null
          professional_id?: string | null
          reason?: string | null
        }
        Relationships: []
      }

      bookings: {
        Row: {
          client_id: string
          created_at: string
          customer_email: string
          customer_id: string
          customer_name: string
          customer_phone: string
          ends_at: string
          google_event_id: string
          id: string
          listing_id: string | null
          notes: string | null
          professional_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string
          created_at?: string
          customer_email?: string
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          ends_at?: string
          google_event_id?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          professional_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          ends_at?: string | null
          google_event_id?: string | null
          id?: string | null
          listing_id?: string | null
          notes?: string | null
          professional_id?: string | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      commercial_analytics_events: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_name: string
          id: string
          meta: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string
          id?: string
          meta?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_name?: string | null
          id?: string | null
          meta?: Json | null
        }
        Relationships: []
      }

      commercial_entity_reports: {
        Row: {
          created_at: string
          details: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          reason?: string | null
          reporter_id?: string | null
          status?: string | null
        }
        Relationships: []
      }

      contractor_verifications: {
        Row: {
          business_name: string
          created_at: string
          id: string
          insurance_ref: string
          profile_id: string
          review_notes: string
          reviewed_at: string
          reviewer_id: string
          status: string
          submitted_at: string
          trade_license_ref: string
          trust_score: number
          updated_at: string
          vat_number: string
        }
        Insert: {
          business_name?: string
          created_at?: string
          id?: string
          insurance_ref?: string
          profile_id?: string
          review_notes?: string
          reviewed_at?: string
          reviewer_id?: string
          status?: string
          submitted_at?: string
          trade_license_ref?: string
          trust_score?: number
          updated_at?: string
          vat_number?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string | null
          id?: string | null
          insurance_ref?: string | null
          profile_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submitted_at?: string | null
          trade_license_ref?: string | null
          trust_score?: number | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }

      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string
          listing_id: string | null
          participant_a: string
          participant_b: string
          typing_at: string | null
          typing_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string
          listing_id?: string | null
          participant_a?: string
          participant_b?: string
          typing_at?: string | null
          typing_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          participant_a?: string | null
          participant_b?: string | null
          typing_at?: string | null
          typing_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      cost_estimate_outcomes: {
        Row: {
          actual_total: number
          area_sqm: number
          consented: boolean
          cost_estimate_id: string
          country: string
          created_at: string
          currency: string
          estimated_standard: number
          id: string
          project_type: string
          region: string
          user_id: string
        }
        Insert: {
          actual_total?: number
          area_sqm?: number
          consented?: boolean
          cost_estimate_id?: string
          country?: string
          created_at?: string
          currency?: string
          estimated_standard?: number
          id?: string
          project_type?: string
          region?: string
          user_id?: string
        }
        Update: {
          actual_total?: number | null
          area_sqm?: number | null
          consented?: boolean | null
          cost_estimate_id?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          estimated_standard?: number | null
          id?: string | null
          project_type?: string | null
          region?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      cost_estimates: {
        Row: {
          area_sqm: number
          confidence: number
          created_at: string
          currency: string
          estimate_json: Json
          id: string
          input_json: Json
          listing_id: string
          location_label: string
          project_type: string
          title: string
          total_economy: number
          total_premium: number
          total_standard: number
          updated_at: string
          user_id: string
        }
        Insert: {
          area_sqm?: number
          confidence?: number
          created_at?: string
          currency?: string
          estimate_json?: Json
          id?: string
          input_json?: Json
          listing_id?: string
          location_label?: string
          project_type?: string
          title?: string
          total_economy?: number
          total_premium?: number
          total_standard?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          area_sqm?: number | null
          confidence?: number | null
          created_at?: string | null
          currency?: string | null
          estimate_json?: Json | null
          id?: string | null
          input_json?: Json | null
          listing_id?: string | null
          location_label?: string | null
          project_type?: string | null
          title?: string | null
          total_economy?: number | null
          total_premium?: number | null
          total_standard?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      document_versions: {
        Row: {
          body_html: Json | null
          body_markdown: string | null
          change_summary: string | null
          created_at: string | null
          document_id: string | null
          effective_from: string | null
          effective_until: Json | null
          id: string | null
          metadata: Json
          published_at: string | null
          source_hash: Json | null
          source_id: string | null
          source_url: string | null
          source_version: Json | null
          status: string | null
          title: string | null
          verified_at: Json | null
          verified_by: Json | null
          version_number: string | null
        }
        Insert: {
          body_html?: Json | null
          body_markdown?: string | null
          change_summary?: string | null
          created_at?: string | null
          document_id?: string | null
          effective_from?: string | null
          effective_until?: Json | null
          id?: string | null
          metadata?: Json
          published_at?: string | null
          source_hash?: Json | null
          source_id?: string | null
          source_url?: string | null
          source_version?: Json | null
          status?: string | null
          title?: string | null
          verified_at?: Json | null
          verified_by?: Json | null
          version_number?: string | null
        }
        Update: {
          body_html?: Json | null
          body_markdown?: string | null
          change_summary?: string | null
          created_at?: string | null
          document_id?: string | null
          effective_from?: string | null
          effective_until?: Json | null
          id?: string | null
          metadata?: Json | null
          published_at?: string | null
          source_hash?: Json | null
          source_id?: string | null
          source_url?: string | null
          source_version?: Json | null
          status?: string | null
          title?: string | null
          verified_at?: Json | null
          verified_by?: Json | null
          version_number?: string | null
        }
        Relationships: []
      }

      geo_catalog: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          region: string | null
          sort_order: number
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          region?: string | null
          sort_order?: number
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          region?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }

      active_geo: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          region: string | null
          sort_order: number
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          region?: string | null
          sort_order?: number
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          region?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }

      google_calendar_connections: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          connected_at: string
          created_at: string
          expires_at: string | null
          id: string
          profile_id: string
          refresh_token: string | null
          scope: string
          token_expiry: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          connected_at?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          profile_id?: string
          refresh_token?: string | null
          scope?: string
          token_expiry?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          connected_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string | null
          profile_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      homepage_metrics: {
        Row: {
          key: string | null
          updated_at: string | null
          value_num: number | null
          value_text: Json | null
        }
        Insert: {
          key?: string | null
          updated_at?: string | null
          value_num?: number | null
          value_text?: Json | null
        }
        Update: {
          key?: string | null
          updated_at?: string | null
          value_num?: number | null
          value_text?: Json | null
        }
        Relationships: []
      }

      legal_documents: {
        Row: {
          country_code: string | null
          created_at: string | null
          current_version_id: string | null
          doc_key: string | null
          doc_kind: string | null
          id: string | null
          is_published: boolean | null
          jurisdiction: string | null
          last_verified_at: string | null
          metadata: Json
          next_verification_at: string | null
          primary_source_id: string | null
          region: Json | null
          title: string | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          current_version_id?: string | null
          doc_key?: string | null
          doc_kind?: string | null
          id?: string | null
          is_published?: boolean | null
          jurisdiction?: string | null
          last_verified_at?: string | null
          metadata?: Json
          next_verification_at?: string | null
          primary_source_id?: string | null
          region?: Json | null
          title?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          current_version_id?: string | null
          doc_key?: string | null
          doc_kind?: string | null
          id?: string | null
          is_published?: boolean | null
          jurisdiction?: string | null
          last_verified_at?: string | null
          metadata?: Json | null
          next_verification_at?: string | null
          primary_source_id?: string | null
          region?: Json | null
          title?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }

      manufacturer_products: {
        Row: {
          brand: string | null
          catalogue_url: Json | null
          category: string | null
          countries_available: Json
          created_at: string | null
          description: string | null
          document_urls: Json
          id: string | null
          image_urls: Json
          is_published: boolean | null
          manufacturer_id: string | null
          name: string | null
          sort_order: number | null
          specifications: Json
          subcategory: Json | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          catalogue_url?: Json | null
          category?: string | null
          countries_available?: Json
          created_at?: string | null
          description?: string | null
          document_urls?: Json
          id?: string | null
          image_urls?: Json
          is_published?: boolean | null
          manufacturer_id?: string | null
          name?: string | null
          sort_order?: number | null
          specifications?: Json
          subcategory?: Json | null
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          catalogue_url?: Json | null
          category?: string | null
          countries_available?: Json | null
          created_at?: string | null
          description?: string | null
          document_urls?: Json | null
          id?: string | null
          image_urls?: Json | null
          is_published?: boolean | null
          manufacturer_id?: string | null
          name?: string | null
          sort_order?: number | null
          specifications?: Json | null
          subcategory?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }

      manufacturer_profiles: {
        Row: {
          agent_required: boolean | null
          catalog_url: Json | null
          categories: Json
          certifications: Json
          commission_max: Json | null
          commission_min: Json | null
          commission_model: Json | null
          company_name: string | null
          company_size: Json | null
          contact_person: Json | null
          countries_available: Json
          country: string | null
          created_at: string | null
          description: string | null
          distributor_available: boolean | null
          exclusive_representation: boolean | null
          founded_year: Json | null
          headquarters: string | null
          id: string | null
          images: Json
          is_published: boolean | null
          languages: Json
          logo_url: string | null
          minimum_experience_years: Json | null
          non_exclusive_representation: boolean | null
          products: Json
          profile_id: string | null
          public_email: string | null
          public_phone: Json | null
          required_experience: Json | null
          show_public_contacts: boolean | null
          slug: string | null
          target_markets: Json
          updated_at: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          agent_required?: boolean | null
          catalog_url?: Json | null
          categories?: Json
          certifications?: Json
          commission_max?: Json | null
          commission_min?: Json | null
          commission_model?: Json | null
          company_name?: string | null
          company_size?: Json | null
          contact_person?: Json | null
          countries_available?: Json
          country?: string | null
          created_at?: string | null
          description?: string | null
          distributor_available?: boolean | null
          exclusive_representation?: boolean | null
          founded_year?: Json | null
          headquarters?: string | null
          id?: string | null
          images?: Json
          is_published?: boolean | null
          languages?: Json
          logo_url?: string | null
          minimum_experience_years?: Json | null
          non_exclusive_representation?: boolean | null
          products?: Json
          profile_id?: string | null
          public_email?: string | null
          public_phone?: Json | null
          required_experience?: Json | null
          show_public_contacts?: boolean | null
          slug?: string | null
          target_markets?: Json
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          agent_required?: boolean | null
          catalog_url?: Json | null
          categories?: Json | null
          certifications?: Json | null
          commission_max?: Json | null
          commission_min?: Json | null
          commission_model?: Json | null
          company_name?: string | null
          company_size?: Json | null
          contact_person?: Json | null
          countries_available?: Json | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          distributor_available?: boolean | null
          exclusive_representation?: boolean | null
          founded_year?: Json | null
          headquarters?: string | null
          id?: string | null
          images?: Json | null
          is_published?: boolean | null
          languages?: Json | null
          logo_url?: string | null
          minimum_experience_years?: Json | null
          non_exclusive_representation?: boolean | null
          products?: Json | null
          profile_id?: string | null
          public_email?: string | null
          public_phone?: Json | null
          required_experience?: Json | null
          show_public_contacts?: boolean | null
          slug?: string | null
          target_markets?: Json | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }

      match_scores: {
        Row: {
          contractor_id: string
          created_at: string
          id: string
          listing_id: string
          rank_position: number
          reasons: string[]
          score: number
        }
        Insert: {
          contractor_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          rank_position?: number
          reasons?: string[]
          score?: number
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          id?: string | null
          listing_id?: string | null
          rank_position?: number | null
          reasons?: string[] | null
          score?: number | null
        }
        Relationships: []
      }

      media: {
        Row: {
          created_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          id?: string | null
        }
        Relationships: []
      }

      message_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          file_name: string | null
          file_size_bytes: number
          id: string
          message_id: string
          mime_type: string | null
          public_url: string
          storage_path: string
        }
        Insert: {
          attachment_type?: string
          created_at?: string
          file_name?: string | null
          file_size_bytes?: number
          id?: string
          message_id?: string
          mime_type?: string | null
          public_url?: string
          storage_path?: string
        }
        Update: {
          attachment_type?: string | null
          created_at?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string | null
          message_id?: string | null
          mime_type?: string | null
          public_url?: string | null
          storage_path?: string | null
        }
        Relationships: []
      }

      notification_tokens: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          platform: string | null
          token: string
          updated_at: string
          user_agent: string
          user_id: string
        }
        Insert: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string | null
          token?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Update: {
          auth?: string | null
          created_at?: string | null
          endpoint?: string | null
          id?: string | null
          p256dh?: string | null
          platform?: string | null
          token?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          email_sent: boolean
          id: string
          is_read: boolean
          link: string | null
          link_path: string
          push_sent: boolean
          read_at: string | null
          reference_id: string
          reference_type: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          email_sent?: boolean
          id?: string
          is_read?: boolean
          link?: string | null
          link_path?: string
          push_sent?: boolean
          read_at?: string | null
          reference_id?: string
          reference_type?: string
          title?: string
          type?: string
          user_id?: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          email_sent?: boolean | null
          id?: string | null
          is_read?: boolean | null
          link?: string | null
          link_path?: string | null
          push_sent?: boolean | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      official_sources: {
        Row: {
          check_interval_hours: number | null
          content_status: string | null
          country_code: string | null
          created_at: string | null
          http_status: Json | null
          id: string | null
          is_active: boolean | null
          jurisdiction: string | null
          last_changed_at: Json | null
          last_checked_at: Json | null
          last_success_at: Json | null
          metadata: Json
          next_verification_at: string | null
          official_domain: string | null
          region: Json | null
          source_hash: Json | null
          source_key: string | null
          source_name: string | null
          source_type: string | null
          source_url: string | null
          source_version: Json | null
          trust_tier: string | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          check_interval_hours?: number | null
          content_status?: string | null
          country_code?: string | null
          created_at?: string | null
          http_status?: Json | null
          id?: string | null
          is_active?: boolean | null
          jurisdiction?: string | null
          last_changed_at?: Json | null
          last_checked_at?: Json | null
          last_success_at?: Json | null
          metadata?: Json
          next_verification_at?: string | null
          official_domain?: string | null
          region?: Json | null
          source_hash?: Json | null
          source_key?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
          source_version?: Json | null
          trust_tier?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          check_interval_hours?: number | null
          content_status?: string | null
          country_code?: string | null
          created_at?: string | null
          http_status?: Json | null
          id?: string | null
          is_active?: boolean | null
          jurisdiction?: string | null
          last_changed_at?: Json | null
          last_checked_at?: Json | null
          last_success_at?: Json | null
          metadata?: Json | null
          next_verification_at?: string | null
          official_domain?: string | null
          region?: Json | null
          source_hash?: Json | null
          source_key?: string | null
          source_name?: string | null
          source_type?: string | null
          source_url?: string | null
          source_version?: Json | null
          trust_tier?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }

      pro_performance_profiles: {
        Row: {
          avg_duration_days: number
          avg_quote_total: number
          jobs_completed: number
          last_computed_at: string
          on_time_rate: number
          professional_id: string
          recommend_rate: number
          return_rate: number
          satisfaction_rate: number
          specialty_slugs: string[]
          updated_at: string
        }
        Insert: {
          avg_duration_days?: number
          avg_quote_total?: number
          jobs_completed?: number
          last_computed_at?: string
          on_time_rate?: number
          professional_id?: string
          recommend_rate?: number
          return_rate?: number
          satisfaction_rate?: number
          specialty_slugs?: string[]
          updated_at?: string
        }
        Update: {
          avg_duration_days?: number | null
          avg_quote_total?: number | null
          jobs_completed?: number | null
          last_computed_at?: string | null
          on_time_rate?: number | null
          professional_id?: string | null
          recommend_rate?: number | null
          return_rate?: number | null
          satisfaction_rate?: number | null
          specialty_slugs?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }

      project_documents: {
        Row: {
          amount: number
          body_html: string
          created_at: string
          created_by: string
          currency: string
          doc_type: string
          id: string
          listing_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          body_html?: string
          created_at?: string
          created_by?: string
          currency?: string
          doc_type?: string
          id?: string
          listing_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          body_html?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          doc_type?: string | null
          id?: string | null
          listing_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      project_media: {
        Row: {
          caption: string
          created_at: string
          id: string
          listing_id: string
          milestone_id: string
          phase: string
          storage_path: string
          uploaded_by: string
          url: string
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          listing_id?: string
          milestone_id?: string
          phase?: string
          storage_path?: string
          uploaded_by?: string
          url?: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string | null
          listing_id?: string | null
          milestone_id?: string | null
          phase?: string | null
          storage_path?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: []
      }

      project_milestones: {
        Row: {
          completed_at: string
          created_at: string
          due_at: string
          id: string
          label: string
          labor_hours: number
          listing_id: string
          notes: string
          reminder_sent_at: string
          sort_order: number
          status: string
          trade_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          due_at?: string
          id?: string
          label?: string
          labor_hours?: number
          listing_id?: string
          notes?: string
          reminder_sent_at?: string
          sort_order?: number
          status?: string
          trade_id?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_at?: string | null
          id?: string | null
          label?: string | null
          labor_hours?: number | null
          listing_id?: string | null
          notes?: string | null
          reminder_sent_at?: string | null
          sort_order?: number | null
          status?: string | null
          trade_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      project_procurement_items: {
        Row: {
          category: string
          chosen_listing_id: string
          chosen_price: number
          cost_estimate_id: string
          created_at: string
          delivery_estimate: string
          id: string
          listing_id: string
          material_name: string
          quantity: number
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string
          chosen_listing_id?: string
          chosen_price?: number
          cost_estimate_id?: string
          created_at?: string
          delivery_estimate?: string
          id?: string
          listing_id?: string
          material_name?: string
          quantity?: number
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          chosen_listing_id?: string | null
          chosen_price?: number | null
          cost_estimate_id?: string | null
          created_at?: string | null
          delivery_estimate?: string | null
          id?: string | null
          listing_id?: string | null
          material_name?: string | null
          quantity?: number | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      referral_redemptions: {
        Row: {
          code_id: string
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          code_id?: string
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Update: {
          code_id?: string | null
          created_at?: string | null
          id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
        }
        Relationships: []
      }

      representation_applications: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          manufacturer_id: string
          message: string
          opportunity_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string
          created_at?: string
          id?: string
          manufacturer_id?: string
          message?: string
          opportunity_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string | null
          manufacturer_id?: string | null
          message?: string | null
          opportunity_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      representation_opportunities: {
        Row: {
          application_deadline: string
          category: string
          commission_range: string
          commission_type: string
          contract_type: string
          created_at: string
          description: string
          exclusive: boolean
          id: string
          manufacturer_id: string
          minimum_requirements: string
          products: string[]
          remote_possible: boolean
          required_experience: string
          required_languages: string[]
          status: string
          target_country: string
          target_customer_types: string[]
          target_regions: string[]
          title: string
          travel_required: boolean
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          category?: string | null
          commission_range?: string | null
          commission_type?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string
          exclusive?: boolean
          id?: string
          manufacturer_id?: string
          minimum_requirements?: string | null
          products?: string[]
          remote_possible?: boolean
          required_experience?: string | null
          required_languages?: string[]
          status?: string
          target_country?: string | null
          target_customer_types?: string[]
          target_regions?: string[]
          title?: string
          travel_required?: boolean
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          category?: string | null
          commission_range?: string | null
          commission_type?: string | null
          contract_type?: string | null
          created_at?: string | null
          description?: string | null
          exclusive?: boolean | null
          id?: string | null
          manufacturer_id?: string | null
          minimum_requirements?: string | null
          products?: string[] | null
          remote_possible?: boolean | null
          required_experience?: string | null
          required_languages?: string[] | null
          status?: string | null
          target_country?: string | null
          target_customer_types?: string[] | null
          target_regions?: string[] | null
          title?: string | null
          travel_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }

      review_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          status?: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string | null
          reason?: string | null
          reporter_id?: string | null
          review_id?: string | null
          status?: string | null
        }
        Relationships: []
      }

      scb_account_links: {
        Row: {
          created_at: string
          dimarket_user_id: string
          email: string
          error_message: string
          scb_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimarket_user_id?: string
          email?: string
          error_message?: string
          scb_user_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          dimarket_user_id?: string | null
          email?: string | null
          error_message?: string | null
          scb_user_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      source_changes: {
        Row: {
          affected_document_ids: string[]
          change_summary: string
          change_type: string
          created_at: string
          detected_at: string
          id: string
          new_excerpt: string
          new_hash: string
          old_excerpt: string
          old_hash: string
          review_notes: string
          reviewed_at: string
          reviewed_by: string
          severity: string
          source_id: string
          status: string
          webhook_alert_sent_at: string
        }
        Insert: {
          affected_document_ids?: string[]
          change_summary?: string
          change_type?: string
          created_at?: string
          detected_at?: string
          id?: string
          new_excerpt?: string
          new_hash?: string
          old_excerpt?: string
          old_hash?: string
          review_notes?: string
          reviewed_at?: string
          reviewed_by?: string
          severity?: string
          source_id?: string
          status?: string
          webhook_alert_sent_at?: string
        }
        Update: {
          affected_document_ids?: string[] | null
          change_summary?: string | null
          change_type?: string | null
          created_at?: string | null
          detected_at?: string | null
          id?: string | null
          new_excerpt?: string | null
          new_hash?: string | null
          old_excerpt?: string | null
          old_hash?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          source_id?: string | null
          status?: string | null
          webhook_alert_sent_at?: string | null
        }
        Relationships: []
      }

      verification_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          id: string
          mime_type: string
          public_url: string
          storage_path: string
          verification_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_name?: string
          id?: string
          mime_type?: string
          public_url?: string
          storage_path?: string
          verification_id?: string
        }
        Update: {
          created_at?: string | null
          doc_type?: string | null
          file_name?: string | null
          id?: string | null
          mime_type?: string | null
          public_url?: string | null
          storage_path?: string | null
          verification_id?: string | null
        }
        Relationships: []
      }

      verification_reviews: {
        Row: {
          action: string
          created_at: string
          id: string
          notes: string
          reviewer_id: string
          verification_id: string
        }
        Insert: {
          action?: string
          created_at?: string
          id?: string
          notes?: string | null
          reviewer_id?: string
          verification_id?: string
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          notes?: string | null
          reviewer_id?: string | null
          verification_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      admin_analytics_series: { Args: Record<string, unknown>; Returns: Json }
      admin_boost_master_rating: { Args: Record<string, unknown>; Returns: Json }
      admin_top_masters: { Args: Record<string, unknown>; Returns: Json }
      admin_verify_master: { Args: Record<string, unknown>; Returns: Json }
      apply_referral_code: { Args: Record<string, unknown>; Returns: Json }
      create_notification: { Args: Record<string, unknown>; Returns: Json }
      ensure_conversation: { Args: Record<string, unknown>; Returns: Json }
      ensure_referral_code: { Args: Record<string, unknown>; Returns: Json }
      ensure_telegram_link_code: { Args: Record<string, unknown>; Returns: Json }
      get_homepage_metrics: { Args: Record<string, unknown>; Returns: Json }
      get_marketplace_category_page: { Args: Record<string, unknown>; Returns: Json }
      get_marketplace_main_categories: { Args: Record<string, unknown>; Returns: Json }
      get_professional_booking_availability: { Args: Record<string, unknown>; Returns: Json }
      get_public_footer_stats: { Args: Record<string, unknown>; Returns: Json }
      notify_job_match_professionals: { Args: Record<string, unknown>; Returns: Json }
      pro_analytics_series: { Args: Record<string, unknown>; Returns: Json }
      record_profile_view: { Args: Record<string, unknown>; Returns: Json }
      refresh_profile_rating: { Args: Record<string, unknown>; Returns: Json }
      register_app_visit: { Args: Record<string, unknown>; Returns: Json }
      register_geo_location: { Args: Record<string, unknown>; Returns: Json }
      track_ad_click: { Args: Record<string, unknown>; Returns: Json }
      track_ad_impression: { Args: Record<string, unknown>; Returns: Json }
      upsert_pro_performance_profile: { Args: Record<string, unknown>; Returns: Json }
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
export type VerificationLevel   = Profile['verification_level']

// ============================================================
// РОЗШИРЕНІ ТИПИ — для UI з join-ами
// ============================================================

// Оголошення з фото та категорією — для карток у каталозі
export interface ListingWithImages extends Listing {
  images: ListingImage[]
  category?: Category | null
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