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
  {
    slug: 'property',
    label: {
      uk: 'Нерухомість',
      ru: 'Недвижимость',
      en: 'Property',
      es: 'Inmuebles',
    },
    subcategories: [
      {
        slug: 'sell-property',
        label: {
          uk: 'Продаж нерухомості',
          ru: 'Продажа недвижимости',
          en: 'Sell property',
          es: 'Venta de inmuebles',
        },
      },
      {
        slug: 'rent-property',
        label: {
          uk: 'Оренда нерухомості',
          ru: 'Аренда недвижимости',
          en: 'Rent property',
          es: 'Alquiler de inmuebles',
        },
      },
      {
        slug: 'sell-commercial',
        label: {
          uk: 'Комерційна нерухомість (продаж)',
          ru: 'Коммерческая недвижимость (продажа)',
          en: 'Sell commercial property',
          es: 'Venta de locales',
        },
      },
      {
        slug: 'rent-commercial',
        label: {
          uk: 'Комерційна нерухомість (оренда)',
          ru: 'Коммерческая недвижимость (аренда)',
          en: 'Rent commercial property',
          es: 'Alquiler de locales',
        },
      },
    ],
  },
]
