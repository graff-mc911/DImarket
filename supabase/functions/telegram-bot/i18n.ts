export type BotLocale = 'uk' | 'ru' | 'en' | 'pl' | 'de' | 'es'

export function normalizeLocale(code?: string | null): BotLocale {
  const c = (code || 'en').toLowerCase().split('-')[0]
  if (c === 'uk' || c === 'ua') return 'uk'
  if (c === 'ru') return 'ru'
  if (c === 'pl') return 'pl'
  if (c === 'de') return 'de'
  if (c === 'es') return 'es'
  return 'en'
}

type MsgKey =
  | 'welcome'
  | 'promo'
  | 'newListing'
  | 'cancelled'
  | 'chooseCategory'
  | 'categoryUnknown'
  | 'askCity'
  | 'cityTooShort'
  | 'askCountry'
  | 'askRegion'
  | 'askCityPick'
  | 'pickCountryButton'
  | 'pickRegionButton'
  | 'cityUnknown'
  | 'cityPickRequired'
  | 'regionEmpty'
  | 'cityEmpty'
  | 'askBudget'
  | 'budgetInvalid'
  | 'askDeadline'
  | 'askDescription'
  | 'descriptionTooShort'
  | 'askPhotos'
  | 'photosNeedUrl'
  | 'askContact'
  | 'contactRequired'
  | 'confirm'
  | 'confirmHint'
  | 'publishing'
  | 'published'
  | 'publishError'
  | 'btnNew'
  | 'btnCancel'
  | 'btnSkip'
  | 'btnYes'
  | 'btnNo'
  | 'linkSuccess'
  | 'linkInvalid'
  | 'linkError'

