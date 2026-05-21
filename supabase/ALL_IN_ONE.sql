-- DImarket ALL_IN_ONE.sql — запустіть у Supabase SQL Editor (wjlfvajloxkevggwjgtk)
-- Порядок: усі migrations, потім seed з RUN_ON_NEW_PROJECT.sql

-- ===== 20260323181005_create_buildster_schema.sql =====
/*
  # Buildster Marketplace Schema

  ## Overview
  Complete database schema for Buildster - a construction and home services marketplace platform.

  ## Tables Created

  ### 1. Categories
  Hierarchical category system for organizing listings and services
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `slug` (text, unique) - URL-friendly identifier
  - `parent_id` (uuid, nullable) - For subcategories
  - `icon` (text) - Icon identifier
  - `description` (text)
  - `created_at` (timestamptz)

  ### 2. Profiles
  Extended user profiles for registered professionals
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `bio` (text)
  - `phone` (text)
  - `location` (text)
  - `avatar_url` (text)
  - `is_professional` (boolean) - True for professionals
  - `rating` (numeric) - Average rating
  - `total_reviews` (integer)
  - `subscription_tier` (text) - 'free', 'monthly', 'yearly'
  - `subscription_expires_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. Professional Categories
  Many-to-many relationship between professionals and categories
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles)
  - `category_id` (uuid, references categories)
  - `created_at` (timestamptz)

  ### 4. Listings
  Ads posted by guests or professionals
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `category_id` (uuid, references categories)
  - `listing_type` (text) - 'service_request', 'service_offer', 'item_sale', 'item_wanted'
  - `price` (numeric, nullable)
  - `currency` (text) - Default 'USD'
  - `location` (text)
  - `contact_name` (text)
  - `contact_phone` (text)
  - `contact_email` (text)
  - `author_id` (uuid, nullable, references profiles) - If posted by registered user
  - `duration_days` (integer) - 7, 30, or 365
  - `expires_at` (timestamptz)
  - `is_premium` (boolean) - For promoted listings
  - `views_count` (integer)
  - `status` (text) - 'active', 'expired', 'sold', 'deleted'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. Listing Images
  Images associated with listings
  - `id` (uuid, primary key)
  - `listing_id` (uuid, references listings)
  - `image_url` (text)
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ### 6. Portfolio Items
  Professional portfolio showcase
  - `id` (uuid, primary key)
  - `profile_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `image_url` (text)
  - `display_order` (integer)
  - `created_at` (timestamptz)

  ### 7. Reviews
  Client reviews for professionals
  - `id` (uuid, primary key)
  - `professional_id` (uuid, references profiles)
  - `reviewer_name` (text)
  - `reviewer_email` (text)
  - `rating` (integer) - 1 to 5
  - `comment` (text)
  - `created_at` (timestamptz)

  ### 8. Messages
  Chat messages between users
  - `id` (uuid, primary key)
  - `conversation_id` (uuid) - Groups messages into conversations
  - `sender_id` (uuid, nullable, references profiles)
  - `sender_name` (text) - For guest senders
  - `sender_email` (text) - For guest senders
  - `recipient_id` (uuid, references profiles)
  - `listing_id` (uuid, nullable, references listings)
  - `content` (text)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ## Security (RLS Policies)

  ### Categories
  - Public read access for all categories

  ### Profiles
  - Public read access for professional profiles
  - Users can update their own profiles

  ### Listings
  - Public read access for active listings
  - Authors can update/delete their own listings
  - Authenticated professionals can create listings

  ### Messages
  - Users can read messages where they are sender or recipient
  - Users can send messages

  ### Reviews
  - Public read access
  - Anyone can create reviews (guests or registered users)

  ## Notes
  - All timestamps use timestamptz for timezone awareness
  - UUID primary keys for scalability
  - Comprehensive indexing for performance
  - Restrictive RLS policies for data security
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  icon text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  bio text,
  phone text,
  location text,
  avatar_url text,
  is_professional boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  subscription_tier text DEFAULT 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create professional_categories junction table
CREATE TABLE IF NOT EXISTS professional_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, category_id)
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('service_request', 'service_offer', 'item_sale', 'item_wanted')),
  price numeric(10,2),
  currency text DEFAULT 'USD',
  location text NOT NULL,
  contact_name text NOT NULL,
  contact_phone text,
  contact_email text,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  duration_days integer NOT NULL DEFAULT 30,
  expires_at timestamptz NOT NULL,
  is_premium boolean DEFAULT false,
  views_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'sold', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create listing_images table
CREATE TABLE IF NOT EXISTS listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name text,
  sender_email text,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_professional ON profiles(is_professional) WHERE is_professional = true;
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_expires ON listings(expires_at);
CREATE INDEX IF NOT EXISTS idx_listings_author ON listings(author_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_profile ON portfolio_items(profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

-- RLS Policies for profiles
CREATE POLICY "Anyone can view professional profiles"
  ON profiles FOR SELECT
  TO public
  USING (is_professional = true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for professional_categories
CREATE POLICY "Anyone can view professional categories"
  ON professional_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Professionals can manage own categories"
  ON professional_categories FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for listings
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  TO public
  USING (status = 'active' AND expires_at > now());

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Guest users can create listings"
  ON listings FOR INSERT
  TO anon
  WITH CHECK (author_id IS NULL);

CREATE POLICY "Authors can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- RLS Policies for listing_images
CREATE POLICY "Anyone can view listing images"
  ON listing_images FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Listing owners can manage images"
  ON listing_images FOR ALL
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE author_id = auth.uid()
    )
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM listings WHERE author_id = auth.uid()
    )
  );

CREATE POLICY "Guest users can insert listing images"
  ON listing_images FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for portfolio_items
CREATE POLICY "Anyone can view portfolio items"
  ON portfolio_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Professionals can manage own portfolio"
  ON portfolio_items FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create reviews"
  ON reviews FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR 
    sender_id = auth.uid()
  );

CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Guest users can send messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (sender_id IS NULL AND sender_name IS NOT NULL AND sender_email IS NOT NULL);

CREATE POLICY "Recipients can update message read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Insert default categories
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Construction', 'construction', 'ðŸ—ï¸', 'New construction and building projects'),
  ('Renovation', 'renovation', 'ðŸ”¨', 'Home renovation and remodeling'),
  ('Electrical', 'electrical', 'âš¡', 'Electrical work and repairs'),
  ('Plumbing', 'plumbing', 'ðŸš¿', 'Plumbing services and installations'),
  ('Handyman', 'handyman', 'ðŸ› ï¸', 'General handyman services'),
  ('Materials', 'materials', 'ðŸªµ', 'Building materials for sale'),
  ('Tools', 'tools', 'ðŸ”§', 'Tools and equipment')
ON CONFLICT (slug) DO NOTHING;


-- ===== 20260324052021_add_professional_features_and_messaging.sql =====
/*
  # Add Professional Features and Messaging System

  ## Changes Made:
  
  ### 1. Profiles Table Updates
    - Add `portfolio_images` (jsonb) - array of portfolio image URLs
    - Add `subscription_type` (text) - 'monthly' or 'yearly'
    - Add `subscription_status` (text) - 'active', 'inactive', 'expired'
    - Add `subscription_expires_at` (timestamptz) - when subscription ends
    - Add `profile_views` (integer) - track profile views
    - Add `notifications_enabled` (boolean) - notification preferences
    - Add `preferred_language` (text) - user's language choice
    - Add `preferred_currency` (text) - user's currency choice
  
  ### 2. Messages Table (New)
    - Create messages table for chat functionality
    - Real-time messaging between users
    
  ### 3. RLS Policies
    - Update policies to allow guest ad creation (listings already support this)
    - Restrict professional features to paid subscribers
*/

