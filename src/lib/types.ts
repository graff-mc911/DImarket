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
// client      — замовник, шукає майстра або послугу
// professional — майстер або фізична особа що надає послуги
// company     — фірма або компанія що надає послуги
// owner       — власник платформи DImarket
// ============================================================
export type UserRole = 'client' | 'professional' | 'company' | 'owner'

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

          experience_years: number | null
          hourly_rate_min: number | null
          hourly_rate_max: number | null
          warranty_months: number | null
          warranty_note: string | null

          created_at: string
          updated_at: string
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
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
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
        }
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
      }

      project_applications: {
        Row: {
          id: string
          listing_id: string
          professional_id: string
          status: 'saved' | 'applied' | 'withdrawn' | 'accepted' | 'rejected'
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
          status?: 'saved' | 'applied' | 'withdrawn' | 'accepted' | 'rejected'
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
          status?: 'saved' | 'applied' | 'withdrawn' | 'accepted' | 'rejected'
          message?: string | null
          saved?: boolean
          hidden?: boolean
          created_at?: string
          updated_at?: string
        }
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
        }
      }

      // ----------------------------------------------------------
      // saved_items — збережені оголошення і профілі
      // item_type: 'listing' або 'profile'
      // ----------------------------------------------------------
      saved_items: {
        Row: {
          id: string
          user_id: string
          item_type: 'listing' | 'profile'
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: 'listing' | 'profile'
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: 'listing' | 'profile'
          item_id?: string
          created_at?: string
        }
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
          geo_scope: 'city' | 'region' | 'country' | 'global'
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
          status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'expired' | 'deleted'
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
          geo_scope: 'city' | 'region' | 'country' | 'global'
          country_code?: string | null
          country_name?: string | null
          region_name?: string | null
          city_name?: string | null
          countries?: string[] | null
          cities?: string[] | null
          starts_at?: string | null
          ends_at?: string | null
          status?: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'expired' | 'deleted'
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
          geo_scope?: 'city' | 'region' | 'country' | 'global'
          country_code?: string | null
          country_name?: string | null
          region_name?: string | null
          city_name?: string | null
          countries?: string[] | null
          cities?: string[] | null
          starts_at?: string | null
          ends_at?: string | null
          status?: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'expired' | 'deleted'
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
          payment_type: 'ad_campaign' | 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost' | 'subscription' | 'featured_profile' | 'sponsored_project' | 'lead_credits' | 'google_ads'
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
          payment_type: 'ad_campaign' | 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost' | 'subscription' | 'featured_profile' | 'sponsored_project' | 'lead_credits' | 'google_ads'
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
          payment_type?: 'ad_campaign' | 'premium_profile' | 'featured_listing' | 'verified_badge' | 'boost' | 'subscription' | 'featured_profile' | 'sponsored_project' | 'lead_credits' | 'google_ads'
          reference_id?: string | null
          amount?: number
          currency?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
        }
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