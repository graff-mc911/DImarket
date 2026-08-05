/** Підкатегорії Jobs (vacancies). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const VACANCIES_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'trades-construction',
    label: {
      uk: 'Будівництво та ремесла',
      ru: 'Строительство и ремёсла',
      en: 'Construction & Trades',
      es: 'Construcción y oficios',
    },
    subcategories: [
      {
        slug: 'construction-jobs',
        label: {
          uk: 'Будівельні вакансії',
          ru: 'Строительные вакансии',
          en: 'Construction Jobs',
          es: 'Empleos de construcción',
        },
      },
      {
        slug: 'skilled-trades',
        label: {
          uk: 'Кваліфіковані ремесла',
          ru: 'Квалифицированные ремёсла',
          en: 'Skilled Trades',
          es: 'Oficios cualificados',
        },
      },
      {
        slug: 'electrician-jobs',
        label: { uk: 'Електрик', ru: 'Электрик', en: 'Electrician', es: 'Electricista' },
      },
      {
        slug: 'plumber-jobs',
        label: { uk: 'Сантехнік', ru: 'Сантехник', en: 'Plumber', es: 'Fontanero' },
      },
    ],
  },
  {
    slug: 'logistics-ops',
    label: {
      uk: 'Логістика та виробництво',
      ru: 'Логистика и производство',
      en: 'Logistics & Operations',
      es: 'Logística y operaciones',
    },
    subcategories: [
      {
        slug: 'drivers',
        label: { uk: 'Водії', ru: 'Водители', en: 'Drivers', es: 'Conductores' },
      },
      {
        slug: 'factory-jobs',
        label: { uk: 'Завод', ru: 'Завод', en: 'Factory Jobs', es: 'Empleos de fábrica' },
      },
      {
        slug: 'warehouse-jobs',
        label: { uk: 'Склад', ru: 'Склад', en: 'Warehouse Jobs', es: 'Almacén' },
      },
    ],
  },
  {
    slug: 'services',
    label: {
      uk: 'Сервіс',
      ru: 'Сервис',
      en: 'Services',
      es: 'Servicios',
    },
    subcategories: [
      {
        slug: 'cleaning-jobs',
        label: { uk: 'Прибирання', ru: 'Уборка', en: 'Cleaning Jobs', es: 'Limpieza' },
      },
      {
        slug: 'domestic-services',
        label: {
          uk: 'Домашній сервіс',
          ru: 'Домашний сервис',
          en: 'Domestic Services',
          es: 'Servicios domésticos',
        },
      },
    ],
  },
  {
    slug: 'office-professional',
    label: {
      uk: 'Офіс і професії',
      ru: 'Офис и профессии',
      en: 'Office & Professional',
      es: 'Oficina y profesiones',
    },
    subcategories: [
      {
        slug: 'office-jobs',
        label: { uk: 'Офіс', ru: 'Офис', en: 'Office Jobs', es: 'Empleos de oficina' },
      },
      {
        slug: 'accounting-jobs',
        label: { uk: 'Бухгалтерія', ru: 'Бухгалтерия', en: 'Accounting', es: 'Contabilidad' },
      },
      {
        slug: 'legal-jobs',
        label: { uk: 'Юриспруденція', ru: 'Юриспруденция', en: 'Legal', es: 'Legal' },
      },
      {
        slug: 'engineering-jobs',
        label: { uk: 'Інженерія', ru: 'Инженерия', en: 'Engineering', es: 'Ingeniería' },
      },
      {
        slug: 'it-jobs',
        label: { uk: 'IT', ru: 'IT', en: 'IT', es: 'TI' },
      },
      {
        slug: 'sales-jobs',
        label: { uk: 'Продажі', ru: 'Продажи', en: 'Sales', es: 'Ventas' },
      },
      {
        slug: 'design-jobs',
        label: { uk: 'Дизайн', ru: 'Дизайн', en: 'Design', es: 'Diseño' },
      },
    ],
  },
  {
    slug: 'remote',
    label: {
      uk: 'Віддалена робота',
      ru: 'Удалённая работа',
      en: 'Remote',
      es: 'Remoto',
    },
    subcategories: [
      {
        slug: 'remote-jobs',
        label: { uk: 'Remote Jobs', ru: 'Удалённые вакансии', en: 'Remote Jobs', es: 'Empleos remotos' },
      },
    ],
  },
]