-- Update profiles table for professional features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'portfolio_images'
  ) THEN
    ALTER TABLE profiles ADD COLUMN portfolio_images jsonb DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_type text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status text DEFAULT 'inactive';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_expires_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_views'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_views integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text DEFAULT 'en';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_currency text DEFAULT 'USD';
  END IF;
END $$;

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  message text NOT NULL,
  images jsonb DEFAULT '[]'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Update RLS for listings to allow anyone to insert (guests included)
DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND expires_at > now());

DROP POLICY IF EXISTS "Anyone can create listings" ON listings;
CREATE POLICY "Anyone can create listings"
  ON listings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own listings" ON listings;
CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_professional ON profiles(is_professional) WHERE is_professional = true;


-- ===== 20260324082347_add_profile_photo_and_website.sql =====
/*
  # Add Profile Photo and Website Fields

  ## Changes Made:
  
  ### 1. Profiles Table Updates
    - Add `profile_photo` (text) - URL for profile photo
    - Add `website` (text) - Professional's website URL
  
  These fields are needed for the Settings page functionality.
*/

-- Add profile_photo field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_photo'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_photo text;
  END IF;
END $$;

-- Add website field if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'website'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website text;
  END IF;
END $$;


-- ===== 20260324175649_remove_subscription_fields.sql =====
/*
  # Remove Subscription Fields

  1. Changes
    - Remove `subscription_tier` column from profiles table
    - Remove `subscription_expires_at` column from profiles table
  
  2. Notes
    - Making the platform completely free
    - No payment or subscription functionality needed
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_tier;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE profiles DROP COLUMN subscription_expires_at;
  END IF;
END $$;


-- ===== 20260327172059_fix_rls_security_policies.sql =====
/*
  # Fix RLS Security Policies

  ## Summary
  This migration fixes critical security vulnerabilities in Row Level Security (RLS) policies that allowed unrestricted anonymous access.

  ## Changes Made

  ### 1. Listings Table
  **Problem**: Policy "Guest users can create listings" allowed ANY anonymous user to create listings without restrictions (WITH CHECK true implied)
  
  **Solution**: 
  - Drop the unsafe policy that allowed unrestricted guest listing creation
  - Replace with policy requiring valid contact information
  - Guests can only create listings if they provide contact_name, contact_email or contact_phone

  ### 2. Listing Images Table
  **Problem**: Policy "Guest users can insert listing images" had WITH CHECK (true), allowing anonymous users to insert images for ANY listing
  
  **Solution**:
  - Drop the dangerous policy completely
  - Guest users can no longer upload images directly
  - Only authenticated users who own the listing can manage images
  - This prevents spam and abuse of image storage

  ### 3. Reviews Table
  **Problem**: Policy "Anyone can create reviews" had WITH CHECK (true), allowing unlimited spam reviews from anyone
  
  **Solution**:
  - Drop the unsafe policy
  - Create new policy requiring reviewer_name and reviewer_email
  - Add validation to prevent empty or spam reviews
  - Maintain public read access for transparency

  ## Security Improvements
  
  1. **Listings**: Now require valid contact information from guests
  2. **Images**: Only authenticated listing owners can upload images
  3. **Reviews**: Must provide name and email, with non-empty comment requirement
  4. **Data Integrity**: Prevents anonymous spam and malicious content

  ## Impact
  
  - Anonymous users must provide contact details to create listings
  - Image uploads now restricted to authenticated users only
  - Reviews require identification and meaningful content
  - No breaking changes to legitimate use cases
*/

-- Fix listings RLS policy for guests
DROP POLICY IF EXISTS "Guest users can create listings" ON listings;
DROP POLICY IF EXISTS "Anyone can create listings" ON listings;

CREATE POLICY "Guest users can create listings with contact info"
  ON listings FOR INSERT
  TO anon
  WITH CHECK (
    author_id IS NULL 
    AND contact_name IS NOT NULL 
    AND contact_name != ''
    AND (contact_email IS NOT NULL OR contact_phone IS NOT NULL)
    AND (contact_email != '' OR contact_phone != '')
  );

-- Fix listing_images RLS policy - remove guest upload ability
DROP POLICY IF EXISTS "Guest users can insert listing images" ON listing_images;

-- Guests should not be able to upload images at all for security
-- Only authenticated users who own the listing can manage images

-- Fix reviews RLS policy to require identification
DROP POLICY IF EXISTS "Anyone can create reviews" ON reviews;

