import fs from 'fs'

/** @typedef {{ uk: string, ru?: string, en?: string }} L */
/** @typedef {{ slug: string, label: L }} Sub */
/** @typedef {{ slug: string, label: L, items: { slug: string, uk: string, ru?: string, en?: string }[] }} Group */

/** @type {Group[]} */
const GROUPS = [
  {
    slug: 'demolition',
    label: { uk: 'Демонтажні роботи', ru: 'Демонтажные работы', en: 'Demolition' },
    items: [
      ['walls', 'Демонтаж стін', 'Демонтаж стен', 'Wall demolition'],
      ['partitions', 'Демонтаж перегородок', 'Демонтаж перегородок', 'Partition demolition'],
      ['tile', 'Демонтаж плитки', 'Демонтаж плитки', 'Tile removal'],
      ['floor', 'Демонтаж підлоги', 'Демонтаж пола', 'Floor demolition'],
      ['laminate', 'Демонтаж ламінату', 'Демонтаж ламината', 'Laminate removal'],
      ['parquet', 'Демонтаж паркету', 'Демонтаж паркета', 'Parquet removal'],
      ['doors', 'Демонтаж дверей', 'Демонтаж дверей', 'Door removal'],
      ['windows', 'Демонтаж вікон', 'Демонтаж окон', 'Window removal'],
      ['ceiling', 'Демонтаж стелі', 'Демонтаж потолка', 'Ceiling demolition'],
      ['plumbing', 'Демонтаж сантехніки', 'Демонтаж сантехники', 'Plumbing demolition'],
      ['electrical', 'Демонтаж електрики', 'Демонтаж электрики', 'Electrical demolition'],
      ['debris-removal', 'Вивіз будівельного сміття', 'Вывоз строительного мусора', 'Construction debris removal'],
    ],
  },
  {
    slug: 'earthworks',
    label: { uk: 'Земляні роботи', ru: 'Земляные работы', en: 'Earthworks' },
    items: [
      ['trenching', 'Копання траншей', 'Копание траншей', 'Trench digging'],
      ['excavation', 'Копання котлованів', 'Копание котлованов', 'Excavation'],
      ['grading', 'Планування ділянки', 'Планировка участка', 'Site grading'],
      ['backfill', 'Засипка', 'Засыпка', 'Backfill'],
      ['compaction', 'Ущільнення ґрунту', 'Уплотнение грунта', 'Soil compaction'],
      ['drainage', 'Дренажні роботи', 'Дренажные работы', 'Drainage work'],
    ],
  },
  {
    slug: 'foundation',
    label: { uk: 'Фундаментні роботи', ru: 'Фундаментные работы', en: 'Foundation work' },
    items: [
      ['strip', 'Стрічковий фундамент', 'Ленточный фундамент', 'Strip foundation'],
      ['slab', 'Плитний фундамент', 'Плитный фундамент', 'Slab foundation'],
      ['pier', 'Стовпчастий фундамент', 'Столбчатый фундамент', 'Pier foundation'],
      ['rebar', 'Армування фундаменту', 'Армирование фундамента', 'Foundation rebar'],
      ['waterproofing', 'Гідроізоляція фундаменту', 'Гидроизоляция фундамента', 'Foundation waterproofing'],
      ['concrete-pour', 'Заливка бетону', 'Заливка бетона', 'Concrete pour'],
    ],
  },
  {
    slug: 'concrete',
    label: { uk: 'Бетонні роботи', ru: 'Бетонные работы', en: 'Concrete work' },
    items: [
      ['concreting', 'Бетонування', 'Бетонирование', 'Concreting'],
      ['slab-pour', 'Заливка плит', 'Заливка плит', 'Slab pouring'],
      ['stairs', 'Бетонні сходи', 'Бетонные лестницы', 'Concrete stairs'],
      ['platforms', 'Бетонні площадки', 'Бетонные площадки', 'Concrete platforms'],
      ['paths', 'Бетонні доріжки', 'Бетонные дорожки', 'Concrete paths'],
      ['rebar', 'Армування', 'Армирование', 'Rebar'],
      ['formwork', 'Опалубка', 'Опалубка', 'Formwork'],
      ['screed', 'Стяжка', 'Стяжка', 'Screed'],
    ],
  },
  {
    slug: 'masonry',
    label: { uk: "Мурування / кам'яні роботи", ru: 'Кладка / каменные работы', en: 'Masonry' },
    items: [
      ['brick', 'Цегляна кладка', 'Кирпичная кладка', 'Brick masonry'],
      ['aerated-block', 'Газоблок', 'Газоблок', 'Aerated concrete block'],
      ['foam-block', 'Піноблок', 'Пеноблок', 'Foam block'],
      ['ceramic-block', 'Керамоблок', 'Керамоблок', 'Ceramic block'],
      ['stone', "Кам'яна кладка", 'Каменная кладка', 'Stone masonry'],
      ['partitions', 'Перегородки', 'Перегородки', 'Partitions'],
      ['load-bearing-walls', 'Несучі стіни', 'Несущие стены', 'Load-bearing walls'],
      ['fireplaces', 'Каміни', 'Камины', 'Fireplaces'],
      ['chimneys', 'Димоходи', 'Дымоходы', 'Chimneys'],
    ],
  },
  {
    slug: 'roofing',
    label: { uk: 'Покрівельні роботи', ru: 'Кровельные работы', en: 'Roofing' },
    items: [
      ['install', 'Монтаж даху', 'Монтаж крыши', 'Roof installation'],
      ['repair', 'Ремонт даху', 'Ремонт крыши', 'Roof repair'],
      ['metal-tile', 'Металочерепиця', 'Металлочерепица', 'Metal tile roofing'],
      ['bitumen', 'Бітумна покрівля', 'Битумная кровля', 'Bitumen roofing'],
      ['flat-roof', 'Плоска покрівля', 'Плоская кровля', 'Flat roof'],
      ['tile', 'Черепиця', 'Черепица', 'Roof tiles'],
      ['waterproofing', 'Гідроізоляція даху', 'Гидроизоляция крыши', 'Roof waterproofing'],
      ['insulation', 'Утеплення даху', 'Утепление крыши', 'Roof insulation'],
      ['gutters', 'Монтаж водостоків', 'Монтаж водостоков', 'Gutter installation'],
      ['soffits', 'Софіти', 'Софиты', 'Soffits'],
      ['gutters-metal', 'Ринви', 'Желоба', 'Gutters'],
    ],
  },
  {
    slug: 'facade',
    label: { uk: 'Фасадні роботи', ru: 'Фасадные работы', en: 'Facade work' },
    items: [
      ['insulation', 'Утеплення фасаду', 'Утепление фасада', 'Facade insulation'],
      ['foam', 'Пінопласт', 'Пенопласт', 'Foam insulation'],
      ['mineral-wool', 'Мінеральна вата', 'Минеральная вата', 'Mineral wool'],
      ['plaster', 'Штукатурка фасаду', 'Штукатурка фасада', 'Facade plaster'],
      ['painting', 'Фарбування фасаду', 'Покраска фасада', 'Facade painting'],
      ['ventilated', 'Вентильований фасад', 'Вентилируемый фасад', 'Ventilated facade'],
      ['clinker', 'Клінкер', 'Клинкер', 'Clinker'],
      ['panels', 'Фасадні панелі', 'Фасадные панели', 'Facade panels'],
      ['repair', 'Ремонт фасаду', 'Ремонт фасада', 'Facade repair'],
    ],
  },
  {
    slug: 'plastering',
    label: { uk: 'Штукатурні роботи', ru: 'Штукатурные работы', en: 'Plastering' },
    items: [
      ['machine', 'Машинна штукатурка', 'Машинная штукатурка', 'Machine plastering'],
      ['manual', 'Ручна штукатурка', 'Ручная штукатурка', 'Manual plastering'],
      ['gypsum', 'Гіпсова штукатурка', 'Гипсовая штукатурка', 'Gypsum plaster'],
      ['cement', 'Цементна штукатурка', 'Цементная штукатурка', 'Cement plaster'],
      ['decorative', 'Декоративна штукатурка', 'Декоративная штукатурка', 'Decorative plaster'],
      ['leveling', 'Вирівнювання стін', 'Выравнивание стен', 'Wall leveling'],
    ],
  },
  {
    slug: 'painting',
    label: { uk: 'Малярні роботи', ru: 'Малярные работы', en: 'Painting' },
    items: [
      ['walls', 'Фарбування стін', 'Покраска стен', 'Wall painting'],
      ['ceiling', 'Фарбування стелі', 'Покраска потолка', 'Ceiling painting'],
      ['facade', 'Фарбування фасаду', 'Покраска фасада', 'Facade painting'],
      ['doors', 'Фарбування дверей', 'Покраска дверей', 'Door painting'],
      ['windows', 'Фарбування вікон', 'Покраска окон', 'Window painting'],
      ['metal', 'Фарбування металу', 'Покраска металла', 'Metal painting'],
      ['putty', 'Шпаклювання', 'Шпаклевание', 'Puttying'],
      ['priming', 'Грунтування', 'Грунтование', 'Priming'],
    ],
  },
  {
    slug: 'wallpaper',
    label: { uk: 'Шпалери', ru: 'Обои', en: 'Wallpaper' },
    items: [
      ['install', 'Поклейка шпалер', 'Поклейка обоев', 'Wallpaper installation'],
      ['removal', 'Демонтаж шпалер', 'Снятие обоев', 'Wallpaper removal'],
      ['non-woven', 'Флізелінові шпалери', 'Флизелиновые обои', 'Non-woven wallpaper'],
      ['vinyl', 'Вінілові шпалери', 'Виниловые обои', 'Vinyl wallpaper'],
      ['photo', 'Фото-шпалери', 'Фотообои', 'Photo wallpaper'],
    ],
  },
  {
    slug: 'drywall',
    label: { uk: 'Гіпсокартон', ru: 'Гипсокартон', en: 'Drywall' },
    items: [
      ['install', 'Монтаж гіпсокартону', 'Монтаж гипсокартона', 'Drywall installation'],
      ['partitions', 'Перегородки', 'Перегородки', 'Drywall partitions'],
      ['suspended-ceiling', 'Підвісні стелі', 'Подвесные потолки', 'Suspended ceilings'],
      ['niches', 'Ніші', 'Ниши', 'Niches'],
      ['boxes', 'Короби', 'Короба', 'Utility boxes'],
      ['multi-level-ceiling', 'Багаторівневі стелі', 'Многоуровневые потолки', 'Multi-level ceilings'],
      ['soundproofing', 'Шумоізоляція', 'Шумоизоляция', 'Soundproofing'],
    ],
  },
  {
    slug: 'tiling',
    label: { uk: 'Плиточні роботи', ru: 'Плиточные работы', en: 'Tiling' },
    items: [
      ['install', 'Укладання плитки', 'Укладка плитки', 'Tile installation'],
      ['bathroom', 'Ванна', 'Ванная', 'Bathroom tiling'],
      ['kitchen', 'Кухня', 'Кухня', 'Kitchen tiling'],
      ['floor', 'Підлога', 'Пол', 'Floor tiling'],
      ['walls', 'Стіни', 'Стены', 'Wall tiling'],
      ['mosaic', 'Мозаїка', 'Мозаика', 'Mosaic'],
      ['porcelain', 'Керамограніт', 'Керамогранит', 'Porcelain tile'],
      ['grouting', 'Затирка швів', 'Затирка швов', 'Grouting'],
      ['repair', 'Ремонт плитки', 'Ремонт плитки', 'Tile repair'],
    ],
  },
  {
    slug: 'flooring',
    label: { uk: 'Підлогові роботи', ru: 'Напольные работы', en: 'Flooring' },
    items: [
      ['laminate', 'Ламінат', 'Ламинат', 'Laminate'],
      ['vinyl', 'Вініл', 'Винил', 'Vinyl flooring'],
      ['spc', 'SPC', 'SPC', 'SPC flooring'],
      ['parquet', 'Паркет', 'Паркет', 'Parquet'],
      ['solid-wood', 'Масивна дошка', 'Массивная доска', 'Solid wood flooring'],
      ['linoleum', 'Лінолеум', 'Линолеум', 'Linoleum'],
      ['carpet', 'Ковролін', 'Ковролин', 'Carpet'],
      ['epoxy', 'Епоксидна підлога', 'Эпоксидный пол', 'Epoxy floor'],
      ['polyurethane', 'Поліуретанова підлога', 'Полиуретановый пол', 'Polyurethane floor'],
      ['screed', 'Стяжка', 'Стяжка', 'Floor screed'],
      ['self-leveling', 'Самовирівнююча підлога', 'Самовыравнивающийся пол', 'Self-leveling floor'],
    ],
  },
  {
    slug: 'carpentry',
    label: { uk: 'Столярні роботи', ru: 'Столярные работы', en: 'Carpentry' },
    items: [
      ['doors-install', 'Монтаж дверей', 'Монтаж дверей', 'Door installation'],
      ['entrance-doors', 'Вхідні двері', 'Входные двери', 'Entrance doors'],
      ['interior-doors', 'Міжкімнатні двері', 'Межкомнатные двери', 'Interior doors'],
      ['arches', 'Арки', 'Арки', 'Arches'],
      ['skirting', 'Плінтуси', 'Плинтусы', 'Skirting boards'],
      ['thresholds', 'Пороги', 'Пороги', 'Thresholds'],
      ['wood-structures', "Дерев'яні конструкції", 'Деревянные конструкции', 'Wood structures'],
      ['stairs', 'Сходи', 'Лестницы', 'Wood stairs'],
    ],
  },
  {
    slug: 'windows',
    label: { uk: 'Вікна', ru: 'Окна', en: 'Windows' },
    items: [
      ['install', 'Монтаж вікон', 'Монтаж окон', 'Window installation'],
      ['removal', 'Демонтаж вікон', 'Демонтаж окон', 'Window removal'],
      ['pvc', 'ПВХ вікна', 'ПВХ окна', 'PVC windows'],
      ['aluminum', 'Алюмінієві вікна', 'Алюминиевые окна', 'Aluminum windows'],
      ['wood', "Дерев'яні вікна", 'Деревянные окна', 'Wood windows'],
      ['adjustment', 'Регулювання', 'Регулировка', 'Window adjustment'],
      ['repair', 'Ремонт вікон', 'Ремонт окон', 'Window repair'],
      ['glass-replacement', 'Заміна склопакетів', 'Замена стеклопакетов', 'IGU replacement'],
    ],
  },
  {
    slug: 'plumbing',
    label: { uk: 'Сантехніка', ru: 'Сантехника', en: 'Plumbing' },
    items: [
      ['install', 'Монтаж сантехніки', 'Монтаж сантехники', 'Plumbing installation'],
      ['repair', 'Ремонт сантехніки', 'Ремонт сантехники', 'Plumbing repair'],
      ['pipes', 'Труби', 'Трубы', 'Pipes'],
      ['sewer', 'Каналізація', 'Канализация', 'Sewer'],
      ['water-supply', 'Водопостачання', 'Водоснабжение', 'Water supply'],
      ['heating', 'Опалення', 'Отопление', 'Heating plumbing'],
      ['radiators', 'Радіатори', 'Радиаторы', 'Radiators'],
      ['boilers', 'Бойлери', 'Бойлеры', 'Water heaters'],
      ['showers', 'Душові', 'Душевые', 'Showers'],
      ['toilets', 'Унітази', 'Унитазы', 'Toilets'],
      ['sinks', 'Умивальники', 'Умывальники', 'Sinks'],
      ['pumps', 'Насоси', 'Насосы', 'Pumps'],
      ['underfloor-heating', 'Тепла підлога', 'Теплый пол', 'Underfloor heating'],
    ],
  },
  {
    slug: 'electro',
    label: { uk: 'Електромонтаж', ru: 'Электромонтаж', en: 'Electrical installation' },
    items: [
      ['wiring', 'Проводка', 'Проводка', 'Wiring'],
      ['rewiring', 'Перепроводка', 'Перепроводка', 'Rewiring'],
      ['panels', 'Щитки', 'Щитки', 'Electrical panels'],
      ['breakers', 'Автомати', 'Автоматы', 'Circuit breakers'],
      ['outlets', 'Розетки', 'Розетки', 'Outlets'],
      ['switches', 'Вимикачі', 'Выключатели', 'Switches'],
      ['lighting', 'Освітлення', 'Освещение', 'Lighting'],
      ['led', 'LED', 'LED', 'LED lighting'],
      ['smart-home', 'Smart home', 'Smart home', 'Smart home'],
      ['intercom', 'Домофони', 'Домофоны', 'Intercoms'],
      ['cameras', 'Камери', 'Камеры', 'Security cameras'],
      ['alarm', 'Сигналізація', 'Сигнализация', 'Alarm systems'],
    ],
  },
  {
    slug: 'hvac',
    label: { uk: 'HVAC / клімат', ru: 'HVAC / климат', en: 'HVAC' },
    items: [
      ['ac', 'Кондиціонери', 'Кондиционеры', 'Air conditioning'],
      ['ventilation', 'Вентиляція', 'Вентиляция', 'Ventilation'],
      ['recuperation', 'Рекуперація', 'Рекуперация', 'Heat recovery ventilation'],
      ['heat-pumps', 'Теплові насоси', 'Тепловые насосы', 'Heat pumps'],
      ['heating', 'Опалення', 'Отопление', 'HVAC heating'],
      ['ac-cleaning', 'Чистка кондиціонерів', 'Чистка кондиционеров', 'AC cleaning'],
    ],
  },
  {
    slug: 'insulation',
    label: { uk: 'Ізоляція', ru: 'Изоляция', en: 'Insulation' },
    items: [
      ['thermal', 'Теплоізоляція', 'Теплоизоляция', 'Thermal insulation'],
      ['sound', 'Шумоізоляція', 'Шумоизоляция', 'Sound insulation'],
      ['waterproofing', 'Гідроізоляція', 'Гидроизоляция', 'Waterproofing'],
      ['vapor', 'Пароізоляція', 'Пароизоляция', 'Vapor barrier'],
    ],
  },
  {
    slug: 'welding',
    label: { uk: 'Зварювальні роботи', ru: 'Сварочные работы', en: 'Welding' },
    items: [
      ['metal-structures', 'Металоконструкції', 'Металлоконструкции', 'Metal structures'],
      ['welding', 'Зварювання', 'Сварка', 'Welding'],
      ['fences', 'Огорожі', 'Ограждения', 'Fences'],
      ['gates', 'Ворота', 'Ворота', 'Gates'],
      ['railings', 'Перила', 'Перила', 'Railings'],
      ['canopies', 'Навіси', 'Навесы', 'Canopies'],
    ],
  },
  {
    slug: 'metal',
    label: { uk: 'Металеві конструкції', ru: 'Металлические конструкции', en: 'Metal structures' },
    items: [
      ['frames', 'Каркаси', 'Каркасы', 'Metal frames'],
      ['hangars', 'Ангари', 'Ангары', 'Hangars'],
      ['stairs', 'Сходи', 'Лестницы', 'Metal stairs'],
      ['balconies', 'Балкони', 'Балконы', 'Balconies'],
      ['canopies', 'Навіси', 'Навесы', 'Metal canopies'],
    ],
  },
  {
    slug: 'glass',
    label: { uk: 'Скляні роботи', ru: 'Стеклянные работы', en: 'Glass work' },
    items: [
      ['shower-enclosures', 'Душові перегородки', 'Душевые перегородки', 'Shower enclosures'],
      ['glass-doors', 'Скляні двері', 'Стеклянные двери', 'Glass doors'],
      ['mirrors', 'Дзеркала', 'Зеркала', 'Mirrors'],
      ['facade-glazing', 'Фасадне скління', 'Фасадное остекление', 'Facade glazing'],
    ],
  },
  {
    slug: 'landscaping',
    label: { uk: 'Ландшафт / зовнішні роботи', ru: 'Ландшафт / наружные работы', en: 'Landscaping' },
    items: [
      ['cobblestone', 'Бруківка', 'Брусчатка', 'Cobblestone'],
      ['paving-slabs', 'Тротуарна плитка', 'Тротуарная плитка', 'Paving slabs'],
      ['fences', 'Паркани', 'Заборы', 'Fences'],
      ['greening', 'Озеленення', 'Озеленение', 'Landscaping / planting'],
      ['irrigation', 'Автоматичний полив', 'Автоматический полив', 'Automatic irrigation'],
      ['terraces', 'Тераси', 'Террасы', 'Terraces'],
      ['gazebos', 'Альтанки', 'Беседки', 'Gazebos'],
    ],
  },
  {
    slug: 'pools',
    label: { uk: 'Басейни', ru: 'Бассейны', en: 'Pools' },
    items: [
      ['construction', 'Будівництво басейнів', 'Строительство бассейнов', 'Pool construction'],
      ['repair', 'Ремонт басейнів', 'Ремонт бассейнов', 'Pool repair'],
      ['maintenance', 'Обслуговування', 'Обслуживание', 'Pool maintenance'],
    ],
  },
  {
    slug: 'solar',
    label: { uk: 'Сонячні системи', ru: 'Солнечные системы', en: 'Solar systems' },
    items: [
      ['panels', 'Сонячні панелі', 'Солнечные панели', 'Solar panels'],
      ['inverters', 'Інвертори', 'Инверторы', 'Inverters'],
      ['battery', 'Акумулятори', 'Аккумуляторы', 'Battery storage'],
      ['installation', 'Монтаж', 'Монтаж', 'Installation'],
    ],
  },
  {
    slug: 'smart-home',
    label: { uk: 'Розумний дім', ru: 'Умный дом', en: 'Smart home' },
    items: [
      ['systems', 'Розумний дім', 'Умный дом', 'Smart home'],
      ['automation', 'Автоматизація', 'Автоматизация', 'Home automation'],
      ['lighting', 'Контроль освітлення', 'Контроль освещения', 'Lighting control'],
      ['security', 'Безпека', 'Безопасность', 'Smart security'],
    ],
  },
  {
    slug: 'design-engineering',
    label: { uk: "Проектування / інженерія", ru: 'Проектирование / инженерия', en: 'Design / engineering' },
    items: [
      ['architect', 'Архітектор', 'Архитектор', 'Architect'],
      ['structural', 'Статик', 'Статик', 'Structural engineer'],
      ['interior', "Дизайн інтер'єру", 'Дизайн интерьера', 'Interior design'],
      ['3d', '3D візуалізація', '3D визуализация', '3D visualization'],
      ['engineering', 'Інженерія', 'Инженерия', 'Engineering'],
    ],
  },
]

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

