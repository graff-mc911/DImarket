import type { TranslationKey } from './en'

// Іспанські переклади інтерфейсу.
// Важливо: ключі мають збігатися з ключами в en.ts, бо en.ts задає тип TranslationKey.
export const esTranslations: Partial<Record<TranslationKey, string>> = {
  // Шапка сайту: навігація, акаунт, мова, валюта.
  'header.browse': 'Explorar',
  'header.findProfessionals': 'Encontrar profesionales',
  'header.professionalLogin': 'Acceso para profesionales',
  'header.createAd': 'Crear anuncio',
  'header.myProfile': 'Mi perfil',
  'header.dashboard': 'Panel',
  'header.myListings': 'Mis anuncios',
  'header.signOut': 'Cerrar sesion',
  'header.account': 'Cuenta',
  'header.language': 'Idioma',
  'header.currency': 'Moneda',
  'header.jobRequests': 'Solicitudes de trabajo',
  'header.favorites': 'Favoritos',
  'header.messages': 'Mensajes',
  'header.postJob': 'Publicar trabajo',
  'header.brandTagline': 'Plataforma de construccion gratuita',

  // Футер: основні посилання, підтримка, реклама і правовий текст.
  'footer.tagline':
    'Conecta con profesionales de la construccion de confianza y encuentra materiales de calidad.',
  'footer.forClients': 'Para clientes',
  'footer.browseListings': 'Ver anuncios',
  'footer.postRequest': 'Publicar solicitud',
  'footer.forProfessionals': 'Para profesionales',
  'footer.signIn': 'Iniciar sesion',
  'footer.register': 'Registrarse',
  'footer.howItWorks': 'Como funciona',
  'footer.allRightsReserved': 'Todos los derechos reservados.',
  'footer.brandText':
    'Dimarket es una plataforma global gratuita de servicios de construccion donde los clientes publican trabajos y los profesionales responden directamente.',
  'footer.monetization':
    'Sin comisiones para los usuarios. Sin suscripciones. La plataforma gana solo con publicidad.',
  'footer.platformTitleSimple': 'Plataforma',
  'footer.accountTitleSimple': 'Cuenta',
  'footer.supportTitle': 'Soporte',
  'footer.contactLink': 'Contacto',
  'footer.advertisingLink': 'Publicidad en el sitio',
  'footer.contactButton': 'Contactanos',
  'footer.adsTitle': 'Publicidad',
  'footer.adsText':
    'Las marcas de materiales, herramientas, logistica y servicios locales pueden llegar a una demanda activa en anuncios y perfiles profesionales.',
  'footer.adsButton': 'Pagina de publicidad',
  'footer.legalRight':
    'Plataforma gratuita de servicios de construccion con monetizacion solo por publicidad.',

  // Сторінка зворотного звʼязку: заголовки, форма, повідомлення і підказки.
  'contact.eyebrow': 'Contacto',
  'contact.title': 'Escribenos directamente',
  'contact.description':
    'Si tienes una pregunta, sugerencia, queja o idea para mejorar la plataforma, envia un mensaje mediante este formulario.',
  'contact.homeButton': 'Inicio',
  'contact.loginButton': 'Iniciar sesion',
  'contact.formTitle': 'Formulario de contacto',
  'contact.formDescription':
    'Describe la consulta con palabras simples; guardaremos el mensaje y podremos volver a el sin perder detalles.',
  'contact.nameLabel': 'Nombre',
  'contact.namePlaceholder': 'Tu nombre',
  'contact.emailLabel': 'Email',
  'contact.emailPlaceholder': 'your@email.com',
  'contact.phoneLabel': 'Telefono',
  'contact.phonePlaceholder': '+48 ...',
  'contact.subjectLabel': 'Asunto',
  'contact.subjectPlaceholder': 'Describe brevemente la solicitud',
  'contact.messageLabel': 'Mensaje',
  'contact.messagePlaceholder': 'Describe la pregunta o el problema en detalle...',
  'contact.submitButton': 'Enviar mensaje',
  'contact.sending': 'Enviando...',
  'contact.requiredFields': 'Completa todos los campos obligatorios.',
  'contact.successMessage':
    'Mensaje enviado correctamente. Lo revisaremos y te contactaremos con los datos indicados.',
  'contact.errorMessage': 'No se pudo enviar el mensaje. Intentalo de nuevo.',
  'contact.howItWorksTitle': 'Como funciona',
  'contact.howItWorksStepOne':
    'Rellenas un formulario corto con datos de contacto y descripcion de la consulta.',
  'contact.howItWorksStepTwo':
    'Recibimos la solicitud en el panel de administracion de la plataforma.',
  'contact.howItWorksStepThree':
    'La respuesta llegara por email o telefono, segun los datos que dejes.',
  'contact.useCasesTitle': 'Para que sirve este formulario',
  'contact.useCaseQuestions': 'Preguntas sobre el funcionamiento del sitio',
  'contact.useCaseBugs': 'Informes de errores',
  'contact.useCaseIdeas': 'Sugerencias de funcionalidades',
  'contact.useCaseComplaints': 'Quejas sobre contenido o usuarios',

  // Головна сторінка: старі ключі, які ще можуть використовуватись у застосунку.
  'home.heroTitle': 'Encuentra profesionales de confianza',
  'home.heroSubtitle': 'Construye tus suenos',
  'home.heroDescription':
    'Marketplace de construccion, renovacion y servicios para el hogar que conecta clientes con profesionales verificados',
  'home.searchPlaceholder': 'Buscar servicios, materiales o profesionales...',
  'home.search': 'Buscar',
  'home.findProfessionals': 'Encontrar profesionales',
  'home.postRequest': 'Publicar solicitud',
  'home.browseByCategory': 'Explorar por categoria',
  'home.topRatedProfessionals': 'Profesionales mejor valorados',
  'home.topRatedDescription':
    'Conecta con expertos verificados en construccion y servicios para el hogar',
  'home.noProfessionals': 'Todavia no hay profesionales registrados. Se el primero.',
  'home.viewAllProfessionals': 'Ver todos los profesionales',
  'home.recentListings': 'Anuncios recientes',
  'home.recentListingsDescription': 'Ultimas oportunidades y solicitudes',
  'home.noListings': 'Todavia no hay anuncios activos. Publica el primero.',
  'home.viewAllListings': 'Ver todos los anuncios',
  'home.whyChoose': 'Por que elegir Dimarket?',
  'home.verifiedProfessionals': 'Profesionales verificados',
  'home.verifiedDescription':
    'Todos los profesionales estan verificados y tienen valoraciones y resenas de clientes reales',
  'home.quickEasy': 'Rapido y facil',
  'home.quickEasyDescription':
    'Publica tu solicitud en minutos sin registro. Recibe respuestas rapidamente',
  'home.directCommunication': 'Comunicacion directa',
  'home.directCommunicationDescription':
    'Conecta directamente con profesionales mediante nuestro sistema de mensajeria',
  'home.areYouProfessional': 'Eres profesional?',
  'home.joinProfessionals':
    'Unete a miles de profesionales que hacen crecer su negocio en Dimarket',
  'home.registerAsProfessional': 'Registrarse como profesional',

  // Головна сторінка: нові ключі для актуального hero-блоку, категорій, запитів і майстрів.
  'home.globalEyebrow': 'Servicios de construccion globales',
  'home.heroSimpleTitle':
    'Encuentra un maestro para reparacion, instalacion o trabajos de construccion.',
  'home.heroSimpleDescription':
    'Los clientes publican solicitudes de trabajo, los profesionales responden directamente y Dimarket sigue siendo gratuito para los usuarios.',
  'home.whatNeedsToBeDone': 'Que hay que hacer?',
  'home.cityOrCountry': 'Ciudad o pais',
  'home.postJob': 'Publicar trabajo',
  'home.popularCategoriesTitle': 'Categorias populares',
  'home.popularCategoriesText':
    'Las areas de construccion y renovacion mas solicitadas en Dimarket.',
  'home.browseRequests': 'Ver solicitudes de trabajo',
  'home.freshRequestsTitle': 'Nuevas solicitudes de trabajo',
  'home.freshRequestsText':
    'Nuevas solicitudes de clientes que los profesionales pueden revisar y responder de inmediato.',
  'home.allRequests': 'Todas las solicitudes de trabajo',
  'home.popularProsTitle': 'Profesionales populares',
  'home.popularProsText':
    'Perfiles con experiencia visible, valoraciones estables y contacto directo.',
  'home.allPros': 'Todos los profesionales',
  'home.adTitle': 'Publicidad',
  'home.adText':
    'Promociona herramientas, materiales, servicios locales o showrooms de construccion dentro de una audiencia con demanda enfocada.',
  'home.adButton': 'Anunciarse en Dimarket',
  'home.adCardOne': 'Socios de materiales',
  'home.adCardTwo': 'Marcas de herramientas',
  'home.adCardThree': 'Showrooms locales',
  'home.noJobs': 'Todavia no hay solicitudes de trabajo activas.',
  'home.noCategories': 'Las categorias apareceran aqui pronto.',
  'home.noLocation': 'Ubicacion no especificada',
  'home.budgetLabel': 'Presupuesto',
  'home.activeLabel': 'Activo',
  'home.unknownCategory': 'Servicio de construccion',
  'home.noBio': 'El perfil del profesional de construccion se esta completando.',
  'home.sponsoredPlacement':
    'Ubicacion patrocinada para herramientas, materiales, logistica o socios locales de construccion.',
  'home.sidebarAdOne':
    'Coloca visibilidad de marca junto a demanda real de construccion.',
  'home.sidebarAdTwo':
    'Llega a profesionales y clientes mientras buscan trabajo y servicios.',
  'home.loading': 'Cargando...',

  // Категорії послуг і матеріалів.
  'category.construction': 'Construccion',
  'category.constructionDesc': 'Nueva construccion y proyectos de obra',
  'category.renovation': 'Renovacion',
  'category.renovationDesc': 'Renovacion y remodelacion del hogar',
  'category.electrical': 'Electricidad',
  'category.electricalDesc': 'Trabajos electricos y reparaciones',
  'category.plumbing': 'Fontaneria',
  'category.plumbingDesc': 'Servicios e instalaciones de fontaneria',
  'category.handyman': 'Manitas',
  'category.handymanDesc': 'Servicios generales de mantenimiento',
  'category.materials': 'Materiales',
  'category.materialsDesc': 'Materiales de construccion en venta',
  'category.tools': 'Herramientas',
  'category.toolsDesc': 'Herramientas y equipos',
  'category.name.construction': 'Construccion',
  'category.name.renovation': 'Renovacion',
  'category.name.electrical': 'Electricidad',
  'category.name.plumbing': 'Fontaneria',
  'category.name.handyman': 'Manitas',
  'category.name.materials': 'Materiales',
  'category.name.tools': 'Herramientas',

  // Картка оголошення: тип, ціна, перегляди, статус premium.
  'listing.serviceNeeded': 'Servicio solicitado',
  'listing.serviceOffered': 'Servicio ofrecido',
  'listing.forSale': 'En venta',
  'listing.wanted': 'Buscado',
  'listing.contactForPrice': 'Contactar para el precio',
  'listing.daysLeft': 'dias restantes',
  'listing.views': 'vistas',
  'listing.premium': 'PREMIUM',
  'listing.constructionService': 'Servicio de construccion',
  'listing.locationNotSpecified': 'Ubicacion no especificada',
  'listing.budget': 'Presupuesto',

  // Картка майстра.
  'professional.contact': 'Contactar',
  'professional.reviews': 'resenas',
  'professional.new': 'Nuevo',
  'professional.defaultName': 'Profesional',
  'professional.global': 'Global',
  'professional.profileInProgress':
    'El perfil del profesional de construccion se esta completando.',

  // Створення оголошення: форма запиту, локація, контакти, фото, статуси.
  'createAd.title': 'Crear una solicitud de trabajo de construccion',
  'createAd.noRegistration': 'Sin registro obligatorio',
  'createAd.eyebrow': 'Solicitud de trabajo gratuita',
  'createAd.heroTitle': 'Crear una solicitud de trabajo de construccion',
  'createAd.heroDescription':
    'Describe el trabajo, agrega una ubicacion y deja que los profesionales te contacten directamente. Sin suscripcion y sin costo de publicacion.',
  'createAd.detailsTitle': 'Detalles del trabajo',
  'createAd.detailsText':
    'Haz la solicitud especifica para que los profesionales comprendan el trabajo y envien una oferta adecuada.',
  'createAd.locationTitle': 'Ubicacion y visibilidad',
  'createAd.locationText':
    'Elige donde se encuentra el trabajo y cuan ampliamente debe ser visible para los profesionales.',
  'createAd.contactTitle': 'Datos de contacto',
  'createAd.contactText':
    'Se requiere al menos un metodo de contacto para que los profesionales puedan comunicarse contigo directamente.',
  'createAd.imagesTitle': 'Fotos (opcional)',
  'createAd.imagesText':
    'Agrega fotos de referencia, planos o ejemplos para ayudar a los profesionales a calcular mejor el trabajo.',
  'createAd.freeListTitle': 'Que incluye',
  'createAd.freeItemOne': 'Publicacion gratuita para clientes',
  'createAd.freeItemTwo': 'Contacto directo con profesionales',
  'createAd.freeItemThree': 'Fotos y presupuesto opcionales',
  'createAd.freeItemFour': 'Modelo de plataforma financiado por publicidad',
  'createAd.adType': 'Tipo de anuncio',
  'createAd.needService': 'Necesito un servicio',
  'createAd.needServiceDesc': 'Busco ayuda',
  'createAd.offerService': 'Ofrezco un servicio',
  'createAd.offerServiceDesc': 'Brindo servicios',
  'createAd.sellItem': 'Vender articulo',
  'createAd.sellItemDesc': 'Materiales, herramientas',
  'createAd.wantItem': 'Comprar articulo',
  'createAd.wantItemDesc': 'Quiero comprar',
  'createAd.titleLabel': 'Titulo',
  'createAd.taskPlaceholder': 'Que hay que hacer?',
  'createAd.titlePlaceholder': 'Ej.: Necesito reparar pladur en la sala',
  'createAd.titleHint': 'Ejemplo: Necesito reparar pladur en la sala',
  'createAd.descriptionLabel': 'Descripcion',
  'createAd.descriptionPlaceholder':
    'Escribe que hay que hacer, el tamano del trabajo, el plazo deseado y cualquier detalle importante.',
  'createAd.descriptionHint':
    'Escribe que hay que hacer, el tamano del trabajo, el plazo deseado y cualquier detalle importante.',
  'createAd.categoryLabel': 'Categoria',
  'createAd.selectCategory': 'Selecciona una categoria',
  'createAd.priceLabel': 'Presupuesto',
  'createAd.pricePlaceholder': 'Presupuesto opcional',
  'createAd.budgetPlaceholder': 'Presupuesto opcional',
  'createAd.locationLabel': 'Ubicacion',
  'createAd.locationPlaceholder': 'Ciudad, distrito o pais',
  'createAd.contactInfo': 'Informacion de contacto',
  'createAd.yourName': 'Tu nombre',
  'createAd.phone': 'Telefono',
  'createAd.email': 'Correo electronico',
  'createAd.contactNote': 'Indica al menos telefono o email',
  'createAd.contactRule':
    'Agrega telefono o email para que los profesionales puedan contactarte.',
  'createAd.images': 'Imagenes (opcional)',
  'createAd.imagePlaceholder': 'https://example.com/photo.jpg',
  'createAd.addImage': 'Agregar otra imagen',
  'createAd.imageTip': 'Consejo: usa enlaces directos a imagenes',
  'createAd.imageHelp':
    'Por ahora usa URL directas de imagenes. La carga local podra agregarse mas tarde sin cambiar el modelo de datos.',
  'createAd.currentLocation': 'Usar mi ubicacion',
  'createAd.duration': 'Duracion de la solicitud',
  'createAd.durationLabel': 'Duracion de la solicitud',
  'createAd.days': 'dias',
  'createAd.popular': 'Popular',
  'createAd.year': 'Ano',
  'createAd.adIncludes': 'Que incluye',
  'createAd.freeListLegacyTitle': 'Tu solicitud incluye:',
  'createAd.daysVisibility': 'dias de visibilidad',
  'createAd.contactDisplayed': 'datos de contacto visibles',
  'createAd.upToImages': 'hasta 10 imagenes',
  'createAd.premiumBadge': 'insignia premium y posicion destacada',
  'createAd.createButton': 'Publicar solicitud de trabajo',
  'createAd.creating': 'Publicando solicitud...',
  'createAd.success': 'Solicitud de trabajo publicada con exito. Redirigiendo...',
  'createAd.contactRequired':
    'Agrega al menos telefono o email antes de publicar la solicitud.',
  'createAd.locationDetectError': 'No se pudo detectar tu ubicacion actual.',
  'createAd.locationLookupError':
    'La busqueda de ubicacion fallo. Introduce la ciudad manualmente.',
  'createAd.publishError': 'No se pudo publicar la solicitud de trabajo.',
  'createAd.locationHelp':
    'Empieza a escribir una ciudad o zona para recibir sugerencias.',
  'createAd.visibilityRadius': 'Radio de visibilidad',
  'createAd.visibilityRadiusDesc':
    'Elige cuan ampliamente sera visible el anuncio',
  'createAd.radius.city': 'Ciudad',
  'createAd.radius.district': 'Distrito',
  'createAd.radius.region': 'Region',
  'createAd.radius.country': 'Pais',
  'createAd.radius.state': 'Estado',
  'createAd.radius.land': 'Land (DE)',
  'createAd.radius.global': 'Todos los usuarios',

  // Вхід у систему.
  'login.title': 'Acceso para profesionales',
  'login.subtitle': 'Inicia sesion para gestionar tu perfil y anuncios',
  'login.email': 'Correo electronico',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Contrasena',
  'login.passwordPlaceholder': '********',
  'login.signIn': 'Iniciar sesion',
  'login.signingIn': 'Iniciando sesion...',
  'login.noAccount': 'Todavia no tienes una cuenta?',
  'login.registerLink': 'Registrarse como profesional',
  'login.lookingToPost': 'Quieres publicar un anuncio?',
  'login.noRegistrationRequired': 'No se requiere registro',

  // Реєстрація майстра.
  'register.title': 'Registro de profesional',
  'register.subtitle': 'Unete a Dimarket y haz crecer tu negocio',
  'register.fullName': 'Nombre completo',
  'register.fullNamePlaceholder': 'Juan Perez',
  'register.passwordMin': 'Minimo 6 caracteres',
  'register.phonePlaceholder': '+34 600 123 456',
  'register.locationPlaceholder': 'Ciudad, provincia',
  'register.createAccount': 'Crear cuenta profesional',
  'register.creating': 'Creando cuenta...',
  'register.success': 'Registro exitoso. Redirigiendo al panel...',
  'register.alreadyHave': 'Ya tienes una cuenta?',
  'register.afterRegistration': 'Despues del registro:',
  'register.choosePlan': 'Elegiras un plan',
  'register.completeProfile': 'Completaras tu perfil y portafolio',
  'register.receiveRequests': 'Comenzaras a recibir solicitudes de clientes',
  'register.buildReputation': 'Construiras tu reputacion con resenas',

  // Каталог оголошень: старі ключі.
  'listings.title': 'Explorar anuncios',
  'listings.searchPlaceholder': 'Buscar anuncios...',
  'listings.filters': 'Filtros',
  'listings.allCategories': 'Todas las categorias',
  'listings.allTypes': 'Todos los tipos',
  'listings.clearFilters': 'Limpiar filtros',
  'listings.loading': 'Cargando anuncios...',
  'listings.noFound': 'No se encontraron anuncios',
  'listings.createFirst': 'Crear el primer anuncio',
  'listings.category': 'Categoria',
  'listings.listingType': 'Tipo de anuncio',
  'listings.typeServiceRequest': 'Necesito un servicio',
  'listings.typeServiceOffer': 'Ofrezco un servicio',
  'listings.typeItemSale': 'En venta',
  'listings.typeItemWanted': 'Buscado',
  'listings.search': 'Buscar',

  // Каталог оголошень: нові ключі.
  'listings.eyebrow': 'Solicitudes de trabajo',
  'listings.simpleTitle': 'Trabajos de construccion de clientes',
  'listings.simpleDescription':
    'Explora solicitudes activas de clientes, filtra por categoria o lugar y responde directamente cuando un trabajo encaje con tus habilidades.',
  'listings.whatNeedsToBeDone': 'Que hay que hacer?',
  'listings.cityOrCountry': 'Ciudad o pais',
  'listings.findRequests': 'Buscar solicitudes',
  'listings.filtersButton': 'Filtros',
  'listings.categoryLabel': 'Categoria',
  'listings.allCategoriesSimple': 'Todas las categorias',
  'listings.clearFiltersSimple': 'Limpiar filtros',
  'listings.postJob': 'Publicar trabajo',
  'listings.countSuffix': 'solicitudes encontradas',
  'listings.loadingRequests': 'Cargando solicitudes de trabajo...',
  'listings.emptyTitle': 'No hay solicitudes que coincidan con estos filtros',
  'listings.emptyText':
    'Prueba otra palabra clave, elige una categoria diferente o elimina el filtro de ubicacion.',

  // Каталог майстрів: старі ключі.
  'professionals.title': 'Encontrar profesionales',
  'professionals.subtitle':
    'Conecta con expertos verificados en construccion y servicios para el hogar',
  'professionals.searchPlaceholder':
    'Buscar por nombre, ubicacion o servicios...',
  'professionals.loading': 'Cargando profesionales...',
  'professionals.noFound': 'No se encontraron profesionales',
  'professionals.beFirst': 'Se el primero en registrarte como profesional',
  'professionals.joinTitle': 'Eres profesional?',
  'professionals.joinDesc':
    'Unete a la plataforma y encuentra clientes que buscan tus servicios',
  'professionals.getStartedToday': 'Empezar hoy',
  'professionals.sortBy': 'Ordenar por',
  'professionals.topRated': 'Mejor valorados',
  'professionals.mostViewed': 'Mas vistos',
  'professionals.newest': 'Mas recientes',
  'professionals.minRating': 'Valoracion minima',
  'professionals.anyRating': 'Cualquier valoracion',
  'professionals.location': 'Ubicacion',
  'professionals.locationPlaceholder': 'Filtrar por ubicacion...',
  'professionals.found': 'profesionales encontrados',
  'professionals.registerAsProfessional': 'Registrarse como profesional',

  // Каталог майстрів: нові ключі.
  'professionals.eyebrow': 'Profesionales / Maestros',
  'professionals.simpleTitle':
    'Profesionales de construccion listos para contacto directo',
  'professionals.simpleDescription':
    'Busca maestros por ciudad, habilidad o valoracion y contactalos directamente despues de revisar su perfil publico.',
  'professionals.nameSkillService': 'Nombre, habilidad o servicio',
  'professionals.cityOrCountry': 'Ciudad o pais',
  'professionals.filtersButton': 'Filtros',
  'professionals.categoryLabel': 'Categoria',
  'professionals.allCategoriesSimple': 'Todas las categorias',
  'professionals.sortLabel': 'Ordenar',
  'professionals.minRatingLabel': 'Valoracion minima',
  'professionals.anyRatingSimple': 'Cualquier valoracion',
  'professionals.sortRating': 'Mayor valoracion',
  'professionals.sortReviews': 'Mas resenas',
  'professionals.sortNewest': 'Perfiles mas nuevos',
  'professionals.clearFiltersSimple': 'Limpiar filtros',
  'professionals.countSuffix': 'profesionales encontrados',
  'professionals.loadingSimple': 'Cargando profesionales...',
  'professionals.postJob': 'Publicar trabajo',
  'professionals.emptyTitle': 'No hay profesionales para estos filtros',
  'professionals.emptyText':
    'Prueba otra ubicacion, quita el filtro de categoria o baja la valoracion minima.',

  // Рекламні блоки.
  'ads.adSpace': 'Espacio publicitario',
  'ads.advertiseHere': 'Anuncia tu negocio aqui',
  'ads.bannerAd': 'Banner publicitario',
  'ads.premiumPlacement': 'Ubicacion publicitaria premium',
  'ads.contactRates': 'Contactanos para conocer tarifas',
  'ads.stickyAdBlock': 'Bloque publicitario fijo',
  'ads.close': 'Cerrar anuncio',

  // Загальні системні тексти.
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Exito',

  // Радіус видимості оголошення.
  'visibility.city': 'Ciudad',
  'visibility.district': 'Distrito',
  'visibility.region': 'Region',
  'visibility.country': 'Pais',
  'visibility.state': 'Estado',
  'visibility.land': 'Land (DE)',
  'visibility.global': 'Todos los usuarios',

  // Сторінки-заглушки та службові маршрути.
  'route.professionalProfileEyebrow': 'Perfil profesional',
  'route.professionalProfileTitle':
    'La pagina del perfil profesional se esta preparando',
  'route.professionalProfileDescription':
    'Aqui los clientes podran ver el perfil del profesional, su valoracion, resenas y trabajos realizados.',
  'route.jobRequestEyebrow': 'Solicitud de trabajo',
  'route.jobRequestTitle': 'Los detalles de la solicitud se estan preparando',
  'route.jobRequestDescription':
    'En esta pagina se mostrara la solicitud completa, archivos adjuntos, presupuesto y contacto directo para profesionales.',
  'route.messagesEyebrow': 'Mensajes',
  'route.messagesTitle': 'Los mensajes directos apareceran aqui',
  'route.messagesDescription':
    'Clientes y profesionales podran comunicarse directamente en una sola conversacion por cada solicitud.',
  'route.notFoundEyebrow': 'Pagina no encontrada',
  'route.notFoundTitle': 'Esta pagina aun no existe',
  'route.notFoundDescription':
    'La ruta ya esta reservada para el crecimiento de la plataforma, pero todavia no hay una pantalla terminada aqui.',

  // Обране.
  'favorites.title': 'Favoritos',
  'favorites.description':
    'Guarda solicitudes de trabajo y profesionales a los que quieras volver mas tarde.',
  'favorites.loginTitle': 'Inicia sesion para guardar favoritos',
  'favorites.loginText':
    'Las solicitudes guardadas y los profesionales guardados solo estan disponibles dentro de tu cuenta.',
  'favorites.loginButton': 'Ir al inicio de sesion',
  'favorites.listingsTab': 'Solicitudes de trabajo',
  'favorites.professionalsTab': 'Profesionales',
  'favorites.loading': 'Cargando favoritos...',
  'favorites.emptyListingsTitle': 'Todavia no hay solicitudes guardadas',
  'favorites.emptyListingsText':
    'Agrega solicitudes a favoritos para volver rapidamente a ellas mas tarde.',
  'favorites.emptyListingsButton': 'Ver solicitudes',
  'favorites.emptyProfessionalsTitle': 'Todavia no hay profesionales guardados',
  'favorites.emptyProfessionalsText':
    'Guarda profesionales que quieras comparar, contactar o revisar despues.',
  'favorites.emptyProfessionalsButton': 'Ver profesionales',

  // Статистика у футері.
  'footerStats.title': 'Actividad de la plataforma',
  'footerStats.subtitle':
    'Indicadores en vivo del uso de Dimarket y la demanda de servicios de construccion.',
  'footerStats.visits': 'Visitas',
  'footerStats.listings': 'Solicitudes creadas',
  'footerStats.successful': 'Solicitudes completadas',
  'footerStats.professionals': 'Profesionales',
  'footerStats.countries': 'Paises en el ranking',
  'footerStats.rankingTitle': 'Ranking de paises',
  'footerStats.rankingSubtitle':
    'La puntuacion combina profesionales, solicitudes y actividad en los paises.',
  'footerStats.updatedPrefix': 'Actualizado:',
  'footerStats.loading': 'Cargando estadisticas...',
  'footerStats.empty':
    'Todavia no hay suficientes datos para construir el ranking de paises.',
  'footerStats.score': 'Puntuacion',
  'footerStats.prosShort': 'Pros',
  'footerStats.jobsShort': 'Trabajos',
  'footerStats.repliesShort': 'Respuestas',

  // Сторінка реклами.
  'advertising.eyebrow': 'Publicidad',
  'advertising.title': 'La publicidad mantiene Dimarket gratis para los usuarios',
  'advertising.description':
    'Dimarket gana solo con publicidad. Las marcas pueden colocar campanas de construccion relevantes mientras clientes y profesionales siguen usando la plataforma gratis.',
  'advertising.placementsTitle': 'Donde puede aparecer la publicidad',
  'advertising.placements.homeTitle': 'Pagina principal',
  'advertising.placements.homeText':
    'Bloques promocionales junto a la busqueda, categorias destacadas y nuevas solicitudes.',
  'advertising.placements.listingsTitle': 'Feed de solicitudes',
  'advertising.placements.listingsText':
    'Ubicaciones integradas entre solicitudes de trabajo donde los profesionales revisan trabajo nuevo activamente.',
  'advertising.placements.sidebarTitle': 'Barra lateral y pie de pagina',
  'advertising.placements.sidebarText':
    'Visibilidad constante para herramientas, materiales, logistica y showrooms locales.',
  'advertising.audienceTitle': 'Ideal para anunciantes',
  'advertising.audienceText':
    'Materiales de construccion, alquiler de equipos, logistica, herramientas de obra, tiendas de reforma, contratistas locales y showrooms de renovacion.',
  'advertising.principleTitle': 'Principio de la plataforma',
  'advertising.principleText':
    'Los clientes no pagan por publicar solicitudes. Los profesionales no pagan por ver oportunidades de contacto. La publicidad es la unica fuente de monetizacion.',
  'advertising.primaryButton': 'Ver solicitudes de trabajo',
  'advertising.secondaryButton': 'Volver al inicio',
  'ads.badge': 'Anuncio',
  'ads.openLink': 'Abrir',
  'ads.geo.global': 'Todo el mundo',
  'ads.geo.countryFallback': 'Pais no indicado',
  'ads.geo.regionFallback': 'Region',
  'ads.geo.cityFallback': 'Ciudad',
  'ads.geo.localFallback': 'Publicidad local',
  'header.openMenu': 'Abrir menu',
  'header.closeMenu': 'Cerrar menu',
  'header.mobileNavigation': 'Navegacion movil',
  'common.required': '*',
  'common.comingSoon': 'Proximamente',
  'messages.description':
    'El chat interno todavia esta en desarrollo. Mientras se lanza, usa el telefono o el email que el autor dejo en el anuncio.',
  'messages.howToContactTitle': 'Como contactar ahora mismo',
  'messages.howToContactText':
    'Abre el anuncio concreto y usa el telefono o el correo electronico que el autor dejo para el contacto directo.',
  'listingDetail.notFound':
    'El anuncio no fue encontrado o fue retirado de la publicacion.',
  'listingDetail.loadError': 'Error de carga desconocido.',
  'listingDetail.unavailable': 'El anuncio no esta disponible.',
  'listingDetail.backToListings': 'Volver a anuncios',
  'listingDetail.back': 'Volver a la lista',
  'listingDetail.contacts': 'Contactos',
  'listingDetail.expired': 'Caducado',
  'professionalDetail.notFound': 'Perfil no encontrado.',
  'professionalDetail.notProfessional':
    'Este perfil no esta marcado como profesional.',
  'professionalDetail.loadError': 'Error de carga desconocido.',
  'professionalDetail.loading': 'Cargando perfil...',
  'professionalDetail.unavailable': 'Perfil no disponible.',
  'professionalDetail.backToProfessionals': 'Volver a profesionales',
  'professionalDetail.back': 'Volver a profesionales',
  'professionalDetail.website': 'Sitio web',
  'professionalDetail.browseListings': 'Ver anuncios',
  'dashboard.error.loadOwner':
    'No se pudo cargar el panel del propietario.',
  'dashboard.error.approveCampaign':
    'No se pudo aprobar la campana publicitaria.',
  'dashboard.error.rejectCampaign':
    'No se pudo rechazar la campana publicitaria.',
  'dashboard.error.deleteCampaign':
    'No se pudo eliminar la campana publicitaria.',
  'dashboard.error.feedbackRead':
    'No se pudo marcar el mensaje como leido.',
  'dashboard.error.feedbackResolved':
    'No se pudo marcar el mensaje como resuelto.',
  'dashboard.error.deleteFeedback': 'No se pudo eliminar el mensaje.',
  'dashboard.error.deleteListing': 'No se pudo eliminar el anuncio.',
  'dashboard.error.deleteInternal':
    'No se pudo eliminar el mensaje interno.',
  'dashboard.notice.approveCampaign': 'Campana publicitaria aprobada.',
  'dashboard.notice.rejectCampaign': 'Campana publicitaria rechazada.',
  'dashboard.notice.deleteCampaign': 'Campana publicitaria eliminada.',
  'dashboard.notice.feedbackRead': 'Mensaje marcado como leido.',
  'dashboard.notice.feedbackResolved': 'Mensaje marcado como resuelto.',
  'dashboard.notice.deleteFeedback': 'Mensaje eliminado.',
  'dashboard.notice.deleteListing': 'Anuncio marcado como eliminado.',
  'dashboard.notice.deleteInternal': 'Mensaje interno eliminado.',
  'dashboard.confirm.deleteCampaign':
    'Estas seguro de que quieres eliminar esta campana publicitaria?',
  'dashboard.confirm.deleteFeedback':
    'Estas seguro de que quieres eliminar este mensaje?',
  'dashboard.confirm.deleteListing':
    'Estas seguro de que quieres eliminar este anuncio?',
  'dashboard.confirm.deleteInternal':
    'Estas seguro de que quieres eliminar este mensaje interno?',
  'dashboard.loading': 'Cargando panel del propietario...',
  'dashboard.accessDeniedTitle': 'Acceso denegado',
  'dashboard.accessDeniedText':
    'Esta seccion solo esta disponible para el propietario de la plataforma. Vuelve al inicio o abre tu perfil.',
  'dashboard.homeButton': 'Inicio',
  'dashboard.profileButton': 'Abrir mi perfil',
  'dashboard.stats.trafficTitle': 'Trafico del sitio',
  'dashboard.stats.trafficText': 'Visitas totales de la plataforma.',
  'dashboard.stats.listingsTitle': 'Anuncios',
  'dashboard.stats.activeNow': 'Activos ahora',
  'dashboard.stats.adsTitle': 'Publicidad',
  'dashboard.stats.pendingNow': 'Pendientes ahora',
  'dashboard.stats.messagesTitle': 'Mensajes',
  'dashboard.stats.feedbackNow': 'Contacto',
  'dashboard.eyebrow': 'Panel del propietario',
  'dashboard.welcome': 'Bienvenido',
  'dashboard.ownerFallbackName': 'propietario del sitio',
  'dashboard.description':
    'Solo tu puedes ver este espacio: cifras del sitio, anuncios, publicidad y mensajes entrantes.',
  'dashboard.recentListingsTitle': 'Anuncios recientes',
  'dashboard.recentListingsText':
    'El contenido mas nuevo de la plataforma para revisarlo y retirarlo rapidamente.',
  'dashboard.openAll': 'Abrir todo',
  'dashboard.created': 'Creado',
  'dashboard.deleted': 'Eliminado',
  'dashboard.delete': 'Eliminar',
  'dashboard.recentListingsEmpty': 'Todavia no hay anuncios para mostrar.',
  'dashboard.controlTitle': 'Ya bajo control',
  'dashboard.controlFeatureOne':
    'Solo el perfil del propietario puede ver este panel.',
  'dashboard.controlFeatureTwo':
    'Puedes ver el trafico total del sitio y la cantidad de anuncios.',
  'dashboard.controlFeatureThree':
    'Puedes retirar anuncios cambiandolos al estado deleted.',
  'dashboard.controlFeatureFour':
    'Puedes revisar campanas publicitarias y solicitudes de moderacion.',
  'dashboard.controlFeatureFive':
    'Puedes leer mensajes del formulario de contacto y mensajes internos de la plataforma.',
  'dashboard.adsTitle': 'Gestion de publicidad',
  'dashboard.adsText':
    'Aqui puedes aprobar, rechazar o eliminar campanas publicitarias.',
  'dashboard.pendingCount': 'Pendiente de revision',
  'dashboard.placement': 'Ubicacion',
  'dashboard.geography': 'Geografia',
  'dashboard.period': 'Periodo',
  'dashboard.approve': 'Aprobar',
  'dashboard.reject': 'Rechazar',
  'dashboard.adsEmpty': 'Todavia no hay campanas publicitarias para moderacion.',
  'dashboard.feedbackTitle': 'Contacto',
  'dashboard.feedbackText':
    'Aqui aparecen todos los mensajes enviados por los usuarios desde el formulario de contacto.',
  'dashboard.total': 'Total',
  'dashboard.unread': 'No leido',
  'dashboard.phone': 'Telefono',
  'dashboard.received': 'Recibido',
  'dashboard.markRead': 'Marcar como leido',
  'dashboard.resolved': 'Resuelto',
  'dashboard.feedbackEmpty':
    'Todavia no hay mensajes del formulario de contacto.',
  'dashboard.messagesTitle': 'Mensajes internos',
  'dashboard.messagesText':
    'Esta seccion muestra las conversaciones que ocurren dentro de la plataforma.',
  'dashboard.emailMissing': 'Email no indicado',
  'dashboard.conversation': 'Conversacion',
  'dashboard.recipient': 'Destinatario',
  'dashboard.listing': 'Anuncio',
  'dashboard.none': 'Ninguno',
  'dashboard.toListing': 'Ir al anuncio',
  'dashboard.internalEmpty': 'Todavia no hay mensajes internos.',
  'dashboard.noLimit': 'Sin limite',
  'dashboard.fromPrefix': 'desde',
  'dashboard.untilPrefix': 'hasta',
  'dashboard.messageSenderUnknown': 'Remitente desconocido',
  'dashboard.feedbackStatus.new': 'Nuevo',
  'dashboard.feedbackStatus.inProgress': 'En progreso',
  'dashboard.feedbackStatus.resolved': 'Resuelto',
  'dashboard.feedbackStatus.archived': 'Archivado',
  'dashboard.listingStatus.active': 'Activo',
  'dashboard.listingStatus.expired': 'Caducado',
  'dashboard.listingStatus.sold': 'Cerrado',
  'dashboard.listingStatus.deleted': 'Eliminado',
  'advertising.selfServePrimaryButton': 'Crear campana',
  'advertising.selfServeLoginCta': 'Inicia sesion para anadir publicidad',
  'advertising.selfServeFormTitle': 'Nueva campana publicitaria',
  'advertising.selfServeFormDescription':
    'Primero guarda la campana y la revisaremos antes de publicarla.',
  'advertising.selfServeLoginPrompt':
    'Inicia sesion con una cuenta de anunciante para crear campanas por tu cuenta.',
  'advertising.selfServePlacement.footerTitle': 'Bloque del pie',
  'advertising.selfServePlacement.footerText':
    'Visibilidad extra durante sesiones de navegacion largas.',
  'advertising.selfServePlacement.mobileTitle': 'Bloque sticky movil',
  'advertising.selfServePlacement.mobileText':
    'Un formato visible para usuarios de telefonos.',
  'advertising.selfServeCampaignTitleLabel': 'Nombre de la campana',
  'advertising.selfServeCampaignTitlePlaceholder':
    'Por ejemplo: Servicio de reformas en Varsovia',
  'advertising.selfServeCampaignDescriptionLabel': 'Descripcion breve',
  'advertising.selfServeCampaignDescriptionPlaceholder':
    'Explica brevemente que promociona esta campana.',
  'advertising.selfServeImageUrlLabel': 'URL de la imagen del banner',
  'advertising.selfServeLinkUrlLabel': 'Enlace de destino',
  'advertising.selfServePlacementLabel': 'Ubicacion',
  'advertising.selfServeGeoScopeLabel': 'Geografia objetivo',
  'advertising.selfServeGeo.cityTitle': 'Solo ciudad',
  'advertising.selfServeGeo.cityText':
    'Muestra la campana en una ciudad elegida.',
  'advertising.selfServeGeo.regionTitle': 'Region / estado',
  'advertising.selfServeGeo.regionText':
    'Muestra la campana en una region seleccionada.',
  'advertising.selfServeGeo.countryTitle': 'Un solo pais',
  'advertising.selfServeGeo.countryText':
    'Muestra la campana solo en el pais elegido.',
  'advertising.selfServeGeo.globalTitle': 'Todo el mundo',
  'advertising.selfServeGeo.globalText':
    'Muestra la campana sin limites geograficos.',
  'advertising.selfServeCountryLabel': 'Pais',
  'advertising.selfServeRegionLabel': 'Region / estado',
  'advertising.selfServeCityLabel': 'Ciudad',
  'advertising.selfServeCountryPlaceholder': 'Por ejemplo: Poland',
  'advertising.selfServeRegionPlaceholder': 'Por ejemplo: Mazowieckie',
  'advertising.selfServeCityPlaceholder': 'Por ejemplo: Warsaw',
  'advertising.selfServePeriodLabel': 'Calendario de la campana',
  'advertising.selfServeStartLabel': 'Fecha de inicio',
  'advertising.selfServeEndLabel': 'Fecha de fin',
  'advertising.selfServeSubmit': 'Crear campana publicitaria',
  'advertising.selfServeSubmitting': 'Creando...',
  'advertising.selfServeCampaignsTitle': 'Mis campanas',
  'advertising.selfServeCampaignsSignIn':
    'Inicia sesion para ver tus propias campanas publicitarias.',
  'advertising.selfServeCampaignsLoading': 'Cargando campanas...',
  'advertising.selfServeCampaignsEmpty':
    'Todavia no has creado ninguna campana publicitaria.',
  'advertising.selfServeGeographyLabel': 'Geografia',
  'advertising.selfServeCreatedAtLabel': 'Creada',
  'advertising.selfServeErrorLogin':
    'Para anadir publicidad, primero inicia sesion en tu cuenta.',
  'advertising.selfServeErrorCountry':
    'Indica el pais para esta campana.',
  'advertising.selfServeErrorRegion':
    'Indica el pais y la region para esta campana.',
  'advertising.selfServeErrorCity':
    'Indica el pais y la ciudad para esta campana.',
  'advertising.selfServeErrorDate':
    'La fecha de fin no puede ser anterior a la fecha de inicio.',
  'advertising.selfServeErrorCreate':
    'No se pudo crear la campana publicitaria. Revisa los campos e intentalo de nuevo.',
  'advertising.selfServeSuccess':
    'La campana publicitaria se ha creado y esta pendiente de revision.',
  'advertising.selfServeStatus.draft': 'Borrador',
  'advertising.selfServeStatus.pending_review': 'En revision',
  'advertising.selfServeStatus.active': 'Activa',
  'advertising.selfServeStatus.paused': 'Pausada',
  'advertising.selfServeStatus.rejected': 'Rechazada',
  'advertising.selfServeStatus.expired': 'Finalizada',
  'advertising.selfServeStatus.deleted': 'Eliminada',
  'settings.description':
    'Administra tu perfil publico, las preferencias de la cuenta y la seguridad.',
  'settings.profileInfoTitle': 'Informacion del perfil',
  'settings.bioLabel': 'Bio / Descripcion',
  'settings.bioPlaceholder':
    'Cuenta a los clientes sobre tu experiencia y servicios...',
  'settings.websiteLabel': 'Sitio web',
  'settings.profilePhotoLabel': 'URL de la foto de perfil',
  'settings.profilePhotoAlt': 'Vista previa del perfil',
  'settings.portfolioTitle': 'Imagenes del portafolio',
  'settings.removePortfolioImage': 'Eliminar imagen del portafolio',
  'settings.addPortfolioImage': 'Anadir imagen del portafolio',
  'settings.preferencesTitle': 'Idioma y moneda',
  'settings.notificationsTitle': 'Activar notificaciones',
  'settings.notificationsText':
    'Recibe actualizaciones sobre mensajes y nuevos contactos.',
  'settings.saveChanges': 'Guardar cambios',
  'settings.saving': 'Guardando...',
  'settings.changePasswordTitle': 'Cambiar contrasena',
  'settings.newPasswordLabel': 'Nueva contrasena',
  'settings.confirmNewPasswordLabel': 'Confirmar nueva contrasena',
  'settings.changePasswordButton': 'Cambiar contrasena',
  'settings.dangerTitle': 'Zona de riesgo',
  'settings.dangerText':
    'Una vez que elimines tu cuenta, no habra vuelta atras. Asegurate antes de continuar.',
  'settings.deleteAccountButton': 'Eliminar cuenta',
  'settings.error.loadProfile':
    'No se pudo cargar la configuracion del perfil.',
  'settings.error.noSession': 'La sesion del usuario no esta disponible.',
  'settings.error.saveProfile': 'No se pudo actualizar el perfil.',
  'settings.error.passwordMismatch': 'Las contrasenas no coinciden.',
  'settings.error.changePassword': 'No se pudo cambiar la contrasena.',
  'settings.error.deleteAccount': 'No se pudo eliminar la cuenta.',
  'settings.success.profileSaved': 'Perfil actualizado correctamente.',
  'settings.success.passwordChanged': 'Contrasena cambiada correctamente.',
  'settings.confirm.deleteAccount':
    'Estas seguro de que quieres eliminar tu cuenta? Esta accion no se puede deshacer.',
}
