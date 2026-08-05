/** Підкатегорії Marketplace (Buy & Sell) — sell-rent. */

import type { SubcategoryGroupDef } from './categoryCatalog'

export const SELL_RENT_WORK_GROUPS: SubcategoryGroupDef[] = [
  {
    slug: 'building-materials',
    label: {
      uk: 'Будівельні матеріали',
      ru: 'Строительные материалы',
      en: 'Building Materials',
      es: 'Materiales de construcción',
    },
    subcategories: [
      {
        slug: 'building-materials',
        label: {
          uk: 'Будівельні матеріали',
          ru: 'Строительные материалы',
          en: 'Building Materials',
          es: 'Materiales de construcción',
        },
      },
      {
        slug: 'leftover-materials',
        label: {
          uk: 'Залишки матеріалів',
          ru: 'Остатки материалов',
          en: 'Leftover Materials',
          es: 'Materiales sobrantes',
        },
      },
    ],
  },
  {
    slug: 'tools-equipment',
    label: {
      uk: 'Інструменти та техніка',
      ru: 'Инструменты и техника',
      en: 'Tools & Equipment',
      es: 'Herramientas y equipos',
    },
    subcategories: [
      {
        slug: 'tools',
        label: { uk: 'Інструменти', ru: 'Инструменты', en: 'Tools', es: 'Herramientas' },
      },
      {
        slug: 'construction-equipment',
        label: {
          uk: 'Будівельна техніка',
          ru: 'Строительная техника',
          en: 'Construction Equipment',
          es: 'Equipos de construcción',
        },
      },
      {
        slug: 'machinery',
        label: { uk: 'Машини', ru: 'Машины', en: 'Machinery', es: 'Maquinaria' },
      },
      {
        slug: 'used-equipment',
        label: {
          uk: 'Вживана техніка',
          ru: 'Б/у техника',
          en: 'Used Equipment',
          es: 'Equipos usados',
        },
      },
      {
        slug: 'scaffolding',
        label: { uk: 'Ліси', ru: 'Строительные леса', en: 'Scaffolding', es: 'Andamios' },
      },
    ],
  },
  {
    slug: 'equipment-rental',
    label: {
      uk: 'Оренда техніки',
      ru: 'Аренда техники',
      en: 'Rental Equipment',
      es: 'Alquiler de equipos',
    },
    subcategories: [
      {
        slug: 'rental-equipment',
        label: {
          uk: 'Оренда обладнання',
          ru: 'Аренда оборудования',
          en: 'Rental Equipment',
          es: 'Equipos en alquiler',
        },
      },
      {
        slug: 'rent-excavator',
        label: { uk: 'Екскаватор', ru: 'Экскаватор', en: 'Excavator', es: 'Excavadora' },
      },
      {
        slug: 'rent-mini-excavator',
        label: {
          uk: 'Міні-екскаватор',
          ru: 'Мини-экскаватор',
          en: 'Mini excavator',
          es: 'Mini excavadora',
        },
      },
      {
        slug: 'rent-scaffolding',
        label: { uk: 'Оренда лісів', ru: 'Аренда лесов', en: 'Scaffolding rental', es: 'Andamios' },
      },
      {
        slug: 'rent-lifts',
        label: { uk: 'Підйомники', ru: 'Подъёмники', en: 'Lifts', es: 'Elevadores' },
      },
      {
        slug: 'rent-generators',
        label: { uk: 'Генератори', ru: 'Генераторы', en: 'Generators', es: 'Generadores' },
      },
      {
        slug: 'rent-tools',
        label: {
          uk: 'Оренда інструменту',
          ru: 'Аренда инструмента',
          en: 'Tools rental',
          es: 'Alquiler de herramientas',
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
        slug: 'houses',
        label: { uk: 'Будинки', ru: 'Дома', en: 'Houses', es: 'Casas' },
      },
      {
        slug: 'commercial-property',
        label: {
          uk: 'Комерційна нерухомість',
          ru: 'Коммерческая недвижимость',
          en: 'Commercial Property',
          es: 'Locales comerciales',
        },
      },
      {
        slug: 'land',
        label: { uk: 'Земля', ru: 'Земля', en: 'Land', es: 'Terrenos' },
      },
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
          uk: 'Комерційна (продаж)',
          ru: 'Коммерческая (продажа)',
          en: 'Sell commercial property',
          es: 'Venta de locales',
        },
      },
      {
        slug: 'rent-commercial',
        label: {
          uk: 'Комерційна (оренда)',
          ru: 'Коммерческая (аренда)',
          en: 'Rent commercial property',
          es: 'Alquiler de locales',
        },
      },
    ],
  },
  {
    slug: 'vehicles',
    label: {
      uk: 'Транспорт',
      ru: 'Транспорт',
      en: 'Vehicles',
      es: 'Vehículos',
    },
    subcategories: [
      {
        slug: 'vehicles',
        label: { uk: 'Авто', ru: 'Авто', en: 'Vehicles', es: 'Vehículos' },
      },
      {
        slug: 'commercial-vehicles',
        label: {
          uk: 'Комерційний транспорт',
          ru: 'Коммерческий транспорт',
          en: 'Commercial Vehicles',
          es: 'Vehículos comerciales',
        },
      },
    ],
  },
  {
    slug: 'marketplace-other',
    label: {
      uk: 'Інше',
      ru: 'Другое',
      en: 'Other',
      es: 'Otros',
    },
    subcategories: [
      {
        slug: 'free-items',
        label: { uk: 'Безкоштовно', ru: 'Бесплатно', en: 'Free Items', es: 'Gratis' },
      },
      {
        slug: 'wanted-to-buy',
        label: {
          uk: 'Куплю / шукаю',
          ru: 'Куплю / ищу',
          en: 'Wanted to Buy',
          es: 'Se busca comprar',
        },
      },
    ],
  },
]
