/** Види робіт для категорії tools (Перевезення / логістика). */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const TRANSPORT_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'logistics',
    label: {
      uk: 'Перевезення / логістика',
      ru: 'Перевозка / логистика',
      en: 'Transport / logistics',
    },
    subcategories: [
      {
        slug: 'logistics-materials',
        label: {
          uk: 'Доставка матеріалів',
          ru: 'Доставка материалов',
          en: 'Material delivery',
        },
      },
      {
        slug: 'logistics-movers',
        label: { uk: 'Вантажники', ru: 'Грузчики', en: 'Movers' },
      },
      {
        slug: 'logistics-relocation',
        label: { uk: 'Переїзди', ru: 'Переезды', en: 'Relocation' },
      },
      {
        slug: 'logistics-transport',
        label: { uk: 'Transport', ru: 'Транспорт', en: 'Transport' },
      },
    ],
  },
]
