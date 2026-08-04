/** Види робіт для категорії legal-notary (Юрист / нотаріус). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const LEGAL_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'legal-notary',
    label: {
      uk: 'Юрист / нотаріус',
      ru: 'Юрист / нотариус',
      en: 'Lawyer / Notary',
      es: 'Abogado / Notario',
    },
    subcategories: [
      {
        slug: 'legal-notary-lawyer',
        label: {
          uk: 'Юрист',
          ru: 'Юрист',
          en: 'Lawyer',
          es: 'Abogado',
        },
      },
      {
        slug: 'legal-notary-notary',
        label: {
          uk: 'Нотаріус',
          ru: 'Нотариус',
          en: 'Notary',
          es: 'Notario',
        },
      },
      {
        slug: 'legal-notary-immigration',
        label: {
          uk: 'Імміграційний юрист',
          ru: 'Иммиграционный юрист',
          en: 'Immigration lawyer',
          es: 'Abogado de extranjería',
        },
      },
      {
        slug: 'legal-notary-contracts',
        label: {
          uk: 'Договори та угоди',
          ru: 'Договоры и сделки',
          en: 'Contracts and transactions',
          es: 'Contratos y transacciones',
        },
      },
      {
        slug: 'legal-notary-company',
        label: {
          uk: 'Реєстрація компаній',
          ru: 'Регистрация компаний',
          en: 'Company registration',
          es: 'Constitución de empresas',
        },
      },
      {
        slug: 'legal-notary-tax',
        label: {
          uk: 'Податковий юрист',
          ru: 'Налоговый юрист',
          en: 'Tax lawyer',
          es: 'Abogado fiscal',
        },
      },
    ],
  },
]
