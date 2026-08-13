export type LocalizedText = Record<string, string> & {
  en: string
}

export type CategorySeoMeta = {
  title: LocalizedText
  description: LocalizedText
}

export type ServiceSubcategory = {
  id: string
  slug: string
  title: LocalizedText
  description: LocalizedText
  image: string
  icon: string
  seo: CategorySeoMeta
}

export type ServiceCategory = {
  id: string
  slug: string
  icon: string
  title: LocalizedText
  description: LocalizedText
  image: string
  serviceCount: number
  subcategories: ServiceSubcategory[]
  /** When set, chips open this path instead of /services/:slug (e.g. /sell-rent, /vacancies). */
  href?: string
}

export const categoriesUiText = {
  eyebrow: { en: 'Service categories' },
  title: { en: 'Find the right service faster' },
  subtitle: {
    en: 'Browse DImarket services by category, expand a card, and jump straight to matching professionals.',
  },
  searchPlaceholder: { en: 'Search services...' },
  locationLabel: { en: 'Location' },
  popularSearchesLabel: { en: 'Popular searches' },
  noResults: { en: 'No services found. Try another search.' },
  servicesLabel: { en: 'services' },
  openCategory: { en: 'Open category' },
  closeCategory: { en: 'Close category' },
}

export const popularCategorySearches = [
  { id: 'electrician', label: { en: 'Electrician' }, query: 'Electrician' },
  { id: 'plumber', label: { en: 'Plumber' }, query: 'Plumber' },
  { id: 'renovation', label: { en: 'Renovation' }, query: 'Renovation' },
  { id: 'buy-sell', label: { en: 'Buy & Sell' }, query: 'Buy & Sell' },
  { id: 'jobs', label: { en: 'Jobs' }, query: 'Jobs' },
  { id: 'official-documents', label: { en: 'Official Documents' }, query: 'Official Documents' },
  { id: 'architect', label: { en: 'Architect' }, query: 'Architect' },
  { id: 'accountant', label: { en: 'Accountant' }, query: 'Accountant' },
  { id: 'lawyer', label: { en: 'Lawyer' }, query: 'Lawyer' },
]

export const categoryLocationOptions = [
  { id: 'all-europe', label: { en: 'All Europe' } },
  { id: 'germany', label: { en: 'Germany' } },
  { id: 'spain', label: { en: 'Spain' } },
  { id: 'poland', label: { en: 'Poland' } },
  { id: 'slovakia', label: { en: 'Slovakia' } },
  { id: 'romania', label: { en: 'Romania' } },
  { id: 'france', label: { en: 'France' } },
  { id: 'italy', label: { en: 'Italy' } },
]

const text = (en: string): LocalizedText => ({ en })

const image = (slug: string) =>
  `https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=72&ixid=dimarket-${slug}`

const seo = (title: string, parent: string): CategorySeoMeta => ({
  title: text(`${title} professionals | ${parent} | DImarket`),
  description: text(`Find verified ${title.toLowerCase()} specialists for ${parent.toLowerCase()} projects across Europe.`),
})

const sub = (
  parent: string,
  icon: string,
  title: string,
  slug?: string,
  description?: string,
): ServiceSubcategory => {
  const resolvedSlug = slug ?? title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id: resolvedSlug,
    slug: resolvedSlug,
    title: text(title),
    description: text(description ?? `${title} services for residential and commercial projects.`),
    image: image(resolvedSlug),
    icon,
    seo: seo(title, parent),
  }
}

const category = (
  id: string,
  icon: string,
  title: string,
  description: string,
  subcategories: ServiceSubcategory[],
  extras?: { href?: string },
): ServiceCategory => ({
  id,
  slug: id,
  icon,
  title: text(title),
  description: text(description),
  image: image(id),
  serviceCount: subcategories.length,
  subcategories,
  href: extras?.href,
})