CREATE POLICY "Users can create reviews with identification"
  ON reviews FOR INSERT
  TO public
  WITH CHECK (
    reviewer_name IS NOT NULL 
    AND reviewer_name != ''
    AND reviewer_email IS NOT NULL
    AND reviewer_email != ''
    AND comment IS NOT NULL
    AND comment != ''
    AND rating >= 1 
    AND rating <= 5
  );


-- ===== 20260329182328_add_visibility_radius_to_listings.sql =====
/*
  # Add Visibility Radius Field to Listings

  1. Changes
    - Add `visibility_radius` column to `listings` table
      - Type: text
      - Allowed values: 'city', 'district', 'region', 'country', 'state', 'land', 'global'
      - Default: 'city'
      - Description: Defines the geographical visibility scope of the listing
  
  2. Notes
    - This field allows users to control how widely their listing is visible
    - Default is 'city' for local visibility
    - 'land' refers to German states (BundeslÃ¤nder)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'visibility_radius'
  ) THEN
    ALTER TABLE listings ADD COLUMN visibility_radius text DEFAULT 'city';
    ALTER TABLE listings ADD CONSTRAINT visibility_radius_check 
      CHECK (visibility_radius IN ('city', 'district', 'region', 'country', 'state', 'land', 'global'));
  END IF;
END $$;

-- ===== 20260502132744_revoke_public_execute_on_security_definer_functions.sql =====
/*
  # Ð’Ð¸Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð½Ñ Ð±ÐµÐ·Ð¿ÐµÐºÐ¸: Ð¾Ð±Ð¼ÐµÐ¶ÐµÐ½Ð½Ñ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ñƒ Ð´Ð¾ SECURITY DEFINER Ñ„ÑƒÐ½ÐºÑ†Ñ–Ð¹

  1. Ð—Ð¼Ñ–Ð½Ð¸
    - Ð’Ñ–Ð´ÐºÐ»Ð¸ÐºÐ°Ð½Ð¾ EXECUTE Ð²Ñ–Ð´ Ñ€Ð¾Ð»Ñ– PUBLIC Ð½Ð° Ð¾Ð±Ð¾Ñ… Ñ„ÑƒÐ½ÐºÑ†Ñ–ÑÑ…
      (PUBLIC Ð´Ð°Ñ” Ð´Ð¾ÑÑ‚ÑƒÐ¿ ÑƒÑÑ–Ð¼ Ñ€Ð¾Ð»ÑÐ¼, Ð²ÐºÐ»ÑŽÑ‡Ð°ÑŽÑ‡Ð¸ anon Ñ‚Ð° authenticated)
    - refresh_app_site_stats: Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° Ñ‚Ñ–Ð»ÑŒÐºÐ¸ postgres Ñ‚Ð° service_role
      (Ñ†Ðµ Ð°Ð´Ð¼Ñ–Ð½Ñ–ÑÑ‚Ñ€Ð°Ñ‚Ð¸Ð²Ð½Ð° Ñ„ÑƒÐ½ÐºÑ†Ñ–Ñ Ð¾Ð½Ð¾Ð²Ð»ÐµÐ½Ð½Ñ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ¸)
    - register_app_visit: Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° anon Ñ‚Ð° authenticated
      (Ð¿Ð¾Ñ‚Ñ€Ñ–Ð±Ð½Ð° Ð´Ð»Ñ Ð¿Ñ–Ð´Ñ€Ð°Ñ…ÑƒÐ½ÐºÑƒ Ð²Ñ–Ð´Ð²Ñ–Ð´ÑƒÐ²Ð°Ð½ÑŒ ÑÐ°Ð¹Ñ‚Ñƒ)

  2. Ð‘ÐµÐ·Ð¿ÐµÐºÐ°
    - Ð£ÑÑƒÐ²Ð°Ñ” Ð²Ñ€Ð°Ð·Ð»Ð¸Ð²Ñ–ÑÑ‚ÑŒ "Public Can Execute SECURITY DEFINER Function"
    - Ð£ÑÑƒÐ²Ð°Ñ” Ð²Ñ€Ð°Ð·Ð»Ð¸Ð²Ñ–ÑÑ‚ÑŒ "Signed-In Users Can Execute SECURITY DEFINER Function"
      Ð´Ð»Ñ refresh_app_site_stats
*/

-- Ð’Ñ–Ð´ÐºÐ»Ð¸ÐºÐ°Ñ”Ð¼Ð¾ EXECUTE Ð²Ñ–Ð´ PUBLIC Ð½Ð° Ð¾Ð±Ð¾Ñ… Ñ„ÑƒÐ½ÐºÑ†Ñ–ÑÑ…
-- (PUBLIC -- Ñ†Ðµ ÑÐ¿ÐµÑ†Ñ–Ð°Ð»ÑŒÐ½Ð° Ñ€Ð¾Ð»ÑŒ, ÑÐºÐ° Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ Ð²ÐºÐ»ÑŽÑ‡Ð°Ñ” Ð²ÑÑ–Ñ… ÐºÐ¾Ñ€Ð¸ÑÑ‚ÑƒÐ²Ð°Ñ‡Ñ–Ð²)
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_app_visit() FROM PUBLIC;

-- Ð”Ð»Ñ refresh_app_site_stats Ð´Ð¾Ð´Ð°Ñ‚ÐºÐ¾Ð²Ð¾ Ð·Ð°Ð±Ð¸Ñ€Ð°Ñ”Ð¼Ð¾ Ñƒ anon Ñ‚Ð° authenticated
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM authenticated;

-- Ð”Ð»Ñ register_app_visit Ð·Ð°Ð»Ð¸ÑˆÐ°Ñ”Ð¼Ð¾ Ð´Ð¾ÑÑ‚ÑƒÐ¿ anon Ñ‚Ð° authenticated
-- (Ð²Ð¾Ð½Ð¸ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±ÑƒÑŽÑ‚ÑŒ Ñ†ÑŽ Ñ„ÑƒÐ½ÐºÑ†Ñ–ÑŽ Ð´Ð»Ñ Ñ€ÐµÑ”ÑÑ‚Ñ€Ð°Ñ†Ñ–Ñ— Ð²Ñ–Ð´Ð²Ñ–Ð´ÑƒÐ²Ð°Ð½ÑŒ)
GRANT EXECUTE ON FUNCTION public.register_app_visit() TO anon;
GRANT EXECUTE ON FUNCTION public.register_app_visit() TO authenticated;


