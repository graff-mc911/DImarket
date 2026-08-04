/** Види робіт для категорії electrical (СТО / авто). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const ELECTRICAL_AUTO_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'electrical',
    label: {
      uk: 'СТО / автосервіс',
      ru: 'СТО / автосервис',
      en: 'Auto service',
      es: 'Taller mecánico',
    },
    subcategories: [
      {
        slug: 'electrical-auto-repair',
        label: {
          uk: 'Ремонт авто',
          ru: 'Ремонт авто',
          en: 'Auto repair',
          es: 'Reparación de vehículos',
        },
      },
      {
        slug: 'electrical-auto-electrician',
        label: {
          uk: 'Автоелектрик',
          ru: 'Автоэлектрик',
          en: 'Auto electrician',
          es: 'Electricista de automóviles',
        },
      },
      {
        slug: 'electrical-tires',
        label: {
          uk: 'Шини',
          ru: 'Шины',
          en: 'Tire service',
          es: 'Neumáticos',
        },
      },
      {
        slug: 'electrical-towing',
        label: {
          uk: 'Евакуатор',
          ru: 'Эвакуатор',
          en: 'Towing',
          es: 'Grúa',
        },
      },
    ],
  },
]