const M: Record<BotLocale, Record<MsgKey, string>> = {
  uk: {
    welcome: '👋 Вітаємо в DImarket!',
    promo:
      'Безкоштовна платформа будівельних послуг.\nСайт: https://dimarket.app\n\nНатисніть «Подати оголошення», щоб фахівці побачили ваше замовлення.',
    newListing: 'Почнемо нове оголошення. Оберіть категорію:',
    cancelled: 'Скасовано. Напишіть /start або натисніть «Подати оголошення».',
    chooseCategory: 'Оберіть категорію з кнопок нижче або введіть номер:',
    categoryUnknown: 'Не знайшов категорію. Оберіть кнопку або номер зі списку.',
    askCity: 'Місто або регіон (наприклад: Варшава, Краків):',
    cityTooShort: 'Вкажіть місто хоча б 2 символи.',
    askCountry: '📍 Оберіть країну (обовʼязково для пошуку фахівця в вашому місті):',
    askRegion: 'Оберіть область / регіон:',
    askCityPick: 'Оберіть населений пункт (місто або село) зі списку — так фахівці з вашого міста побачать оголошення:',
    pickCountryButton: 'Оберіть країну кнопкою нижче.',
    pickRegionButton: 'Оберіть область кнопкою нижче.',
    cityUnknown: 'Не знайшов таке місто в обраній області. Оберіть з кнопок або введіть точну назву зі списку.',
    cityPickRequired: 'Спочатку оберіть область і місто з кнопок.',
    regionEmpty: 'Для цієї країни немає регіонів у каталозі. Спробуйте іншу країну.',
    cityEmpty: 'Для цього регіону немає міст у каталозі. Оберіть інший регіон.',
    askBudget: 'Бюджет (EUR/USD) або «пропустити»:',
    budgetInvalid: 'Вкажіть число або «пропустити».',
    askDeadline: 'Термін (днів): 7, 14, 30 або «пропустити» (30 днів):',
    askDescription: 'Опишіть роботу (мінімум 15 символів):',
    descriptionTooShort: 'Опис занадто короткий. Додайте деталі.',
    askPhotos: 'Надішліть фото або посилання (https://…), або «пропустити»:',
    photosNeedUrl: 'Надішліть фото або посилання https://…',
    askContact: 'Телефон або email для звʼязку:',
    contactRequired: 'Потрібен телефон або email.',
    confirm:
      '📋 Перевірте:\nКатегорія: {category}\nМісто: {city}\nБюджет: {budget}\nТермін: {deadline} дн.\nОпис: {description}\nФото: {photos}\n\nОпублікувати на dimarket.app?',
    confirmHint: 'Натисніть «Так» або «Ні».',
    publishing: 'Публікую оголошення…',
    published: '✅ Оголошення опубліковано!\n{link}',
    publishError: 'Не вдалося опублікувати. Спробуйте пізніше або напишіть на dimarket.app/contact',
    btnNew: '📝 Подати оголошення',
    btnCancel: '❌ Скасувати',
    btnSkip: 'Пропустити',
    btnYes: '✅ Так',
    btnNo: '❌ Ні',
    linkSuccess: '✅ Telegram підключено! Ви отримуватимете сповіщення про нові замовлення.',
    linkInvalid: '❌ Код не знайдено. Скопіюйте код із Налаштувань → Telegram на dimarket.app.',
    linkError: '⚠️ Помилка привʼязки. Спробуйте пізніше.',
  },
  ru: {
    welcome: '👋 Добро пожаловать в DImarket!',
    promo:
      'Бесплатная платформа строительных услуг.\nСайт: https://dimarket.app\n\nНажмите «Разместить объявление», чтобы мастера увидели ваш заказ.',
    newListing: 'Создадим объявление. Выберите категорию:',
    cancelled: 'Отменено. Напишите /start или «Разместить объявление».',
    chooseCategory: 'Выберите категорию кнопкой или введите номер:',
    categoryUnknown: 'Категория не найдена. Выберите кнопку или номер.',
    askCity: 'Город или регион (например: Варшава, Краков):',
    cityTooShort: 'Укажите город (минимум 2 символа).',
    askCountry: '📍 Выберите страну (чтобы мастера из вашего города увидели объявление):',
    askRegion: 'Выберите область / регион:',
    askCityPick: 'Выберите населённый пункт из списка (город или село):',
    pickCountryButton: 'Выберите страну кнопкой ниже.',
    pickRegionButton: 'Выберите область кнопкой ниже.',
    cityUnknown: 'Такого города нет в выбранной области. Выберите из кнопок.',
    cityPickRequired: 'Сначала выберите область и город.',
    regionEmpty: 'Нет регионов для этой страны.',
    cityEmpty: 'Нет городов для этого региона.',
    askBudget: 'Бюджет или «пропустить»:',
    budgetInvalid: 'Укажите число или «пропустить».',
    askDeadline: 'Срок (дней): 7, 14, 30 или «пропустить» (30):',
    askDescription: 'Опишите работу (минимум 15 символов):',
    descriptionTooShort: 'Описание слишком короткое.',
    askPhotos: 'Отправьте фото или ссылку https://…, или «пропустить»:',
    photosNeedUrl: 'Отправьте фото или ссылку https://…',
    askContact: 'Телефон или email:',
    contactRequired: 'Нужен телефон или email.',
    confirm:
      '📋 Проверьте:\nКатегория: {category}\nГород: {city}\nБюджет: {budget}\nСрок: {deadline} дн.\nОписание: {description}\nФото: {photos}\n\nОпубликовать на dimarket.app?',
    confirmHint: 'Нажмите «Да» или «Нет».',
    publishing: 'Публикую…',
    published: '✅ Объявление опубликовано!\n{link}',
    publishError: 'Не удалось опубликовать. Попробуйте на dimarket.app',
    btnNew: '📝 Разместить объявление',
    btnCancel: '❌ Отмена',
    btnSkip: 'Пропустить',
    btnYes: '✅ Да',
    btnNo: '❌ Нет',
    linkSuccess: '✅ Telegram подключён! Вы будете получать уведомления о новых заказах.',
    linkInvalid: '❌ Код не найден. Скопируйте код из Настроек → Telegram на dimarket.app.',
    linkError: '⚠️ Ошибка привязки. Попробуйте позже.',
  },
  en: {
    welcome: '👋 Welcome to DImarket!',
    promo:
      'Free construction services marketplace.\nhttps://dimarket.app\n\nTap «Post a job» to publish your request for professionals.',
    newListing: 'Let’s create your listing. Pick a category:',
    cancelled: 'Cancelled. Send /start or tap «Post a job».',
    chooseCategory: 'Pick a category below or type a number:',
    categoryUnknown: 'Category not found. Use a button or number.',
    askCity: 'City or area (e.g. Warsaw, Berlin):',
    cityTooShort: 'City must be at least 2 characters.',
    askCountry: '📍 Pick country (required so local pros see your listing):',
    askRegion: 'Pick region / state:',
    askCityPick: 'Pick your city or village from the list:',
    pickCountryButton: 'Use the country buttons below.',
    pickRegionButton: 'Use the region buttons below.',
    cityUnknown: 'City not found in this region. Pick from the buttons.',
    cityPickRequired: 'Pick region and city from the buttons first.',
    regionEmpty: 'No regions for this country.',
    cityEmpty: 'No cities for this region.',
    askBudget: 'Budget (optional) — number or «skip»:',
    budgetInvalid: 'Enter a number or «skip».',
    askDeadline: 'Duration in days: 7, 14, 30 or «skip» (30):',
    askDescription: 'Describe the job (min 15 characters):',
    descriptionTooShort: 'Description is too short.',
    askPhotos: 'Send photo(s) or URL(s), or «skip»:',
    photosNeedUrl: 'Send a photo or https:// link.',
    askContact: 'Phone or email for contact:',
    contactRequired: 'Phone or email required.',
    confirm:
      '📋 Review:\nCategory: {category}\nCity: {city}\nBudget: {budget}\nDays: {deadline}\nDetails: {description}\nPhotos: {photos}\n\nPublish on dimarket.app?',
    confirmHint: 'Tap Yes or No.',
    publishing: 'Publishing…',
    published: '✅ Listing published!\n{link}',
    publishError: 'Could not publish. Try https://dimarket.app/contact',
    btnNew: '📝 Post a job',
    btnCancel: '❌ Cancel',
    btnSkip: 'Skip',
    btnYes: '✅ Yes',
    btnNo: '❌ No',
    linkSuccess: '✅ Telegram linked! You will receive alerts for new job matches.',
    linkInvalid: '❌ Code not found. Copy the code from Settings → Telegram on dimarket.app.',
    linkError: '⚠️ Link failed. Try again later.',
  },
  pl: {
    welcome: '👋 Witamy w DImarket!',
    promo: 'Darmowa platforma budowlana.\nhttps://dimarket.app\n\nKliknij «Dodaj ogłoszenie».',
    newListing: 'Nowe ogłoszenie. Wybierz kategorię:',
    cancelled: 'Anulowano. /start lub «Dodaj ogłoszenie».',
    chooseCategory: 'Wybierz kategorię lub numer:',
    categoryUnknown: 'Nie rozpoznano kategorii.',
    askCity: 'Miasto (np. Warszawa):',
    cityTooShort: 'Podaj miasto (min. 2 znaki).',
    askCountry: '📍 Wybierz kraj:',
    askRegion: 'Wybierz województwo / region:',
    askCityPick: 'Wybierz miasto lub wieś z listy:',
    pickCountryButton: 'Wybierz kraj przyciskiem.',
    pickRegionButton: 'Wybierz region przyciskiem.',
    cityUnknown: 'Nie znaleziono miasta. Wybierz z listy.',
    cityPickRequired: 'Najpierw wybierz region i miasto.',
    regionEmpty: 'Brak regionów.',
    cityEmpty: 'Brak miast.',
    askBudget: 'Budżet lub «pomiń»:',
    budgetInvalid: 'Liczba lub «pomiń».',
    askDeadline: 'Termin (dni): 7, 14, 30 lub «pomiń»:',
    askDescription: 'Opis pracy (min. 15 znaków):',
    descriptionTooShort: 'Opis za krótki.',
    askPhotos: 'Zdjęcie lub link, albo «pomiń»:',
    photosNeedUrl: 'Wyślij zdjęcie lub link https://',
    askContact: 'Telefon lub email:',
    contactRequired: 'Wymagany telefon lub email.',
    confirm:
      '📋 Podsumowanie:\nKategoria: {category}\nMiasto: {city}\nBudżet: {budget}\nDni: {deadline}\nOpis: {description}\nZdjęcia: {photos}\n\nOpublikować?',
    confirmHint: 'Tak lub Nie.',
    publishing: 'Publikuję…',
    published: '✅ Opublikowano!\n{link}',
    publishError: 'Błąd publikacji. dimarket.app',
    btnNew: '📝 Dodaj ogłoszenie',
    btnCancel: '❌ Anuluj',
    btnSkip: 'Pomiń',
    btnYes: '✅ Tak',
    btnNo: '❌ Nie',
    linkSuccess: '✅ Telegram połączony! Otrzymasz powiadomienia o nowych zleceniach.',
    linkInvalid: '❌ Nie znaleziono kodu. Skopiuj kod z Ustawień → Telegram na dimarket.app.',
    linkError: '⚠️ Błąd połączenia. Spróbuj później.',
  },
  de: {
    welcome: '👋 Willkommen bei DImarket!',
    promo: 'Kostenlose Bau-Plattform.\nhttps://dimarket.app',
    newListing: 'Neues Inserat. Kategorie wählen:',
    cancelled: 'Abgebrochen. /start',
    chooseCategory: 'Kategorie wählen oder Nummer:',
    categoryUnknown: 'Kategorie nicht erkannt.',
    askCity: 'Stadt:',
    cityTooShort: 'Stadt zu kurz.',
    askCountry: '📍 Land wählen:',
    askRegion: 'Region wählen:',
    askCityPick: 'Stadt/Gemeinde aus der Liste:',
    pickCountryButton: 'Land per Knopf wählen.',
    pickRegionButton: 'Region per Knopf wählen.',
    cityUnknown: 'Stadt nicht gefunden.',
    cityPickRequired: 'Zuerst Region und Stadt wählen.',
    regionEmpty: 'Keine Regionen.',
    cityEmpty: 'Keine Städte.',
    askBudget: 'Budget oder «überspringen»:',
    budgetInvalid: 'Zahl oder «überspringen».',
    askDeadline: 'Tage: 7, 14, 30 oder überspringen:',
    askDescription: 'Beschreibung (min. 15 Zeichen):',
    descriptionTooShort: 'Zu kurz.',
    askPhotos: 'Foto/Link oder überspringen:',
    photosNeedUrl: 'Foto oder https:// Link.',
    askContact: 'Telefon oder E-Mail:',
    contactRequired: 'Kontakt erforderlich.',
    confirm: '📋 {category} | {city} | {budget} | {deadline}d\n{description}\nVeröffentlichen?',
    confirmHint: 'Ja oder Nein.',
    publishing: 'Veröffentliche…',
    published: '✅ Veröffentlicht!\n{link}',
    publishError: 'Fehler. dimarket.app',
    btnNew: '📝 Inserat',
    btnCancel: '❌ Abbrechen',
    btnSkip: 'Überspringen',
    btnYes: '✅ Ja',
    btnNo: '❌ Nein',
    linkSuccess: '✅ Telegram verbunden! Sie erhalten Benachrichtigungen zu neuen Aufträgen.',
    linkInvalid: '❌ Code nicht gefunden. Kopieren Sie den Code aus Einstellungen → Telegram.',
    linkError: '⚠️ Verknüpfung fehlgeschlagen. Bitte später erneut versuchen.',
  },
  es: {
    welcome: '👋 ¡Bienvenido a DImarket!',
    promo: 'Plataforma gratuita de construcción.\nhttps://dimarket.app',
    newListing: 'Nuevo anuncio. Elige categoría:',
    cancelled: 'Cancelado. /start',
    chooseCategory: 'Elige categoría o número:',
    categoryUnknown: 'Categoría no encontrada.',
    askCity: 'Ciudad:',
    cityTooShort: 'Ciudad demasiado corta.',
    askCountry: '📍 Elige país:',
    askRegion: 'Elige región:',
    askCityPick: 'Elige ciudad o pueblo de la lista:',
    pickCountryButton: 'Usa los botones de país.',
    pickRegionButton: 'Usa los botones de región.',
    cityUnknown: 'Ciudad no encontrada.',
    cityPickRequired: 'Elige región y ciudad primero.',
    regionEmpty: 'Sin regiones.',
    cityEmpty: 'Sin ciudades.',
    askBudget: 'Presupuesto o «omitir»:',
    budgetInvalid: 'Número u «omitir».',
    askDeadline: 'Días: 7, 14, 30 u omitir:',
    askDescription: 'Descripción (mín. 15 caracteres):',
    descriptionTooShort: 'Descripción muy corta.',
    askPhotos: 'Foto o enlace, u omitir:',
    photosNeedUrl: 'Foto o enlace https://',
    askContact: 'Teléfono o email:',
    contactRequired: 'Contacto obligatorio.',
    confirm: '📋 {category} | {city}\n{description}\n¿Publicar?',
    confirmHint: 'Sí o No.',
    publishing: 'Publicando…',
    published: '✅ ¡Publicado!\n{link}',
    publishError: 'Error. dimarket.app',
    btnNew: '📝 Publicar',
    btnCancel: '❌ Cancelar',
    btnSkip: 'Omitir',
    btnYes: '✅ Sí',
    btnNo: '❌ No',
    linkSuccess: '✅ ¡Telegram vinculado! Recibirás alertas de nuevos trabajos.',
    linkInvalid: '❌ Código no encontrado. Copia el código desde Ajustes → Telegram en dimarket.app.',
    linkError: '⚠️ Error al vincular. Inténtalo más tarde.',
  },
}