-- ===== 20260502143255_switch_register_app_visit_to_security_invoker.sql =====
/*
  # ÐŸÐµÑ€ÐµÐºÐ»ÑŽÑ‡ÐµÐ½Ð½Ñ register_app_visit Ð½Ð° SECURITY INVOKER

  1. Ð—Ð¼Ñ–Ð½Ð¸
    - Ð¤ÑƒÐ½ÐºÑ†Ñ–Ñ register_app_visit Ñ‚ÐµÐ¿ÐµÑ€ SECURITY INVOKER Ð·Ð°Ð¼Ñ–ÑÑ‚ÑŒ SECURITY DEFINER
    - Ð¦Ðµ Ð¾Ð·Ð½Ð°Ñ‡Ð°Ñ”, Ñ‰Ð¾ Ð²Ð¾Ð½Ð° Ð²Ð¸ÐºÐ¾Ð½ÑƒÑ”Ñ‚ÑŒÑÑ Ð· Ð¿Ñ€Ð°Ð²Ð°Ð¼Ð¸ Ñ‚Ð¾Ð³Ð¾, Ñ…Ñ‚Ð¾ Ñ—Ñ— Ð²Ð¸ÐºÐ»Ð¸ÐºÐ°Ñ”,
      Ð° Ð½Ðµ Ð· Ð¿Ñ€Ð°Ð²Ð°Ð¼Ð¸ Ð²Ð»Ð°ÑÐ½Ð¸ÐºÐ° (postgres)
    - Ð”Ð¾Ð´Ð°Ð½Ð¾ RLS-Ð¿Ð¾Ð»Ñ–Ñ‚Ð¸ÐºÑƒ UPDATE Ð½Ð° Ñ‚Ð°Ð±Ð»Ð¸Ñ†ÑŽ app_site_stats Ð´Ð»Ñ anon Ñ‚Ð° authenticated,
      Ñ‰Ð¾Ð± Ð²Ð¾Ð½Ð¸ Ð¼Ð¾Ð³Ð»Ð¸ Ñ–Ð½ÐºÑ€ÐµÐ¼ÐµÐ½Ñ‚ÑƒÐ²Ð°Ñ‚Ð¸ Ð»Ñ–Ñ‡Ð¸Ð»ÑŒÐ½Ð¸Ðº Ð²Ñ–Ð´Ð²Ñ–Ð´ÑƒÐ²Ð°Ð½ÑŒ

  2. Ð‘ÐµÐ·Ð¿ÐµÐºÐ°
    - Ð£ÑÑƒÐ²Ð°Ñ” Ð²Ñ€Ð°Ð·Ð»Ð¸Ð²Ñ–ÑÑ‚ÑŒ "Public Can Execute SECURITY DEFINER Function"
    - Ð£ÑÑƒÐ²Ð°Ñ” Ð²Ñ€Ð°Ð·Ð»Ð¸Ð²Ñ–ÑÑ‚ÑŒ "Signed-In Users Can Execute SECURITY DEFINER Function"
    - Ð”Ð¾ÑÑ‚ÑƒÐ¿ Ð´Ð¾ UPDATE Ð¾Ð±Ð¼ÐµÐ¶ÐµÐ½Ð¸Ð¹ Ñ‡ÐµÑ€ÐµÐ· RLS Ñ‚Ñ–Ð»ÑŒÐºÐ¸ Ñ€ÑÐ´ÐºÐ¾Ð¼ id = 1
*/

-- ÐŸÐµÑ€ÐµÑÑ‚Ð²Ð¾Ñ€ÑŽÑ”Ð¼Ð¾ Ñ„ÑƒÐ½ÐºÑ†Ñ–ÑŽ ÑÐº SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.register_app_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.app_site_stats
  SET total_visits = total_visits + 1
  WHERE id = 1;
END;
$$;

-- Ð”Ð¾Ð´Ð°Ñ”Ð¼Ð¾ RLS-Ð¿Ð¾Ð»Ñ–Ñ‚Ð¸ÐºÑƒ, Ñ‰Ð¾ Ð´Ð¾Ð·Ð²Ð¾Ð»ÑÑ” anon Ñ‚Ð° authenticated Ð¾Ð½Ð¾Ð²Ð»ÑŽÐ²Ð°Ñ‚Ð¸ Ð»Ñ–Ñ‡Ð¸Ð»ÑŒÐ½Ð¸Ðº
CREATE POLICY "Anon and authenticated can increment visit counter"
  ON public.app_site_stats
  FOR UPDATE
  TO anon, authenticated
  USING (id = 1)
  WITH CHECK (id = 1);


-- ===== 20260503065101_revoke_execute_on_refresh_app_site_stats.sql =====
/*
  # Revoke public execute on refresh_app_site_stats

  1. Security Changes
    - Revoke EXECUTE on refresh_app_site_stats from anon and authenticated roles
    - This function aggregates data across multiple tables and should only
      be called by service_role (e.g., via cron or admin)
    - Resolves 403 error when frontend accidentally calls this function

  2. Notes
    - Function remains available to service_role for scheduled refreshes
    - Frontend should read from app_site_stats table directly (via RLS SELECT policy)
*/

REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon, authenticated;


-- ===== 20260514190333_create_app_site_stats_and_functions.sql =====
/*
  # Create app_site_stats table and related functions

  1. New Tables
    - `app_site_stats`
      - `id` (integer, primary key, always 1 - single row)
      - `total_visits` (integer) - total app visits
      - `total_listings_created` (integer) - total listings ever created
      - `total_successful_listings` (integer) - listings with status 'sold'
      - `total_professionals` (integer) - count of professional profiles
      - `country_ranking` (jsonb) - array of country stats objects
      - `updated_at` (timestamptz)

  2. Functions
    - `register_app_visit()` - increments total_visits counter
    - `refresh_app_site_stats()` - recalculates all aggregate stats

  3. Security
    - Enable RLS on app_site_stats
    - Allow anon/authenticated to read stats (id = 1)
    - Allow anon/authenticated to increment visit counter
*/

