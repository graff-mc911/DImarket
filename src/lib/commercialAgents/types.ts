/** Commercial Agents — shared types (client-side; mirrors SQL). */

export type VerificationStatus = 'unverified' | 'pending' | 'verified'

export type OpportunityStatus = 'draft' | 'published' | 'paused' | 'closed'

export type ApplicationStatus =
  | 'pending'
  | 'viewed'
  | 'shortlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'fake_company'
  | 'incorrect_information'
  | 'abuse'
  | 'other'

export type ManufacturerProfile = {
  id: string
  profile_id: string
  slug: string
  company_name: string
  logo_url: string | null
  description: string
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
  verification_status: VerificationStatus
  is_published: boolean
  created_at: string
  updated_at: string
}

export type AgentProfile = {
  id: string
  profile_id: string
  slug: string
  full_name: string
  profile_photo_url: string | null
  company_name: string | null
  description: string
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
  verification_status: VerificationStatus
  is_published: boolean
  created_at: string
  updated_at: string
}

export type RepresentationOpportunity = {
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
  status: OpportunityStatus
  created_at: string
  updated_at: string
  manufacturer?: ManufacturerProfile | null
}

export type RepresentationApplication = {
  id: string
  opportunity_id: string
  agent_id: string
  manufacturer_id: string
  message: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

export type AgentInvitation = {
  id: string
  manufacturer_id: string
  agent_id: string
  opportunity_id: string | null
  message: string
  status: InvitationStatus
  created_at: string
  updated_at: string
}

export type CommercialSearchFilters = {
  query: string
  country: string
  category: string
  language: string
  verifiedOnly: boolean
  exclusive: '' | 'exclusive' | 'non_exclusive'
  remote: '' | 'remote' | 'local'
  availableOnly: boolean
  minExperience: number | null
}

export const EMPTY_COMMERCIAL_FILTERS: CommercialSearchFilters = {
  query: '',
  country: '',
  category: '',
  language: '',
  verifiedOnly: false,
  exclusive: '',
  remote: '',
  availableOnly: false,
  minExperience: null,
}

export type MatchBreakdown = {
  country: number
  industry: number
  category: number
  experience: number
  language: number
  territory: number
  customerType: number
  representationType: number
}

export type MatchResult = {
  score: number
  label: 'excellent' | 'good' | 'potential'
  breakdown: MatchBreakdown
}
