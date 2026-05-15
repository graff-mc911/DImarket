import type { TranslationKey } from './en'

export const srTranslations: Partial<Record<TranslationKey, string>> = {
  // Header
  'header.browse': 'Pregledaj',
  'header.findProfessionals': 'Pronadji majstore',
  'header.professionalLogin': 'Prijava za majstore',
  'header.createAd': 'Napravi oglas',
  'header.myProfile': 'Moj profil',
  'header.dashboard': 'Kontrolna tabla',
  'header.myListings': 'Moji oglasi',
  'header.signOut': 'Odjava',
  'header.account': 'Nalog',
  'header.language': 'Jezik',
  'header.currency': 'Valuta',
  'header.jobRequests': 'Zahtevi za posao',
  'header.favorites': 'Sacuvano',
  'header.messages': 'Poruke',
  'header.postJob': 'Objavi zahtev',
  'header.brandTagline': 'Besplatna gradjevinska platforma',

  // Footer
  'footer.tagline':
    'Povezi se sa pouzdanim gradjevinskim profesionalcima i pronadji kvalitetne materijale.',
  'footer.forClients': 'Za klijente',
  'footer.browseListings': 'Pregledaj oglase',
  'footer.postRequest': 'Objavi zahtev',
  'footer.forProfessionals': 'Za majstore',
  'footer.signIn': 'Prijava',
  'footer.register': 'Registracija',
  'footer.howItWorks': 'Kako funkcionise',
  'footer.allRightsReserved': 'Sva prava zadrzana.',
  'footer.brandText':
    'Dimarket je besplatna globalna platforma za gradjevinske usluge gde klijenti objavljuju poslove, a majstori odgovaraju direktno.',
  'footer.monetization':
    'Bez provizija za korisnike. Bez pretplata. Platforma zaradjuje iskljucivo od oglasavanja.',
  'footer.platformTitleSimple': 'Platforma',
  'footer.accountTitleSimple': 'Nalog',
  'footer.adsTitle': 'Reklama',
  'footer.adsText':
    'Brendovi gradjevinskog materijala, alata, logistike i lokalnih usluga mogu doci do aktivne potraznje kroz oglase i stranice majstora.',
  'footer.adsButton': 'Stranica za oglasavanje',
  'footer.legalRight':
    'Besplatna platforma za gradjevinske usluge sa monetizacijom samo kroz reklame.',

  // Home old keys
  'home.heroTitle': 'Pronadji proverene majstore',
  'home.heroSubtitle': 'Izgradi svoje snove',
  'home.heroDescription':
    'Marketplace za gradnju, renoviranje i kucne usluge koji povezuje klijente sa proverenim profesionalcima',
  'home.searchPlaceholder': 'Pretrazi usluge, materijale ili majstore...',
  'home.search': 'Pretraga',
  'home.findProfessionals': 'Pronadji majstore',
  'home.postRequest': 'Objavi zahtev',
  'home.browseByCategory': 'Pregled po kategorijama',
  'home.topRatedProfessionals': 'Najbolje ocenjeni majstori',
  'home.topRatedDescription':
    'Povezi se sa proverenim strucnjacima za gradnju i kucne usluge',
  'home.noProfessionals': 'Jos nema registrovanih majstora. Budi prvi!',
  'home.viewAllProfessionals': 'Pogledaj sve majstore',
  'home.recentListings': 'Najnoviji oglasi',
  'home.recentListingsDescription': 'Najnovije prilike i zahtevi',
  'home.noListings': 'Jos nema aktivnih oglasa. Objavi prvi!',
  'home.viewAllListings': 'Pogledaj sve oglase',
  'home.whyChoose': 'Zasto Dimarket?',
  'home.verifiedProfessionals': 'Provereni majstori',
  'home.verifiedDescription':
    'Svi majstori su provereni i imaju ocene i komentare stvarnih klijenata',
  'home.quickEasy': 'Brzo i jednostavno',
  'home.quickEasyDescription':
    'Objavi zahtev za nekoliko minuta bez registracije. Dobij odgovore brzo',
  'home.directCommunication': 'Direktna komunikacija',
  'home.directCommunicationDescription':
    'Povezi se direktno sa majstorima kroz nas ugradjeni sistem poruka',
  'home.areYouProfessional': 'Da li si majstor?',
  'home.joinProfessionals':
    'Pridruzi se hiljadama majstora koji razvijaju svoj posao na Dimarket-u',
  'home.registerAsProfessional': 'Registruj se kao majstor',

  // Home new keys
  'home.globalEyebrow': 'Globalne gradjevinske usluge',
  'home.heroSimpleTitle':
    'Pronadji majstora za popravku, montazu ili gradjevinske radove.',
  'home.heroSimpleDescription':
    'Klijenti objavljuju zahteve za posao, majstori odgovaraju direktno, a Dimarket ostaje besplatan za korisnike.',
  'home.whatNeedsToBeDone': 'Sta treba uraditi?',
  'home.cityOrCountry': 'Grad ili drzava',
  'home.postJob': 'Objavi zahtev',
  'home.popularCategoriesTitle': 'Popularne kategorije',
  'home.popularCategoriesText':
    'Najtrazeniji pravci gradnje i renoviranja na Dimarket-u.',
  'home.browseRequests': 'Pregledaj zahteve za posao',
  'home.freshRequestsTitle': 'Novi zahtevi za posao',
  'home.freshRequestsText':
    'Novi zahtevi klijenata koje majstori mogu odmah da pregledaju i preuzmu.',
  'home.allRequests': 'Svi zahtevi za posao',
  'home.popularProsTitle': 'Popularni majstori',
  'home.popularProsText':
    'Profili sa vidljivim iskustvom, stabilnim ocenama i direktnim kontaktom.',
  'home.allPros': 'Svi majstori',
  'home.adTitle': 'Reklama',
  'home.adText':
    'Promovisi alate, materijale, lokalne usluge ili gradjevinske salone pred publikom sa stvarnom potraznjom.',
  'home.adButton': 'Oglašavaj se na Dimarket-u',
  'home.adCardOne': 'Partneri za materijal',
  'home.adCardTwo': 'Brendovi alata',
  'home.adCardThree': 'Lokalni saloni',
  'home.noJobs': 'Jos nema aktivnih zahteva za posao.',
  'home.noCategories': 'Kategorije ce se uskoro pojaviti ovde.',
  'home.noLocation': 'Lokacija nije navedena',
  'home.budgetLabel': 'Budzet',
  'home.activeLabel': 'Aktivno',
  'home.unknownCategory': 'Gradjevinska usluga',
  'home.noBio': 'Profil gradjevinskog profesionalca je jos u pripremi.',
  'home.sponsoredPlacement':
    'Sponzorisano pozicioniranje za alate, materijale, logistiku ili lokalne gradjevinske partnere.',
  'home.sidebarAdOne': 'Postavi svoj brend pored stvarne gradjevinske potraznje.',
  'home.sidebarAdTwo':
    'Dostigni majstore i klijente dok traze posao i usluge.',
  'home.loading': 'Ucitavanje...',

  // Categories
  'category.construction': 'Gradnja',
  'category.constructionDesc': 'Nova gradnja i gradjevinski projekti',
  'category.renovation': 'Renoviranje',
  'category.renovationDesc': 'Renoviranje i preuredjenje doma',
  'category.electrical': 'Elektrika',
  'category.electricalDesc': 'Elektro radovi i popravke',
  'category.plumbing': 'Vodoinstalacije',
  'category.plumbingDesc': 'Vodoinstalaterske usluge i montaza',
  'category.handyman': 'Majstor',
  'category.handymanDesc': 'Opste majstorske usluge',
  'category.materials': 'Materijali',
  'category.materialsDesc': 'Gradjevinski materijal za prodaju',
  'category.tools': 'Alati',
  'category.toolsDesc': 'Alati i oprema',
  'category.name.construction': 'Gradnja',
  'category.name.renovation': 'Renoviranje',
  'category.name.electrical': 'Elektrika',
  'category.name.plumbing': 'Vodoinstalacije',
  'category.name.handyman': 'Majstor',
  'category.name.materials': 'Materijali',
  'category.name.tools': 'Alati',

  // Listing Card
  'listing.serviceNeeded': 'Trazim uslugu',
  'listing.serviceOffered': 'Nudim uslugu',
  'listing.forSale': 'Na prodaju',
  'listing.wanted': 'Kupujem',
  'listing.contactForPrice': 'Kontaktiraj za cenu',
  'listing.daysLeft': 'dana preostalo',
  'listing.views': 'pregleda',
  'listing.premium': 'PREMIUM',
  'listing.constructionService': 'Gradjevinska usluga',
  'listing.locationNotSpecified': 'Lokacija nije navedena',
  'listing.budget': 'Budzet',

  // Professional Card
  'professional.contact': 'Kontakt',
  'professional.reviews': 'recenzija',
  'professional.new': 'Nov',
  'professional.defaultName': 'Profesionalac',
  'professional.global': 'Globalno',
  'professional.profileInProgress':
    'Profil gradjevinskog profesionalca je jos u pripremi.',

  // Create Ad
  'createAd.title': 'Kreiraj gradjevinski zahtev za posao',
  'createAd.noRegistration': 'Registracija nije potrebna',
  'createAd.eyebrow': 'Besplatan zahtev za posao',
  'createAd.heroTitle': 'Kreiraj gradjevinski zahtev za posao',
  'createAd.heroDescription':
    'Opisi posao, dodaj lokaciju i omoguci majstorima da te direktno kontaktiraju. Bez pretplate i bez troska objave.',
  'createAd.detailsTitle': 'Detalji posla',
  'createAd.detailsText':
    'Napravi zahtev sto preciznijim kako bi majstori razumeli posao i poslali odgovarajucu ponudu.',
  'createAd.locationTitle': 'Lokacija i vidljivost',
  'createAd.locationText':
    'Izaberi gde se posao nalazi i koliko siroko treba da bude vidljiv majstorima.',
  'createAd.contactTitle': 'Podaci za kontakt',
  'createAd.contactText':
    'Potreban je najmanje jedan nacin kontakta kako bi majstori mogli direktno da te kontaktiraju.',
  'createAd.imagesTitle': 'Fotografije (opciono)',
  'createAd.imagesText':
    'Dodaj referentne fotografije, planove ili primere kako bi majstori preciznije procenili posao.',
  'createAd.freeListTitle': 'Sta je ukljuceno',
  'createAd.freeItemOne': 'Besplatno objavljivanje za klijente',
  'createAd.freeItemTwo': 'Direktan kontakt sa majstorima',
  'createAd.freeItemThree': 'Fotografije i budzet po zelji',
  'createAd.freeItemFour': 'Model platforme finansiran kroz reklame',
  'createAd.adType': 'Tip oglasa',
  'createAd.needService': 'Trazim uslugu',
  'createAd.needServiceDesc': 'Trazim pomoc',
  'createAd.offerService': 'Nudim uslugu',
  'createAd.offerServiceDesc': 'Pruzam usluge',
  'createAd.sellItem': 'Prodajem predmet',
  'createAd.sellItemDesc': 'Materijali, alati',
  'createAd.wantItem': 'Kupujem predmet',
  'createAd.wantItemDesc': 'Zelim da kupim',
  'createAd.titleLabel': 'Naslov',
  'createAd.taskPlaceholder': 'Sta treba uraditi?',
  'createAd.titlePlaceholder': 'Npr.: Potrebna popravka gipsa u dnevnoj sobi',
  'createAd.titleHint': 'Primer: Potrebna popravka gipsa u dnevnoj sobi',
  'createAd.descriptionLabel': 'Opis',
  'createAd.descriptionPlaceholder':
    'Napisi sta treba uraditi, koliki je obim posla, zeljeni rok i sve vazne detalje.',
  'createAd.descriptionHint':
    'Napisi sta treba uraditi, koliki je obim posla, zeljeni rok i sve vazne detalje.',
  'createAd.categoryLabel': 'Kategorija',
  'createAd.selectCategory': 'Izaberi kategoriju',
  'createAd.priceLabel': 'Budzet',
  'createAd.pricePlaceholder': 'Budzet po zelji',
  'createAd.budgetPlaceholder': 'Budzet po zelji',
  'createAd.locationLabel': 'Lokacija',
  'createAd.locationPlaceholder': 'Grad, opstina ili drzava',
  'createAd.contactInfo': 'Kontakt informacije',
  'createAd.yourName': 'Tvoje ime',
  'createAd.phone': 'Telefon',
  'createAd.email': 'Email',
  'createAd.contactNote': 'Navedi barem telefon ili email',
  'createAd.contactRule':
    'Dodaj telefon ili email kako bi majstori mogli da te kontaktiraju.',
  'createAd.images': 'Slike (opciono)',
  'createAd.imagePlaceholder': 'https://example.com/photo.jpg',
  'createAd.addImage': 'Dodaj jos jednu sliku',
  'createAd.imageTip': 'Savet: koristi direktne linkove do slika',
  'createAd.imageHelp':
    'Za sada koristi direktne URL adrese slika. Lokalno otpremanje moze biti dodato kasnije bez promene modela podataka.',
  'createAd.currentLocation': 'Koristi moju lokaciju',
  'createAd.duration': 'Trajanje zahteva',
  'createAd.durationLabel': 'Trajanje zahteva',
  'createAd.days': 'dana',
  'createAd.popular': 'Popularno',
  'createAd.year': 'Godina',
  'createAd.adIncludes': 'Sta je ukljuceno',
  'createAd.freeListLegacyTitle': 'Tvoj zahtev ukljucuje:',
  'createAd.daysVisibility': 'dana vidljivosti',
  'createAd.contactDisplayed': 'prikazane kontakt informacije',
  'createAd.upToImages': 'do 10 slika',
  'createAd.premiumBadge': 'premium oznaku i gornje pozicioniranje',
  'createAd.createButton': 'Objavi zahtev za posao',
  'createAd.creating': 'Objavljivanje zahteva...',
  'createAd.success': 'Zahtev za posao je uspesno objavljen. Preusmeravanje...',
  'createAd.contactRequired':
    'Dodaj barem telefon ili email pre objavljivanja zahteva.',
  'createAd.locationDetectError': 'Nije moguce odrediti tvoju trenutnu lokaciju.',
  'createAd.locationLookupError':
    'Pretraga lokacije nije uspela. Unesi grad rucno.',
  'createAd.publishError': 'Nije moguce objaviti zahtev za posao.',
  'createAd.locationHelp':
    'Pocni da kucas grad ili oblast da bi dobio predloge.',
  'createAd.visibilityRadius': 'Radijus vidljivosti',
  'createAd.visibilityRadiusDesc':
    'Izaberi koliko siroko ce oglas biti vidljiv',
  'createAd.radius.city': 'Grad',
  'createAd.radius.district': 'Opstina',
  'createAd.radius.region': 'Region',
  'createAd.radius.country': 'Drzava',
  'createAd.radius.state': 'Pokrajina',
  'createAd.radius.land': 'Pokrajina (DE)',
  'createAd.radius.global': 'Svi korisnici',

  // Login
  'login.title': 'Prijava za majstore',
  'login.subtitle': 'Prijavi se da upravljas svojim profilom i oglasima',
  'login.email': 'Email adresa',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Lozinka',
  'login.passwordPlaceholder': '********',
  'login.signIn': 'Prijava',
  'login.signingIn': 'Prijavljivanje...',
  'login.noAccount': 'Jos nemas nalog?',
  'login.registerLink': 'Registruj se kao majstor',
  'login.lookingToPost': 'Zelis da objavis oglas?',
  'login.noRegistrationRequired': 'Registracija nije potrebna',

  // Register
  'register.title': 'Registracija majstora',
  'register.subtitle': 'Pridruzi se Dimarket-u i razvijaj svoj posao',
  'register.fullName': 'Puno ime',
  'register.fullNamePlaceholder': 'Marko Markovic',
  'register.passwordMin': 'Minimum 6 karaktera',
  'register.phonePlaceholder': '+381 60 123 45 67',
  'register.locationPlaceholder': 'Grad, okrug',
  'register.createAccount': 'Napravi nalog majstora',
  'register.creating': 'Kreiranje naloga...',
  'register.success': 'Registracija je uspesna! Preusmeravanje na panel...',
  'register.alreadyHave': 'Vec imas nalog?',
  'register.afterRegistration': 'Nakon registracije:',
  'register.choosePlan': 'Izabraces plan',
  'register.completeProfile': 'Popunices profil i portfolio',
  'register.receiveRequests': 'Poceces da dobijas zahteve od klijenata',
  'register.buildReputation': 'Izgradices reputaciju kroz recenzije',

  // Listings old keys
  'listings.title': 'Pregledaj oglase',
  'listings.searchPlaceholder': 'Pretrazi oglase...',
  'listings.filters': 'Filteri',
  'listings.allCategories': 'Sve kategorije',
  'listings.allTypes': 'Svi tipovi',
  'listings.clearFilters': 'Obrisi filtere',
  'listings.loading': 'Ucitavanje oglasa...',
  'listings.noFound': 'Nema pronadjenih oglasa',
  'listings.createFirst': 'Napravi prvi oglas',
  'listings.category': 'Kategorija',
  'listings.listingType': 'Tip oglasa',
  'listings.typeServiceRequest': 'Trazim uslugu',
  'listings.typeServiceOffer': 'Nudim uslugu',
  'listings.typeItemSale': 'Na prodaju',
  'listings.typeItemWanted': 'Kupujem',
  'listings.search': 'Pretraga',

  // Listings new keys
  'listings.eyebrow': 'Zahtevi za posao',
  'listings.simpleTitle': 'Gradjevinski poslovi od klijenata',
  'listings.simpleDescription':
    'Pregledaj aktivne zahteve klijenata, filtriraj po kategoriji ili mestu i odgovori direktno kada posao odgovara tvojim vestinama.',
  'listings.whatNeedsToBeDone': 'Sta treba uraditi?',
  'listings.cityOrCountry': 'Grad ili drzava',
  'listings.findRequests': 'Pronadji zahteve',
  'listings.filtersButton': 'Filteri',
  'listings.categoryLabel': 'Kategorija',
  'listings.allCategoriesSimple': 'Sve kategorije',
  'listings.clearFiltersSimple': 'Obrisi filtere',
  'listings.postJob': 'Objavi zahtev',
  'listings.countSuffix': 'pronadjenih zahteva',
  'listings.loadingRequests': 'Ucitavanje zahteva za posao...',
  'listings.emptyTitle': 'Nema zahteva koji odgovaraju ovim filterima',
  'listings.emptyText':
    'Probaj drugu kljucnu rec, izaberi drugu kategoriju ili ukloni filter lokacije.',

  // Professionals old keys
  'professionals.title': 'Pronadji majstore',
  'professionals.subtitle':
    'Povezi se sa proverenim strucnjacima za gradnju i kucne usluge',
  'professionals.searchPlaceholder': 'Pretraga po imenu, lokaciji ili usluzi...',
  'professionals.loading': 'Ucitavanje majstora...',
  'professionals.noFound': 'Majstori nisu pronadjeni',
  'professionals.beFirst': 'Budi prvi koji ce se registrovati kao majstor!',
  'professionals.joinTitle': 'Da li si majstor?',
  'professionals.joinDesc':
    'Pridruzi se platformi i pronadji klijente koji traze tvoje usluge',
  'professionals.getStartedToday': 'Pocni danas',
  'professionals.sortBy': 'Sortiraj po',
  'professionals.topRated': 'Najvisa ocena',
  'professionals.mostViewed': 'Najvise pregleda',
  'professionals.newest': 'Najnoviji',
  'professionals.minRating': 'Minimalna ocena',
  'professionals.anyRating': 'Bilo koja ocena',
  'professionals.location': 'Lokacija',
  'professionals.locationPlaceholder': 'Filtriraj po lokaciji...',
  'professionals.found': 'pronadjenih majstora',
  'professionals.registerAsProfessional': 'Registruj se kao majstor',

  // Professionals new keys
  'professionals.eyebrow': 'Profesionalci / Majstori',
  'professionals.simpleTitle':
    'Gradjevinski profesionalci spremni za direktan kontakt',
  'professionals.simpleDescription':
    'Trazi majstore po gradu, vestini ili oceni i kontaktiraj ih direktno nakon pregleda njihovog javnog profila.',
  'professionals.nameSkillService': 'Ime, vestina ili usluga',
  'professionals.cityOrCountry': 'Grad ili drzava',
  'professionals.filtersButton': 'Filteri',
  'professionals.categoryLabel': 'Kategorija',
  'professionals.allCategoriesSimple': 'Sve kategorije',
  'professionals.sortLabel': 'Sortiranje',
  'professionals.minRatingLabel': 'Minimalna ocena',
  'professionals.anyRatingSimple': 'Bilo koja ocena',
  'professionals.sortRating': 'Najvisa ocena',
  'professionals.sortReviews': 'Najvise recenzija',
  'professionals.sortNewest': 'Najnoviji profili',
  'professionals.clearFiltersSimple': 'Obrisi filtere',
  'professionals.countSuffix': 'pronadjenih majstora',
  'professionals.loadingSimple': 'Ucitavanje majstora...',
  'professionals.postJob': 'Objavi zahtev',
  'professionals.emptyTitle': 'Nema majstora koji odgovaraju ovim filterima',
  'professionals.emptyText':
    'Probaj drugu lokaciju, ukloni filter kategorije ili smanji minimalnu ocenu.',

  // Ads
  'ads.adSpace': 'Reklamni prostor',
  'ads.advertiseHere': 'Reklamiraj svoj biznis ovde',
  'ads.bannerAd': 'Baner reklama',
  'ads.premiumPlacement': 'Premium reklamno pozicioniranje',
  'ads.contactRates': 'Kontaktiraj nas za cene',
  'ads.stickyAdBlock': 'Fiksni reklamni blok',
  'ads.close': 'Zatvori reklamu',

  // Common
  'common.loading': 'Ucitavanje...',
  'common.error': 'Greska',
  'common.success': 'Uspeh',

  // Visibility
  'visibility.city': 'Grad',
  'visibility.district': 'Opstina',
  'visibility.region': 'Region',
  'visibility.country': 'Drzava',
  'visibility.state': 'Pokrajina',
  'visibility.land': 'Pokrajina (DE)',
  'visibility.global': 'Svi korisnici',

  // Route placeholders
  'route.professionalProfileEyebrow': 'Profil majstora',
  'route.professionalProfileTitle': 'Stranica profila majstora je u pripremi',
  'route.professionalProfileDescription':
    'Ovde ce klijenti moci da pregledaju profil majstora, ocenu, recenzije i zavrsene radove.',
  'route.jobRequestEyebrow': 'Zahtev za posao',
  'route.jobRequestTitle': 'Detalji zahteva su u pripremi',
  'route.jobRequestDescription':
    'Na ovoj stranici ce biti prikazan ceo zahtev, prilozi, budzet i direktan kontakt za majstore.',
  'route.messagesEyebrow': 'Poruke',
  'route.messagesTitle': 'Direktne poruke ce se pojaviti ovde',
  'route.messagesDescription':
    'Klijenti i majstori ce moci da komuniciraju direktno kroz jedan razgovor za svaki zahtev.',
  'route.notFoundEyebrow': 'Stranica nije pronadjena',
  'route.notFoundTitle': 'Ova stranica jos ne postoji',
  'route.notFoundDescription':
    'Ruta je vec rezervisana za dalji razvoj platforme, ali ovde jos nema gotovog ekrana.',

  // Favorites
  'favorites.title': 'Sacuvano',
  'favorites.description':
    'Sacuvaj zahteve za posao i majstore kojima zelis da se vratis kasnije.',
  'favorites.loginTitle': 'Prijavi se da bi cuvao favorite',
  'favorites.loginText':
    'Sacuvani zahtevi za posao i sacuvani majstori dostupni su samo unutar tvog naloga.',
  'favorites.loginButton': 'Idi na prijavu',
  'favorites.listingsTab': 'Zahtevi za posao',
  'favorites.professionalsTab': 'Majstori',
  'favorites.loading': 'Ucitavanje sacuvanih stavki...',
  'favorites.emptyListingsTitle': 'Jos nema sacuvanih zahteva',
  'favorites.emptyListingsText':
    'Dodaj zahteve u sacuvano kako bi im se brzo vratio kasnije.',
  'favorites.emptyListingsButton': 'Pregledaj zahteve',
  'favorites.emptyProfessionalsTitle': 'Jos nema sacuvanih majstora',
  'favorites.emptyProfessionalsText':
    'Sacuvaj majstore koje zelis da uporedis, kontaktiras ili pregledas kasnije.',
  'favorites.emptyProfessionalsButton': 'Pregledaj majstore',

  // Footer stats
  'footerStats.title': 'Aktivnost platforme',
  'footerStats.subtitle':
    'Uzivo pokazatelji koriscenja Dimarket-a i potraznje za gradjevinskim uslugama.',
  'footerStats.visits': 'Posete',
  'footerStats.listings': 'Kreirani zahtevi',
  'footerStats.successful': 'Zavrseni zahtevi',
  'footerStats.professionals': 'Majstori',
  'footerStats.countries': 'Drzave u rangiranju',
  'footerStats.rankingTitle': 'Rang lista drzava',
  'footerStats.rankingSubtitle':
    'Ocena kombinuje majstore, zahteve i aktivnost po drzavama.',
  'footerStats.updatedPrefix': 'Azurirano:',
  'footerStats.loading': 'Ucitavanje statistike...',
  'footerStats.empty': 'Jos nema dovoljno podataka za rangiranje drzava.',
  'footerStats.score': 'Ocena',
  'footerStats.prosShort': 'Prof',
  'footerStats.jobsShort': 'Posl',
  'footerStats.repliesShort': 'Odg',

  // Advertising
  'advertising.eyebrow': 'Reklama',
  'advertising.title': 'Reklama odrzava Dimarket besplatnim za korisnike',
  'advertising.description':
    'Dimarket zaradjuje samo od reklama. Brendovi mogu plasirati relevantne gradjevinske kampanje, dok klijenti i majstori nastavljaju da koriste platformu besplatno.',
  'advertising.placementsTitle': 'Gde se reklama moze prikazati',
  'advertising.placements.homeTitle': 'Pocetna stranica',
  'advertising.placements.homeText':
    'Promotivni blokovi pored pretrage, popularnih kategorija i novih zahteva.',
  'advertising.placements.listingsTitle': 'Tok zahteva',
  'advertising.placements.listingsText':
    'Ugradjena pozicioniranja izmedju zahteva za posao, gde majstori aktivno prate nove prilike.',
  'advertising.placements.sidebarTitle': 'Bocna traka i footer',
  'advertising.placements.sidebarText':
    'Stalna vidljivost za alate, materijale, logistiku i lokalne salone.',
  'advertising.audienceTitle': 'Najbolje za oglasivace',
  'advertising.audienceText':
    'Gradjevinski materijal, iznajmljivanje opreme, logistika, gradjevinski alati, prodavnice za renoviranje, lokalne usluge izvodjaca i saloni za renoviranje.',
  'advertising.principleTitle': 'Princip platforme',
  'advertising.principleText':
    'Klijenti ne placaju za objavu zahteva. Majstori ne placaju da vide kontakt mogucnosti. Reklama je jedini sloj monetizacije.',
  'advertising.primaryButton': 'Pregledaj zahteve za posao',
  'advertising.secondaryButton': 'Nazad na pocetnu',
}