CREATE TABLE IF NOT EXISTS app_site_stats (
  id integer PRIMARY KEY DEFAULT 1,
  total_visits integer DEFAULT 0,
  total_listings_created integer DEFAULT 0,
  total_successful_listings integer DEFAULT 0,
  total_professionals integer DEFAULT 0,
  country_ranking jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT app_site_stats_single_row CHECK (id = 1)
);

-- Insert the single row if not exists
INSERT INTO app_site_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE app_site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site stats"
  ON app_site_stats FOR SELECT
  TO anon, authenticated
  USING (id = 1);

CREATE POLICY "Anon and authenticated can increment visit counter"
  ON app_site_stats FOR UPDATE
  TO anon, authenticated
  USING (id = 1)
  WITH CHECK (id = 1);

-- Function to register a visit (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.register_app_visit()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.app_site_stats
  SET total_visits = total_visits + 1
  WHERE id = 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_app_visit() TO anon;
GRANT EXECUTE ON FUNCTION public.register_app_visit() TO authenticated;

-- Function to refresh aggregate stats (SECURITY DEFINER for cross-table reads)
CREATE OR REPLACE FUNCTION public.refresh_app_site_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_total_listings integer;
  v_successful_listings integer;
  v_total_professionals integer;
  v_country_ranking jsonb;
BEGIN
  SELECT COUNT(*) INTO v_total_listings FROM public.listings WHERE status != 'deleted';
  SELECT COUNT(*) INTO v_successful_listings FROM public.listings WHERE status = 'sold';
  SELECT COUNT(*) INTO v_total_professionals FROM public.profiles WHERE is_professional = true;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'country', country,
        'score', score,
        'professionals', professionals,
        'listings', listings,
        'responses', responses
      ) ORDER BY score DESC
    ),
    '[]'::jsonb
  )
  INTO v_country_ranking
  FROM (
    SELECT
      location AS country,
      COUNT(DISTINCT p.id) * 10 + COUNT(DISTINCT l.id) * 5 AS score,
      COUNT(DISTINCT p.id) AS professionals,
      COUNT(DISTINCT l.id) AS listings,
      0 AS responses
    FROM public.profiles p
    FULL OUTER JOIN public.listings l ON l.location = p.location
    WHERE p.location IS NOT NULL OR l.location IS NOT NULL
    GROUP BY location
    HAVING location IS NOT NULL AND location != ''
    ORDER BY score DESC
    LIMIT 20
  ) ranked;

  UPDATE public.app_site_stats
  SET
    total_listings_created = v_total_listings,
    total_successful_listings = v_successful_listings,
    total_professionals = v_total_professionals,
    country_ranking = COALESCE(v_country_ranking, '[]'::jsonb),
    updated_at = now()
  WHERE id = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_app_site_stats() FROM authenticated;


-- ===== 20260514190419_create_ad_campaigns_feedback_and_profiles_extras.sql =====
/*
  # Create ad_campaigns, feedback_messages tables and add is_site_owner to profiles

  1. New Tables
    - `ad_campaigns` - advertising campaigns with geo-targeting
    - `feedback_messages` - contact form submissions

  2. Profile Changes
    - Add `is_site_owner` boolean column to profiles

  3. Security
    - RLS enabled on all new tables
    - Appropriate policies for each table
*/

-- Add is_site_owner to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_site_owner'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_site_owner boolean DEFAULT false;
  END IF;
END $$;

-- Create ad_campaigns table
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  link_url text NOT NULL,
  placement text NOT NULL CHECK (placement IN ('home', 'listings', 'sidebar', 'footer', 'mobile_sticky')),
  geo_scope text NOT NULL CHECK (geo_scope IN ('city', 'region', 'country', 'global')),
  country_code text,
  country_name text,
  region_name text,
  city_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'rejected', 'expired', 'deleted')),
  review_note text,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ad campaigns"
  ON ad_campaigns FOR SELECT
  TO public
  USING (status = 'active' AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Site owners can view all ad campaigns"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

CREATE POLICY "Advertisers can view own campaigns"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (advertiser_id = auth.uid());

CREATE POLICY "Authenticated users can create ad campaigns"
  ON ad_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Advertisers can update own campaigns"
  ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (advertiser_id = auth.uid())
  WITH CHECK (advertiser_id = auth.uid());

CREATE POLICY "Site owners can update any campaign"
  ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

CREATE POLICY "Advertisers can delete own campaigns"
  ON ad_campaigns FOR DELETE
  TO authenticated
  USING (advertiser_id = auth.uid());

-- Create feedback_messages table
CREATE TABLE IF NOT EXISTS feedback_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback_messages FOR INSERT
  TO public
  WITH CHECK (
    name IS NOT NULL AND name != ''
    AND email IS NOT NULL AND email != ''
    AND subject IS NOT NULL AND subject != ''
    AND message IS NOT NULL AND message != ''
  );

CREATE POLICY "Site owners can view all feedback"
  ON feedback_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

CREATE POLICY "Site owners can update feedback status"
  ON feedback_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement ON ad_campaigns(placement);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_messages(status);
CREATE INDEX IF NOT EXISTS idx_feedback_is_read ON feedback_messages(is_read);


-- ===== 20260519130000_dimarket_complete_backend.sql =====
/*
  # DImarket â€” Ð¿Ð¾Ð²Ð½Ð° ÑÑ…ÐµÐ¼Ð° Ð´Ð»Ñ Ñ€ÐµÐºÐ»Ð°Ð¼Ð¸, Stripe, Ð³ÐµÐ¾ Ñ‚Ð° Ð´Ð¾Ð¿Ð¾Ð¼Ñ–Ð¶Ð½Ð¸Ñ… Ñ‚Ð°Ð±Ð»Ð¸Ñ†ÑŒ

  Ð”Ð¾Ð¿Ð¾Ð²Ð½ÑŽÑ” Ñ–ÑÐ½ÑƒÑŽÑ‡Ñ– Ð¼Ñ–Ð³Ñ€Ð°Ñ†Ñ–Ñ— Buildster/DImarket:
  - Ñ€Ð¾Ð·ÑˆÐ¸Ñ€ÑŽÑ” ad_campaigns Ð¿Ñ–Ð´ Advertising.tsx
  - profiles: premium, verified, user_role
  - listings: is_promoted
  - payments, announcements, saved_items, geo_catalog
  - view active_geo
  - storage bucket ad-media
*/

-- =============================================================================
-- PROFILES â€” Ð¿Ñ€ÐµÐ¼Ñ–ÑƒÐ¼, Ð²ÐµÑ€Ð¸Ñ„Ñ–ÐºÐ°Ñ†Ñ–Ñ, Ñ€Ð¾Ð»ÑŒ
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_role') THEN
    ALTER TABLE profiles ADD COLUMN user_role text
      CHECK (user_role IS NULL OR user_role IN ('client', 'professional', 'company', 'owner'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_verified') THEN
    ALTER TABLE profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'verified_at') THEN
    ALTER TABLE profiles ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN premium_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_featured') THEN
    ALTER TABLE profiles ADD COLUMN is_featured boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'featured_expires_at') THEN
    ALTER TABLE profiles ADD COLUMN featured_expires_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'client_rating') THEN
    ALTER TABLE profiles ADD COLUMN client_rating numeric(3,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'client_total_reviews') THEN
    ALTER TABLE profiles ADD COLUMN client_total_reviews integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'response_rate') THEN
    ALTER TABLE profiles ADD COLUMN response_rate numeric(5,2);
  END IF;
