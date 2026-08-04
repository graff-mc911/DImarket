/** Види робіт для категорії accounting-finance (Бухгалтер / фінконсультант). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const ACCOUNTING_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'accounting-finance',
    label: {
      uk: 'Бухгалтер / фінансовий консультант',
      ru: 'Бухгалтер / финансовый консультант',
      en: 'Accountant / Financial consultant',
      es: 'Contador / Consultor financiero',
    },
    subcategories: [
      {
        slug: 'accounting-finance-bookkeeping',
        label: {
          uk: 'Бухгалтерія',
          ru: 'Бухгалтерия',
          en: 'Bookkeeping',
          es: 'Contabilidad',
        },
      },
      {
        slug: 'accounting-finance-tax',
        label: {
          uk: 'Податки',
          ru: 'Налоги',
          en: 'Tax consulting',
          es: 'Asesoría fiscal',
        },
      },
      {
        slug: 'accounting-finance-payroll',
        label: {
          uk: 'Зарплата та кадри',
          ru: 'Зарплата и кадры',
          en: 'Payroll',
          es: 'Nóminas',
        },
      },
      {
        slug: 'accounting-finance-autonomo',
        label: {
          uk: 'Облік для autónomo',
          ru: 'Учёт для autónomo',
          en: 'Autónomo accounting',
          es: 'Contabilidad de autónomos',
        },
      },
      {
        slug: 'accounting-finance-gestoria',
        label: {
          uk: 'Гесторія / адміністративні послуги',
          ru: 'Гестория / админ. услуги',
          en: 'Administrative gestoría',
          es: 'Gestoría administrativa',
        },
      },
      {
        slug: 'accounting-finance-advisory',
        label: {
          uk: 'Фінансовий консалтинг',
          ru: 'Финансовый консалтинг',
          en: 'Financial consulting',
          es: 'Consultoría financiera',
        },
      },
    ],
  },
]