export function t(locale: BotLocale, key: MsgKey, params?: Record<string, string>): string {
  let s = M[locale]?.[key] ?? M.en[key]
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replaceAll(`{${k}}`, v)
    }
  }
  return s
}

/** Назви категорій для кнопок (основні slug з БД). */
export const CATEGORY_LABELS: Record<string, Partial<Record<BotLocale, string>>> = {
  construction: { uk: 'Будівництво', ru: 'Строительство', en: 'Construction', pl: 'Budowa', de: 'Bau', es: 'Construcción' },
  renovation: { uk: 'Ремонт', ru: 'Ремонт', en: 'Renovation', pl: 'Remont' },
  electrical: { uk: 'Автосервіс', ru: 'Автосервис', en: 'Auto repair', pl: 'Warsztat' },
  plumbing: { uk: 'Сантехніка', ru: 'Сантехника', en: 'Plumbing', pl: 'Hydraulika' },
  handyman: { uk: 'Фахівець', ru: 'Мастер', en: 'Handyman', pl: 'Złota rączka' },
  cleaning: { uk: 'Прибирання', ru: 'Уборка', en: 'Cleaning', pl: 'Sprzątanie', es: 'Limpieza' },
  tools: { uk: 'Транспорт', ru: 'Транспорт', en: 'Transport', pl: 'Transport' },
  furniture: { uk: 'Меблі', ru: 'Мебель', en: 'Furniture', pl: 'Meble' },
  'legal-notary': { uk: 'Юрист / нотаріус', ru: 'Юрист', en: 'Lawyer' },
  'accounting-finance': { uk: 'Бухгалтер', ru: 'Бухгалтер', en: 'Accountant' },
  vacancies: { uk: 'Вакансії', ru: 'Вакансии', en: 'Vacancies', pl: 'Wakaty' },
  'sell-rent': { uk: 'Продаж / оренда', ru: 'Продажа / аренда', en: 'Sale / rent', pl: 'Sprzedaż' },
}

export function categoryLabel(slug: string, locale: BotLocale, fallbackName: string): string {
  return CATEGORY_LABELS[slug]?.[locale] ?? CATEGORY_LABELS[slug]?.en ?? fallbackName
}
