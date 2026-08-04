#!/usr/bin/env node
/**
 * Builds curated public business directory seed files for DImarket launch markets.
 *
 * Policy:
 * - Only publicly listed factual fields (name, category, location, website, phone, email, address, hours, services)
 * - Original DImarket bios/SEO — never copied marketing copy, reviews, ratings, or images
 * - Auth claim emails use directory+{slug}@users.dimarket.app (not the business public email)
 *
 * Usage: node scripts/build-public-directory-seed.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SPAIN_EXPANSION } from './spain-directory-expansion-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../data/directory')
mkdirSync(outDir, { recursive: true })

/** @typedef {{
 *  slug: string
 *  full_name: string
 *  user_role: 'company' | 'professional'
 *  categories: string[]
 *  work_subcategory_slugs: string[]
 *  city: string
 *  region: string
 *  country: string
 *  country_code: string
 *  address?: string | null
 *  phone?: string | null
 *  public_email?: string | null
 *  website?: string | null
 *  business_hours?: string | null
 *  services: string[]
 *  languages: string[]
 *  bio: string
 *  sources: string[]
 * }} RawBusiness */

/** @type {RawBusiness[]} */
const RAW = [
  ...SPAIN_EXPANSION,
  // ── Darmstadt / Germany ──────────────────────────────────────────
  {
    slug: 'stark-elektro-darmstadt',
    full_name: 'Stark Elektro',
    user_role: 'company',
    categories: ['Electrician'],
    work_subcategory_slugs: [
      'electro-wiring',
      'electro-rewiring',
      'electro-panels',
      'electro-lighting',
      'electro-smart-home',
      'solar-panels',
      'solar-installation',
      'smart-home-systems',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: 'Moltkestraße 21, 64295 Darmstadt',
    phone: '+49 177 6988882',
    public_email: 'info@stark-elektro.de',
    website: 'https://stark-elektro.de/',
    business_hours: 'Mon–Fri 08:00–17:00',
    services: [
      'Electrical installation',
      'Rewiring and renovation electrics',
      'Photovoltaic systems',
      'Wallbox / EV charging',
      'Smart home and network cabling',
      'Electrical planning',
    ],
    languages: ['de', 'en'],
    bio: 'Master electrician company based in Darmstadt serving the Rhine-Main area. Publicly listed services cover electrical installation and renovation, photovoltaic systems, EV wallboxes, and smart-home wiring for residential and commercial clients.',
    sources: ['https://stark-elektro.de/'],
  },
  {
    slug: 'heinrich-schmid-darmstadt',
    full_name: 'Heinrich Schmid GmbH & Co. KG — Darmstadt',
    user_role: 'company',
    categories: [
      'Painting',
      'Drywall',
      'Flooring',
      'Tiles',
      'Plastering',
      'Insulation',
      'Renovation',
    ],
    work_subcategory_slugs: [
      'painting-walls',
      'painting-facade',
      'drywall-install',
      'drywall-partitions',
      'flooring-parquet',
      'flooring-laminate',
      'flooring-screed',
      'tiling-install',
      'plastering-manual',
      'facade-insulation',
      'insulation-thermal',
      'facade-repair',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: 'Gräfenhäuser Straße 36, 64293 Darmstadt',
    phone: '+49 6151 1301912',
    public_email: 'darmstadt@heinrich-schmid.de',
    website: 'https://www.heinrich-schmid.com/standorte/darmstadt-273/',
    business_hours: null,
    services: [
      'Painting',
      'Drywall',
      'Flooring and screed',
      'Tiling',
      'Plaster and stucco',
      'Facade renovation',
      'Thermal insulation',
      'Project coordination',
    ],
    languages: ['de', 'en'],
    bio: 'Regional branch of a German trades company in Darmstadt. Public location lists painting, drywall, flooring, tiling, plaster, facade renovation, and insulation for residential and commercial interiors.',
    sources: ['https://www.heinrich-schmid.com/standorte/darmstadt-273/'],
  },
  {
    slug: 'patrick-noel-malerhandwerk-darmstadt',
    full_name: 'Patrick Noël Malerhandwerk GmbH',
    user_role: 'company',
    categories: ['Painting', 'Plastering', 'Demolition', 'Renovation'],
    work_subcategory_slugs: [
      'painting-walls',
      'painting-ceiling',
      'painting-facade',
      'plastering-manual',
      'demolition-walls',
      'demolition-partitions',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: 'In der Kirchtanne 27, 64297 Darmstadt',
    phone: '+49 6151 5013326',
    public_email: 'info@noel-malerhandwerk.de',
    website: 'https://www.noel-malerhandwerk.de/',
    business_hours: null,
    services: ['Painting and coating', 'Interior finishing', 'Selective demolition / strip-out', 'Damage-related renovation support'],
    languages: ['de'],
    bio: 'Registered painting trades company in Darmstadt-Eberstadt. Public impressum lists painting and related finishing work, with selective demolition and renovation support for private and commercial properties.',
    sources: [
      'https://www.noel-malerhandwerk.de/impressum',
      'https://www.noel-malerhandwerk.de/kontakt',
    ],
  },
  {
    slug: 'kraft-gmbh-darmstadt',
    full_name: 'Kraft GmbH Darmstadt',
    user_role: 'company',
    categories: ['Painting', 'Drywall', 'Renovation', 'Construction Company'],
    work_subcategory_slugs: [
      'painting-walls',
      'painting-ceiling',
      'drywall-install',
      'plastering-manual',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: 'Messeler-Park-Straße 119 A, 64291 Darmstadt',
    phone: '+49 6151 384170',
    public_email: null,
    website: 'https://www.kraft-gmbh-darmstadt.de/',
    business_hours: null,
    services: ['Interior painting', 'Finishing trades', 'Renovation of living and work spaces'],
    languages: ['de'],
    bio: 'Darmstadt finishing trades company with a public workshop address in the Messeler Park area. Listed services focus on interior painting and renovation of residential and commercial rooms.',
    sources: ['https://www.kraft-gmbh-darmstadt.de/'],
  },
  {
    slug: 'zimmermann-und-sohn-darmstadt',
    full_name: 'Zimmermann & Sohn GmbH',
    user_role: 'company',
    categories: [
      'Painting',
      'Plastering',
      'Drywall',
      'Flooring',
      'Tiles',
      'Insulation',
      'Renovation',
    ],
    work_subcategory_slugs: [
      'painting-walls',
      'painting-facade',
      'plastering-manual',
      'plastering-decorative',
      'drywall-install',
      'flooring-parquet',
      'tiling-install',
      'facade-insulation',
      'wallpaper-install',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: 'Marienburgstraße 1, 64297 Darmstadt',
    phone: '+49 6151 46297',
    public_email: null,
    website: 'https://zimmermannundsohn.de/',
    business_hours: null,
    services: [
      'Painting and wallpapering',
      'Plastering',
      'Drywall',
      'Flooring and tiling',
      'Facade renovation',
      'Thermal insulation',
      'Heritage restoration support',
    ],
    languages: ['de'],
    bio: 'Long-established painting and finishing company in Darmstadt. Public site lists painting, plastering, drywall, flooring, tiling, facade work, and insulation for renovation and heritage-related projects.',
    sources: ['https://zimmermannundsohn.de/'],
  },
  {
    slug: 'domenico-di-santo-malerbetrieb-darmstadt',
    full_name: 'Domenico Di Santo Malerbetrieb',
    user_role: 'professional',
    categories: ['Painting', 'Plastering', 'Drywall', 'Flooring', 'Renovation'],
    work_subcategory_slugs: [
      'painting-walls',
      'painting-ceiling',
      'plastering-manual',
      'drywall-install',
      'flooring-laminate',
      'wallpaper-install',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: null,
    phone: null,
    public_email: null,
    website: 'https://www.disanto-domenico.de/malerbetrieb-darmstadt/',
    business_hours: null,
    services: ['Painting', 'Wallpapering', 'Plastering', 'Drywall', 'Floor covering'],
    languages: ['de'],
    bio: 'Family-run painting business serving Darmstadt and nearby towns. Publicly described services include painting, wallpapering, plastering, drywall, and floor covering for private, commercial, and institutional clients.',
    sources: ['https://www.disanto-domenico.de/malerbetrieb-darmstadt/'],
  },
  {
    slug: 'bp-bau-darmstadt',
    full_name: 'B&P Bau',
    user_role: 'company',
    categories: [
      'Construction Company',
      'Renovation',
      'Electrician',
      'Plumbing',
      'HVAC',
      'Painting',
    ],
    work_subcategory_slugs: [
      'masonry-partitions',
      'painting-walls',
      'painting-facade',
      'electro-wiring',
      'plumbing-install',
      'hvac-ac',
      'drywall-install',
    ],
    city: 'Darmstadt',
    region: 'Hessen',
    country: 'Germany',
    country_code: 'DE',
    address: null,
    phone: null,
    public_email: null,
    website: 'https://www.b-pbau.de/',
    business_hours: null,
    services: [
      'New build and renovation',
      'Interior fit-out',
      'Facade and painting',
      'Electrical works',
      'Sanitary and climate systems',
    ],
    languages: ['de'],
    bio: 'Construction and renovation company headquartered in Darmstadt. Public service list covers new build and renovation, interior fit-out, facade and painting work, plus electrical, sanitary, and climate trades.',
    sources: ['https://www.b-pbau.de/'],
  },

  // ── Alicante / Spain ─────────────────────────────────────────────
  {
    slug: 'reformas-alacant',
    full_name: 'Reformas Alacant',
    user_role: 'company',
    categories: [
      'Renovation',
      'Plumbing',
      'Electrician',
      'Painting',
      'Drywall',
      'Doors',
      'Demolition',
    ],
    work_subcategory_slugs: [
      'plumbing-install',
      'plumbing-showers',
      'electro-wiring',
      'electro-lighting',
      'painting-walls',
      'drywall-install',
      'drywall-suspended-ceiling',
      'carpentry-doors-install',
      'masonry-partitions',
      'tiling-bathroom',
      'tiling-kitchen',
      'demolition-partitions',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: null,
    phone: '+34 634 579 438',
    public_email: null,
    website: 'https://reformasalacant.es/',
    business_hours: null,
    services: [
      'Full apartment renovations',
      'Kitchen and bathroom renovations',
      'Plumbing and electrical',
      'Carpentry and drywall',
      'Painting and finishes',
      'Commercial premises fit-out',
    ],
    languages: ['es', 'en'],
    bio: 'Alicante renovation company coordinating in-house plumbing, electrical, carpentry, drywall, masonry, and painting trades. Public contact lists full-home, kitchen, bathroom, and commercial premises renovations across the city.',
    sources: ['https://reformasalacant.es/'],
  },
  {
    slug: 'carbonell-reformas-alicante',
    full_name: 'Carbonell Reformas Alicante',
    user_role: 'company',
    categories: ['Renovation', 'Plumbing', 'Electrician', 'Tiles', 'Interior Design'],
    work_subcategory_slugs: [
      'plumbing-install',
      'electro-wiring',
      'tiling-bathroom',
      'tiling-kitchen',
      'painting-walls',
      'carpentry-doors-install',
      'design-engineering-interior',
      'demolition-partitions',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: null,
    phone: '+34 966 262 802',
    public_email: null,
    website: 'https://carbonellreformasalicante.com/',
    business_hours: 'Mon–Sat 09:00–20:30',
    services: [
      'Full flat renovations',
      'Bathroom renovations',
      'Kitchen renovations',
      'Facade rehabilitation',
      'Commercial and office fit-out',
    ],
    languages: ['es', 'en'],
    bio: 'Alicante renovation firm established around 2010. Public listings cover full-flat, bathroom, and kitchen renovations plus facade and commercial fit-out work, with published weekday and Saturday hours.',
    sources: ['https://carbonellreformasalicante.com/'],
  },
  {
    slug: 'urbasan-alicante',
    full_name: 'Urbasan Reformas & Interiorismo',
    user_role: 'company',
    categories: ['Renovation', 'Interior Design', 'Tiles', 'Plumbing', 'Electrician'],
    work_subcategory_slugs: [
      'design-engineering-interior',
      'tiling-bathroom',
      'tiling-kitchen',
      'plumbing-install',
      'electro-wiring',
      'painting-walls',
      'carpentry-doors-install',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle San Agatángelo 13, 03007 Alicante',
    phone: '+34 965 133 046',
    public_email: 'info@urbasan.com',
    website: 'https://www.urbasan.com/',
    business_hours: null,
    services: [
      'Turnkey renovations',
      'Kitchen renovations',
      'Bathroom renovations',
      'Interior design coordination',
    ],
    languages: ['es'],
    bio: 'Alicante renovation and interior-design company with a public showroom address on Calle San Agatángelo. Listed work includes turnkey home renovations plus kitchen and bathroom projects.',
    sources: ['https://www.urbasan.com/'],
  },
  {
    slug: 'multihogar-alicante',
    full_name: 'MultiHogar Alicante',
    user_role: 'company',
    categories: ['Plumbing', 'Electrician', 'Windows'],
    work_subcategory_slugs: [
      'plumbing-repair',
      'plumbing-install',
      'electro-wiring',
      'electro-outlets',
      'electro-lighting',
      'windows-repair',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle Xixona 16, El Campello, Alicante',
    phone: '+34 627 378 977',
    public_email: null,
    website: 'https://multihogaralicante.es/',
    business_hours: null,
    services: [
      'Emergency plumbing',
      'Authorized electrical repairs and renovations',
      'Blind and shutter repairs',
      'Home maintenance call-outs',
    ],
    languages: ['es'],
    bio: 'Home services company based in El Campello (Alicante province). Public contact lists plumbing, authorized electrical work, shutter repairs, and general residential call-outs.',
    sources: [
      'https://multihogaralicante.es/',
      'https://multihogaralicante.es/contacto/',
    ],
  },
  {
    slug: 'explanada-reformas-alicante',
    full_name: 'Explanada Reformas',
    user_role: 'company',
    categories: ['Renovation', 'Construction Company'],
    work_subcategory_slugs: [
      'masonry-partitions',
      'plumbing-install',
      'electro-wiring',
      'painting-walls',
      'tiling-install',
      'flooring-laminate',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle Jacinto Maltés 28, 03012 Alicante',
    phone: '+34 865 443 420',
    public_email: null,
    website: 'https://reformasintegralesalicante.pro/',
    business_hours: null,
    services: ['Full home renovations', 'Commercial premises renovations', 'Second-home renovations'],
    languages: ['es'],
    bio: 'Alicante renovation company with a public office on Calle Jacinto Maltés. Listed projects cover full residential renovations, commercial premises, and second homes in Alicante and nearby areas.',
    sources: ['https://reformasintegralesalicante.pro/'],
  },
  {
    slug: 'coypa-fontaneria-reformas-alicante',
    full_name: 'Coypa Reformas y Fontanería Alicante',
    user_role: 'company',
    categories: ['Plumbing', 'Renovation', 'Electrician', 'HVAC'],
    work_subcategory_slugs: [
      'plumbing-install',
      'plumbing-repair',
      'plumbing-showers',
      'electro-wiring',
      'hvac-ac',
      'tiling-bathroom',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: "Calle Nou d'Octubre, 03012 Alicante",
    phone: null,
    public_email: null,
    website: 'https://fontaneriayreformasalicante.com/',
    business_hours: null,
    services: [
      'Plumbing repairs and bathroom renovations',
      'Electrical interventions',
      'Air-conditioning related works',
      'Vertical / height-access interventions',
    ],
    languages: ['es'],
    bio: 'Alicante plumbing and renovation company with a public address on Calle Nou d’Octubre. Services listed include bathroom renovations, plumbing repairs, electrical work, and air-conditioning interventions.',
    sources: ['https://fontaneriayreformasalicante.com/'],
  },
  {
    slug: 'reformas-esquivel-alicante',
    full_name: 'Reformas Esquivel',
    user_role: 'professional',
    categories: ['Plumbing', 'Painting', 'Renovation', 'Tiles', 'Doors', 'Windows'],
    work_subcategory_slugs: [
      'plumbing-repair',
      'plumbing-install',
      'plumbing-showers',
      'painting-walls',
      'tiling-install',
      'masonry-partitions',
      'carpentry-doors-install',
      'windows-install',
    ],
    city: 'Alicante',
    region: 'Valencia',
    country: 'Spain',
    country_code: 'ES',
    address: null,
    phone: null,
    public_email: null,
    website: 'https://www.reformasesquivel.com/',
    business_hours: null,
    services: [
      'Plumbing repairs and installations',
      'Masonry and tiling',
      'Painting',
      'Door and window fitting',
    ],
    languages: ['es'],
    bio: 'Independent renovation trades business serving Alicante. Public service list includes plumbing, masonry, tiling, painting, and door/window fitting for residential clients.',
    sources: ['https://www.reformasesquivel.com/'],
  },

  // ── Madrid / Spain ───────────────────────────────────────────────
  {
    slug: 'refiser-madrid',
    full_name: 'REFISER — Obras y Reformas',
    user_role: 'company',
    categories: [
      'Renovation',
      'Plumbing',
      'Electrician',
      'Painting',
      'Construction Company',
    ],
    work_subcategory_slugs: [
      'masonry-partitions',
      'plumbing-install',
      'plumbing-repair',
      'plumbing-heating',
      'electro-wiring',
      'electro-outlets',
      'painting-walls',
      'carpentry-doors-install',
    ],
    city: 'Madrid',
    region: 'Madrid',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle Ebanistería 3, 28037 Madrid',
    phone: '+34 638 419 932',
    public_email: null,
    website: 'https://refiser.com/',
    business_hours: null,
    services: [
      'Full renovations of homes and premises',
      'Masonry',
      'Plumbing and heating',
      'Electrical installation and repairs',
      'Painting and carpentry',
    ],
    languages: ['es'],
    bio: 'Madrid renovation and building-works company with a public office on Calle Ebanistería. Listed trades include masonry, plumbing, electrical work, painting, and carpentry for homes and commercial premises.',
    sources: ['https://refiser.com/'],
  },
  {
    slug: 'jm-reformas-elite-madrid',
    full_name: 'JM Reformas Élite S.L.',
    user_role: 'company',
    categories: [
      'Renovation',
      'Demolition',
      'Plumbing',
      'Electrician',
      'Painting',
      'Tiles',
    ],
    work_subcategory_slugs: [
      'demolition-partitions',
      'demolition-walls',
      'masonry-partitions',
      'plumbing-install',
      'electro-wiring',
      'painting-walls',
      'tiling-install',
      'carpentry-doors-install',
    ],
    city: 'Madrid',
    region: 'Madrid',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle Ricardo Beltrán y Rozpide 7, 28026 Madrid',
    phone: '+34 624 614 361',
    public_email: 'jmreformaselite@gmail.com',
    website: 'https://jmreformaselite.com/',
    business_hours: null,
    services: [
      'Full renovations',
      'Bathroom and kitchen renovations',
      'Demolition and masonry',
      'Plumbing and electrical',
      'Painting and tiling finishes',
    ],
    languages: ['es'],
    bio: 'Madrid renovation company (S.L.) with a published address in the south of the city. Public services span demolition, masonry, plumbing, electrical work, painting, tiling, and full home renovations.',
    sources: ['https://jmreformaselite.com/'],
  },
  {
    slug: 'reformas-multiservicios-moraga-madrid',
    full_name: 'Reformas y Multiservicios Moraga',
    user_role: 'company',
    categories: ['Plumbing', 'Renovation', 'Electrician', 'Painting', 'Flooring', 'Doors'],
    work_subcategory_slugs: [
      'plumbing-repair',
      'plumbing-boilers',
      'plumbing-showers',
      'electro-wiring',
      'painting-walls',
      'flooring-laminate',
      'carpentry-doors-install',
    ],
    city: 'Madrid',
    region: 'Madrid',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle Menasalbas 2, Madrid',
    phone: '+34 625 112 025',
    public_email: null,
    website: 'https://www.reformasymultiservicios.es/',
    business_hours: null,
    services: [
      'Plumbing call-outs and boiler work',
      'Bathroom renovations',
      'Kitchen renovations',
      'Electrical and painting works',
      'Floating floors and doors',
    ],
    languages: ['es'],
    bio: 'Madrid multi-service renovation and plumbing company with a public address on Calle Menasalbas. Listed work includes plumbing call-outs, bathroom and kitchen renovations, electrical work, painting, floors, and doors.',
    sources: ['https://www.reformasymultiservicios.es/'],
  },
  {
    slug: 'construcciones-carmona-madrid',
    full_name: 'Construcciones Carmona',
    user_role: 'company',
    categories: [
      'Construction Company',
      'Renovation',
      'Plumbing',
      'Electrician',
      'HVAC',
      'Painting',
      'Doors',
    ],
    work_subcategory_slugs: [
      'masonry-brick',
      'masonry-partitions',
      'plumbing-install',
      'electro-wiring',
      'hvac-ac',
      'painting-walls',
      'carpentry-doors-install',
      'carpentry-wood-structures',
    ],
    city: 'Madrid',
    region: 'Madrid',
    country: 'Spain',
    country_code: 'ES',
    address: 'Calle Prado Egido 40, 28492 Mataelpino (El Boalo), Madrid',
    phone: '+34 613 014 831',
    public_email: null,
    website: 'https://construccionesreformasmadrid.es/',
    business_hours: 'Mon–Fri 11:00–14:00 and 18:00–20:00',
    services: [
      'Full renovations of homes and premises',
      'Masonry',
      'Plumbing and electrical',
      'Carpentry',
      'Climate systems',
      'Painting and finishes',
    ],
    languages: ['es'],
    bio: 'Family construction and renovation company based in Mataelpino, covering Madrid city and the northwest sierra municipalities. Public hours and trades include masonry, plumbing, electrical, carpentry, climate, and painting.',
    sources: ['https://construccionesreformasmadrid.es/'],
  },
  ]

// Intentional: do not include aggregator-only firms without owned public contact pages.

/** Candidates reviewed but skipped for insufficient public contact/location facts. */
const SKIPPED = [
  {
    name: 'Generic yellow-pages painter listings (Darmstadt)',
    reason: 'Name-only aggregator entries without a verifiable website or published phone/address owned by the business.',
  },
  {
    name: 'ibau / public tender notices (Darmstadt)',
    reason: 'Tender notices are not business directory profiles.',
  },
  {
    name: 'Unverified Google Maps pins without official website',
    reason: 'Insufficient reusable public business facts without copying third-party reviews or photos.',
  },
  {
    name: 'Duplicate REFISER Coslada landing pages',
    reason: 'Same company as REFISER Madrid; merged into one listing.',
  },
  {
    name: 'Duplicate Carbonell / Reformas Alicante brand variants',
    reason: 'Same operating company already included as Carbonell Reformas Alicante.',
  },
  {
    name: 'Redosan Reformas (Alicante)',
    reason: 'Appears only on third-party directories without a verified owned website, phone, or address.',
  },
  {
    name: 'Hardware / building-materials retailers without clear construction-service listing',
    reason: 'Insufficient public service facts for a DImarket professional/company profile.',
  },
  {
    name: 'Third-party Google / portal reviews and star ratings',
    reason: 'Reviews and ratings are not copied; DImarket listings start without imported review text.',
  },
  {
    name: 'Company website photos, logos, and gallery images',
    reason: 'Copyrighted media is not scraped; profiles use text facts only until the business claims and uploads its own media.',
  },
]

const CATEGORY_ALIASES = {
  Drywall: 'Drywall',
  Painting: 'Painting',
  Plastering: 'Plastering',
  Flooring: 'Flooring',
  Roofing: 'Roofing',
  Electrician: 'Electrician',
  Plumbing: 'Plumbing',
  Windows: 'Windows',
  Doors: 'Doors',
  Concrete: 'Concrete',
  Renovation: 'Renovation',
  Demolition: 'Demolition',
  Tiles: 'Tiles',
  HVAC: 'HVAC',
  Insulation: 'Insulation',
  Architecture: 'Architecture',
  'Interior Design': 'Interior Design',
  'Construction Company': 'Construction Company',
  'Building Materials': 'Building Materials',
  'Hardware Store': 'Hardware Store',
}

function normalizeName(name) {
  return name
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/\s+—\s+/g, ' — ')
    .trim()
}

function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function buildSeo(b) {
  const primary = b.categories[0] || 'Construction'
  const title = `${b.full_name} — ${primary} in ${b.city} | DImarket`
  const meta = `${b.full_name} offers ${b.services.slice(0, 3).join(', ').toLowerCase()} in ${b.city}, ${b.country}. Find contact details on DImarket.`
  const keywords = [
    b.full_name,
    ...b.categories,
    b.city,
    b.region,
    b.country,
    ...b.services.slice(0, 4),
    'DImarket',
  ]
  return {
    title: title.slice(0, 70),
    meta_description: meta.slice(0, 160),
    slug: b.slug,
    keywords: [...new Set(keywords.map((k) => k.trim()).filter(Boolean))],
  }
}

function locationLine(b) {
  return `${b.city}, ${b.region}, ${b.country}`
}

function dedupeKey(b) {
  const websiteHost = (b.website || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase()
  const phone = (b.phone || '').replace(/\D/g, '')
  const name = normalizeName(b.full_name).toLowerCase()
  return [websiteHost || '', phone || '', name, b.city.toLowerCase()].join('|')
}

function validate(b) {
  const issues = []
  if (!b.full_name?.trim()) issues.push('missing name')
  if (!b.city || !b.country) issues.push('missing location')
  if (!b.categories?.length) issues.push('missing categories')
  if (!b.work_subcategory_slugs?.length) issues.push('missing work slugs')
  if (!b.bio?.trim() || b.bio.length < 40) issues.push('bio too short')
  if (!b.website && !b.phone && !b.address) {
    issues.push('insufficient public contact facts')
  }
  for (const c of b.categories) {
    if (!CATEGORY_ALIASES[c]) issues.push(`unknown category: ${c}`)
  }
  return issues
}

// Normalize + dedupe
const seen = new Map()
const duplicatesRemoved = []
const validationSkipped = []
const businesses = []

for (const raw of RAW) {
  const b = {
    ...raw,
    full_name: normalizeName(raw.full_name),
    categories: [...new Set(raw.categories.map((c) => CATEGORY_ALIASES[c] || c))],
    work_subcategory_slugs: [...new Set(raw.work_subcategory_slugs)],
    languages: [...new Set(raw.languages)],
    services: [...new Set(raw.services)],
    slug: raw.slug || slugify(`${raw.full_name}-${raw.city}`),
    address: raw.address || null,
    phone: raw.phone || null,
    public_email: raw.public_email || null,
    website: raw.website || null,
    business_hours: raw.business_hours || null,
  }

  const issues = validate(b)
  if (issues.length) {
    validationSkipped.push({ name: b.full_name, reason: issues.join('; ') })
    continue
  }

  const key = dedupeKey(b)
  if (seen.has(key)) {
    duplicatesRemoved.push({
      kept: seen.get(key),
      removed: b.full_name,
      key,
    })
    continue
  }
  seen.set(key, b.full_name)

  const location = locationLine(b)
  businesses.push({
    slug: b.slug,
    full_name: b.full_name,
    user_role: b.user_role,
    is_professional: true,
    categories: b.categories,
    work_subcategory_slugs: b.work_subcategory_slugs,
    city: b.city,
    region: b.region,
    country: b.country,
    country_code: b.country_code,
    location,
    address: b.address,
    phone: b.phone,
    public_email: b.public_email,
    website: b.website,
    business_hours: b.business_hours,
    services: b.services,
    languages: b.languages,
    bio: b.bio,
    preferred_language: b.languages[0] || 'en',
    directory_claim_email: `directory+${b.slug}@users.dimarket.app`,
    seo: buildSeo(b),
    sources: b.sources,
    import: {
      table: 'profiles',
      requires_auth_user: true,
      sync_professional_categories: true,
    },
  })
}

businesses.sort((a, b) => {
  const c = a.country.localeCompare(b.country) || a.city.localeCompare(b.city)
  return c || a.full_name.localeCompare(b.full_name)
})

const categoriesPopulated = [...new Set(businesses.flatMap((b) => b.categories))].sort()
const citiesCovered = [
  ...new Set(businesses.map((b) => `${b.city}, ${b.region}, ${b.country}`)),
].sort()

const summary = {
  generated_at: new Date().toISOString(),
  businesses_ready_to_import: businesses.length,
  categories_populated: categoriesPopulated,
  categories_count: categoriesPopulated.length,
  cities_covered: citiesCovered,
  cities_count: citiesCovered.length,
  duplicates_removed: duplicatesRemoved.length,
  duplicates_detail: duplicatesRemoved,
  records_skipped_insufficient_public_info: SKIPPED.length + validationSkipped.length,
  skipped_detail: [...SKIPPED, ...validationSkipped],
  by_city: Object.fromEntries(
    citiesCovered.map((c) => [
      c,
      businesses.filter((b) => `${b.city}, ${b.region}, ${b.country}` === c).length,
    ]),
  ),
  by_role: {
    company: businesses.filter((b) => b.user_role === 'company').length,
    professional: businesses.filter((b) => b.user_role === 'professional').length,
  },
  policy_notes: [
    'Only publicly listed factual business information was used.',
    'Bios, SEO titles, meta descriptions, and keywords are original DImarket text.',
    'Reviews, ratings, biographies copied from third parties, photos, logos, and website layouts were not scraped or reused.',
    'Auth emails are claimable directory+slug@users.dimarket.app addresses; public business emails stay in public_email only.',
  ],
}

const payload = {
  version: 1,
  generated_at: summary.generated_at,
  schema: {
    target_table: 'profiles',
    auth_required: true,
    junction: 'professional_categories',
    location_format: 'City, Region, Country',
    notes:
      'profiles.id references auth.users(id). Import creates claimable auth users then upserts profiles and syncs professional_categories from work_subcategory_slugs.',
  },
  summary,
  businesses,
}

writeFileSync(resolve(outDir, 'public-businesses.json'), JSON.stringify(payload, null, 2) + '\n')

const csvHeader = [
  'slug',
  'full_name',
  'user_role',
  'categories',
  'work_subcategory_slugs',
  'location',
  'address',
  'phone',
  'public_email',
  'website',
  'business_hours',
  'services',
  'languages',
  'bio',
  'seo_title',
  'seo_meta_description',
  'seo_slug',
  'seo_keywords',
  'directory_claim_email',
]

const escapeCsv = (v) => {
  const s = v == null ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const csvRows = businesses.map((b) =>
  [
    b.slug,
    b.full_name,
    b.user_role,
    b.categories.join('|'),
    b.work_subcategory_slugs.join('|'),
    b.location,
    b.address,
    b.phone,
    b.public_email,
    b.website,
    b.business_hours,
    b.services.join('|'),
    b.languages.join('|'),
    b.bio,
    b.seo.title,
    b.seo.meta_description,
    b.seo.slug,
    b.seo.keywords.join('|'),
    b.directory_claim_email,
  ]
    .map(escapeCsv)
    .join(','),
)

writeFileSync(
  resolve(outDir, 'public-businesses.csv'),
  [csvHeader.join(','), ...csvRows].join('\n') + '\n',
)

// SQL sidecar: profile upserts require auth.users rows created by the import script.
const sqlEscape = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const sqlArray = (arr) =>
  arr?.length
    ? `ARRAY[${arr.map((x) => sqlEscape(x)).join(', ')}]::text[]`
    : `'{}'::text[]`

const sqlLines = [
  '-- DImarket public business directory',
  '-- profiles.id must already exist in auth.users (use scripts/import-public-directory.mjs --apply).',
  '-- SEO fields are stored in data/directory/public-businesses.json (profiles has no SEO columns).',
  'BEGIN;',
  '',
]
for (const b of businesses) {
  sqlLines.push(`-- ${b.full_name} (${b.slug})`)
  sqlLines.push(
    `UPDATE profiles SET
  full_name = ${sqlEscape(b.full_name)},
  bio = ${sqlEscape(b.bio)},
  phone = ${sqlEscape(b.phone)},
  location = ${sqlEscape(b.location)},
  website = ${sqlEscape(b.website)},
  user_role = ${sqlEscape(b.user_role)},
  is_professional = true,
  languages = ${sqlArray(b.languages)},
  preferred_language = ${sqlEscape(b.preferred_language)},
  work_subcategory_slugs = ${sqlArray(b.work_subcategory_slugs)},
  availability_status = 'available',
  updated_at = now()
WHERE website = ${sqlEscape(b.website)}
   OR (full_name = ${sqlEscape(b.full_name)} AND location ILIKE ${sqlEscape('%' + b.city + '%')});`,
  )
  sqlLines.push('')
}
sqlLines.push('COMMIT;')
sqlLines.push('')
writeFileSync(resolve(outDir, 'public-businesses.sql'), sqlLines.join('\n'))

writeFileSync(resolve(outDir, 'IMPORT_SUMMARY.json'), JSON.stringify(summary, null, 2) + '\n')

const md = `# Public business directory — import summary

Generated: ${summary.generated_at}

## Totals

| Metric | Value |
| --- | ---: |
| Businesses ready to import | **${summary.businesses_ready_to_import}** |
| Categories populated | **${summary.categories_count}** |
| Cities covered | **${summary.cities_count}** |
| Duplicates removed | **${summary.duplicates_removed}** |
| Records skipped (insufficient public info) | **${summary.records_skipped_insufficient_public_info}** |

## Categories

${categoriesPopulated.map((c) => `- ${c}`).join('\n')}

## Cities

${citiesCovered.map((c) => `- ${c} (${summary.by_city[c]})`).join('\n')}

## Roles

- Companies: ${summary.by_role.company}
- Professionals: ${summary.by_role.professional}

## Skipped

${summary.skipped_detail.map((s) => `- **${s.name}** — ${s.reason}`).join('\n')}

## Files

- \`public-businesses.json\` — primary import payload (matches profiles schema + SEO sidecar)
- \`public-businesses.csv\` — flat importable table
- \`public-businesses.sql\` — SQL UPDATE helpers (requires auth users from the import script)
- \`IMPORT_SUMMARY.json\` — machine-readable summary

## Import

\`\`\`bash
# Dry-run (default)
node scripts/import-public-directory.mjs

# Apply to Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
node scripts/import-public-directory.mjs --apply
\`\`\`

## Policy

${summary.policy_notes.map((n) => `- ${n}`).join('\n')}

## Live import

After applying, see \`import-run-report.md\` for per-business auth user IDs.
`

writeFileSync(resolve(outDir, 'IMPORT_SUMMARY.md'), md)

const readme = `# DImarket public business directory

Curated initial directory of publicly listed construction companies and professionals for launch markets (Darmstadt, Alicante, Madrid).

## What is included

Factual public fields only: business name, categories, city/region/country, website, public phone, public email, public address, public hours, publicly listed services, and languages when stated.

Each profile also includes:

- Original short DImarket description (\`bio\`)
- Original SEO \`title\`, \`meta_description\`, \`slug\`, \`keywords\`
- Normalized \`work_subcategory_slugs\` for DImarket category sync
- Claimable auth email \`directory+{slug}@users.dimarket.app\`

## What is excluded

Reviews, ratings, third-party biographies, marketing copy copied verbatim, photos, logos, and website layouts.

## Files

- \`public-businesses.json\` — primary import payload (profiles schema + SEO sidecar)
- \`public-businesses.csv\` — flat importable table
- \`public-businesses.sql\` — SQL UPDATE helpers (after auth users exist)
- \`IMPORT_SUMMARY.md\` / \`IMPORT_SUMMARY.json\` — counts and skipped records

## Rebuild

\`\`\`bash
node scripts/build-public-directory-seed.mjs
\`\`\`

## Import into database

\`\`\`bash
node scripts/import-public-directory.mjs          # dry-run
node scripts/import-public-directory.mjs --apply  # create auth users + profiles
\`\`\`

Requires \`SUPABASE_SERVICE_ROLE_KEY\` and \`VITE_SUPABASE_URL\` / \`SUPABASE_URL\`.
`

writeFileSync(resolve(outDir, 'README.md'), readme)

console.log(
  JSON.stringify(
    {
      businesses: businesses.length,
      categories: categoriesPopulated.length,
      cities: citiesCovered.length,
      duplicates_removed: duplicatesRemoved.length,
      skipped: summary.records_skipped_insufficient_public_info,
      out: outDir,
    },
    null,
    2,
  ),
)
