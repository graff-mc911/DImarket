/**
 * Keys for previously hardcoded UI strings (listing/pro/checkout/chat/history).
 * Merged into en/uk; other locales fall back to English via the locale loader.
 */

export const uiHardcodedFixEn = {
  'listing.saved': 'Saved',
  'listing.save': 'Save listing',
  'listing.loginToContact': 'Sign in to contact',
  'listing.createSimilar': 'Create a similar listing',
  'listing.ended': 'Listing ended',

  'listing.unavailable': 'Listing unavailable.',
  'listing.photo': 'Photo {n}',
  'listing.searchPrefix': 'Search: {q}',
  'listing.cityPrefix': 'City: {city}',
  'listing.maxPricePrefix': 'Max price: {price}',
  'listing.contacts': 'Contacts',
  'listing.aboutAuthor': 'About the author',
  'listing.author': 'Author',

  'pro.about': 'About the pro',
  'pro.portfolio': 'Portfolio',
  'pro.reviews': 'Reviews ({count})',
  'pro.save': 'Save professional',
  'pro.saved': 'Saved',
  'pro.new': 'New',
  'pro.fallbackName': 'Professional',
  'pro.notFound': 'Profile not found.',
  'pro.unavailable': 'Profile unavailable.',
  'pro.loadError': 'Failed to load.',

  'favorites.remove': 'Remove from saved',
  'favorites.save': 'Save',

  'common.all': 'All',
  'common.buy': 'Buy',
  'common.processing': 'Processing…',
  'common.deleteListingConfirm': 'Delete this listing?',
  'common.pageUnavailable': 'Page unavailable',
  'common.somethingWrong': 'Something went wrong',

  'chat.open': 'Chat with assistant',
  'chat.title': 'DImarket AI Assistant',
  'chat.welcome':
    'Hi! I am the DImarket virtual assistant. Ask about services, prices, or how to publish a listing.',
  'chat.placeholder': 'Write your question…',
  'chat.webhookMissing':
    'Widget is not configured: set VITE_AI_WEBHOOK_URL in .env or pass a webhookUrl prop.',

  'checkout.viewProfile': 'View profile',
  'checkout.myListings': 'My listings',
  'checkout.backHome': 'Back to home',
  'checkout.stripeOnly': 'Payments are processed via Stripe Checkout.',

  'boost.getBadge': 'Get badge',
  'boost.buy': 'Purchase',
  'boost.payError': 'Payment failed. Please try again.',
  'boost.premiumBenefits.1': 'Your profile at the top of search results',
  'boost.premiumBenefits.2': 'Orange premium stripe on your card',
  'boost.premiumBenefits.3': 'More views and inquiries from clients',
  'boost.premiumBenefits.4': 'Priority in filtered results',
  'boost.verifiedBenefits.1': 'Green checkmark ✓ on your profile',
  'boost.verifiedBenefits.2': 'Increased trust from clients',
  'boost.verifiedBenefits.3': 'Priority when ratings are equal',
  'boost.verifiedBenefits.4': 'Valid for 1 year',
  'boost.premiumNamePrefix': 'Premium profile — ',

  'home.prosAbbrev': '{n} pros',
  'home.companiesAbbrev': '{n} companies',
  'home.countriesAbbrev': '{n} countries',
  'home.servicesAbbrev': '{n} services',

  'costEstimator.historyColEstimate': 'Estimate',
  'costEstimator.historyColEconomy': 'Economy',
  'costEstimator.historyColStandard': 'Standard',
  'costEstimator.historyColPremium': 'Premium',
  'costEstimator.historyColArea': 'Area',
  'costEstimator.historyLoading': 'Loading…',
  'costEstimator.historyEmpty': 'No saved estimates yet',
  'costEstimator.historyCreate': 'Create estimate',
  'costEstimator.historyShare': 'Share',
  'costEstimator.historyArchive': 'Archive',
  'costEstimator.historyPdf': 'PDF',
  'costEstimator.historyCsv': 'CSV',
  'costEstimator.historyShareSuffix': '— reference estimate',


} as const