END $$;

-- =============================================================================
-- LISTINGS â€” Ð²Ð¸Ð´Ñ–Ð»ÐµÐ½Ñ– Ð¾Ð³Ð¾Ð»Ð¾ÑˆÐµÐ½Ð½Ñ
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_promoted') THEN
    ALTER TABLE listings ADD COLUMN is_promoted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'promoted_expires_at') THEN
    ALTER TABLE listings ADD COLUMN promoted_expires_at timestamptz;
  END IF;
END $$;

-- =============================================================================
-- AD_CAMPAIGNS â€” Ñ€Ð¾Ð·ÑˆÐ¸Ñ€ÐµÐ½Ð½Ñ Ð¿Ñ–Ð´ self-serve Ñ€ÐµÐºÐ»Ð°Ð¼Ñƒ
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'media_url') THEN
    ALTER TABLE ad_campaigns ADD COLUMN media_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'media_type') THEN
    ALTER TABLE ad_campaigns ADD COLUMN media_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'placements') THEN
    ALTER TABLE ad_campaigns ADD COLUMN placements text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'countries') THEN
    ALTER TABLE ad_campaigns ADD COLUMN countries text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'regions') THEN
    ALTER TABLE ad_campaigns ADD COLUMN regions text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'cities') THEN
    ALTER TABLE ad_campaigns ADD COLUMN cities text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'impressions') THEN
    ALTER TABLE ad_campaigns ADD COLUMN impressions bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'clicks') THEN
    ALTER TABLE ad_campaigns ADD COLUMN clicks bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'stripe_payment_id') THEN
    ALTER TABLE ad_campaigns ADD COLUMN stripe_payment_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'price_paid') THEN
    ALTER TABLE ad_campaigns ADD COLUMN price_paid numeric(12,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ad_campaigns' AND column_name = 'currency_paid') THEN
    ALTER TABLE ad_campaigns ADD COLUMN currency_paid text DEFAULT 'eur';
  END IF;
END $$;

-- Ð—Ð½Ñ–Ð¼Ð°Ñ”Ð¼Ð¾ ÑÑ‚Ð°Ñ€Ñ– CHECK-Ð¾Ð±Ð¼ÐµÐ¶ÐµÐ½Ð½Ñ Ð½Ð° ad_campaigns (geo_scope, status)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'ad_campaigns' AND c.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_geo_scope_check
  CHECK (geo_scope IN (
    'global', 'countries', 'regions', 'cities',
    'country', 'region', 'city'
  ));

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'pending_payment',
    'active', 'paused', 'rejected', 'expired', 'deleted'
  ));

ALTER TABLE ad_campaigns
  ADD CONSTRAINT ad_campaigns_media_type_check
  CHECK (media_type IS NULL OR media_type IN ('image', 'gif', 'video'));

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placements ON ad_campaigns USING gin (placements);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_cities ON ad_campaigns USING gin (cities);

-- =============================================================================
-- PAYMENTS â€” Ð¶ÑƒÑ€Ð½Ð°Ð» Stripe-Ñ‚Ñ€Ð°Ð½Ð·Ð°ÐºÑ†Ñ–Ð¹
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN (
    'ad_campaign', 'premium_profile', 'featured_listing', 'verified_badge', 'boost'
  )),
  reference_id uuid,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  stripe_payment_intent_id text,
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id);

-- =============================================================================
-- ANNOUNCEMENTS â€” Ð±Ð°Ð½ÐµÑ€Ð¸ Ð² ÑˆÐ°Ð¿Ñ†Ñ–
-- =============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'promo')),
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active announcements" ON announcements;
CREATE POLICY "Anyone can read active announcements"
  ON announcements FOR SELECT TO public
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "Site owners manage announcements" ON announcements;
CREATE POLICY "Site owners manage announcements"
  ON announcements FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_site_owner = true)
  );

-- =============================================================================
-- SAVED_ITEMS â€” Ð¾Ð±Ñ€Ð°Ð½Ðµ
-- =============================================================================

CREATE TABLE IF NOT EXISTS saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('listing', 'profile')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved items" ON saved_items;
CREATE POLICY "Users manage own saved items"
  ON saved_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);

-- =============================================================================
-- GEO_CATALOG + ACTIVE_GEO â€” Ð³ÐµÐ¾Ñ‚Ð°Ñ€Ð³ÐµÑ‚Ð¸Ð½Ð³ Ñ€ÐµÐºÐ»Ð°Ð¼Ð¸
-- location Ñƒ profiles: "Ð¼Ñ–ÑÑ‚Ð¾, Ñ€ÐµÐ³Ñ–Ð¾Ð½, ÐºÑ€Ð°Ñ—Ð½Ð°"
-- =============================================================================

