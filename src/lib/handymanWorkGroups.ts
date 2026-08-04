/** Види робіт для категорії handyman. */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const HANDYMAN_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'handyman',
    label: {
      uk: 'Майстер на годину',
      ru: 'Мастер на час',
      en: 'Handyman',
      es: 'Manitas',
    },
    subcategories: [
      {
        slug: 'handyman-general',
        label: {
          uk: 'Дрібний ремонт',
          ru: 'Мелкий ремонт',
          en: 'General repairs',
          es: 'Reparaciones generales',
        },
      },
      {
        slug: 'handyman-assembly',
        label: {
          uk: 'Збірка меблів',
          ru: 'Сборка мебели',
          en: 'Furniture assembly',
          es: 'Montaje de muebles',
        },
      },
      {
        slug: 'handyman-locks',
        label: {
          uk: 'Замки / двері',
          ru: 'Замки / двери',
          en: 'Locks and doors',
          es: 'Cerrajería',
        },
      },
    ],
  },
]