export const serviceCategories: ServiceCategory[] = [
  category('specialists', '👷', 'Specialists', 'Verified tradespeople for installation, repair, and finishing work.', [
    sub('Specialists', '⚡', 'Electrician'),
    sub('Specialists', '💧', 'Plumber'),
    sub('Specialists', '🔧', 'Installer'),
    sub('Specialists', '🧱', 'Mason'),
    sub('Specialists', '🏗', 'Concrete Worker'),
    sub('Specialists', '🔥', 'Welder'),
    sub('Specialists', '🏠', 'Roofer'),
    sub('Specialists', '🎨', 'Painter'),
    sub('Specialists', '⬛', 'Tiler'),
    sub('Specialists', '🪚', 'Carpenter'),
    sub('Specialists', '📐', 'Architect & Designer'),
  ]),
  category(
    'buy-sell',
    '🛒',
    'Buy & Sell',
    'Marketplace for selling, buying, and renting equipment, materials, and property.',
    [
      sub('Buy & Sell', '🏷', 'For Sale', 'buy-sell-for-sale', 'Items and materials listed for sale.'),
      sub('Buy & Sell', '🔍', 'Wanted', 'buy-sell-wanted', 'Wanted / looking-to-buy listings.'),
      sub(
        'Buy & Sell',
        '🏗',
        'Equipment Rental',
        'buy-sell-equipment-rental',
        'Construction equipment and tool rentals.',
      ),
      sub('Buy & Sell', '🏠', 'Property', 'buy-sell-property', 'Property sale and rental listings.'),
    ],
    { href: '/sell-rent' },
  ),
  category(
    'jobs',
    '💼',
    'Jobs',
    'Job vacancies and hiring offers across construction and home services.',
    [
      sub('Jobs', '📋', 'Vacancies', 'jobs-vacancies', 'Open vacancies from companies and pros.'),
      sub('Jobs', '👷', 'Hiring Trades', 'jobs-hiring', 'Hiring electricians, plumbers, and other trades.'),
    ],
    { href: '/vacancies' },
  ),
  category(
    'official-documents',
    '📜',
    'Official Documents',
    'Verified pointers to official government sources. Not silent AI legal rewrite.',
    [
      sub(
        'Official Documents',
        '🇪🇺',
        'Legislation entry points',
        'official-documents-legislation',
        'Official gazette and government legislation portals by country.',
      ),
      sub(
        'Official Documents',
        '🏠',
        'Rental information hubs',
        'official-documents-rental',
        'Informational rental hubs linking to official sources only.',
      ),
      sub(
        'Official Documents',
        '✅',
        'Freshness & verification',
        'official-documents-freshness',
        'How DImarket monitors official sources and versions.',
      ),
    ],
    { href: '/category/official-documents' },
  ),
  category('renovation', '🏠', 'Renovation', 'Home and business renovation services from planning to handover.', [
    sub('Renovation', '🏡', 'Home Renovation'),
    sub('Renovation', '🛁', 'Bathroom'),
    sub('Renovation', '🍳', 'Kitchen'),
    sub('Renovation', '🏢', 'Office'),
    sub('Renovation', '🏊', 'Pool'),
    sub('Renovation', '🏛', 'Facade'),
    sub('Renovation', '✨', 'Full Renovation'),
  ]),
  category('construction', '🏗', 'Construction', 'Construction teams for residential, commercial, and structural work.', [
    sub('Construction', '🏡', 'House Construction'),
    sub('Construction', '🏬', 'Commercial Construction'),
    sub('Construction', '🧱', 'Foundations'),
    sub('Construction', '🏗', 'Concrete Works'),
    sub('Construction', '🚜', 'Earthworks'),
    sub('Construction', '💥', 'Demolition'),
    sub('Construction', '🏘', 'Modular Houses'),
  ]),
  category('hvac', '❄', 'HVAC', 'Heating, cooling, ventilation, and climate system services.', [
    sub('HVAC', '❄', 'Air Conditioning'),
    sub('HVAC', '🔥', 'Heat Pumps'),
    sub('HVAC', '🌬', 'Ventilation'),
    sub('HVAC', '♨', 'Underfloor Heating'),
    sub('HVAC', '🛠', 'HVAC Service'),
  ]),
  category('garden', '🌳', 'Garden', 'Outdoor, garden, landscaping, and pool maintenance services.', [
    sub('Garden', '🌿', 'Landscaping'),
    sub('Garden', '🌱', 'Lawn'),
    sub('Garden', '💦', 'Irrigation'),
    sub('Garden', '🌳', 'Tree Care'),
    sub('Garden', '🏊', 'Pools'),
    sub('Garden', '🧤', 'Garden Maintenance'),
  ]),
  category('cleaning', '🧹', 'Cleaning', 'Cleaning crews for homes, offices, windows, and post-build sites.', [
    sub('Cleaning', '🏠', 'House Cleaning'),
    sub('Cleaning', '🏢', 'Office Cleaning'),
    sub('Cleaning', '🏗', 'Post Construction Cleaning'),
    sub('Cleaning', '🪟', 'Window Cleaning'),
    sub('Cleaning', '🗑', 'Waste Removal'),
  ]),
  category('security', '🔒', 'Security', 'Security, monitoring, access, and fire protection solutions.', [
    sub('Security', '📹', 'CCTV'),
    sub('Security', '🚨', 'Alarm Systems'),
    sub('Security', '🧯', 'Fire Protection'),
    sub('Security', '🪪', 'Access Control'),
  ]),
  category('moving', '🚛', 'Moving', 'Moving, transport, and removal services for homes and offices.', [
    sub('Moving', '🏠', 'Apartment Moving'),
    sub('Moving', '🏢', 'Office Moving'),
    sub('Moving', '💪', 'Movers'),
    sub('Moving', '🚚', 'Transport'),
    sub('Moving', '🗑', 'Waste Removal'),
  ]),
  category('stores', '🛒', 'Stores', 'Suppliers and shops for construction, interiors, and equipment.', [
    sub('Stores', '🧱', 'Building Materials'),
    sub('Stores', '⚡', 'Electrical Supplies'),
    sub('Stores', '💧', 'Plumbing Supplies'),
    sub('Stores', '🛠', 'Tools'),
    sub('Stores', '🪑', 'Furniture'),
    sub('Stores', '💡', 'Lighting'),
    sub('Stores', '🌳', 'Garden Equipment'),
  ]),
  category('manufacturers', '🏭', 'Manufacturers', 'Manufacturers for custom building and interior products.', [
    sub('Manufacturers', '🪑', 'Furniture Manufacturers'),
    sub('Manufacturers', '🪟', 'Window Manufacturers'),
    sub('Manufacturers', '🚪', 'Door Manufacturers'),
    sub('Manufacturers', '🏗', 'Metal Structures'),
    sub('Manufacturers', '🧱', 'Concrete Products'),
  ]),
  category(
    'commercial-agents',
    '🤝',
    'Commercial Agents',
    'B2B network: find manufacturers seeking representation or commercial agents for your brand.',
    [
      sub(
        'Commercial Agents',
        '🏭',
        'Find Manufacturers',
        'commercial-agents-manufacturers',
        'Manufacturers looking for independent commercial representatives.',
      ),
      sub(
        'Commercial Agents',
        '🤵',
        'Find Agents',
        'commercial-agents-representatives',
        'Commercial agents available for new brands and territories.',
      ),
      sub(
        'Commercial Agents',
        '📋',
        'Opportunities',
        'commercial-agents-opportunities',
        'Open representation mandates by country and category.',
      ),
    ],
    { href: '/commercial-agents' },
  ),
  category('rentals', '📦', 'Rentals', 'Rental services for tools, equipment, vehicles, and power systems.', [
    sub('Rentals', '🚜', 'Construction Equipment'),
    sub('Rentals', '🛠', 'Tool Rental'),
    sub('Rentals', '🚗', 'Car Rental'),
    sub('Rentals', '🚚', 'Trailer Rental'),
    sub('Rentals', '⚡', 'Generator Rental'),
  ]),
  category('automotive', '🚗', 'Automotive', 'Vehicle repair, diagnostics, towing, and tire services.', [
    sub('Automotive', '🔧', 'Auto Repair'),
    sub('Automotive', '⚡', 'Auto Electrician'),
    sub('Automotive', '🚘', 'Body Repair'),
    sub('Automotive', '🛞', 'Tire Service'),
    sub('Automotive', '🪝', 'Towing'),
  ]),
  category('home-services', '👨‍👩‍👧', 'Home Services', 'Everyday home help, repairs, and assembly tasks.', [
    sub('Home Services', '🛠', 'Handyman'),
    sub('Home Services', '🪑', 'Furniture Assembly'),
  ]),
  category('accounting-finance', '💰', 'Accounting & Finance', 'Accounting, tax, payroll, audit, and business advisory services.', [
    sub('Accounting & Finance', '📊', 'Accountant'),
    sub('Accounting & Finance', '🧾', 'Tax Consultant'),
    sub('Accounting & Finance', '🔍', 'Auditor'),
    sub('Accounting & Finance', '💼', 'Financial Consultant'),
    sub('Accounting & Finance', '👥', 'Payroll'),
    sub('Accounting & Finance', '🇪🇸', 'Autónomo Accounting'),
    sub('Accounting & Finance', '📈', 'Business Consulting'),
  ]),
  category('real-estate', '🏢', 'Real Estate', 'Property services for buyers, sellers, tenants, and investors.', [
    sub('Real Estate', '🏡', 'Buy Property'),
    sub('Real Estate', '🏷', 'Sell Property'),
    sub('Real Estate', '🔑', 'Rent Property'),
    sub('Real Estate', '🏬', 'Commercial Property'),
    sub('Real Estate', '🌄', 'Land'),
  ]),
  category('architecture-design', '📐', 'Architecture & Design', 'Design, visualization, BIM, interiors, and landscape planning.', [
    sub('Architecture & Design', '📐', 'Architect'),
    sub('Architecture & Design', '🛋', 'Interior Designer'),
    sub('Architecture & Design', '🌳', 'Landscape Designer'),
    sub('Architecture & Design', '🧊', '3D Visualization'),
    sub('Architecture & Design', '🏛', 'Building Design'),
    sub('Architecture & Design', '🧩', 'BIM Design'),
  ]),
  category('engineering', '📋', 'Engineering', 'Technical experts for planning, surveys, audits, and supervision.', [
    sub('Engineering', '🏗', 'Structural Engineer'),
    sub('Engineering', '📏', 'Surveyor'),
    sub('Engineering', '🪨', 'Geologist'),
    sub('Engineering', '⚡', 'Energy Audit'),
    sub('Engineering', '✅', 'Technical Supervision'),
  ]),
  category('legal-services', '⚖', 'Legal Services', 'Legal, notary, immigration, registration, and tax-law services.', [
    sub('Legal Services', '⚖', 'Lawyer'),
    sub('Legal Services', '👩‍⚖️', 'Attorney'),
    sub('Legal Services', '📜', 'Notary'),
    sub('Legal Services', '🛂', 'Immigration Lawyer'),
    sub('Legal Services', '🏢', 'Company Registration'),
    sub('Legal Services', '🏛', 'Court Representation'),
    sub('Legal Services', '🧾', 'Tax Lawyer'),
  ]),
]