CREATE TABLE IF NOT EXISTS geo_catalog (
  id serial PRIMARY KEY,
  country text NOT NULL,
  region text NOT NULL DEFAULT 'Ð†Ð½ÑˆÑ–',
  city text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'geo_catalog_country_region_city_key'
  ) THEN
    ALTER TABLE geo_catalog
      ADD CONSTRAINT geo_catalog_country_region_city_key UNIQUE (country, region, city);
  END IF;
END $$;

INSERT INTO geo_catalog (country, region, city, sort_order) VALUES
  ('Ð£ÐºÑ€Ð°Ñ—Ð½Ð°', 'ÐšÐ¸Ñ—Ð²ÑÑŒÐºÐ°', 'ÐšÐ¸Ñ—Ð²', 1),
  ('Ð£ÐºÑ€Ð°Ñ—Ð½Ð°', 'Ð›ÑŒÐ²Ñ–Ð²ÑÑŒÐºÐ°', 'Ð›ÑŒÐ²Ñ–Ð²', 2),
  ('Ð£ÐºÑ€Ð°Ñ—Ð½Ð°', 'Ð¥Ð°Ñ€ÐºÑ–Ð²ÑÑŒÐºÐ°', 'Ð¥Ð°Ñ€ÐºÑ–Ð²', 3),
  ('Ð£ÐºÑ€Ð°Ñ—Ð½Ð°', 'ÐžÐ´ÐµÑÑŒÐºÐ°', 'ÐžÐ´ÐµÑÐ°', 4),
  ('Ð£ÐºÑ€Ð°Ñ—Ð½Ð°', 'Ð”Ð½Ñ–Ð¿Ñ€Ð¾Ð¿ÐµÑ‚Ñ€Ð¾Ð²ÑÑŒÐºÐ°', 'Ð”Ð½Ñ–Ð¿Ñ€Ð¾', 5),
  ('ÐŸÐ¾Ð»ÑŒÑ‰Ð°', 'ÐœÐ°Ð·Ð¾Ð²ÐµÑ†ÑŒÐºÐµ', 'Ð’Ð°Ñ€ÑˆÐ°Ð²Ð°', 10),
  ('ÐŸÐ¾Ð»ÑŒÑ‰Ð°', 'ÐœÐ°Ð»Ð¾Ð¿Ð¾Ð»ÑŒÑÑŒÐºÐµ', 'ÐšÑ€Ð°ÐºÑ–Ð²', 11),
  ('ÐŸÐ¾Ð»ÑŒÑ‰Ð°', 'ÐÐ¸Ð¶Ð½ÑŒÐ¾ÑÑ–Ð»ÐµÐ·ÑŒÐºÐµ', 'Ð’Ñ€Ð¾Ñ†Ð»Ð°Ð²', 12),
  ('ÐÑ–Ð¼ÐµÑ‡Ñ‡Ð¸Ð½Ð°', 'Ð‘Ð°Ð²Ð°Ñ€Ñ–Ñ', 'ÐœÑŽÐ½Ñ…ÐµÐ½', 20),
  ('ÐÑ–Ð¼ÐµÑ‡Ñ‡Ð¸Ð½Ð°', 'Ð‘ÐµÑ€Ð»Ñ–Ð½', 'Ð‘ÐµÑ€Ð»Ñ–Ð½', 21),
  ('ÐÑ–Ð¼ÐµÑ‡Ñ‡Ð¸Ð½Ð°', 'ÐŸÑ–Ð²Ð½Ñ–Ñ‡Ð½Ð¸Ð¹ Ð ÐµÐ¹Ð½-Ð’ÐµÑÑ‚Ñ„Ð°Ð»Ñ–Ñ', 'ÐšÐµÐ»ÑŒÐ½', 22),
  ('Ð§ÐµÑ…Ñ–Ñ', 'ÐŸÑ€Ð°Ð³Ð°', 'ÐŸÑ€Ð°Ð³Ð°', 30),
  ('Ð¡Ð»Ð¾Ð²Ð°Ñ‡Ñ‡Ð¸Ð½Ð°', 'Ð‘Ñ€Ð°Ñ‚Ð¸ÑÐ»Ð°Ð²ÑÑŒÐºÐ¸Ð¹', 'Ð‘Ñ€Ð°Ñ‚Ð¸ÑÐ»Ð°Ð²Ð°', 40),
  ('Ð ÑƒÐ¼ÑƒÐ½Ñ–Ñ', 'Ð‘ÑƒÑ…Ð°Ñ€ÐµÑÑ‚', 'Ð‘ÑƒÑ…Ð°Ñ€ÐµÑÑ‚', 50)
ON CONFLICT (country, region, city) DO NOTHING;

-- ÐŸÐ°Ñ€ÑÐ¸Ð½Ð³ location "city, region, country"
CREATE OR REPLACE VIEW active_geo AS
WITH profile_geo AS (
  SELECT
    NULLIF(trim(split_part(p.location, ', ', 3)), '') AS country,
    COALESCE(NULLIF(trim(split_part(p.location, ', ', 2)), ''), 'Ð†Ð½ÑˆÑ–') AS region,
    NULLIF(trim(split_part(p.location, ', ', 1)), '') AS city
  FROM profiles p
  WHERE p.location IS NOT NULL AND length(trim(p.location)) > 0
),
listing_geo AS (
  SELECT
    NULLIF(trim(split_part(l.location, ', ', 3)), '') AS country,
    COALESCE(NULLIF(trim(split_part(l.location, ', ', 2)), ''), 'Ð†Ð½ÑˆÑ–') AS region,
    NULLIF(trim(split_part(l.location, ', ', 1)), '') AS city
  FROM listings l
  WHERE l.location IS NOT NULL AND length(trim(l.location)) > 0
),
aggregated AS (
  SELECT country, region, city, count(*)::int AS user_count
  FROM (
    SELECT * FROM profile_geo
    UNION ALL
    SELECT * FROM listing_geo
  ) u
  WHERE country IS NOT NULL AND city IS NOT NULL
  GROUP BY country, region, city
)
SELECT
  COALESCE(a.country, g.country) AS country,
  COALESCE(a.region, g.region) AS region,
  COALESCE(a.city, g.city) AS city,
  GREATEST(COALESCE(a.user_count, 0), 1) AS user_count
