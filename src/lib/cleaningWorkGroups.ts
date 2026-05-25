/** Види робіт для категорії cleaning (Прибирання / клінінг). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const CLEANING_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'cleaning',
    label: {
      uk: 'Прибирання / клінінг',
      ru: 'Уборка / клининг',
      en: 'Cleaning',
    },
    subcategories: [
      {
        slug: 'cleaning-post-renovation',
        label: {
          uk: 'Прибирання після ремонту',
          ru: 'Уборка после ремонта',
          en: 'Post-renovation cleaning',
        },
      },
      {
        slug: 'cleaning-general',
        label: {
          uk: 'Cleaning',
          ru: 'Cleaning',
          en: 'Cleaning',
        },
      },
      {
        slug: 'cleaning-deep',
        label: {
          uk: 'Deep cleaning',
          ru: 'Генеральная уборка',
          en: 'Deep cleaning',
        },
      },
      {
        slug: 'cleaning-construction',
        label: {
          uk: 'Construction cleaning',
          ru: 'Уборка после строительства',
          en: 'Construction cleaning',
        },
      },
    ],
  },
]
