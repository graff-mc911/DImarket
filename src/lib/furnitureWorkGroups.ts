/** Види робіт для категорії furniture. */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const FURNITURE_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'furniture',
    label: {
      uk: 'Меблі',
      ru: 'Мебель',
      en: 'Furniture',
      es: 'Muebles',
    },
    subcategories: [
      {
        slug: 'furniture-assembly',
        label: {
          uk: 'Збірка меблів',
          ru: 'Сборка мебели',
          en: 'Furniture assembly',
          es: 'Montaje de muebles',
        },
      },
      {
        slug: 'furniture-custom',
        label: {
          uk: 'Меблі на замовлення',
          ru: 'Мебель на заказ',
          en: 'Custom furniture',
          es: 'Muebles a medida',
        },
      },
      {
        slug: 'furniture-repair',
        label: {
          uk: 'Ремонт меблів',
          ru: 'Ремонт мебели',
          en: 'Furniture repair',
          es: 'Reparación de muebles',
        },
      },
    ],
  },
]