FROM geo_catalog g
LEFT JOIN aggregated a
  ON a.country = g.country AND a.region = g.region AND a.city = g.city
UNION
SELECT a.country, a.region, a.city, a.user_count
FROM aggregated a
WHERE NOT EXISTS (
  SELECT 1 FROM geo_catalog g
  WHERE g.country = a.country AND g.region = a.region AND g.city = a.city
);

GRANT SELECT ON geo_catalog TO anon, authenticated;
GRANT SELECT ON active_geo TO anon, authenticated;

-- =============================================================================
-- STORAGE â€” bucket ad-media Ð´Ð»Ñ Ñ€ÐµÐºÐ»Ð°Ð¼Ð½Ð¸Ñ… Ð¼ÐµÐ´Ñ–Ð°
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-media',
  'ad-media',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read ad media" ON storage.objects;
CREATE POLICY "Public read ad media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'ad-media');

DROP POLICY IF EXISTS "Authenticated upload ad media" ON storage.objects;
CREATE POLICY "Authenticated upload ad media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ad-media'
    AND (storage.foldername(name))[1] = 'campaigns'
  );

DROP POLICY IF EXISTS "Authenticated update ad media" ON storage.objects;
CREATE POLICY "Authenticated update ad media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');

DROP POLICY IF EXISTS "Authenticated delete ad media" ON storage.objects;
CREATE POLICY "Authenticated delete ad media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ad-media' AND (storage.foldername(name))[1] = 'campaigns');


-- ===== RUN_ON_NEW_PROJECT.sql =====
-- ============================================================
-- Ð—Ð°Ð¿ÑƒÑÑ‚Ñ–Ñ‚ÑŒ ÐžÐ”Ð˜Ð Ð ÐÐ— Ñƒ Supabase SQL Editor (Ð¿Ñ€Ð¾Ñ”ÐºÑ‚ wjlfvajloxkevggwjgtk)
-- ÐŸÑ–ÑÐ»Ñ Ð±Ð°Ð·Ð¾Ð²Ð¸Ñ… Ð¼Ñ–Ð³Ñ€Ð°Ñ†Ñ–Ð¹ Ð· supabase/migrations/ (ÑÐºÑ‰Ð¾ Ñ‚Ð°Ð±Ð»Ð¸Ñ†ÑŒ Ñ‰Ðµ Ð½ÐµÐ¼Ð°Ñ” â€”
-- ÑÐ¿Ð¾Ñ‡Ð°Ñ‚ÐºÑƒ Ð·Ð°ÑÑ‚Ð¾ÑÑƒÐ¹Ñ‚Ðµ Ð²ÑÑ– Ñ„Ð°Ð¹Ð»Ð¸ migrations Ð¿Ð¾ Ð¿Ð¾Ñ€ÑÐ´ÐºÑƒ, Ð¿Ð¾Ñ‚Ñ–Ð¼ Ñ†ÐµÐ¹ Ñ„Ð°Ð¹Ð»).
-- ============================================================

-- ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ñ–Ñ— (ÑÐºÑ‰Ð¾ Ð¿Ð¾Ñ€Ð¾Ð¶Ð½ÑŒÐ¾)
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Ð‘ÑƒÐ´Ñ–Ð²Ð½Ð¸Ñ†Ñ‚Ð²Ð¾', 'construction', 'ðŸ—ï¸', 'ÐÐ¾Ð²Ðµ Ð±ÑƒÐ´Ñ–Ð²Ð½Ð¸Ñ†Ñ‚Ð²Ð¾'),
  ('Ð ÐµÐ¼Ð¾Ð½Ñ‚', 'renovation', 'ðŸ”¨', 'Ð ÐµÐ¼Ð¾Ð½Ñ‚ Ñ– Ñ€ÐµÐºÐ¾Ð½ÑÑ‚Ñ€ÑƒÐºÑ†Ñ–Ñ'),
  ('Ð•Ð»ÐµÐºÑ‚Ñ€Ð¸ÐºÐ°', 'electrical', 'âš¡', 'Ð•Ð»ÐµÐºÑ‚Ñ€Ð¾Ð¼Ð¾Ð½Ñ‚Ð°Ð¶'),
  ('Ð¡Ð°Ð½Ñ‚ÐµÑ…Ð½Ñ–ÐºÐ°', 'plumbing', 'ðŸš¿', 'Ð¡Ð°Ð½Ñ‚ÐµÑ…Ð½Ñ–Ñ‡Ð½Ñ– Ñ€Ð¾Ð±Ð¾Ñ‚Ð¸'),
  ('ÐœÐ°Ð¹ÑÑ‚ÐµÑ€ Ð½Ð° Ð³Ð¾Ð´Ð¸Ð½Ñƒ', 'handyman', 'ðŸ› ï¸', 'Ð”Ñ€Ñ–Ð±Ð½Ñ– Ñ€Ð¾Ð±Ð¾Ñ‚Ð¸'),
  ('ÐœÐ°Ñ‚ÐµÑ€Ñ–Ð°Ð»Ð¸', 'materials', 'ðŸªµ', 'ÐœÐ°Ñ‚ÐµÑ€Ñ–Ð°Ð»Ð¸'),
  ('Ð†Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ð¸', 'tools', 'ðŸ”§', 'Ð†Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ð¸')
ON CONFLICT (slug) DO NOTHING;

-- Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ° Ð¿Ð»Ð°Ñ‚Ñ„Ð¾Ñ€Ð¼Ð¸ (Ð¾Ð´Ð¸Ð½ Ñ€ÑÐ´Ð¾Ðº)
INSERT INTO app_site_stats (id, total_visits, total_listings_created, total_professionals)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- ÐŸÐµÑ€ÐµÐ²Ñ–Ñ€ÐºÐ°
SELECT 'categories' AS tbl, COUNT(*)::int AS cnt FROM categories
UNION ALL
SELECT 'app_site_stats', COUNT(*)::int FROM app_site_stats;