export const uiHardcodedFixUk: Record<string, string> = {
  'listing.saved': 'В збережених',
  'listing.save': 'Зберегти оголошення',
  'listing.loginToContact': 'Увійти для контакту',
  'listing.createSimilar': 'Створити схоже оголошення',
  'listing.ended': 'Термін завершився',
  'listing.daysLeft': 'Ще {days} дн.',
  'listing.unavailable': 'Оголошення недоступне.',
  'listing.photo': 'Фото {n}',
  'listing.searchPrefix': 'Пошук: {q}',
  'listing.cityPrefix': 'Місто: {city}',
  'listing.maxPricePrefix': 'Макс. ціна: {price}',
  'listing.contacts': 'Контакти',
  'listing.aboutAuthor': 'Про автора',
  'listing.author': 'Автор',

  'pro.about': 'Про майстра',
  'pro.portfolio': 'Портфоліо',
  'pro.reviews': 'Відгуки ({count})',
  'pro.save': 'Зберегти майстра',
  'pro.saved': 'В збережених',
  'pro.new': 'Новий',
  'pro.fallbackName': 'Майстер',
  'pro.notFound': 'Профіль не знайдено.',
  'pro.unavailable': 'Профіль недоступний.',
  'pro.loadError': 'Помилка завантаження',

  'favorites.remove': 'Видалити зі збережених',
  'favorites.save': 'Зберегти',

  'common.all': 'Всі',
  'common.buy': 'Придбати',
  'common.processing': 'Переходимо…',
  'common.deleteListingConfirm': 'Видалити оголошення?',
  'common.pageUnavailable': 'Сторінка недоступна',
  'common.somethingWrong': 'Щось пішло не так',

  'chat.open': 'Чат з помічником',
  'chat.title': 'DImarket AI-помічник',
  'chat.welcome':
    'Вітаю! Я віртуальний помічник DImarket. Запитайте про послуги, ціни або як опублікувати оголошення.',
  'chat.placeholder': 'Напишіть запит…',
  'chat.webhookMissing':
    'Віджет не налаштовано: встановіть VITE_AI_WEBHOOK_URL у .env або передайте webhookUrl prop.',

  'checkout.viewProfile': 'Переглянути профіль',
  'checkout.myListings': 'Мої оголошення',
  'checkout.backHome': 'На головну',
  'checkout.stripeOnly': 'Оплата здійснюється через Stripe Checkout.',

  'boost.getBadge': 'Отримати бейдж',
  'boost.buy': 'Придбати',
  'boost.payError': 'Помилка оплати. Спробуйте ще раз.',
  'boost.premiumBenefits.1': 'Ваш профіль вгорі пошукової видачі',
  'boost.premiumBenefits.2': 'Помаранчева преміум-смужка на картці',
  'boost.premiumBenefits.3': 'Більше переглядів і звернень від клієнтів',
  'boost.premiumBenefits.4': 'Пріоритет у результатах фільтрації',
  'boost.verifiedBenefits.1': 'Зелена галочка ✓ на вашому профілі',
  'boost.verifiedBenefits.2': 'Підвищена довіра від клієнтів',
  'boost.verifiedBenefits.3': 'Пріоритет при однаковому рейтингу',
  'boost.verifiedBenefits.4': 'Термін дії — 1 рік',
  'boost.premiumNamePrefix': 'Преміум профіль — ',

  'home.prosAbbrev': '{n} проф.',
  'home.companiesAbbrev': '{n} комп.',
  'home.countriesAbbrev': '{n} країн',
  'home.servicesAbbrev': '{n} послуг',

  'costEstimator.historyColEstimate': 'Оцінка',
  'costEstimator.historyColEconomy': 'Економ',
  'costEstimator.historyColStandard': 'Стандарт',
  'costEstimator.historyColPremium': 'Преміум',
  'costEstimator.historyColArea': 'Площа',
  'costEstimator.historyLoading': 'Завантаження…',
  'costEstimator.historyEmpty': 'Збережених оцінок ще немає',
  'costEstimator.historyCreate': 'Створити оцінку',
  'costEstimator.historyShare': 'Поділитися',
  'costEstimator.historyArchive': 'В архів',
  'costEstimator.historyPdf': 'PDF',
  'costEstimator.historyCsv': 'CSV',
  'costEstimator.historyShareSuffix': '— орієнтовна оцінка',

  'nav.costEstimator': 'Оцінка вартості',
}
