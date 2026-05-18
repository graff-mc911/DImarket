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
  ('Construction', 'construction', '🏗️', 'New construction and building projects'),
  ('Renovation', 'renovation', '🔨', 'Home renovation and remodeling'),
  ('Electrical', 'electrical', '⚡', 'Electrical work and repairs'),
  ('Plumbing', 'plumbing', '🚿', 'Plumbing services and installations'),
  ('Handyman', 'handyman', '🛠️', 'General handyman services'),
  ('Materials', 'materials', '🪵', 'Building materials for sale'),
  ('Tools', 'tools', '🔧', 'Tools and equipment')
ON CONFLICT (slug) DO NOTHING;
