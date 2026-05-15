import type { TranslationKey } from './en'

export const bgTranslations: Partial<Record<TranslationKey, string>> = {
  // Шапка сайту
  'header.browse': 'Преглед',
  'header.findProfessionals': 'Намери майстори',
  'header.professionalLogin': 'Вход за майстори',
  'header.createAd': 'Създай обява',
  'header.myProfile': 'Моят профил',
  'header.dashboard': 'Панел',
  'header.myListings': 'Моите обяви',
  'header.signOut': 'Изход',
  'header.account': 'Акаунт',
  'header.language': 'Език',
  'header.currency': 'Валута',
  'header.jobRequests': 'Заявки за работа',
  'header.favorites': 'Любими',
  'header.messages': 'Съобщения',
  'header.postJob': 'Публикувай заявка',
  'header.brandTagline': 'Безплатна строителна платформа',

  // Футер
  'footer.tagline':
    'Свържи се с надеждни строителни професионалисти и намери качествени материали.',
  'footer.forClients': 'За клиенти',
  'footer.browseListings': 'Преглед на обяви',
  'footer.postRequest': 'Публикувай заявка',
  'footer.forProfessionals': 'За майстори',
  'footer.signIn': 'Вход',
  'footer.register': 'Регистрация',
  'footer.howItWorks': 'Как работи',
  'footer.allRightsReserved': 'Всички права запазени.',
  'footer.brandText':
    'Dimarket е безплатна глобална платформа за строителни услуги, където клиентите публикуват работа, а майсторите отговарят директно.',
  'footer.monetization':
    'Без такси за потребителите. Без абонаменти. Платформата печели само от реклама.',
  'footer.platformTitleSimple': 'Платформа',
  'footer.accountTitleSimple': 'Акаунт',
  'footer.adsTitle': 'Реклама',
  'footer.adsText':
    'Марки за строителни материали, инструменти, логистика и местни услуги могат да достигнат активното търсене в обявите и в страниците на майсторите.',
  'footer.adsButton': 'Рекламна страница',
  'footer.legalRight':
    'Безплатна платформа за строителни услуги с монетизация само чрез реклама.',

  // Головна сторінка: старі ключі
  'home.heroTitle': 'Намери надеждни майстори',
  'home.heroSubtitle': 'Изгради мечтите си',
  'home.heroDescription':
    'Платформа за строителство, ремонт и домашни услуги, която свързва клиенти с проверени професионалисти',
  'home.searchPlaceholder': 'Търси услуги, материали или майстори...',
  'home.search': 'Търси',
  'home.findProfessionals': 'Намери майстори',
  'home.postRequest': 'Публикувай заявка',
  'home.browseByCategory': 'Преглед по категории',
  'home.topRatedProfessionals': 'Най-високо оценени майстори',
  'home.topRatedDescription':
    'Свържи се с проверени експерти в строителството и домашните услуги',
  'home.noProfessionals': 'Все още няма регистрирани майстори. Бъди първият!',
  'home.viewAllProfessionals': 'Виж всички майстори',
  'home.recentListings': 'Последни обяви',
  'home.recentListingsDescription': 'Нови възможности и заявки',
  'home.noListings': 'Все още няма активни обяви. Публикувай първата!',
  'home.viewAllListings': 'Виж всички обяви',
  'home.whyChoose': 'Защо Dimarket?',
  'home.verifiedProfessionals': 'Проверени майстори',
  'home.verifiedDescription':
    'Всички майстори са проверени и имат оценки и отзиви от реални клиенти',
  'home.quickEasy': 'Бързо и лесно',
  'home.quickEasyDescription':
    'Публикувай заявката си за минути без регистрация. Получавай отговори бързо',
  'home.directCommunication': 'Директна комуникация',
  'home.directCommunicationDescription':
    'Свържи се директно с майсторите чрез нашата вградена система за съобщения',
  'home.areYouProfessional': 'Ти майстор ли си?',
  'home.joinProfessionals':
    'Присъедини се към хиляди майстори, които развиват бизнеса си чрез Dimarket',
  'home.registerAsProfessional': 'Регистрирай се като майстор',

  // Головна сторінка: нові ключі
  'home.globalEyebrow': 'Глобални строителни услуги',
  'home.heroSimpleTitle':
    'Намери майстор за ремонт, монтаж или строителни работи.',
  'home.heroSimpleDescription':
    'Клиентите публикуват заявки за работа, майсторите отговарят директно, а Dimarket остава безплатен за потребителите.',
  'home.whatNeedsToBeDone': 'Какво трябва да се направи?',
  'home.cityOrCountry': 'Град или държава',
  'home.postJob': 'Публикувай заявка',
  'home.popularCategoriesTitle': 'Популярни категории',
  'home.popularCategoriesText':
    'Най-търсените направления в строителството и ремонта в Dimarket.',
  'home.browseRequests': 'Преглед на заявки',
  'home.freshRequestsTitle': 'Нови заявки за работа',
  'home.freshRequestsText':
    'Нови клиентски заявки, които майсторите могат веднага да разгледат и поемат.',
  'home.allRequests': 'Всички заявки за работа',
  'home.popularProsTitle': 'Популярни майстори',
  'home.popularProsText':
    'Профили с видим опит, стабилни оценки и директен контакт.',
  'home.allPros': 'Всички майстори',
  'home.adTitle': 'Реклама',
  'home.adText':
    'Популяризирай инструменти, материали, местни услуги или строителни шоуруми пред аудитория с реално търсене.',
  'home.adButton': 'Рекламирай в Dimarket',
  'home.adCardOne': 'Партньори за материали',
  'home.adCardTwo': 'Марки инструменти',
  'home.adCardThree': 'Местни шоуруми',
  'home.noJobs': 'Все още няма активни заявки за работа.',
  'home.noCategories': 'Категориите ще се появят тук скоро.',
  'home.noLocation': 'Местоположението не е посочено',
  'home.budgetLabel': 'Бюджет',
  'home.activeLabel': 'Активно',
  'home.unknownCategory': 'Строителна услуга',
  'home.noBio': 'Профилът на строителния професионалист все още се попълва.',
  'home.sponsoredPlacement':
    'Спонсорирано позициониране за инструменти, материали, логистика или местни строителни партньори.',
  'home.sidebarAdOne': 'Постави бранда си до реално строително търсене.',
  'home.sidebarAdTwo':
    'Достигни до майстори и клиенти, докато търсят работа и услуги.',
  'home.loading': 'Зареждане...',

  // Категорії
  'category.construction': 'Строителство',
  'category.constructionDesc': 'Ново строителство и строителни проекти',
  'category.renovation': 'Ремонт',
  'category.renovationDesc': 'Ремонт и обновяване на дома',
  'category.electrical': 'Електро',
  'category.electricalDesc': 'Електромонтажни работи и ремонти',
  'category.plumbing': 'ВиК',
  'category.plumbingDesc': 'ВиК услуги и инсталации',
  'category.handyman': 'Майстор',
  'category.handymanDesc': 'Общи майсторски услуги',
  'category.materials': 'Материали',
  'category.materialsDesc': 'Строителни материали за продажба',
  'category.tools': 'Инструменти',
  'category.toolsDesc': 'Инструменти и оборудване',
  'category.name.construction': 'Строителство',
  'category.name.renovation': 'Ремонт',
  'category.name.electrical': 'Електро',
  'category.name.plumbing': 'ВиК',
  'category.name.handyman': 'Майстор',
  'category.name.materials': 'Материали',
  'category.name.tools': 'Инструменти',

  // Картка оголошення
  'listing.serviceNeeded': 'Търся услуга',
  'listing.serviceOffered': 'Предлагам услуга',
  'listing.forSale': 'Продава се',
  'listing.wanted': 'Търся',
  'listing.contactForPrice': 'Свържи се за цена',
  'listing.daysLeft': 'дни остават',
  'listing.views': 'преглеждания',
  'listing.premium': 'ПРЕМИУМ',
  'listing.constructionService': 'Строителна услуга',
  'listing.locationNotSpecified': 'Местоположението не е посочено',
  'listing.budget': 'Бюджет',

  // Картка майстра
  'professional.contact': 'Контакт',
  'professional.reviews': 'отзива',
  'professional.new': 'Нов',
  'professional.defaultName': 'Професионалист',
  'professional.global': 'Глобално',
  'professional.profileInProgress':
    'Профилът на строителния професионалист все още се попълва.',

  // Створення оголошення
  'createAd.title': 'Създай строителна заявка за работа',
  'createAd.noRegistration': 'Не е нужна регистрация',
  'createAd.eyebrow': 'Безплатна заявка за работа',
  'createAd.heroTitle': 'Създай строителна заявка за работа',
  'createAd.heroDescription':
    'Опиши работата, добави местоположение и остави майсторите да се свържат директно с теб. Без абонамент и без такса за публикуване.',
  'createAd.detailsTitle': 'Детайли за работата',
  'createAd.detailsText':
    'Направи заявката конкретна, за да могат майсторите да разберат работата и да изпратят подходяща оферта.',
  'createAd.locationTitle': 'Местоположение и видимост',
  'createAd.locationText':
    'Избери къде се намира работата и колко широко да бъде видима за майсторите.',
  'createAd.contactTitle': 'Данни за контакт',
  'createAd.contactText':
    'Нужен е поне един начин за контакт, за да могат майсторите да се свържат директно с теб.',
  'createAd.imagesTitle': 'Снимки (по желание)',
  'createAd.imagesText':
    'Добави примерни снимки, планове или примери, за да помогнеш на майсторите да оценят по-точно работата.',
  'createAd.freeListTitle': 'Какво включва',
  'createAd.freeItemOne': 'Безплатно публикуване за клиенти',
  'createAd.freeItemTwo': 'Директен контакт с майстори',
  'createAd.freeItemThree': 'Снимки и бюджет по желание',
  'createAd.freeItemFour': 'Модел на платформа, финансиран от реклама',
  'createAd.adType': 'Тип обява',
  'createAd.needService': 'Търся услуга',
  'createAd.needServiceDesc': 'Търся помощ',
  'createAd.offerService': 'Предлагам услуга',
  'createAd.offerServiceDesc': 'Предоставям услуги',
  'createAd.sellItem': 'Продавам артикул',
  'createAd.sellItemDesc': 'Материали, инструменти',
  'createAd.wantItem': 'Купувам артикул',
  'createAd.wantItemDesc': 'Искам да купя',
  'createAd.titleLabel': 'Заглавие',
  'createAd.taskPlaceholder': 'Какво трябва да се направи?',
  'createAd.titlePlaceholder': 'Напр.: Нужен е ремонт на гипсокартон в хола',
  'createAd.titleHint': 'Пример: Нужен е ремонт на гипсокартон в хола',
  'createAd.descriptionLabel': 'Описание',
  'createAd.descriptionPlaceholder':
    'Напиши какво трябва да се направи, какъв е обемът на работата, предпочитаният срок и всички важни детайли.',
  'createAd.descriptionHint':
    'Напиши какво трябва да се направи, какъв е обемът на работата, предпочитаният срок и всички важни детайли.',
  'createAd.categoryLabel': 'Категория',
  'createAd.selectCategory': 'Избери категория',
  'createAd.priceLabel': 'Бюджет',
  'createAd.pricePlaceholder': 'Бюджет по желание',
  'createAd.budgetPlaceholder': 'Бюджет по желание',
  'createAd.locationLabel': 'Местоположение',
  'createAd.locationPlaceholder': 'Град, район или държава',
  'createAd.contactInfo': 'Информация за контакт',
  'createAd.yourName': 'Твоето име',
  'createAd.phone': 'Телефон',
  'createAd.email': 'Имейл',
  'createAd.contactNote': 'Посочи поне телефон или имейл',
  'createAd.contactRule':
    'Добави телефон или имейл, за да могат майсторите да се свържат с теб.',
  'createAd.images': 'Изображения (по желание)',
  'createAd.imagePlaceholder': 'https://example.com/photo.jpg',
  'createAd.addImage': 'Добави още едно изображение',
  'createAd.imageTip': 'Съвет: използвай директни линкове към изображения',
  'createAd.imageHelp':
    'Засега използвай директни URL адреси на изображения. Локалното качване може да бъде добавено по-късно без промяна на модела на данни.',
  'createAd.currentLocation': 'Използвай моето местоположение',
  'createAd.duration': 'Продължителност на заявката',
  'createAd.durationLabel': 'Продължителност на заявката',
  'createAd.days': 'дни',
  'createAd.popular': 'Популярно',
  'createAd.year': 'Година',
  'createAd.adIncludes': 'Какво включва',
  'createAd.freeListLegacyTitle': 'Твоята заявка включва:',
  'createAd.daysVisibility': 'дни видимост',
  'createAd.contactDisplayed': 'показани данни за контакт',
  'createAd.upToImages': 'до 10 изображения',
  'createAd.premiumBadge': 'премиум значка и горно позициониране',
  'createAd.createButton': 'Публикувай заявка за работа',
  'createAd.creating': 'Публикуване на заявката...',
  'createAd.success': 'Заявката за работа е публикувана успешно. Пренасочване...',
  'createAd.contactRequired':
    'Добави поне телефон или имейл преди публикуване на заявката.',
  'createAd.locationDetectError': 'Неуспешно определяне на текущото местоположение.',
  'createAd.locationLookupError':
    'Търсенето на местоположение не бе успешно. Въведи града ръчно.',
  'createAd.publishError': 'Неуспешно публикуване на заявката за работа.',
  'createAd.locationHelp':
    'Започни да въвеждаш град или район, за да получиш предложения.',
  'createAd.visibilityRadius': 'Радиус на видимост',
  'createAd.visibilityRadiusDesc':
    'Избери колко широко да бъде видима обявата',
  'createAd.radius.city': 'Град',
  'createAd.radius.district': 'Район',
  'createAd.radius.region': 'Регион',
  'createAd.radius.country': 'Държава',
  'createAd.radius.state': 'Щат',
  'createAd.radius.land': 'Провинция (DE)',
  'createAd.radius.global': 'Всички потребители',

  // Вхід
  'login.title': 'Вход за майстори',
  'login.subtitle': 'Влез, за да управляваш профила и обявите си',
  'login.email': 'Имейл адрес',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Парола',
  'login.passwordPlaceholder': '********',
  'login.signIn': 'Вход',
  'login.signingIn': 'Влизане...',
  'login.noAccount': 'Все още нямаш акаунт?',
  'login.registerLink': 'Регистрирай се като майстор',
  'login.lookingToPost': 'Искаш да публикуваш обява?',
  'login.noRegistrationRequired': 'Не е нужна регистрация',

  // Реєстрація
  'register.title': 'Регистрация на майстор',
  'register.subtitle': 'Присъедини се към Dimarket и развий бизнеса си',
  'register.fullName': 'Пълно име',
  'register.fullNamePlaceholder': 'Иван Иванов',
  'register.passwordMin': 'Минимум 6 символа',
  'register.phonePlaceholder': '+359 88 123 45 67',
  'register.locationPlaceholder': 'Град, област',
  'register.createAccount': 'Създай акаунт на майстор',
  'register.creating': 'Създаване на акаунт...',
  'register.success': 'Регистрацията е успешна! Пренасочване към панела...',
  'register.alreadyHave': 'Вече имаш акаунт?',
  'register.afterRegistration': 'След регистрация:',
  'register.choosePlan': 'Ще избереш план',
  'register.completeProfile': 'Ще попълниш профила и портфолиото си',
  'register.receiveRequests': 'Ще започнеш да получаваш клиентски заявки',
  'register.buildReputation': 'Ще изградиш репутацията си чрез отзиви',

  // Каталог оголошень: старі ключі
  'listings.title': 'Преглед на обяви',
  'listings.searchPlaceholder': 'Търси обяви...',
  'listings.filters': 'Филтри',
  'listings.allCategories': 'Всички категории',
  'listings.allTypes': 'Всички типове',
  'listings.clearFilters': 'Изчисти филтрите',
  'listings.loading': 'Зареждане на обяви...',
  'listings.noFound': 'Няма намерени обяви',
  'listings.createFirst': 'Създай първата обява',
  'listings.category': 'Категория',
  'listings.listingType': 'Тип обява',
  'listings.typeServiceRequest': 'Търся услуга',
  'listings.typeServiceOffer': 'Предлагам услуга',
  'listings.typeItemSale': 'Продава се',
  'listings.typeItemWanted': 'Купувам',
  'listings.search': 'Търси',

  // Каталог оголошень: нові ключі
  'listings.eyebrow': 'Заявки за работа',
  'listings.simpleTitle': 'Строителни заявки от клиенти',
  'listings.simpleDescription':
    'Преглеждай активни клиентски заявки, филтрирай по категория или място и отговаряй директно, когато работата съответства на уменията ти.',
  'listings.whatNeedsToBeDone': 'Какво трябва да се направи?',
  'listings.cityOrCountry': 'Град или държава',
  'listings.findRequests': 'Намери заявки',
  'listings.filtersButton': 'Филтри',
  'listings.categoryLabel': 'Категория',
  'listings.allCategoriesSimple': 'Всички категории',
  'listings.clearFiltersSimple': 'Изчисти филтрите',
  'listings.postJob': 'Публикувай заявка',
  'listings.countSuffix': 'намерени заявки',
  'listings.loadingRequests': 'Зареждане на заявки за работа...',
  'listings.emptyTitle': 'Няма заявки, които да съответстват на тези филтри',
  'listings.emptyText':
    'Опитай с друга ключова дума, избери различна категория или премахни филтъра за местоположение.',

  // Каталог майстрів: старі ключі
  'professionals.title': 'Намери майстори',
  'professionals.subtitle':
    'Свържи се с проверени експерти в строителството и домашните услуги',
  'professionals.searchPlaceholder': 'Търси по име, местоположение или услуги...',
  'professionals.loading': 'Зареждане на майстори...',
  'professionals.noFound': 'Не са намерени майстори',
  'professionals.beFirst': 'Бъди първият регистриран майстор!',
  'professionals.joinTitle': 'Ти майстор ли си?',
  'professionals.joinDesc':
    'Присъедини се към платформата и намери клиенти, които търсят твоите услуги',
  'professionals.getStartedToday': 'Започни днес',
  'professionals.sortBy': 'Сортиране по',
  'professionals.topRated': 'Най-висока оценка',
  'professionals.mostViewed': 'Най-много преглеждания',
  'professionals.newest': 'Най-нови',
  'professionals.minRating': 'Минимална оценка',
  'professionals.anyRating': 'Всякаква оценка',
  'professionals.location': 'Местоположение',
  'professionals.locationPlaceholder': 'Филтрирай по местоположение...',
  'professionals.found': 'намерени майстори',
  'professionals.registerAsProfessional': 'Регистрирай се като майстор',

  // Каталог майстрів: нові ключі
  'professionals.eyebrow': 'Професионалисти / Майстори',
  'professionals.simpleTitle':
    'Строителни професионалисти, готови за директен контакт',
  'professionals.simpleDescription':
    'Търси майстори по град, умение или оценка и се свържи директно с тях след преглед на публичния им профил.',
  'professionals.nameSkillService': 'Име, умение или услуга',
  'professionals.cityOrCountry': 'Град или държава',
  'professionals.filtersButton': 'Филтри',
  'professionals.categoryLabel': 'Категория',
  'professionals.allCategoriesSimple': 'Всички категории',
  'professionals.sortLabel': 'Подреждане',
  'professionals.minRatingLabel': 'Минимална оценка',
  'professionals.anyRatingSimple': 'Всякаква оценка',
  'professionals.sortRating': 'Най-висока оценка',
  'professionals.sortReviews': 'Най-много отзиви',
  'professionals.sortNewest': 'Най-нови профили',
  'professionals.clearFiltersSimple': 'Изчисти филтрите',
  'professionals.countSuffix': 'намерени майстори',
  'professionals.loadingSimple': 'Зареждане на майстори...',
  'professionals.postJob': 'Публикувай заявка',
  'professionals.emptyTitle': 'Няма майстори, които да съответстват на тези филтри',
  'professionals.emptyText':
    'Опитай с друго местоположение, премахни филтъра по категория или намали минималната оценка.',

  // Рекламні блоки
  'ads.adSpace': 'Рекламно място',
  'ads.advertiseHere': 'Рекламирай бизнеса си тук',
  'ads.bannerAd': 'Банерна реклама',
  'ads.premiumPlacement': 'Премиум рекламно позициониране',
  'ads.contactRates': 'Свържи се с нас за тарифи',
  'ads.stickyAdBlock': 'Фиксиран рекламен блок',
  'ads.close': 'Затвори рекламата',

  // Загальні тексти
  'common.loading': 'Зареждане...',
  'common.error': 'Грешка',
  'common.success': 'Успех',

  // Радіус видимості
  'visibility.city': 'Град',
  'visibility.district': 'Район',
  'visibility.region': 'Регион',
  'visibility.country': 'Държава',
  'visibility.state': 'Щат',
  'visibility.land': 'Провинция (DE)',
  'visibility.global': 'Всички потребители',

  // Службові сторінки-заглушки
  'route.professionalProfileEyebrow': 'Профил на майстор',
  'route.professionalProfileTitle': 'Страницата на профила на майстора се подготвя',
  'route.professionalProfileDescription':
    'Тук клиентите ще могат да разглеждат профила на майстора, оценката, отзивите и завършените работи.',
  'route.jobRequestEyebrow': 'Заявка за работа',
  'route.jobRequestTitle': 'Детайлите на заявката се подготвят',
  'route.jobRequestDescription':
    'На тази страница ще се показват пълното описание на заявката, прикачените файлове, бюджетът и директният контакт за майсторите.',
  'route.messagesEyebrow': 'Съобщения',
  'route.messagesTitle': 'Директните съобщения ще се показват тук',
  'route.messagesDescription':
    'Клиенти и майстори ще могат да общуват директно в един разговор за всяка заявка.',
  'route.notFoundEyebrow': 'Страницата не е намерена',
  'route.notFoundTitle': 'Тази страница все още не съществува',
  'route.notFoundDescription':
    'Маршрутът вече е запазен за бъдещо развитие на платформата, но тук все още няма завършен екран.',

  // Обране
  'favorites.title': 'Любими',
  'favorites.description':
    'Запази заявки за работа и майстори, към които искаш да се върнеш по-късно.',
  'favorites.loginTitle': 'Влез, за да запазваш любими',
  'favorites.loginText':
    'Запазените заявки за работа и майстори са налични само в твоя акаунт.',
  'favorites.loginButton': 'Към вход',
  'favorites.listingsTab': 'Заявки за работа',
  'favorites.professionalsTab': 'Майстори',
  'favorites.loading': 'Зареждане на любими...',
  'favorites.emptyListingsTitle': 'Все още няма запазени заявки',
  'favorites.emptyListingsText':
    'Добавяй заявки в любими, за да можеш бързо да се връщаш към тях по-късно.',
  'favorites.emptyListingsButton': 'Прегледай заявки',
  'favorites.emptyProfessionalsTitle': 'Все още няма запазени майстори',
  'favorites.emptyProfessionalsText':
    'Запази майстори, които искаш да сравниш, да потърсиш или да прегледаш по-късно.',
  'favorites.emptyProfessionalsButton': 'Прегледай майстори',

  // Статистика у футері
  'footerStats.title': 'Активност на платформата',
  'footerStats.subtitle':
    'Живи индикатори за използването на Dimarket и търсенето на строителни услуги.',
  'footerStats.visits': 'Посещения',
  'footerStats.listings': 'Създадени заявки',
  'footerStats.successful': 'Завършени заявки',
  'footerStats.professionals': 'Майстори',
  'footerStats.countries': 'Държави в класацията',
  'footerStats.rankingTitle': 'Класация на държавите',
  'footerStats.rankingSubtitle':
    'Оценката комбинира майстори, заявки и активност в различните държави.',
  'footerStats.updatedPrefix': 'Обновено:',
  'footerStats.loading': 'Зареждане на статистика...',
  'footerStats.empty': 'Все още няма достатъчно данни за класацията на държавите.',
  'footerStats.score': 'Оценка',
  'footerStats.prosShort': 'Проф.',
  'footerStats.jobsShort': 'Работи',
  'footerStats.repliesShort': 'Отг.',

  // Сторінка реклами
  'advertising.eyebrow': 'Реклама',
  'advertising.title': 'Рекламата поддържа Dimarket безплатен за потребителите',
  'advertising.description':
    'Dimarket печели само от реклама. Брандовете могат да публикуват релевантни кампании за строителство, докато клиентите и майсторите продължават да използват платформата безплатно.',
  'advertising.placementsTitle': 'Къде може да се появи реклама',
  'advertising.placements.homeTitle': 'Начална страница',
  'advertising.placements.homeText':
    'Промо блокове до търсенето, популярните категории и новите заявки.',
  'advertising.placements.listingsTitle': 'Поток със заявки',
  'advertising.placements.listingsText':
    'Вградени рекламни позиции между заявките за работа, където майсторите активно следят нова работа.',
  'advertising.placements.sidebarTitle': 'Странична лента и футър',
  'advertising.placements.sidebarText':
    'Постоянна видимост за инструменти, материали, логистика и местни шоуруми.',
  'advertising.audienceTitle': 'Подходящо за рекламодатели',
  'advertising.audienceText':
    'Строителни материали, наем на техника, логистика, строителни инструменти, магазини за ремонт, местни изпълнители и шоуруми за ремонт.',
  'advertising.principleTitle': 'Принцип на платформата',
  'advertising.principleText':
    'Клиентите не плащат за публикуване на заявки. Майсторите не плащат за достъп до контакти. Рекламата е единственият слой на монетизация.',
  'advertising.primaryButton': 'Преглед на заявки за работа',
  'advertising.secondaryButton': 'Назад към началото',

  // Футер: підтримка і контакти
  'footer.supportTitle': 'Поддръжка',
  'footer.contactLink': 'Контакт',
  'footer.advertisingLink': 'Реклама в сайта',
  'footer.contactButton': 'Свържи се с нас',

  // Сторінка контакту
  'contact.eyebrow': 'Контакт',
  'contact.title': 'Пиши ни директно',
  'contact.description':
    'Ако имаш въпрос, предложение, оплакване или идея за подобряване на платформата, изпрати ни съобщение чрез този формуляр.',
  'contact.homeButton': 'Начало',
  'contact.loginButton': 'Вход',
  'contact.formTitle': 'Форма за контакт',
  'contact.formDescription':
    'Опиши заявката си кратко и ясно - ще запазим съобщението и ще можем да се върнем към него без да губим детайлите.',
  'contact.nameLabel': 'Име',
  'contact.namePlaceholder': 'Твоето име',
  'contact.emailLabel': 'Имейл',
  'contact.emailPlaceholder': 'your@email.com',
  'contact.phoneLabel': 'Телефон',
  'contact.phonePlaceholder': '+359 ...',
  'contact.subjectLabel': 'Тема',
  'contact.subjectPlaceholder': 'Опиши накратко заявката',
  'contact.messageLabel': 'Съобщение',
  'contact.messagePlaceholder':
    'Опиши подробно въпроса или проблема...',
  'contact.submitButton': 'Изпрати съобщение',
  'contact.sending': 'Изпращане...',
  'contact.requiredFields': 'Моля, попълни всички задължителни полета.',
  'contact.successMessage':
    'Съобщението е изпратено успешно. Ще го прегледаме и ще се свържем с теб на посочените координати.',
  'contact.errorMessage':
    'Неуспешно изпращане на съобщението. Моля, опитай отново.',
  'contact.howItWorksTitle': 'Как работи',
  'contact.howItWorksStepOne':
    'Попълваш кратък формуляр с данни за контакт и описание на заявката.',
  'contact.howItWorksStepTwo':
    'Получаваме заявката в администраторския панел на платформата.',
  'contact.howItWorksStepThree':
    'Отговорът ще дойде по имейл или телефон според оставените данни.',
  'contact.useCasesTitle': 'За какво е тази форма',
  'contact.useCaseQuestions': 'Въпроси за работата на сайта',
  'contact.useCaseBugs': 'Сигнали за грешки',
  'contact.useCaseIdeas': 'Предложения за функционалности',
  'contact.useCaseComplaints': 'Оплаквания за съдържание или потребители',

  // Загальні системні ключі
  'common.required': '*',
  'common.comingSoon': 'Скоро',

  // Доступність у шапці
  'header.openMenu': 'Отвори менюто',
  'header.closeMenu': 'Затвори менюто',
  'header.mobileNavigation': 'Мобилна навигация',

  // Сторінка повідомлень
  'messages.description':
    'Вътрешният чат все още се подготвя. Докато не бъде пуснат, използвай телефона или имейла, оставени в обявата.',
  'messages.howToContactTitle': 'Как да се свържеш още сега',
  'messages.howToContactText':
    'Отвори конкретната обява и използвай телефона или имейла, оставени от автора за директен контакт.',

  // Деталі оголошення
  'listingDetail.notFound':
    'Обявата не е намерена или е премахната от публикуване.',
  'listingDetail.loadError': 'Неизвестна грешка при зареждане.',
  'listingDetail.unavailable': 'Обявата не е налична.',
  'listingDetail.backToListings': 'Назад към обявите',
  'listingDetail.back': 'Назад към списъка',
  'listingDetail.contacts': 'Контакти',
  'listingDetail.expired': 'Изтекла',

  // Деталі профілю майстра
  'professionalDetail.notFound': 'Профилът не е намерен.',
  'professionalDetail.notProfessional':
    'Този профил не е отбелязан като профил на майстор.',
  'professionalDetail.loadError': 'Неизвестна грешка при зареждане.',
  'professionalDetail.loading': 'Зареждане на профила...',
  'professionalDetail.unavailable': 'Профилът не е наличен.',
  'professionalDetail.backToProfessionals': 'Назад към майсторите',
  'professionalDetail.back': 'Назад към майсторите',
  'professionalDetail.website': 'Уебсайт',
  'professionalDetail.browseListings': 'Преглед на обяви',

  // Панель власника
  'dashboard.error.loadOwner':
    'Неуспешно зареждане на панела на собственика.',
  'dashboard.error.approveCampaign':
    'Неуспешно одобряване на рекламната кампания.',
  'dashboard.error.rejectCampaign':
    'Неуспешно отхвърляне на рекламната кампания.',
  'dashboard.error.deleteCampaign':
    'Неуспешно изтриване на рекламната кампания.',
  'dashboard.error.feedbackRead':
    'Неуспешно маркиране на съобщението като прочетено.',
  'dashboard.error.feedbackResolved':
    'Неуспешно маркиране на съобщението като решено.',
  'dashboard.error.deleteFeedback':
    'Неуспешно изтриване на съобщението.',
  'dashboard.error.deleteListing':
    'Неуспешно изтриване на обявата.',
  'dashboard.error.deleteInternal':
    'Неуспешно изтриване на вътрешното съобщение.',
  'dashboard.notice.approveCampaign': 'Рекламната кампания е одобрена.',
  'dashboard.notice.rejectCampaign': 'Рекламната кампания е отхвърлена.',
  'dashboard.notice.deleteCampaign': 'Рекламната кампания е изтрита.',
  'dashboard.notice.feedbackRead': 'Съобщението е маркирано като прочетено.',
  'dashboard.notice.feedbackResolved':
    'Съобщението е маркирано като решено.',
  'dashboard.notice.deleteFeedback': 'Съобщението е изтрито.',
  'dashboard.notice.deleteListing': 'Обявата е маркирана като изтрита.',
  'dashboard.notice.deleteInternal': 'Вътрешното съобщение е изтрито.',
  'dashboard.confirm.deleteCampaign':
    'Сигурен ли си, че искаш да изтриеш тази рекламна кампания?',
  'dashboard.confirm.deleteFeedback':
    'Сигурен ли си, че искаш да изтриеш това съобщение?',
  'dashboard.confirm.deleteListing':
    'Сигурен ли си, че искаш да изтриеш тази обява?',
  'dashboard.confirm.deleteInternal':
    'Сигурен ли си, че искаш да изтриеш това вътрешно съобщение?',
  'dashboard.loading': 'Зареждане на панела на собственика...',
  'dashboard.accessDeniedTitle': 'Достъпът е отказан',
  'dashboard.accessDeniedText':
    'Този раздел е достъпен само за собственика на платформата. Върни се в началото или отвори профила си.',
  'dashboard.homeButton': 'Начало',
  'dashboard.profileButton': 'Отвори моя профил',
  'dashboard.stats.trafficTitle': 'Трафик на сайта',
  'dashboard.stats.trafficText': 'Общ брой посещения на платформата.',
  'dashboard.stats.listingsTitle': 'Обяви',
  'dashboard.stats.activeNow': 'Активни сега',
  'dashboard.stats.adsTitle': 'Реклама',
  'dashboard.stats.pendingNow': 'В изчакване сега',
  'dashboard.stats.messagesTitle': 'Съобщения',
  'dashboard.stats.feedbackNow': 'Контакт',
  'dashboard.eyebrow': 'Панел на собственика',
  'dashboard.welcome': 'Добре дошъл',
  'dashboard.ownerFallbackName': 'собственикът на сайта',
  'dashboard.description':
    'Само ти виждаш това пространство: статистика на сайта, обяви, реклама и входящи съобщения.',
  'dashboard.recentListingsTitle': 'Последни обяви',
  'dashboard.recentListingsText':
    'Най-новото съдържание в платформата за бърза проверка и премахване.',
  'dashboard.openAll': 'Отвори всички',
  'dashboard.created': 'Създадена',
  'dashboard.deleted': 'Изтрита',
  'dashboard.delete': 'Изтрий',
  'dashboard.recentListingsEmpty':
    'В момента няма обяви за показване.',
  'dashboard.controlTitle': 'Всичко под контрол',
  'dashboard.controlFeatureOne':
    'Само профилът на собственика може да вижда този панел.',
  'dashboard.controlFeatureTwo':
    'Можеш да виждаш общия трафик на сайта и броя на обявите.',
  'dashboard.controlFeatureThree':
    'Можеш да премахваш обяви, като ги прехвърляш в статус deleted.',
  'dashboard.controlFeatureFour':
    'Можеш да проверяваш рекламни кампании и заявки за модерация.',
  'dashboard.controlFeatureFive':
    'Можеш да четеш съобщенията от контактната форма и вътрешните съобщения в платформата.',
  'dashboard.adsTitle': 'Управление на рекламата',
  'dashboard.adsText':
    'Тук можеш да одобряваш, отхвърляш или изтриваш рекламни кампании.',
  'dashboard.pendingCount': 'Чакащи преглед',
  'dashboard.placement': 'Позиция',
  'dashboard.geography': 'География',
  'dashboard.period': 'Период',
  'dashboard.approve': 'Одобри',
  'dashboard.reject': 'Отхвърли',
  'dashboard.adsEmpty':
    'Все още няма рекламни кампании за модериране.',
  'dashboard.feedbackTitle': 'Контакт',
  'dashboard.feedbackText':
    'Тук се показват всички съобщения, изпратени от потребителите чрез контактната форма.',
  'dashboard.total': 'Общо',
  'dashboard.unread': 'Непрочетени',
  'dashboard.phone': 'Телефон',
  'dashboard.received': 'Получено',
  'dashboard.markRead': 'Маркирай като прочетено',
  'dashboard.resolved': 'Решено',
  'dashboard.feedbackEmpty':
    'Все още няма съобщения от контактната форма.',
  'dashboard.messagesTitle': 'Вътрешни съобщения',
  'dashboard.messagesText':
    'Този раздел показва разговорите, които се случват вътре в платформата.',
  'dashboard.emailMissing': 'Имейлът не е посочен',
  'dashboard.conversation': 'Разговор',
  'dashboard.recipient': 'Получател',
  'dashboard.listing': 'Обява',
  'dashboard.none': 'Няма',
  'dashboard.toListing': 'Към обявата',
  'dashboard.internalEmpty':
    'Все още няма вътрешни съобщения.',
  'dashboard.noLimit': 'Без ограничение',
  'dashboard.fromPrefix': 'от',
  'dashboard.untilPrefix': 'до',
  'dashboard.messageSenderUnknown': 'Неизвестен подател',
  'dashboard.feedbackStatus.new': 'Ново',
  'dashboard.feedbackStatus.inProgress': 'В процес',
  'dashboard.feedbackStatus.resolved': 'Решено',
  'dashboard.feedbackStatus.archived': 'Архивирано',
  'dashboard.listingStatus.active': 'Активна',
  'dashboard.listingStatus.expired': 'Изтекла',
  'dashboard.listingStatus.sold': 'Затворена',
  'dashboard.listingStatus.deleted': 'Изтрита',

  // Реклама: додаткові системні ключі
  'ads.badge': 'Реклама',
  'ads.openLink': 'Отвори',
  'ads.geo.global': 'Целият свят',
  'ads.geo.countryFallback': 'Държавата не е посочена',
  'ads.geo.regionFallback': 'Регион',
  'ads.geo.cityFallback': 'Град',
  'ads.geo.localFallback': 'Местна реклама',

  // Сторінка реклами: self-serve кампанії
  'advertising.selfServePrimaryButton': 'Създай кампания',
  'advertising.selfServeLoginCta':
    'Влез, за да добавиш реклама',
  'advertising.selfServeFormTitle': 'Нова рекламна кампания',
  'advertising.selfServeFormDescription':
    'Първо запази кампанията, след което ще я прегледаме ръчно преди публикуване.',
  'advertising.selfServeLoginPrompt':
    'Влез с акаунт на рекламодател, за да създаваш кампании самостоятелно.',
  'advertising.selfServePlacement.footerTitle': 'Блок във футъра',
  'advertising.selfServePlacement.footerText':
    'Допълнителна видимост по време на по-дълги сесии на разглеждане.',
  'advertising.selfServePlacement.mobileTitle': 'Sticky мобилен блок',
  'advertising.selfServePlacement.mobileText':
    'Добре видим формат за потребители на телефон.',
  'advertising.selfServeCampaignTitleLabel': 'Име на кампанията',
  'advertising.selfServeCampaignTitlePlaceholder':
    'Например: Ремонтни услуги в София',
  'advertising.selfServeCampaignDescriptionLabel': 'Кратко описание',
  'advertising.selfServeCampaignDescriptionPlaceholder':
    'Обясни накратко какво рекламира тази кампания.',
  'advertising.selfServeImageUrlLabel': 'URL на банер изображение',
  'advertising.selfServeLinkUrlLabel': 'Целеви линк',
  'advertising.selfServePlacementLabel': 'Позиция',
  'advertising.selfServeGeoScopeLabel': 'Географско таргетиране',
  'advertising.selfServeGeo.cityTitle': 'Само град',
  'advertising.selfServeGeo.cityText':
    'Показвай кампанията само в един избран град.',
  'advertising.selfServeGeo.regionTitle': 'Регион / област',
  'advertising.selfServeGeo.regionText':
    'Показвай кампанията в един избран регион.',
  'advertising.selfServeGeo.countryTitle': 'Една държава',
  'advertising.selfServeGeo.countryText':
    'Показвай кампанията само в избраната държава.',
  'advertising.selfServeGeo.globalTitle': 'Целият свят',
  'advertising.selfServeGeo.globalText':
    'Показвай кампанията без географско ограничение.',
  'advertising.selfServeCountryLabel': 'Държава',
  'advertising.selfServeRegionLabel': 'Регион / област',
  'advertising.selfServeCityLabel': 'Град',
  'advertising.selfServeCountryPlaceholder': 'Например: Bulgaria',
  'advertising.selfServeRegionPlaceholder': 'Например: Sofia',
  'advertising.selfServeCityPlaceholder': 'Например: Sofia',
  'advertising.selfServePeriodLabel': 'Период на кампанията',
  'advertising.selfServeStartLabel': 'Начална дата',
  'advertising.selfServeEndLabel': 'Крайна дата',
  'advertising.selfServeSubmit': 'Създай рекламна кампания',
  'advertising.selfServeSubmitting': 'Създаване...',
  'advertising.selfServeCampaignsTitle': 'Моите кампании',
  'advertising.selfServeCampaignsSignIn':
    'Влез, за да видиш собствените си рекламни кампании.',
  'advertising.selfServeCampaignsLoading': 'Зареждане на кампаниите...',
  'advertising.selfServeCampaignsEmpty':
    'Все още не си създал рекламна кампания.',
  'advertising.selfServeGeographyLabel': 'География',
  'advertising.selfServeCreatedAtLabel': 'Създадена',
  'advertising.selfServeErrorLogin':
    'За да добавиш реклама, първо влез в акаунта си.',
  'advertising.selfServeErrorCountry':
    'Моля, посочи държава за тази кампания.',
  'advertising.selfServeErrorRegion':
    'Моля, посочи държава и регион за тази кампания.',
  'advertising.selfServeErrorCity':
    'Моля, посочи държава и град за тази кампания.',
  'advertising.selfServeErrorDate':
    'Крайната дата не може да бъде преди началната дата.',
  'advertising.selfServeErrorCreate':
    'Неуспешно създаване на рекламната кампания. Провери полетата и опитай отново.',
  'advertising.selfServeSuccess':
    'Рекламната кампания е създадена и очаква модерация.',
  'advertising.selfServeStatus.draft': 'Чернова',
  'advertising.selfServeStatus.pending_review': 'В преглед',
  'advertising.selfServeStatus.active': 'Активна',
  'advertising.selfServeStatus.paused': 'Пауза',
  'advertising.selfServeStatus.rejected': 'Отхвърлена',
  'advertising.selfServeStatus.expired': 'Приключила',
  'advertising.selfServeStatus.deleted': 'Изтрита',

  // Налаштування
  'settings.description':
    'Управлявай публичния си профил, настройките на акаунта и параметрите за сигурност.',
  'settings.profileInfoTitle': 'Информация за профила',
  'settings.bioLabel': 'Био / Описание',
  'settings.bioPlaceholder':
    'Разкажи на клиентите за опита и услугите си...',
  'settings.websiteLabel': 'Уебсайт',
  'settings.profilePhotoLabel': 'URL на профилната снимка',
  'settings.profilePhotoAlt': 'Преглед на профила',
  'settings.portfolioTitle': 'Снимки в портфолиото',
  'settings.removePortfolioImage': 'Премахни снимката от портфолиото',
  'settings.addPortfolioImage': 'Добави снимка в портфолиото',
  'settings.preferencesTitle': 'Език и валута',
  'settings.notificationsTitle': 'Включи известията',
  'settings.notificationsText':
    'Получавай актуализации за съобщения и нови контакти.',
  'settings.saveChanges': 'Запази промените',
  'settings.saving': 'Запазване...',
  'settings.changePasswordTitle': 'Смени паролата',
  'settings.newPasswordLabel': 'Нова парола',
  'settings.confirmNewPasswordLabel': 'Потвърди новата парола',
  'settings.changePasswordButton': 'Смени паролата',
  'settings.dangerTitle': 'Рискова зона',
  'settings.dangerText':
    'След като изтриеш акаунта си, няма връщане назад. Увери се, преди да продължиш.',
  'settings.deleteAccountButton': 'Изтрий акаунта',
  'settings.error.loadProfile':
    'Неуспешно зареждане на настройките на профила.',
  'settings.error.noSession': 'Потребителската сесия не е налична.',
  'settings.error.saveProfile':
    'Неуспешно обновяване на профила.',
  'settings.error.passwordMismatch': 'Паролите не съвпадат.',
  'settings.error.changePassword':
    'Неуспешна смяна на паролата.',
  'settings.error.deleteAccount': 'Неуспешно изтриване на акаунта.',
  'settings.success.profileSaved': 'Профилът е обновен успешно!',
  'settings.success.passwordChanged': 'Паролата е сменена успешно!',
  'settings.confirm.deleteAccount':
    'Сигурен ли си, че искаш да изтриеш акаунта си? Това действие е необратимо.',
}
