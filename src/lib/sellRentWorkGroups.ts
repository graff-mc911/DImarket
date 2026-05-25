/** Підкатегорії для sell-rent (Продам / Оренда). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const SELL_RENT_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'equipment-rental',
    label: {
      uk: 'Оренда техніки',
      ru: 'Аренда техники',
      en: 'Equipment rental',
    },
    subcategories: [
      {
        slug: 'rent-excavator',
        label: { uk: 'Excavator', ru: 'Экскаватор', en: 'Excavator' },
      },
      {
        slug: 'rent-mini-excavator',
        label: {
          uk: 'Mini excavator',
          ru: 'Мини-экскаватор',
          en: 'Mini excavator',
        },
      },
      {
        slug: 'rent-scaffolding',
        label: { uk: 'Scaffolding', ru: 'Строительные леса', en: 'Scaffolding' },
      },
      {
        slug: 'rent-lifts',
        label: { uk: 'Lifts', ru: 'Подъёмники', en: 'Lifts' },
      },
      {
        slug: 'rent-generators',
        label: { uk: 'Generators', ru: 'Генераторы', en: 'Generators' },
      },
      {
        slug: 'rent-tools',
        label: {
          uk: 'Tools rental',
          ru: 'Аренда инструмента',
          en: 'Tools rental',
        },
      },
    ],
  },
]
