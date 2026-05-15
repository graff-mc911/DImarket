import type { TranslationKey } from './en'

export const trTranslations: Partial<Record<TranslationKey, string>> = {
  // Header
  'header.browse': 'Goz at',
  'header.findProfessionals': 'Usta bul',
  'header.professionalLogin': 'Usta girisi',
  'header.createAd': 'Ilan olustur',
  'header.myProfile': 'Profilim',
  'header.dashboard': 'Panel',
  'header.myListings': 'Ilanlarim',
  'header.signOut': 'Cikis yap',
  'header.account': 'Hesap',
  'header.language': 'Dil',
  'header.currency': 'Para birimi',
  'header.jobRequests': 'Is talepleri',
  'header.favorites': 'Favoriler',
  'header.messages': 'Mesajlar',
  'header.postJob': 'Is talebi yayinla',
  'header.brandTagline': 'Ucretsiz insaat platformu',

  // Footer
  'footer.tagline':
    'Guvenilir insaat profesyonelleriyle baglanti kur ve kaliteli malzemeler bul.',
  'footer.forClients': 'Musteriler icin',
  'footer.browseListings': 'Ilanlara goz at',
  'footer.postRequest': 'Talep yayinla',
  'footer.forProfessionals': 'Profesyoneller icin',
  'footer.signIn': 'Giris yap',
  'footer.register': 'Kayit ol',
  'footer.howItWorks': 'Nasil calisir',
  'footer.allRightsReserved': 'Tum haklari saklidir.',
  'footer.brandText':
    'Dimarket, musterilerin is ilanlari yayinladigi ve profesyonellerin dogrudan yanit verdigi ucretsiz global bir insaat hizmetleri platformudur.',
  'footer.monetization':
    'Kullanicilar icin komisyon yok. Abonelik yok. Platform sadece reklamdan gelir elde eder.',
  'footer.platformTitleSimple': 'Platform',
  'footer.accountTitleSimple': 'Hesap',
  'footer.adsTitle': 'Reklam',
  'footer.adsText':
    'Insaat malzemeleri, aletler, lojistik ve yerel hizmet markalari ilanlar ve profesyonel profiller uzerinden aktif talebe ulasabilir.',
  'footer.adsButton': 'Reklam sayfasi',
  'footer.legalRight':
    'Yalnizca reklam gelirine dayanan ucretsiz insaat hizmetleri platformu.',

  // Home old keys
  'home.heroTitle': 'Guvenilir ustalari bul',
  'home.heroSubtitle': 'Hayallerini insa et',
  'home.heroDescription':
    'Musterileri dogrulanmis profesyonellerle bulusturan insaat, renovasyon ve ev hizmetleri platformu',
  'home.searchPlaceholder': 'Hizmet, malzeme veya profesyonel ara...',
  'home.search': 'Ara',
  'home.findProfessionals': 'Usta bul',
  'home.postRequest': 'Talep yayinla',
  'home.browseByCategory': 'Kategoriye gore goz at',
  'home.topRatedProfessionals': 'En yuksek puanli profesyoneller',
  'home.topRatedDescription':
    'Insaat ve ev hizmetlerinde dogrulanmis uzmanlarla baglanti kur',
  'home.noProfessionals': 'Henuz kayitli profesyonel yok. Ilk sen ol.',
  'home.viewAllProfessionals': 'Tum profesyonelleri gor',
  'home.recentListings': 'Son ilanlar',
  'home.recentListingsDescription': 'En yeni firsatlar ve talepler',
  'home.noListings': 'Henuz aktif ilan yok. Ilk ilani yayinla.',
  'home.viewAllListings': 'Tum ilanlari gor',
  'home.whyChoose': 'Neden Dimarket?',
  'home.verifiedProfessionals': 'Dogrulanmis profesyoneller',
  'home.verifiedDescription':
    'Tum profesyoneller dogrulanmistir ve gercek musterilerden puanlar ile yorumlara sahiptir',
  'home.quickEasy': 'Hizli ve kolay',
  'home.quickEasyDescription':
    'Talebini kayit olmadan dakikalar icinde yayinla. Hizli sekilde yanit al',
  'home.directCommunication': 'Dogrudan iletisim',
  'home.directCommunicationDescription':
    'Mesajlasma sistemimiz uzerinden profesyonellerle dogrudan iletisime gec',
  'home.areYouProfessional': 'Profesyonel misin?',
  'home.joinProfessionals':
    'Isini Dimarket uzerinde buyuten binlerce profesyonele katil',
  'home.registerAsProfessional': 'Profesyonel olarak kayit ol',

  // Home new keys
  'home.globalEyebrow': 'Global insaat hizmetleri',
  'home.heroSimpleTitle':
    'Tamir, montaj veya insaat isi icin bir usta bul.',
  'home.heroSimpleDescription':
    'Musteriler is talepleri yayinlar, profesyoneller dogrudan yanit verir ve Dimarket kullanicilar icin ucretsiz kalir.',
  'home.whatNeedsToBeDone': 'Ne yapilmasi gerekiyor?',
  'home.cityOrCountry': 'Sehir veya ulke',
  'home.postJob': 'Is talebi yayinla',
  'home.popularCategoriesTitle': 'Populer kategoriler',
  'home.popularCategoriesText':
    'Dimarket uzerinde en cok talep goren insaat ve renovasyon alanlari.',
  'home.browseRequests': 'Is taleplerine goz at',
  'home.freshRequestsTitle': 'Yeni is talepleri',
  'home.freshRequestsText':
    'Profesyonellerin hemen inceleyip yanitlayabilecegi yeni musteri talepleri.',
  'home.allRequests': 'Tum is talepleri',
  'home.popularProsTitle': 'Populer profesyoneller',
  'home.popularProsText':
    'Gorunur deneyim, tutarli puanlar ve dogrudan iletisim sunan profiller.',
  'home.allPros': 'Tum profesyoneller',
  'home.adTitle': 'Reklam',
  'home.adText':
    'Aletleri, malzemeleri, yerel hizmetleri veya insaat showroomlarini gercek talebe sahip bir kitleye tanit.',
  'home.adButton': 'Dimarket\'te reklam ver',
  'home.adCardOne': 'Malzeme ortaklari',
  'home.adCardTwo': 'Alet markalari',
  'home.adCardThree': 'Yerel showroomlar',
  'home.noJobs': 'Henuz aktif is talebi yok.',
  'home.noCategories': 'Kategoriler yakinda burada gorunecek.',
  'home.noLocation': 'Konum belirtilmedi',
  'home.budgetLabel': 'Butce',
  'home.activeLabel': 'Aktif',
  'home.unknownCategory': 'Insaat hizmeti',
  'home.noBio': 'Insaat profesyonelinin profili hala tamamlanıyor.',
  'home.sponsoredPlacement':
    'Aletler, malzemeler, lojistik veya yerel insaat ortaklari icin sponsorlu alan.',
  'home.sidebarAdOne':
    'Markani gercek insaat talebinin yanina yerlestir.',
  'home.sidebarAdTwo':
    'Is ve hizmet arayan profesyoneller ile musterlere ulas.',
  'home.loading': 'Yukleniyor...',

  // Categories
  'category.construction': 'Insaat',
  'category.constructionDesc': 'Yeni insaat ve yapi projeleri',
  'category.renovation': 'Renovasyon',
  'category.renovationDesc': 'Ev yenileme ve tadilat',
  'category.electrical': 'Elektrik',
  'category.electricalDesc': 'Elektrik isleri ve onarimlar',
  'category.plumbing': 'Tesisat',
  'category.plumbingDesc': 'Tesisat hizmetleri ve montaj',
  'category.handyman': 'Tamirci',
  'category.handymanDesc': 'Genel tamir ve bakim hizmetleri',
  'category.materials': 'Malzemeler',
  'category.materialsDesc': 'Satilik insaat malzemeleri',
  'category.tools': 'Aletler',
  'category.toolsDesc': 'Aletler ve ekipmanlar',
  'category.name.construction': 'Insaat',
  'category.name.renovation': 'Renovasyon',
  'category.name.electrical': 'Elektrik',
  'category.name.plumbing': 'Tesisat',
  'category.name.handyman': 'Tamirci',
  'category.name.materials': 'Malzemeler',
  'category.name.tools': 'Aletler',

  // Listing Card
  'listing.serviceNeeded': 'Hizmet ariyorum',
  'listing.serviceOffered': 'Hizmet sunuyorum',
  'listing.forSale': 'Satilik',
  'listing.wanted': 'Araniyor',
  'listing.contactForPrice': 'Fiyat icin iletisime gec',
  'listing.daysLeft': 'gun kaldi',
  'listing.views': 'goruntulenme',
  'listing.premium': 'PREMIUM',
  'listing.constructionService': 'Insaat hizmeti',
  'listing.locationNotSpecified': 'Konum belirtilmedi',
  'listing.budget': 'Butce',

  // Professional Card
  'professional.contact': 'Iletisim',
  'professional.reviews': 'yorum',
  'professional.new': 'Yeni',
  'professional.defaultName': 'Profesyonel',
  'professional.global': 'Global',
  'professional.profileInProgress':
    'Insaat profesyonelinin profili hala tamamlanıyor.',

  // Create Ad
  'createAd.title': 'Insaat is talebi olustur',
  'createAd.noRegistration': 'Kayit gerektirmez',
  'createAd.eyebrow': 'Ucretsiz is talebi',
  'createAd.heroTitle': 'Insaat is talebi olustur',
  'createAd.heroDescription':
    'Isi acikla, bir konum ekle ve profesyonellerin seninle dogrudan iletisime gecmesine izin ver. Abonelik yok, yayinlama ucreti yok.',
  'createAd.detailsTitle': 'Is detaylari',
  'createAd.detailsText':
    'Talebi profesyonellerin isi anlamasi ve uygun teklif gondermesi icin net yaz.',
  'createAd.locationTitle': 'Konum ve gorunurluk',
  'createAd.locationText':
    'Isin nerede oldugunu ve profesyonellere ne kadar genis gorunecegini sec.',
  'createAd.contactTitle': 'Iletisim bilgileri',
  'createAd.contactText':
    'Profesyonellerin sana dogrudan ulasabilmesi icin en az bir iletisim yontemi gerekir.',
  'createAd.imagesTitle': 'Fotograflar (istege bagli)',
  'createAd.imagesText':
    'Profesyonellerin isi daha iyi hesaplayabilmesi icin ornek fotograflar, planlar veya referanslar ekle.',
  'createAd.freeListTitle': 'Neler dahil',
  'createAd.freeItemOne': 'Musteriler icin ucretsiz yayinlama',
  'createAd.freeItemTwo': 'Profesyonellerle dogrudan iletisim',
  'createAd.freeItemThree': 'Istege bagli fotograflar ve butce',
  'createAd.freeItemFour': 'Reklamla finanse edilen platform modeli',
  'createAd.adType': 'Ilan tipi',
  'createAd.needService': 'Bir hizmete ihtiyacim var',
  'createAd.needServiceDesc': 'Yardim ariyorum',
  'createAd.offerService': 'Hizmet sunuyorum',
  'createAd.offerServiceDesc': 'Hizmet veriyorum',
  'createAd.sellItem': 'Urun sat',
  'createAd.sellItemDesc': 'Malzemeler, aletler',
  'createAd.wantItem': 'Urun satin al',
  'createAd.wantItemDesc': 'Satin almak istiyorum',
  'createAd.titleLabel': 'Baslik',
  'createAd.taskPlaceholder': 'Ne yapilmasi gerekiyor?',
  'createAd.titlePlaceholder': 'Orn: Oturma odasinda alcipan tamiri gerekiyor',
  'createAd.titleHint': 'Ornek: Oturma odasinda alcipan tamiri gerekiyor',
  'createAd.descriptionLabel': 'Aciklama',
  'createAd.descriptionPlaceholder':
    'Ne yapilmasi gerektigini, isin boyutunu, istedigin zamani ve tum onemli detaylari yaz.',
  'createAd.descriptionHint':
    'Ne yapilmasi gerektigini, isin boyutunu, istedigin zamani ve tum onemli detaylari yaz.',
  'createAd.categoryLabel': 'Kategori',
  'createAd.selectCategory': 'Kategori sec',
  'createAd.priceLabel': 'Butce',
  'createAd.pricePlaceholder': 'Istege bagli butce',
  'createAd.budgetPlaceholder': 'Istege bagli butce',
  'createAd.locationLabel': 'Konum',
  'createAd.locationPlaceholder': 'Sehir, ilce veya ulke',
  'createAd.contactInfo': 'Iletisim bilgileri',
  'createAd.yourName': 'Adin',
  'createAd.phone': 'Telefon',
  'createAd.email': 'E-posta',
  'createAd.contactNote': 'En az telefon veya e-posta belirt',
  'createAd.contactRule':
    'Profesyonellerin sana ulasabilmesi icin telefon veya e-posta ekle.',
  'createAd.images': 'Gorseller (istege bagli)',
  'createAd.imagePlaceholder': 'https://example.com/photo.jpg',
  'createAd.addImage': 'Bir gorsel daha ekle',
  'createAd.imageTip': 'Ipuclari: dogrudan gorsel baglantilari kullan',
  'createAd.imageHelp':
    'Simdilik dogrudan gorsel URL\'leri kullan. Yerel yukleme daha sonra veri modelini degistirmeden eklenebilir.',
  'createAd.currentLocation': 'Mevcut konumumu kullan',
  'createAd.duration': 'Talep suresi',
  'createAd.durationLabel': 'Talep suresi',
  'createAd.days': 'gun',
  'createAd.popular': 'Populer',
  'createAd.year': 'Yil',
  'createAd.adIncludes': 'Neler dahil',
  'createAd.freeListLegacyTitle': 'Talebin sunlari icerir:',
  'createAd.daysVisibility': 'gun gorunurluk',
  'createAd.contactDisplayed': 'gorunen iletisim bilgileri',
  'createAd.upToImages': '10 gorsele kadar',
  'createAd.premiumBadge': 'premium rozeti ve ust sirada gosterim',
  'createAd.createButton': 'Is talebini yayinla',
  'createAd.creating': 'Talep yayinlaniyor...',
  'createAd.success': 'Is talebi basariyla yayinlandi. Yonlendiriliyor...',
  'createAd.contactRequired':
    'Talebi yayinlamadan once en az telefon veya e-posta ekle.',
  'createAd.locationDetectError': 'Mevcut konumun tespit edilemedi.',
  'createAd.locationLookupError':
    'Konum aramasi basarisiz oldu. Sehri manuel olarak gir.',
  'createAd.publishError': 'Is talebi yayinlanamadi.',
  'createAd.locationHelp':
    'Oneri almak icin sehir veya bolge yazmaya basla.',
  'createAd.visibilityRadius': 'Gorunurluk yaricapi',
  'createAd.visibilityRadiusDesc':
    'Ilanin ne kadar genis gorunecegini sec',
  'createAd.radius.city': 'Sehir',
  'createAd.radius.district': 'Ilce',
  'createAd.radius.region': 'Bolge',
  'createAd.radius.country': 'Ulke',
  'createAd.radius.state': 'Eyalet',
  'createAd.radius.land': 'Bolge (DE)',
  'createAd.radius.global': 'Tum kullanicilar',

  // Login
  'login.title': 'Usta girisi',
  'login.subtitle': 'Profilini ve ilanlarini yonetmek icin giris yap',
  'login.email': 'E-posta adresi',
  'login.emailPlaceholder': 'you@example.com',
  'login.password': 'Sifre',
  'login.passwordPlaceholder': '********',
  'login.signIn': 'Giris yap',
  'login.signingIn': 'Giris yapiliyor...',
  'login.noAccount': 'Henuz hesabin yok mu?',
  'login.registerLink': 'Profesyonel olarak kayit ol',
  'login.lookingToPost': 'Ilan yayinlamak istiyor musun?',
  'login.noRegistrationRequired': 'Kayit gerekmez',

  // Register
  'register.title': 'Profesyonel kaydi',
  'register.subtitle': 'Dimarket\'e katil ve isini buyut',
  'register.fullName': 'Ad soyad',
  'register.fullNamePlaceholder': 'Ahmet Yilmaz',
  'register.passwordMin': 'En az 6 karakter',
  'register.phonePlaceholder': '+90 555 123 45 67',
  'register.locationPlaceholder': 'Sehir, bolge',
  'register.createAccount': 'Profesyonel hesap olustur',
  'register.creating': 'Hesap olusturuluyor...',
  'register.success': 'Kayit basarili! Panele yonlendiriliyor...',
  'register.alreadyHave': 'Zaten bir hesabin var mi?',
  'register.afterRegistration': 'Kayittan sonra:',
  'register.choosePlan': 'Bir plan sececeksin',
  'register.completeProfile': 'Profilini ve portfoyunu tamamlayacaksin',
  'register.receiveRequests': 'Musteri talepleri almaya baslayacaksin',
  'register.buildReputation': 'Yorumlarla itibarini olusturacaksin',

  // Listings old keys
  'listings.title': 'Ilanlara goz at',
  'listings.searchPlaceholder': 'Ilan ara...',
  'listings.filters': 'Filtreler',
  'listings.allCategories': 'Tum kategoriler',
  'listings.allTypes': 'Tum tipler',
  'listings.clearFilters': 'Filtreleri temizle',
  'listings.loading': 'Ilanlar yukleniyor...',
  'listings.noFound': 'Ilan bulunamadi',
  'listings.createFirst': 'Ilk ilani olustur',
  'listings.category': 'Kategori',
  'listings.listingType': 'Ilan tipi',
  'listings.typeServiceRequest': 'Bir hizmete ihtiyacim var',
  'listings.typeServiceOffer': 'Hizmet sunuyorum',
  'listings.typeItemSale': 'Satilik',
  'listings.typeItemWanted': 'Araniyor',
  'listings.search': 'Ara',

  // Listings new keys
  'listings.eyebrow': 'Is talepleri',
  'listings.simpleTitle': 'Musterilerden insaat isleri',
  'listings.simpleDescription':
    'Aktif musteri taleplerine goz at, kategori veya konuma gore filtrele ve is yeteneklerine uyuyorsa dogrudan yanit ver.',
  'listings.whatNeedsToBeDone': 'Ne yapilmasi gerekiyor?',
  'listings.cityOrCountry': 'Sehir veya ulke',
  'listings.findRequests': 'Talep bul',
  'listings.filtersButton': 'Filtreler',
  'listings.categoryLabel': 'Kategori',
  'listings.allCategoriesSimple': 'Tum kategoriler',
  'listings.clearFiltersSimple': 'Filtreleri temizle',
  'listings.postJob': 'Is talebi yayinla',
  'listings.countSuffix': 'talep bulundu',
  'listings.loadingRequests': 'Is talepleri yukleniyor...',
  'listings.emptyTitle': 'Bu filtrelere uyan talep yok',
  'listings.emptyText':
    'Baska bir anahtar kelime dene, farkli bir kategori sec veya konum filtresini kaldir.',

  // Professionals old keys
  'professionals.title': 'Usta bul',
  'professionals.subtitle':
    'Dogrulanmis insaat ve ev hizmetleri uzmanlariyla baglanti kur',
  'professionals.searchPlaceholder': 'Isim, konum veya hizmete gore ara...',
  'professionals.loading': 'Profesyoneller yukleniyor...',
  'professionals.noFound': 'Profesyonel bulunamadi',
  'professionals.beFirst': 'Profesyonel olarak kayit olan ilk kisi sen ol!',
  'professionals.joinTitle': 'Profesyonel misin?',
  'professionals.joinDesc':
    'Platforma katil ve hizmetlerini arayan musterileri bul',
  'professionals.getStartedToday': 'Bugun basla',
  'professionals.sortBy': 'Siralama',
  'professionals.topRated': 'En yuksek puan',
  'professionals.mostViewed': 'En cok goruntulenen',
  'professionals.newest': 'En yeni',
  'professionals.minRating': 'Minimum puan',
  'professionals.anyRating': 'Herhangi bir puan',
  'professionals.location': 'Konum',
  'professionals.locationPlaceholder': 'Konuma gore filtrele...',
  'professionals.found': 'profesyonel bulundu',
  'professionals.registerAsProfessional': 'Profesyonel olarak kayit ol',

  // Professionals new keys
  'professionals.eyebrow': 'Profesyoneller / Ustalar',
  'professionals.simpleTitle':
    'Dogrudan iletisime hazir insaat profesyonelleri',
  'professionals.simpleDescription':
    'Ustalari sehir, beceri veya puana gore ara ve herkese acik profillerini gordukten sonra dogrudan iletisime gec.',
  'professionals.nameSkillService': 'Isim, beceri veya hizmet',
  'professionals.cityOrCountry': 'Sehir veya ulke',
  'professionals.filtersButton': 'Filtreler',
  'professionals.categoryLabel': 'Kategori',
  'professionals.allCategoriesSimple': 'Tum kategoriler',
  'professionals.sortLabel': 'Siralama',
  'professionals.minRatingLabel': 'Minimum puan',
  'professionals.anyRatingSimple': 'Herhangi bir puan',
  'professionals.sortRating': 'En yuksek puan',
  'professionals.sortReviews': 'En cok yorum',
  'professionals.sortNewest': 'En yeni profiller',
  'professionals.clearFiltersSimple': 'Filtreleri temizle',
  'professionals.countSuffix': 'profesyonel bulundu',
  'professionals.loadingSimple': 'Profesyoneller yukleniyor...',
  'professionals.postJob': 'Is talebi yayinla',
  'professionals.emptyTitle': 'Bu filtrelere uyan profesyonel yok',
  'professionals.emptyText':
    'Baska bir konum dene, kategori filtresini kaldir veya minimum puani dusur.',

  // Ads
  'ads.adSpace': 'Reklam alani',
  'ads.advertiseHere': 'Isini burada tanit',
  'ads.bannerAd': 'Banner reklam',
  'ads.premiumPlacement': 'Premium reklam yerlesimi',
  'ads.contactRates': 'Fiyatlar icin bize ulas',
  'ads.stickyAdBlock': 'Sabit reklam blogu',
  'ads.close': 'Reklami kapat',

  // Common
  'common.loading': 'Yukleniyor...',
  'common.error': 'Hata',
  'common.success': 'Basarili',

  // Visibility
  'visibility.city': 'Sehir',
  'visibility.district': 'Ilce',
  'visibility.region': 'Bolge',
  'visibility.country': 'Ulke',
  'visibility.state': 'Eyalet',
  'visibility.land': 'Bolge (DE)',
  'visibility.global': 'Tum kullanicilar',

  // Route placeholders
  'route.professionalProfileEyebrow': 'Profesyonel profil',
  'route.professionalProfileTitle': 'Profesyonel profil sayfasi hazirlaniyor',
  'route.professionalProfileDescription':
    'Burada musteriler profesyonelin profilini, puanini, yorumlarini ve tamamladigi isleri gorebilecek.',
  'route.jobRequestEyebrow': 'Is talebi',
  'route.jobRequestTitle': 'Talep detaylari hazirlaniyor',
  'route.jobRequestDescription':
    'Bu sayfada tam talep, ek dosyalar, butce ve profesyoneller icin dogrudan iletisim gosterilecek.',
  'route.messagesEyebrow': 'Mesajlar',
  'route.messagesTitle': 'Dogrudan mesajlar burada gorunecek',
  'route.messagesDescription':
    'Musteriler ve profesyoneller her talep icin tek bir konusmada dogrudan iletisim kurabilecek.',
  'route.notFoundEyebrow': 'Sayfa bulunamadi',
  'route.notFoundTitle': 'Bu sayfa henuz yok',
  'route.notFoundDescription':
    'Bu rota platformun buyumesi icin ayrildi, ancak burada henuz tamamlanmis bir ekran yok.',

  // Favorites
  'favorites.title': 'Favoriler',
  'favorites.description':
    'Daha sonra donmek istedigin is taleplerini ve profesyonelleri kaydet.',
  'favorites.loginTitle': 'Favorileri kaydetmek icin giris yap',
  'favorites.loginText':
    'Kaydedilen is talepleri ve kaydedilen profesyoneller sadece hesabinda kullanilabilir.',
  'favorites.loginButton': 'Girise git',
  'favorites.listingsTab': 'Is talepleri',
  'favorites.professionalsTab': 'Profesyoneller',
  'favorites.loading': 'Favoriler yukleniyor...',
  'favorites.emptyListingsTitle': 'Henuz kaydedilmis talep yok',
  'favorites.emptyListingsText':
    'Daha sonra hizla geri donmek icin talepleri favorilere ekle.',
  'favorites.emptyListingsButton': 'Talepleri gor',
  'favorites.emptyProfessionalsTitle': 'Henuz kaydedilmis profesyonel yok',
  'favorites.emptyProfessionalsText':
    'Karsilastirmak, iletisime gecmek veya daha sonra incelemek istedigin profesyonelleri kaydet.',
  'favorites.emptyProfessionalsButton': 'Profesyonelleri gor',

  // Footer stats
  'footerStats.title': 'Platform etkinligi',
  'footerStats.subtitle':
    'Dimarket kullanimi ve insaat hizmetleri talebine dair canli gostergeler.',
  'footerStats.visits': 'Ziyaretler',
  'footerStats.listings': 'Olusturulan talepler',
  'footerStats.successful': 'Tamamlanan talepler',
  'footerStats.professionals': 'Profesyoneller',
  'footerStats.countries': 'Siralamadaki ulkeler',
  'footerStats.rankingTitle': 'Ulke siralamasi',
  'footerStats.rankingSubtitle':
    'Puan, ulkelerdeki profesyonelleri, talepleri ve etkinligi birlestirir.',
  'footerStats.updatedPrefix': 'Guncellendi:',
  'footerStats.loading': 'Istatistikler yukleniyor...',
  'footerStats.empty': 'Ulke siralamasi olusturmak icin henuz yeterli veri yok.',
  'footerStats.score': 'Puan',
  'footerStats.prosShort': 'Prof',
  'footerStats.jobsShort': 'Isler',
  'footerStats.repliesShort': 'Yan',

  // Advertising
  'advertising.eyebrow': 'Reklam',
  'advertising.title': 'Reklam, Dimarket\'i kullanicilar icin ucretsiz tutar',
  'advertising.description':
    'Dimarket sadece reklamdan gelir elde eder. Markalar insaatla ilgili kampanyalar yayinlayabilirken musteriler ve profesyoneller platformu ucretsiz kullanmaya devam eder.',
  'advertising.placementsTitle': 'Reklam nerede gorunebilir',
  'advertising.placements.homeTitle': 'Ana sayfa',
  'advertising.placements.homeText':
    'Arama, one cikan kategoriler ve yeni taleplerin yanindaki tanitim bloklari.',
  'advertising.placements.listingsTitle': 'Talep akisi',
  'advertising.placements.listingsText':
    'Profesyonellerin yeni firsatlari aktif olarak takip ettigi is talepleri arasindaki yerlestirmeler.',
  'advertising.placements.sidebarTitle': 'Yan panel ve alt bilgi',
  'advertising.placements.sidebarText':
    'Aletler, malzemeler, lojistik ve yerel showroomlar icin surekli gorunurluk.',
  'advertising.audienceTitle': 'Reklamverenler icin ideal',
  'advertising.audienceText':
    'Insaat malzemeleri, ekipman kiralama, lojistik, santiye aletleri, renovasyon magazalari, yerel yuklenici hizmetleri ve renovasyon showroomlari icin uygundur.',
  'advertising.principleTitle': 'Platform ilkesi',
  'advertising.principleText':
    'Musteriler talep yayinlamak icin odemez. Profesyoneller iletisim firsatlarini gormek icin odemez. Reklam tek gelir katmanidir.',
  'advertising.primaryButton': 'Is taleplerini gor',
  'advertising.secondaryButton': 'Ana sayfaya don',
}