const lines = []
lines.push('/** Auto-generated by scripts/generate-construction-catalog.mjs — do not edit by hand */')
lines.push("import type { SubcategoryGroupDef } from './categoryCatalog'")
lines.push('')
lines.push('export const CONSTRUCTION_WORK_GROUPS: SubcategoryGroupDef[] = [')

for (const g of GROUPS) {
  lines.push('  {')
  lines.push(`    slug: '${g.slug}',`)
  lines.push(`    label: { uk: '${esc(g.label.uk)}', ru: '${esc(g.label.ru)}', en: '${esc(g.label.en)}' },`)
  lines.push('    subcategories: [')
  for (const [itemSlug, uk, ru, en] of g.items) {
    const slug = `${g.slug}-${itemSlug}`
    lines.push(
      `      { slug: '${slug}', label: { uk: '${esc(uk)}', ru: '${esc(ru)}', en: '${esc(en)}' } },`,
    )
  }
  lines.push('    ],')
  lines.push('  },')
}

lines.push(']')
lines.push('')

const out = 'src/lib/constructionWorkGroups.ts'
fs.writeFileSync(out, lines.join('\n'), 'utf8')
const count = GROUPS.reduce((n, g) => n + g.items.length, 0)
console.log(`Wrote ${out}: ${GROUPS.length} groups, ${count} subcategories`)
