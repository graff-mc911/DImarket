import type { TranslationKey } from './en'

// Німецькі переклади інтерфейсу.
// Важливо: ключі мають збігатися з ключами в en.ts, бо en.ts задає тип TranslationKey.
export const deTranslations: Partial<Record<TranslationKey, string>> = {
  // Шапка сайту: навігація, акаунт, мова, валюта.
  'header.browse': 'Entdecken',
  'header.findProfessionals': 'Fachleute finden',
  'header.professionalLogin': 'Login fuer Fachkraefte',
  'header.createAd': 'Anzeige erstellen',
  'header.myProfile': 'Mein Profil',
  'header.dashboard': 'Dashboard',
  'header.myListings': 'Meine Anzeigen',
  'header.signOut': 'Abmelden',
  'header.account': 'Konto',
  'header.language': 'Sprache',
  'header.currency': 'Waehrung',
  'header.jobRequests': 'Arbeitsanfragen',
  'header.favorites': 'Favoriten',
  'header.messages': 'Nachrichten',
  'header.postJob': 'Anfrage veroeffentlichen',
  'header.brandTagline': 'Kostenlose Bauplattform',

  // Футер: основні посилання, підтримка, реклама і правовий текст.
  'footer.tagline':
    'Finden Sie vertrauenswuerdige Bauprofis und hochwertige Materialien.',
  'footer.forClients': 'Fuer Kunden',
  'footer.browseListings': 'Anzeigen durchsuchen',
  'footer.postRequest': 'Anfrage erstellen',
  'footer.forProfessionals': 'Fuer Fachkraefte',
  'footer.signIn': 'Anmelden',
  'footer.register': 'Registrieren',
  'footer.howItWorks': 'So funktioniert es',
  'footer.allRightsReserved': 'Alle Rechte vorbehalten.',
  'footer.brandText':
    'Dimarket ist eine kostenlose globale Plattform fuer Baudienstleistungen, auf der Kunden Arbeiten einstellen und Fachkraefte direkt antworten.',
  'footer.monetization':
    'Keine Gebuehren fuer Nutzer. Keine Abonnements. Die Plattform verdient ausschliesslich durch Werbung.',
  'footer.platformTitleSimple': 'Plattform',
  'footer.accountTitleSimple': 'Konto',
  'footer.supportTitle': 'Support',
  'footer.contactLink': 'Kontakt',
  'footer.advertisingLink': 'Werbung auf der Seite',
  'footer.contactButton': 'Kontakt aufnehmen',
  'footer.adsTitle': 'Werbung',
  'footer.adsText':
    'Marken fuer Baumaterialien, Werkzeuge, Logistik und lokale Services erreichen aktive Nachfrage in Anzeigen und auf Profilseiten.',
  'footer.adsButton': 'Werbeseite',
  'footer.legalRight':
    'Kostenlose Plattform fuer Baudienstleistungen mit ausschliesslicher Werbefinanzierung.',

  // Сторінка зворотного звʼязку: заголовки, форма, повідомлення і підказки.
  'contact.eyebrow': 'Kontakt',
  'contact.title': 'Schreiben Sie uns direkt',
  'contact.description':
    'Wenn Sie eine Frage, einen Vorschlag, eine Beschwerde oder eine Idee zur Verbesserung der Plattform haben, senden Sie uns eine Nachricht ueber dieses Formular.',
  'contact.homeButton': 'Startseite',
  'contact.loginButton': 'Anmelden',
  'contact.formTitle': 'Kontaktformular',
  'contact.formDescription':
    'Beschreiben Sie Ihr Anliegen einfach - wir speichern die Anfrage und koennen ohne Detailverlust darauf zurueckkommen.',
  'contact.nameLabel': 'Name',
  'contact.namePlaceholder': 'Ihr Name',
  'contact.emailLabel': 'Email',
  'contact.emailPlaceholder': 'your@email.com',
  'contact.phoneLabel': 'Telefon',
  'contact.phonePlaceholder': '+48 ...',
  'contact.subjectLabel': 'Betreff',
  'contact.subjectPlaceholder': 'Anfrage kurz beschreiben',
  'contact.messageLabel': 'Nachricht',
  'contact.messagePlaceholder': 'Beschreiben Sie Frage oder Problem genauer...',
  'contact.submitButton': 'Nachricht senden',
  'contact.sending': 'Wird gesendet...',
  'contact.requiredFields': 'Bitte fuellen Sie alle Pflichtfelder aus.',
  'contact.successMessage':
    'Nachricht erfolgreich gesendet. Wir pruefen sie und kontaktieren Sie ueber die angegebenen Daten.',
  'contact.errorMessage':
    'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
  'contact.howItWorksTitle': 'So funktioniert es',
  'contact.howItWorksStepOne':
    'Sie fuellen ein kurzes Formular mit Kontaktdaten und Beschreibung aus.',
  'contact.howItWorksStepTwo':
    'Wir erhalten die Anfrage im Admin-Bereich der Plattform.',
  'contact.howItWorksStepThree':
    'Die Antwort kommt per Email oder Telefon, je nachdem, was Sie angegeben haben.',
  'contact.useCasesTitle': 'Wofuer dieses Formular ist',
  'contact.useCaseQuestions': 'Fragen zur Funktionsweise der Website',
  'contact.useCaseBugs': 'Fehlermeldungen',
  'contact.useCaseIdeas': 'Vorschlaege fuer Funktionen',
  'contact.useCaseComplaints': 'Beschwerden ueber Inhalte oder Nutzer',

  // Головна сторінка: старі ключі, які ще можуть використовуватись у застосунку.
  'home.heroTitle': 'Vertrauenswuerdige Fachleute finden',
  'home.heroSubtitle': 'Bauen Sie Ihre Traeume',
  'home.heroDescription':
    'Marktplatz fuer Bau, Renovierung und Hausservices, der Kunden mit geprueften Fachkraeften verbindet',
  'home.searchPlaceholder': 'Suche nach Services, Materialien oder Fachleuten...',
  'home.search': 'Suchen',
  'home.findProfessionals': 'Fachleute finden',
  'home.postRequest': 'Anfrage erstellen',
  'home.browseByCategory': 'Nach Kategorie durchsuchen',
  'home.topRatedProfessionals': 'Top bewertete Fachleute',
  'home.topRatedDescription':
    'Verbinden Sie sich mit geprueften Experten fuer Bau und Hausservices',
  'home.noProfessionals': 'Noch keine Fachleute registriert. Seien Sie der Erste!',
  'home.viewAllProfessionals': 'Alle Fachleute ansehen',
  'home.recentListings': 'Neueste Anzeigen',
  'home.recentListingsDescription': 'Aktuelle Chancen und Anfragen',
  'home.noListings': 'Noch keine aktiven Anzeigen. Veroeffentlichen Sie die erste!',
  'home.viewAllListings': 'Alle Anzeigen ansehen',
  'home.whyChoose': 'Warum Dimarket?',
  'home.verifiedProfessionals': 'Gepruefte Fachleute',
  'home.verifiedDescription':
    'Alle Fachleute sind verifiziert und haben Bewertungen von echten Kunden',
  'home.quickEasy': 'Schnell und einfach',
  'home.quickEasyDescription':
    'Veroeffentlichen Sie Ihre Anfrage in wenigen Minuten ohne Registrierung. Erhalten Sie schnell Antworten',
  'home.directCommunication': 'Direkte Kommunikation',
  'home.directCommunicationDescription':
    'Kommunizieren Sie direkt mit Fachleuten ueber unser Nachrichtensystem',
  'home.areYouProfessional': 'Sind Sie Fachkraft?',
  'home.joinProfessionals':
    'Schliessen Sie sich Tausenden Fachleuten an, die ihr Geschaeft mit Dimarket ausbauen',
  'home.registerAsProfessional': 'Als Fachkraft registrieren',

  // Головна сторінка: нові ключі для актуального hero-блоку, категорій, запитів і майстрів.
  'home.globalEyebrow': 'Globale Baudienstleistungen',
  'home.heroSimpleTitle':
    'Finden Sie einen Handwerker fuer Reparatur-, Montage- oder Bauarbeiten.',
  'home.heroSimpleDescription':
    'Kunden veroeffentlichen Arbeitsanfragen, Fachkraefte antworten direkt, und Dimarket bleibt fuer Nutzer kostenlos.',
  'home.whatNeedsToBeDone': 'Was muss erledigt werden?',
  'home.cityOrCountry': 'Stadt oder Land',
  'home.postJob': 'Anfrage veroeffentlichen',
  'home.popularCategoriesTitle': 'Beliebte Kategorien',
  'home.popularCategoriesText':
    'Die gefragtesten Bereiche fuer Bau und Renovierung auf Dimarket.',
  'home.browseRequests': 'Arbeitsanfragen durchsuchen',
  'home.freshRequestsTitle': 'Neue Arbeitsanfragen',
  'home.freshRequestsText':
    'Neue Kundenanfragen, die Fachkraefte sofort pruefen und beantworten koennen.',
  'home.allRequests': 'Alle Arbeitsanfragen',
  'home.popularProsTitle': 'Beliebte Fachleute',
  'home.popularProsText':
    'Profile mit sichtbarer Erfahrung, stabilen Bewertungen und direktem Kontakt.',
  'home.allPros': 'Alle Fachleute',
  'home.adTitle': 'Werbung',
  'home.adText':
    'Bewerben Sie Werkzeuge, Materialien, lokale Services oder Bauschauraeume in einer klar fokussierten Nachfragegruppe.',
  'home.adButton': 'Auf Dimarket werben',
  'home.adCardOne': 'Materialpartner',
  'home.adCardTwo': 'Werkzeugmarken',
  'home.adCardThree': 'Lokale Schauräume',
  'home.noJobs': 'Noch keine aktiven Arbeitsanfragen.',
  'home.noCategories': 'Kategorien erscheinen hier bald.',
  'home.noLocation': 'Standort nicht angegeben',
  'home.budgetLabel': 'Budget',
  'home.activeLabel': 'Aktiv',
  'home.unknownCategory': 'Baudienstleistung',
  'home.noBio': 'Das Profil dieses Bauprofis wird noch vervollstaendigt.',
  'home.sponsoredPlacement':
    'Gesponserte Platzierung fuer Werkzeuge, Materialien, Logistik oder lokale Baupartner.',
  'home.sidebarAdOne': 'Platzieren Sie Ihre Marke neben echter Baunachfrage.',
  'home.sidebarAdTwo':
    'Erreichen Sie Fachleute und Kunden, waehrend sie nach Arbeit und Services suchen.',
  'home.loading': 'Wird geladen...',

  // Категорії послуг і матеріалів.
  'category.construction': 'Bau',
  'category.constructionDesc': 'Neubau und Bauprojekte',
  'category.renovation': 'Renovierung',
  'category.renovationDesc': 'Hausrenovierung und Umbau',
  'category.electrical': 'Elektrik',
  'category.electricalDesc': 'Elektrische Arbeiten und Reparaturen',
  'category.plumbing': 'Sanitaer',
  'category.plumbingDesc': 'Sanitaerdienstleistungen und Installationen',
  'category.handyman': 'Handwerker',
  'category.handymanDesc': 'Allgemeine Handwerksdienste',
  'category.materials': 'Materialien',
  'category.materialsDesc': 'Baumaterialien zum Verkauf',
  'category.tools': 'Werkzeuge',
  'category.toolsDesc': 'Werkzeuge und Ausruestung',
  'category.name.construction': 'Bau',
  'category.name.renovation': 'Renovierung',
  'category.name.electrical': 'Elektrik',
  'category.name.plumbing': 'Sanitaer',
  'category.name.handyman': 'Handwerker',
  'category.name.materials': 'Materialien',
  'category.name.tools': 'Werkzeuge',

  // Картка оголошення: тип, ціна, перегляди, статус premium.
  'listing.serviceNeeded': 'Service gesucht',
  'listing.serviceOffered': 'Service angeboten',
  'listing.forSale': 'Zu verkaufen',
  'listing.wanted': 'Gesucht',
  'listing.contactForPrice': 'Preis auf Anfrage',
  'listing.daysLeft': 'Tage uebrig',
  'listing.views': 'Aufrufe',
  'listing.premium': 'PREMIUM',
  'listing.constructionService': 'Baudienstleistung',
  'listing.locationNotSpecified': 'Standort nicht angegeben',
  'listing.budget': 'Budget',

  // Картка майстра.
  'professional.contact': 'Kontakt',
  'professional.reviews': 'Bewertungen',
  'professional.new': 'Neu',
  'professional.defaultName': 'Fachkraft',
  'professional.global': 'Global',
  'professional.profileInProgress':
    'Das Profil dieses Bauprofis wird noch vervollstaendigt.',

  // Створення оголошення: форма запиту, локація, контакти, фото, статуси.
  'createAd.title': 'Bauanfrage erstellen',
  'createAd.noRegistration': 'Keine Registrierung erforderlich',
  'createAd.eyebrow': 'Kostenlose Arbeitsanfrage',
  'createAd.heroTitle': 'Bauanfrage erstellen',
  'createAd.heroDescription':
    'Beschreiben Sie die Arbeit, fuegen Sie einen Standort hinzu und lassen Sie Fachkraefte Sie direkt kontaktieren. Kein Abo und keine Veroeffentlichungsgebuehr.',
  'createAd.detailsTitle': 'Auftragsdetails',
  'createAd.detailsText':
    'Beschreiben Sie die Anfrage praezise, damit Fachkraefte die Arbeit verstehen und ein passendes Angebot senden koennen.',
  'createAd.locationTitle': 'Standort und Sichtbarkeit',
  'createAd.locationText':
    'Waehlen Sie, wo sich der Auftrag befindet und wie breit er fuer Fachkraefte sichtbar sein soll.',
  'createAd.contactTitle': 'Kontaktdaten',
  'createAd.contactText':
    'Mindestens eine Kontaktmoeglichkeit ist erforderlich, damit Fachkraefte Sie direkt erreichen koennen.',
  'createAd.imagesTitle': 'Fotos (optional)',
  'createAd.imagesText':
    'Fuegen Sie Referenzfotos, Plaene oder Beispiele hinzu, damit Fachkraefte den Auftrag genauer einschaetzen koennen.',
  'createAd.freeListTitle': 'Was enthalten ist',
  'createAd.freeItemOne': 'Kostenlose Verffentlichung fuer Kunden',
  'createAd.freeItemTwo': 'Direkter Kontakt mit Fachkraeften',
  'createAd.freeItemThree': 'Optionale Fotos und Budget',
  'createAd.freeItemFour': 'Werbefinanziertes Plattformmodell',
  'createAd.adType': 'Anzeigentyp',
  'createAd.needService': 'Service gesucht',
  'createAd.needServiceDesc': 'Ich suche Hilfe',
  'createAd.offerService': 'Service anbieten',
  'createAd.offerServiceDesc': 'Ich biete Services an',
  'createAd.sellItem': 'Artikel verkaufen',
  'createAd.sellItemDesc': 'Materialien, Werkzeuge',
  'createAd.wantItem': 'Artikel suchen',
  'createAd.wantItemDesc': 'Ich moechte kaufen',
  'createAd.titleLabel': 'Titel',
  'createAd.taskPlaceholder': 'Was muss erledigt werden?',
  'createAd.titlePlaceholder': 'z. B. Trockenbau-Reparatur im Wohnzimmer gesucht',
  'createAd.titleHint': 'Beispiel: Trockenbau-Reparatur im Wohnzimmer gesucht',
  'createAd.descriptionLabel': 'Beschreibung',
  'createAd.descriptionPlaceholder':
    'Beschreiben Sie, was erledigt werden muss, den Umfang, den gewuenschten Zeitrahmen und wichtige Details.',
  'createAd.descriptionHint':
    'Beschreiben Sie, was erledigt werden muss, den Umfang, den gewuenschten Zeitrahmen und wichtige Details.',
  'createAd.categoryLabel': 'Kategorie',
  'createAd.selectCategory': 'Kategorie auswaehlen',
  'createAd.priceLabel': 'Budget',
  'createAd.pricePlaceholder': 'Optionales Budget',
  'createAd.budgetPlaceholder': 'Optionales Budget',
  'createAd.locationLabel': 'Standort',
  'createAd.locationPlaceholder': 'Stadt, Bezirk oder Land',
  'createAd.contactInfo': 'Kontaktinformationen',
  'createAd.yourName': 'Ihr Name',
  'createAd.phone': 'Telefon',
  'createAd.email': 'E-Mail',
  'createAd.contactNote': 'Mindestens Telefon oder E-Mail angeben',
  'createAd.contactRule':
    'Fuegen Sie Telefon oder E-Mail hinzu, damit Fachkraefte Sie kontaktieren koennen.',
  'createAd.images': 'Bilder (optional)',
  'createAd.imagePlaceholder': 'https://example.com/photo.jpg',
  'createAd.addImage': 'Weiteres Bild hinzufuegen',
  'createAd.imageTip': 'Tipp: Verwenden Sie direkte Bildlinks',
  'createAd.imageHelp':
    'Verwenden Sie vorerst direkte Bild-URLs. Lokaler Upload kann spaeter ohne Aenderung des Datenmodells hinzugefuegt werden.',
  'createAd.currentLocation': 'Meinen Standort verwenden',
  'createAd.duration': 'Anfragedauer',
  'createAd.durationLabel': 'Anfragedauer',
  'createAd.days': 'Tage',
  'createAd.popular': 'Beliebt',
  'createAd.year': 'Jahr',
  'createAd.adIncludes': 'Was enthalten ist',
  'createAd.freeListLegacyTitle': 'Ihre Anfrage enthaelt:',
  'createAd.daysVisibility': 'Tage Sichtbarkeit',
  'createAd.contactDisplayed': 'Kontaktinformationen werden angezeigt',
  'createAd.upToImages': 'Bis zu 10 Bilder',
  'createAd.premiumBadge': 'Premium-Badge und Top-Platzierung',
  'createAd.createButton': 'Arbeitsanfrage veroeffentlichen',
  'createAd.creating': 'Anfrage wird veroeffentlicht...',
  'createAd.success': 'Arbeitsanfrage erfolgreich veroeffentlicht. Weiterleitung...',
  'createAd.contactRequired':
    'Fuegen Sie vor der Veroeffentlichung mindestens Telefon oder E-Mail hinzu.',
  'createAd.locationDetectError':
    'Ihr aktueller Standort konnte nicht ermittelt werden.',
  'createAd.locationLookupError':
    'Standortsuche fehlgeschlagen. Bitte Stadt manuell eingeben.',
  'createAd.publishError':
    'Die Arbeitsanfrage konnte nicht veroeffentlicht werden.',
  'createAd.locationHelp':
    'Beginnen Sie mit der Eingabe einer Stadt oder Region, um Vorschlaege zu erhalten.',
  'createAd.visibilityRadius': 'Sichtbarkeitsradius',
  'createAd.visibilityRadiusDesc':
    'Waehlen Sie, wie weit die Anzeige sichtbar sein soll',
  'createAd.radius.city': 'Stadt',
  'createAd.radius.district': 'Bezirk',
  'createAd.radius.region': 'Region',
  'createAd.radius.country': 'Land',
  'createAd.radius.state': 'Bundesland',
  'createAd.radius.land': 'Bundesland (DE)',
  'createAd.radius.global': 'Alle Nutzer',

  // Вхід у систему.
  'login.title': 'Login fuer Fachkraefte',
  'login.subtitle': 'Melden Sie sich an, um Profil und Anzeigen zu verwalten',
  'login.email': 'E-Mail-Adresse',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Passwort',
  'login.passwordPlaceholder': '********',
  'login.signIn': 'Anmelden',
  'login.signingIn': 'Anmeldung...',
  'login.noAccount': 'Noch kein Konto?',
  'login.registerLink': 'Als Fachkraft registrieren',
  'login.lookingToPost': 'Moechten Sie eine Anzeige veroeffentlichen?',
  'login.noRegistrationRequired': 'Keine Registrierung erforderlich',

  // Реєстрація майстра.
  'register.title': 'Als Fachkraft registrieren',
  'register.subtitle':
    'Treten Sie Dimarket bei und bauen Sie Ihr Geschaeft aus',
  'register.fullName': 'Vollstaendiger Name',
  'register.fullNamePlaceholder': 'Max Mustermann',
  'register.passwordMin': 'Mindestens 6 Zeichen',
  'register.phonePlaceholder': '+49 170 1234567',
  'register.locationPlaceholder': 'Stadt, Bundesland',
  'register.createAccount': 'Fachkraftkonto erstellen',
  'register.creating': 'Konto wird erstellt...',
  'register.success':
    'Registrierung erfolgreich! Weiterleitung zum Dashboard...',
  'register.alreadyHave': 'Sie haben bereits ein Konto?',
  'register.afterRegistration': 'Nach der Registrierung:',
  'register.choosePlan': 'Waehlen Sie einen Tarif',
  'register.completeProfile':
    'Vervollstaendigen Sie Ihr Profil mit Portfolio',
  'register.receiveRequests': 'Erhalten Sie Kundenanfragen',
  'register.buildReputation':
    'Bauen Sie Ihren Ruf durch Bewertungen auf',

  // Каталог оголошень: старі ключі.
  'listings.title': 'Anzeigen durchsuchen',
  'listings.searchPlaceholder': 'Anzeigen durchsuchen...',
  'listings.filters': 'Filter',
  'listings.allCategories': 'Alle Kategorien',
  'listings.allTypes': 'Alle Typen',
  'listings.clearFilters': 'Filter zuruecksetzen',
  'listings.loading': 'Anzeigen werden geladen...',
  'listings.noFound': 'Keine Anzeigen gefunden',
  'listings.createFirst': 'Erste Anzeige erstellen',
  'listings.category': 'Kategorie',
  'listings.listingType': 'Anzeigentyp',
  'listings.typeServiceRequest': 'Service gesucht',
  'listings.typeServiceOffer': 'Service angeboten',
  'listings.typeItemSale': 'Zu verkaufen',
  'listings.typeItemWanted': 'Gesucht',
  'listings.search': 'Suchen',

  // Каталог оголошень: нові ключі.
  'listings.eyebrow': 'Arbeitsanfragen',
  'listings.simpleTitle': 'Bauauftraege von Kunden',
  'listings.simpleDescription':
    'Durchsuchen Sie aktive Kundenanfragen, filtern Sie nach Kategorie oder Ort und antworten Sie direkt, wenn ein Auftrag zu Ihren Faehigkeiten passt.',
  'listings.whatNeedsToBeDone': 'Was muss erledigt werden?',
  'listings.cityOrCountry': 'Stadt oder Land',
  'listings.findRequests': 'Anfragen finden',
  'listings.filtersButton': 'Filter',
  'listings.categoryLabel': 'Kategorie',
  'listings.allCategoriesSimple': 'Alle Kategorien',
  'listings.clearFiltersSimple': 'Filter zuruecksetzen',
  'listings.postJob': 'Anfrage veroeffentlichen',
  'listings.countSuffix': 'Anfragen gefunden',
  'listings.loadingRequests': 'Arbeitsanfragen werden geladen...',
  'listings.emptyTitle': 'Keine Arbeitsanfragen passen zu diesen Filtern',
  'listings.emptyText':
    'Versuchen Sie ein anderes Stichwort, waehlen Sie eine andere Kategorie oder entfernen Sie den Standortfilter.',

  // Каталог майстрів: старі ключі.
  'professionals.title': 'Fachleute finden',
  'professionals.subtitle':
    'Verbinden Sie sich mit geprueften Experten fuer Bau und Hausservices',
  'professionals.searchPlaceholder':
    'Nach Name, Standort oder Services suchen...',
  'professionals.loading': 'Fachleute werden geladen...',
  'professionals.noFound': 'Keine Fachleute gefunden',
  'professionals.beFirst':
    'Seien Sie der Erste, der sich als Fachkraft registriert!',
  'professionals.joinTitle': 'Sind Sie Fachkraft?',
  'professionals.joinDesc':
    'Treten Sie unserer Plattform bei und finden Sie Kunden, die nach Ihren Leistungen suchen',
  'professionals.getStartedToday': 'Heute starten',
  'professionals.sortBy': 'Sortieren nach',
  'professionals.topRated': 'Top bewertet',
  'professionals.mostViewed': 'Am meisten angesehen',
  'professionals.newest': 'Neueste',
  'professionals.minRating': 'Mindestbewertung',
  'professionals.anyRating': 'Beliebige Bewertung',
  'professionals.location': 'Standort',
  'professionals.locationPlaceholder': 'Nach Standort filtern...',
  'professionals.found': 'Fachleute gefunden',
  'professionals.registerAsProfessional': 'Als Fachkraft registrieren',

  // Каталог майстрів: нові ключі.
  'professionals.eyebrow': 'Fachleute / Handwerker',
  'professionals.simpleTitle':
    'Baufachkraefte bereit fuer direkten Kontakt',
  'professionals.simpleDescription':
    'Suchen Sie Handwerker nach Stadt, Faehigkeit oder Bewertung und kontaktieren Sie sie direkt nach Ansicht ihres oeffentlichen Profils.',
  'professionals.nameSkillService': 'Name, Faehigkeit oder Service',
  'professionals.cityOrCountry': 'Stadt oder Land',
  'professionals.filtersButton': 'Filter',
  'professionals.categoryLabel': 'Kategorie',
  'professionals.allCategoriesSimple': 'Alle Kategorien',
  'professionals.sortLabel': 'Sortierung',
  'professionals.minRatingLabel': 'Mindestbewertung',
  'professionals.anyRatingSimple': 'Beliebige Bewertung',
  'professionals.sortRating': 'Hoechste Bewertung',
  'professionals.sortReviews': 'Meiste Bewertungen',
  'professionals.sortNewest': 'Neueste Profile',
  'professionals.clearFiltersSimple': 'Filter zuruecksetzen',
  'professionals.countSuffix': 'Fachleute gefunden',
  'professionals.loadingSimple': 'Fachleute werden geladen...',
  'professionals.postJob': 'Anfrage veroeffentlichen',
  'professionals.emptyTitle': 'Keine Fachleute passen zu diesen Filtern',
  'professionals.emptyText':
    'Versuchen Sie einen anderen Standort, entfernen Sie den Kategorienfilter oder senken Sie die Mindestbewertung.',

  // Рекламні блоки.
  'ads.adSpace': 'Werbeflaeche',
  'ads.advertiseHere': 'Werben Sie hier fuer Ihr Unternehmen',
  'ads.bannerAd': 'Bannerwerbung',
  'ads.premiumPlacement': 'Premium-Werbeplatzierung',
  'ads.contactRates': 'Kontaktieren Sie uns fuer Preise',
  'ads.stickyAdBlock': 'Fixierter Werbeblock',
  'ads.close': 'Werbung schliessen',

  // Загальні системні тексти.
  'common.loading': 'Wird geladen...',
  'common.error': 'Fehler',
  'common.success': 'Erfolg',

  // Радіус видимості оголошення.
  'visibility.city': 'Stadt',
  'visibility.district': 'Bezirk',
  'visibility.region': 'Region',
  'visibility.country': 'Land',
  'visibility.state': 'Bundesland',
  'visibility.land': 'Bundesland (DE)',
  'visibility.global': 'Alle Nutzer',

  // Сторінки-заглушки та службові маршрути.
  'route.professionalProfileEyebrow': 'Fachkraftprofil',
  'route.professionalProfileTitle':
    'Die Profilseite der Fachkraft wird vorbereitet',
  'route.professionalProfileDescription':
    'Hier koennen Kunden Profil, Bewertung, Rezensionen und abgeschlossene Arbeiten einsehen.',
  'route.jobRequestEyebrow': 'Arbeitsanfrage',
  'route.jobRequestTitle': 'Details der Arbeitsanfrage werden vorbereitet',
  'route.jobRequestDescription':
    'Diese Seite zeigt die vollstaendige Anfrage, Anhaenge, Budget und direkte Kontaktoptionen fuer Fachkraefte.',
  'route.messagesEyebrow': 'Nachrichten',
  'route.messagesTitle': 'Direktnachrichten erscheinen hier',
  'route.messagesDescription':
    'Kunden und Fachleute koennen hier in einem Gespraech pro Auftrag direkt kommunizieren.',
  'route.notFoundEyebrow': 'Seite nicht gefunden',
  'route.notFoundTitle': 'Diese Seite existiert noch nicht',
  'route.notFoundDescription':
    'Die Route ist fuer spaeteres Wachstum reserviert, aber es gibt hier noch keinen fertigen Bildschirm.',

  // Обране.
  'favorites.title': 'Favoriten',
  'favorites.description':
    'Speichern Sie Arbeitsanfragen und Fachleute, zu denen Sie spaeter zurueckkehren moechten.',
  'favorites.loginTitle': 'Melden Sie sich an, um Favoriten zu speichern',
  'favorites.loginText':
    'Gespeicherte Arbeitsanfragen und Fachleute sind nur in Ihrem Konto verfuegbar.',
  'favorites.loginButton': 'Zur Anmeldung',
  'favorites.listingsTab': 'Arbeitsanfragen',
  'favorites.professionalsTab': 'Fachleute',
  'favorites.loading': 'Favoriten werden geladen...',
  'favorites.emptyListingsTitle':
    'Noch keine gespeicherten Arbeitsanfragen',
  'favorites.emptyListingsText':
    'Verwenden Sie die Favoritenfunktion bei Anzeigen, damit sie spaeter schnell verfuegbar sind.',
  'favorites.emptyListingsButton': 'Arbeitsanfragen durchsuchen',
  'favorites.emptyProfessionalsTitle':
    'Noch keine gespeicherten Fachleute',
  'favorites.emptyProfessionalsText':
    'Speichern Sie Fachleute, die Sie vergleichen, kontaktieren oder spaeter erneut ansehen moechten.',
  'favorites.emptyProfessionalsButton': 'Fachleute durchsuchen',

  // Статистика у футері.
  'footerStats.title': 'Plattformaktivitaet',
  'footerStats.subtitle':
    'Live-Indikatoren aus der Nutzung von Dimarket und der Nachfrage nach Baudienstleistungen.',
  'footerStats.visits': 'Besuche',
  'footerStats.listings': 'Erstellte Anfragen',
  'footerStats.successful': 'Abgeschlossene Anfragen',
  'footerStats.professionals': 'Fachleute',
  'footerStats.countries': 'Bewertete Laender',
  'footerStats.rankingTitle': 'Laenderranking',
  'footerStats.rankingSubtitle':
    'Die Bewertung kombiniert Fachleute, Anfragen und Aktivitaet in den Laendern.',
  'footerStats.updatedPrefix': 'Aktualisiert:',
  'footerStats.loading': 'Statistiken werden geladen...',
  'footerStats.empty': 'Noch nicht genug Daten fuer das Laenderranking.',
  'footerStats.score': 'Punktzahl',
  'footerStats.prosShort': 'Profis',
  'footerStats.jobsShort': 'Jobs',
  'footerStats.repliesShort': 'Antworten',

  // Сторінка реклами.
  'advertising.eyebrow': 'Werbung',
  'advertising.title': 'Werbung haelt Dimarket fuer Nutzer kostenlos',
  'advertising.description':
    'Dimarket verdient ausschliesslich durch Werbung. Marken koennen relevante, baubezogene Kampagnen platzieren, waehrend Kunden und Fachleute die Plattform kostenlos nutzen.',
  'advertising.placementsTitle': 'Wo Werbung erscheinen kann',
  'advertising.placements.homeTitle': 'Startseite',
  'advertising.placements.homeText':
    'Warme Werbebloecke neben Suche, beliebten Kategorien und frischen Anfragen.',
  'advertising.placements.listingsTitle': 'Anfragen-Feed',
  'advertising.placements.listingsText':
    'Eingebettete Platzierungen zwischen Arbeitsanfragen, waehrend Fachleute aktiv nach neuer Arbeit suchen.',
  'advertising.placements.sidebarTitle': 'Seitenleiste und Footer',
  'advertising.placements.sidebarText':
    'Dauerhafte Sichtbarkeit fuer Werkzeuge, Materialien, Logistik und lokale Schauräume.',
  'advertising.audienceTitle': 'Ideal fuer Werbetreibende',
  'advertising.audienceText':
    'Baumaterialien, Geraetemiete, Logistik, Bauwerkzeuge, Heimwerkermaerkte, lokale Handwerksdienste und Renovierungsschauraeume.',
  'advertising.principleTitle': 'Plattformprinzip',
  'advertising.principleText':
    'Kunden zahlen nicht fuer das Veroeffentlichen von Anfragen. Fachleute zahlen nicht fuer Kontaktchancen. Werbung ist die einzige Monetarisierungsebene.',
  'advertising.primaryButton': 'Arbeitsanfragen durchsuchen',
  'advertising.secondaryButton': 'Zurueck zur Startseite',
  'ads.badge': 'Anzeige',
  'ads.openLink': 'Oeffnen',
  'ads.geo.global': 'Weltweit',
  'ads.geo.countryFallback': 'Land nicht angegeben',
  'ads.geo.regionFallback': 'Region',
  'ads.geo.cityFallback': 'Stadt',
  'ads.geo.localFallback': 'Lokale Werbung',
  'header.openMenu': 'Menue oeffnen',
  'header.closeMenu': 'Menue schliessen',
  'header.mobileNavigation': 'Mobile Navigation',
  'common.required': '*',
  'common.comingSoon': 'Kommt bald',
  'messages.description':
    'Der interne Chat ist noch in Arbeit. Bis er startet, nutze die Telefonnummer oder Email, die der Autor in der Anzeige hinterlassen hat.',
  'messages.howToContactTitle': 'So kontaktierst du jetzt schon',
  'messages.howToContactText':
    'Oeffne die konkrete Anzeige und nutze die Telefonnummer oder die Email fuer den direkten Kontakt.',
  'listingDetail.notFound':
    'Die Anzeige wurde nicht gefunden oder aus der Veroeffentlichung entfernt.',
  'listingDetail.loadError': 'Unbekannter Ladefehler.',
  'listingDetail.unavailable': 'Die Anzeige ist nicht verfuegbar.',
  'listingDetail.backToListings': 'Zurueck zu den Anzeigen',
  'listingDetail.back': 'Zurueck zur Liste',
  'listingDetail.contacts': 'Kontakte',
  'listingDetail.expired': 'Abgelaufen',
  'professionalDetail.notFound': 'Profil nicht gefunden.',
  'professionalDetail.notProfessional':
    'Dieses Profil ist nicht als Fachkraft markiert.',
  'professionalDetail.loadError': 'Unbekannter Ladefehler.',
  'professionalDetail.loading': 'Profil wird geladen...',
  'professionalDetail.unavailable': 'Profil nicht verfuegbar.',
  'professionalDetail.backToProfessionals':
    'Zurueck zu den Fachkraeften',
  'professionalDetail.back': 'Zurueck zu den Fachkraeften',
  'professionalDetail.website': 'Webseite',
  'professionalDetail.browseListings': 'Anzeigen durchsuchen',
  'dashboard.error.loadOwner':
    'Das Eigentuemer-Dashboard konnte nicht geladen werden.',
  'dashboard.error.approveCampaign':
    'Die Werbekampagne konnte nicht bestaetigt werden.',
  'dashboard.error.rejectCampaign':
    'Die Werbekampagne konnte nicht abgelehnt werden.',
  'dashboard.error.deleteCampaign':
    'Die Werbekampagne konnte nicht geloescht werden.',
  'dashboard.error.feedbackRead':
    'Die Nachricht konnte nicht als gelesen markiert werden.',
  'dashboard.error.feedbackResolved':
    'Die Nachricht konnte nicht als geloest markiert werden.',
  'dashboard.error.deleteFeedback':
    'Die Nachricht konnte nicht geloescht werden.',
  'dashboard.error.deleteListing':
    'Die Anzeige konnte nicht geloescht werden.',
  'dashboard.error.deleteInternal':
    'Die interne Nachricht konnte nicht geloescht werden.',
  'dashboard.notice.approveCampaign': 'Werbekampagne bestaetigt.',
  'dashboard.notice.rejectCampaign': 'Werbekampagne abgelehnt.',
  'dashboard.notice.deleteCampaign': 'Werbekampagne geloescht.',
  'dashboard.notice.feedbackRead': 'Nachricht als gelesen markiert.',
  'dashboard.notice.feedbackResolved': 'Nachricht als geloest markiert.',
  'dashboard.notice.deleteFeedback': 'Nachricht geloescht.',
  'dashboard.notice.deleteListing':
    'Anzeige als geloescht markiert.',
  'dashboard.notice.deleteInternal': 'Interne Nachricht geloescht.',
  'dashboard.confirm.deleteCampaign':
    'Moechtest du diese Werbekampagne wirklich loeschen?',
  'dashboard.confirm.deleteFeedback':
    'Moechtest du diese Nachricht wirklich loeschen?',
  'dashboard.confirm.deleteListing':
    'Moechtest du diese Anzeige wirklich loeschen?',
  'dashboard.confirm.deleteInternal':
    'Moechtest du diese interne Nachricht wirklich loeschen?',
  'dashboard.loading': 'Eigentuemer-Dashboard wird geladen...',
  'dashboard.accessDeniedTitle': 'Zugriff verweigert',
  'dashboard.accessDeniedText':
    'Dieser Bereich ist nur fuer den Plattform-Eigentuemer verfuegbar. Gehe zur Startseite zurueck oder oeffne dein Profil.',
  'dashboard.homeButton': 'Startseite',
  'dashboard.profileButton': 'Mein Profil oeffnen',
  'dashboard.stats.trafficTitle': 'Seitenverkehr',
  'dashboard.stats.trafficText': 'Gesamte Plattformbesuche.',
  'dashboard.stats.listingsTitle': 'Anzeigen',
  'dashboard.stats.activeNow': 'Jetzt aktiv',
  'dashboard.stats.adsTitle': 'Werbung',
  'dashboard.stats.pendingNow': 'Jetzt offen',
  'dashboard.stats.messagesTitle': 'Nachrichten',
  'dashboard.stats.feedbackNow': 'Kontakt',
  'dashboard.eyebrow': 'Eigentuemer-Dashboard',
  'dashboard.welcome': 'Willkommen',
  'dashboard.ownerFallbackName': 'Plattform-Eigentuemer',
  'dashboard.description':
    'Nur du siehst diesen Bereich: Seitenzahlen, Anzeigen, Werbung und eingehende Nachrichten.',
  'dashboard.recentListingsTitle': 'Neueste Anzeigen',
  'dashboard.recentListingsText':
    'Der neueste Inhalt der Plattform fuer schnelle Pruefung und Entfernung.',
  'dashboard.openAll': 'Alle oeffnen',
  'dashboard.created': 'Erstellt',
  'dashboard.deleted': 'Geloescht',
  'dashboard.delete': 'Loeschen',
  'dashboard.recentListingsEmpty':
    'Es gibt noch keine Anzeigen zur Anzeige.',
  'dashboard.controlTitle': 'Bereits unter Kontrolle',
  'dashboard.controlFeatureOne':
    'Nur das Eigentuemer-Profil kann dieses Dashboard sehen.',
  'dashboard.controlFeatureTwo':
    'Du kannst den gesamten Seitenverkehr und die Anzahl der Anzeigen sehen.',
  'dashboard.controlFeatureThree':
    'Du kannst Anzeigen entfernen, indem du sie auf den Status deleted setzt.',
  'dashboard.controlFeatureFour':
    'Du kannst Werbekampagnen und Moderationsanfragen pruefen.',
  'dashboard.controlFeatureFive':
    'Du kannst Kontaktanfragen und interne Plattformnachrichten lesen.',
  'dashboard.adsTitle': 'Werbeverwaltung',
  'dashboard.adsText':
    'Hier kannst du Werbekampagnen bestaetigen, ablehnen oder loeschen.',
  'dashboard.pendingCount': 'Zur Pruefung',
  'dashboard.placement': 'Platzierung',
  'dashboard.geography': 'Geografie',
  'dashboard.period': 'Zeitraum',
  'dashboard.approve': 'Bestaetigen',
  'dashboard.reject': 'Ablehnen',
  'dashboard.adsEmpty':
    'Es gibt noch keine Werbekampagnen zur Moderation.',
  'dashboard.feedbackTitle': 'Kontakt',
  'dashboard.feedbackText':
    'Hier erscheinen alle Nachrichten, die Nutzer ueber das Kontaktformular senden.',
  'dashboard.total': 'Gesamt',
  'dashboard.unread': 'Ungelesen',
  'dashboard.phone': 'Telefon',
  'dashboard.received': 'Empfangen',
  'dashboard.markRead': 'Als gelesen markieren',
  'dashboard.resolved': 'Geloest',
  'dashboard.feedbackEmpty':
    'Es gibt noch keine Nachrichten aus dem Kontaktformular.',
  'dashboard.messagesTitle': 'Interne Nachrichten',
  'dashboard.messagesText':
    'Dieser Bereich zeigt Gesprache, die innerhalb der Plattform stattfinden.',
  'dashboard.emailMissing': 'Email nicht angegeben',
  'dashboard.conversation': 'Konversation',
  'dashboard.recipient': 'Empfaenger',
  'dashboard.listing': 'Anzeige',
  'dashboard.none': 'Keine',
  'dashboard.toListing': 'Zur Anzeige',
  'dashboard.internalEmpty':
    'Es gibt noch keine internen Nachrichten.',
  'dashboard.noLimit': 'Ohne Limit',
  'dashboard.fromPrefix': 'ab',
  'dashboard.untilPrefix': 'bis',
  'dashboard.messageSenderUnknown': 'Unbekannter Absender',
  'dashboard.feedbackStatus.new': 'Neu',
  'dashboard.feedbackStatus.inProgress': 'In Bearbeitung',
  'dashboard.feedbackStatus.resolved': 'Geloest',
  'dashboard.feedbackStatus.archived': 'Archiviert',
  'dashboard.listingStatus.active': 'Aktiv',
  'dashboard.listingStatus.expired': 'Abgelaufen',
  'dashboard.listingStatus.sold': 'Geschlossen',
  'dashboard.listingStatus.deleted': 'Geloescht',
  'advertising.selfServePrimaryButton': 'Kampagne erstellen',
  'advertising.selfServeLoginCta':
    'Anmelden, um Werbung hinzuzufuegen',
  'advertising.selfServeFormTitle': 'Neue Werbekampagne',
  'advertising.selfServeFormDescription':
    'Speichere die Kampagne zuerst, dann pruefen wir sie vor der Veroeffentlichung.',
  'advertising.selfServeLoginPrompt':
    'Melde dich mit einem Werbekonto an, um Kampagnen selbst zu erstellen.',
  'advertising.selfServePlacement.footerTitle': 'Footer-Bereich',
  'advertising.selfServePlacement.footerText':
    'Zusaetzliche Sichtbarkeit bei laengeren Browsing-Sitzungen.',
  'advertising.selfServePlacement.mobileTitle': 'Mobiler Sticky-Block',
  'advertising.selfServePlacement.mobileText':
    'Ein gut sichtbares Format fuer Nutzer auf dem Smartphone.',
  'advertising.selfServeCampaignTitleLabel': 'Kampagnenname',
  'advertising.selfServeCampaignTitlePlaceholder':
    'Zum Beispiel: Renovierungsservice in Warschau',
  'advertising.selfServeCampaignDescriptionLabel': 'Kurzbeschreibung',
  'advertising.selfServeCampaignDescriptionPlaceholder':
    'Beschreibe kurz, was diese Kampagne bewirbt.',
  'advertising.selfServeImageUrlLabel': 'Bannerbild-URL',
  'advertising.selfServeLinkUrlLabel': 'Ziellink',
  'advertising.selfServePlacementLabel': 'Platzierung',
  'advertising.selfServeGeoScopeLabel': 'Zielregion',
  'advertising.selfServeGeo.cityTitle': 'Nur Stadt',
  'advertising.selfServeGeo.cityText':
    'Zeige die Kampagne in einer ausgewaehlten Stadt.',
  'advertising.selfServeGeo.regionTitle': 'Region / Bundesland',
  'advertising.selfServeGeo.regionText':
    'Zeige die Kampagne in einer ausgewaehlten Region.',
  'advertising.selfServeGeo.countryTitle': 'Ein Land',
  'advertising.selfServeGeo.countryText':
    'Zeige die Kampagne nur im ausgewaehlten Land.',
  'advertising.selfServeGeo.globalTitle': 'Weltweit',
  'advertising.selfServeGeo.globalText':
    'Zeige die Kampagne ohne geografische Einschraenkungen.',
  'advertising.selfServeCountryLabel': 'Land',
  'advertising.selfServeRegionLabel': 'Region / Bundesland',
  'advertising.selfServeCityLabel': 'Stadt',
  'advertising.selfServeCountryPlaceholder':
    'Zum Beispiel: Poland',
  'advertising.selfServeRegionPlaceholder':
    'Zum Beispiel: Mazowieckie',
  'advertising.selfServeCityPlaceholder':
    'Zum Beispiel: Warsaw',
  'advertising.selfServePeriodLabel': 'Kampagnenzeitraum',
  'advertising.selfServeStartLabel': 'Startdatum',
  'advertising.selfServeEndLabel': 'Enddatum',
  'advertising.selfServeSubmit': 'Werbekampagne erstellen',
  'advertising.selfServeSubmitting': 'Wird erstellt...',
  'advertising.selfServeCampaignsTitle': 'Meine Kampagnen',
  'advertising.selfServeCampaignsSignIn':
    'Melde dich an, um deine eigenen Werbekampagnen zu sehen.',
  'advertising.selfServeCampaignsLoading':
    'Kampagnen werden geladen...',
  'advertising.selfServeCampaignsEmpty':
    'Du hast noch keine Werbekampagnen erstellt.',
  'advertising.selfServeGeographyLabel': 'Geografie',
  'advertising.selfServeCreatedAtLabel': 'Erstellt',
  'advertising.selfServeErrorLogin':
    'Um Werbung hinzuzufuegen, melde dich zuerst bei deinem Konto an.',
  'advertising.selfServeErrorCountry':
    'Bitte gib das Land fuer diese Kampagne an.',
  'advertising.selfServeErrorRegion':
    'Bitte gib Land und Region fuer diese Kampagne an.',
  'advertising.selfServeErrorCity':
    'Bitte gib Land und Stadt fuer diese Kampagne an.',
  'advertising.selfServeErrorDate':
    'Das Enddatum darf nicht vor dem Startdatum liegen.',
  'advertising.selfServeErrorCreate':
    'Die Werbekampagne konnte nicht erstellt werden. Bitte pruefe die Felder und versuche es erneut.',
  'advertising.selfServeSuccess':
    'Die Werbekampagne wurde erstellt und wartet auf die Pruefung.',
  'advertising.selfServeStatus.draft': 'Entwurf',
  'advertising.selfServeStatus.pending_review': 'In Pruefung',
  'advertising.selfServeStatus.active': 'Aktiv',
  'advertising.selfServeStatus.paused': 'Pausiert',
  'advertising.selfServeStatus.rejected': 'Abgelehnt',
  'advertising.selfServeStatus.expired': 'Beendet',
  'advertising.selfServeStatus.deleted': 'Geloescht',
  'settings.description':
    'Verwalte dein oeffentliches Profil, deine Kontoeinstellungen und die Sicherheit.',
  'settings.profileInfoTitle': 'Profilinformationen',
  'settings.bioLabel': 'Bio / Beschreibung',
  'settings.bioPlaceholder':
    'Erzaehle Kunden etwas ueber deine Erfahrung und deine Leistungen...',
  'settings.websiteLabel': 'Webseite',
  'settings.profilePhotoLabel': 'Profilfoto-URL',
  'settings.profilePhotoAlt': 'Profilvorschau',
  'settings.portfolioTitle': 'Portfolio-Bilder',
  'settings.removePortfolioImage': 'Portfolio-Bild entfernen',
  'settings.addPortfolioImage': 'Portfolio-Bild hinzufuegen',
  'settings.preferencesTitle': 'Sprache und Waehrung',
  'settings.notificationsTitle': 'Benachrichtigungen aktivieren',
  'settings.notificationsText':
    'Erhalte Updates zu Nachrichten und neuen Kontakten.',
  'settings.saveChanges': 'Aenderungen speichern',
  'settings.saving': 'Speichern...',
  'settings.changePasswordTitle': 'Passwort aendern',
  'settings.newPasswordLabel': 'Neues Passwort',
  'settings.confirmNewPasswordLabel': 'Neues Passwort bestaetigen',
  'settings.changePasswordButton': 'Passwort aendern',
  'settings.dangerTitle': 'Gefahrenbereich',
  'settings.dangerText':
    'Wenn du dein Konto loeschst, gibt es keinen Weg zurueck. Bitte sei dir ganz sicher.',
  'settings.deleteAccountButton': 'Konto loeschen',
  'settings.error.loadProfile':
    'Die Profileinstellungen konnten nicht geladen werden.',
  'settings.error.noSession':
    'Die Benutzersitzung ist nicht verfuegbar.',
  'settings.error.saveProfile':
    'Das Profil konnte nicht aktualisiert werden.',
  'settings.error.passwordMismatch':
    'Die Passwoerter stimmen nicht ueberein.',
  'settings.error.changePassword':
    'Das Passwort konnte nicht geaendert werden.',
  'settings.error.deleteAccount':
    'Das Konto konnte nicht geloescht werden.',
  'settings.success.profileSaved': 'Profil erfolgreich aktualisiert!',
  'settings.success.passwordChanged': 'Passwort erfolgreich geaendert!',
  'settings.confirm.deleteAccount':
    'Moechtest du dein Konto wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.',

  // Нові ключі — MyListings та Profile
  'myListings.title': 'Meine Anzeigen',
  'myListings.subtitle': 'Verwalten Sie Ihre Anzeigen',
  'myListings.createNew': 'Neue Anzeige',
  'myListings.noListings': 'Sie haben noch keine Anzeigen',
  'myListings.loading': 'Anzeigen werden geladen...',
  'myListings.status.active': 'Aktiv',
  'myListings.status.expired': 'Abgelaufen',
  'myListings.status.sold': 'Verkauft',
  'myListings.status.deleted': 'Gelöscht',
  'profile.editProfile': 'Profil bearbeiten',
  'profile.portfolio': 'Portfolio',
  'profile.reviews': 'Bewertungen',
  'profile.noPortfolio': 'Noch kein Portfolio',
  'profile.noReviews': 'Noch keine Bewertungen',
  'profile.memberSince': 'Mitglied seit',
  'profile.activeAds': 'aktive Anzeigen',
  'profile.viewAllListings': 'Alle meine Anzeigen',
  'ads.label': 'Werbung',
  'ads.visit': 'Besuchen',

  // Advertising self-service переклади
  'advertising.selfService.eyebrow': 'Selbstbuchung von Werbung',
  'advertising.selfService.title': 'Fügen Sie Ihre Anzeige hinzu und wählen Sie genaues geografisches Targeting',
  'advertising.selfService.createBtn': 'Werbekampagne erstellen',
  'advertising.form.title': 'Neue Werbekampagne',
  'advertising.form.mediaLabel': 'Mediendatei des Banners',
  'advertising.form.nameLabel': 'Kampagnenname',
  'advertising.form.linkLabel': 'Link beim Klick',
  'advertising.geo.label': 'Geografisches Targeting',
  'advertising.geo.global': 'Weltweit',
  'advertising.geo.countries': 'Länder',
  'advertising.geo.regions': 'Regionen',
  'advertising.geo.cities': 'Städte',
  'advertising.price.title': 'Kostenberechnung',
  'advertising.price.total': 'Gesamtbetrag',
  'advertising.submit': 'Zur Zahlung gehen',
  'advertising.preview.title': 'Vorschau',
  'advertising.myCampaigns.title': 'Meine Werbekampagnen',
  'advertising.myCampaigns.empty': 'Sie haben noch keine Werbekampagne erstellt.',
  'advertising.success': 'Kampagne erstellt. Nächster Schritt — Stripe verbinden.',
  'advertising.error.noMedia': 'Laden Sie eine Mediendatei für das Banner hoch.',
  'advertising.status.draft': 'Entwurf',
  'advertising.status.pending_payment': 'Zahlung ausstehend',
  'advertising.status.active': 'Aktiv',
  'advertising.status.rejected': 'Abgelehnt',
  'advertising.status.expired': 'Abgelaufen',
  'advertising.selfService.loginBtn': 'Anmelden um Werbung hinzuzufügen',
  'advertising.selfService.backBtn': 'Zurück zur Startseite',
  'advertising.howTitle': 'Wie es funktioniert',
  'advertising.form.desc': 'Kampagne wird mit Status ausstehende Zahlung erstellt.',
  'advertising.submitting': 'Wird erstellt...',
  'advertising.placementsSection.title': 'Wo die Werbung anzeigen',
  'advertising.geo.noneAvailable': 'Keine Optionen verfügbar',

  // Advertising — повні переклади
  'advertising.dates.endLabel': 'Enddatum',
  'advertising.dates.error': 'Enddatum kann nicht vor Startdatum liegen.',
  'advertising.dates.label': 'Kampagnenzeitraum',
  'advertising.dates.optional': 'optional',
  'advertising.dates.startLabel': 'Startdatum',
  'advertising.error.noAuth': 'Um Werbung hinzuzufügen, melden Sie sich zuerst an.',
  'advertising.error.noGeo': 'Wählen Sie die geografische Ausrichtung der Werbung.',
  'advertising.error.noLink': 'Geben Sie einen Link beim Klick auf die Anzeige an.',
  'advertising.error.save': 'Kampagne konnte nicht erstellt werden. Felder prüfen und erneut versuchen.',
  'advertising.feature.geo': 'Genaue Geografie',
  'advertising.feature.geoText': 'Weltweit, Länder, Regionen oder bestimmte Städte.',
  'advertising.feature.placements': 'Mehrere Positionen',
  'advertising.feature.placementsText': 'Wählen Sie eine oder mehrere Seiten wo Ihr Banner angezeigt wird.',
  'advertising.feature.price': 'Automatischer Preis',
  'advertising.feature.priceText': 'Der Betrag wird nach Städten, Positionen und Wochen berechnet.',
  'advertising.form.descLabel': 'Kurze Beschreibung',
  'advertising.form.descPlaceholder': 'Beschreiben Sie kurz was Sie bewerben.',
  'advertising.form.linkPlaceholder': 'https://ihre-seite.de',
  'advertising.form.loginBtn': 'In Konto einloggen',
  'advertising.form.loginRequired': 'Um selbst Werbung hinzuzufügen, müssen Sie sich anmelden.',
  'advertising.form.mediaDrop': 'Datei ziehen oder zum Auswählen klicken',
  'advertising.form.mediaGif': 'GIF Animation',
  'advertising.form.mediaImage': 'JPG, PNG, WebP',
  'advertising.form.mediaMax': 'bis 20 MB',
  'advertising.form.mediaReady': 'Fertig',
  'advertising.form.mediaRemove': 'Entfernen',
  'advertising.form.mediaVideo': 'MP4, WebM — ohne Ton',
  'advertising.form.namePlaceholder': 'Z.B.: Werbung für Reparaturdienst in Warschau',
  'advertising.form.uploading': 'Hochladen...',
  'advertising.geo.citiesCount': 'Städte',
  'advertising.geo.noCities': 'Keine Städte ausgewählt',
  'advertising.geo.noCountries': 'Keine Länder ausgewählt',
  'advertising.geo.noRegions': 'Keine Regionen ausgewählt',
  'advertising.geo.selectCities': 'Städte',
  'advertising.geo.selectCountries': 'Länder',
  'advertising.geo.selectRegions': 'Regionen / Gebiete',
  'advertising.geo.selected': 'ausgewählt',
  'advertising.geo.worldwide': 'Weltweit',
  'advertising.myCampaigns.amount': 'Betrag',
  'advertising.myCampaigns.created': 'Erstellt',
  'advertising.myCampaigns.geo': 'Geografie',
  'advertising.myCampaigns.loading': 'Kampagnen werden geladen...',
  'advertising.myCampaigns.loginMsg': 'Melden Sie sich an um Ihre eigenen Werbekampagnen zu sehen.',
  'advertising.next.1': 'Stripe Checkout mit dynamischem Betrag verbinden.',
  'advertising.next.2': 'Nach erfolgreicher Zahlung Werbung automatisch aktivieren.',
  'advertising.next.3': 'Aufrufs- und Klickstatistiken hinzufügen.',
  'advertising.next.4': 'Später temporäre GEO_DATA durch Datenbanktabellen ersetzen.',
  'advertising.next.title': 'Nächste Stufe',
  'advertising.placement.footer.text': 'Breites Format für lange Browsing-Sitzungen.',
  'advertising.placement.footer.title': 'Fußzeile',
  'advertising.placement.home.text': 'Maximale Sichtbarkeit für neue Plattformbesucher.',
  'advertising.placement.home.title': 'Startseite',
  'advertising.placement.listings.text': 'Anzeige für Zielgruppe die bereits nach Waren oder Dienstleistungen sucht.',
  'advertising.placement.listings.title': 'Anzeigenseite',
  'advertising.placement.mobile.text': 'Gut sichtbares Format für Smartphones.',
  'advertising.placement.mobile.title': 'Mobiler Sticky-Block',
  'advertising.placement.sidebar.text': 'Ständige Präsenz auf den internen Seiten der Website.',
  'advertising.placement.sidebar.title': 'Seitlicher Banner',
  'advertising.placements.deselectAll': 'Alle abwählen',
  'advertising.placements.selectAll': 'Alle auswählen',
  'advertising.placementsSection.desc': 'Sie können eine oder mehrere Werbepositionen gleichzeitig auswählen.',
  'advertising.preview.adLabel': 'Werbung',
  'advertising.preview.citiesCount': 'Städte',
  'advertising.preview.cost': 'Kosten',
  'advertising.preview.desc': 'So sieht der Werbeblock auf der Website aus. Das gesamte Banner ist ein Link-Button.',
  'advertising.preview.geoLabel': 'Geografie',
  'advertising.preview.goBtn': 'Besuchen →',
  'advertising.preview.link': 'Link',
  'advertising.preview.media': 'Medien',
  'advertising.preview.mediaGif': 'GIF Animation',
  'advertising.preview.mediaImage': 'Bild',
  'advertising.preview.mediaVideo': 'Video ohne Ton',
  'advertising.preview.placeholder': 'Banner erscheint hier',
  'advertising.preview.positions': 'Positionen',
  'advertising.price.cities': 'Städte',
  'advertising.price.duration': 'Zeitraum',
  'advertising.price.durationLabel': 'Dauer',
  'advertising.price.geo': 'Geografie',
  'advertising.price.perCity': '€ / Stadt / Position / Woche',
  'advertising.price.positions': 'Werbepositionen',
  'advertising.price.week1': '1 Woche',
  'advertising.price.week12': '12 Wochen',
  'advertising.price.week2': '2 Wochen',
  'advertising.price.week4': '4 Wochen',
  'advertising.selfService.description': 'Banner hochladen, Link angeben, Seiten, Geografie und Anzeigezeitraum wählen.',
  'advertising.status.1': 'Der Werbetreibende erstellt selbst eine Kampagne in seinem Konto.',
  'advertising.status.2': 'Der Preis wird automatisch nach Städten, Positionen und Wochen berechnet.',
  'advertising.status.3': 'Kampagne wird mit dem Status ausstehende Zahlung gespeichert.',
  'advertising.status.4': 'Stripe-Zahlung wird in der nächsten Stufe verbunden.',
  'advertising.status.deleted': 'Gelöscht',
  'advertising.status.paused': 'Pausiert',
  'advertising.status.pending_review': 'In Überprüfung',
  'advertising.status.title': 'Wie es jetzt funktioniert',
  'advertising.step1.text': 'Bild, GIF oder Video ohne Ton ziehen oder auswählen.',
  'advertising.step1.title': 'Banner hochladen',
  'advertising.step2.text': 'Wählen Sie weltweit, Länder, Regionen oder Städte.',
  'advertising.step2.title': 'Geografie auswählen',
  'advertising.step3.text': 'Kampagne wird mit dem Status ausstehende Zahlung erstellt.',
  'advertising.step3.title': 'Zur Zahlung',
    'home.howItWorksTitle': 'So funktioniert es',
  'home.howItWorksText': 'Drei einfache Schritte, um einen Handwerker zu finden oder Aufträge zu bekommen',
  'home.howStep1Title': 'Konto erstellen',
  'home.howStep1Text': 'Wählen Sie Ihre Rolle: Kunde, Fachkraft oder Unternehmen. Füllen Sie Ihr Profil mit Beschreibung und Arbeitsfotos aus.',
  'home.howStep2Title': 'Finden oder veröffentlichen',
  'home.howStep2Text': 'Kunden veröffentlichen Arbeitsanfragen. Fachkräfte finden Aufträge und antworten direkt.',
  'home.howStep3Title': 'Direkt vereinbaren',
  'home.howStep3Text': 'Kommunizieren Sie über den integrierten Chat ohne Zwischenhändler. Hinterlassen Sie nach der Arbeit Bewertungen.',
  'home.statsProfessionals': 'Fachkräfte',
  'home.statsListings': 'aktive Anzeigen',
  'home.statsLanguages': 'Oberflächensprachen',
  'professional.featured': 'Empfohlen',
  'professional.verified': 'Verifiziert',
}