/**
 * Problem-first AI guide: client describes a need; assistant collects missing
 * facts step-by-step (job / ads / profile / vacancy / sell-rent).
 */
import type { TranslationKey } from '../i18n'
import {
  buildDraftTitle,
  draftNeedsContact,
  emptyJobRequestDraft,
  type GuideIntent,
  type JobRequestDraft,
  type SalesBotStep,
  type SalesCategoryOption,
  type TradeRole,
} from './jobRequestDraft'

export type SalesBotMessageTurn = {
  replyKey: TranslationKey
  replyParams?: Record<string, string>
  replyText?: string
}

export type SalesBotMessage = {
  role: 'user' | 'assistant'
  content: string
  turn?: SalesBotMessageTurn
}

export type SalesBotTurnResult = {
  replyKey: TranslationKey
  replyParams?: Record<string, string>
  replyText?: string
  step: SalesBotStep
  draft: JobRequestDraft
  quickReplies?: string[]
  canPublish: boolean
  /** Hook should rank nearest pros and show cards */
  needsMatches?: boolean
  /** Navigate after this turn */
  navigateTo?: string
  /** sessionStorage flags (e.g. ad guide) */
  sessionFlags?: Record<string, string>
  publishedListingId?: string
}

export type SalesBotContext = {
  locale: string
  categories: SalesCategoryOption[]
  categoryLabels: Record<string, string>
  profileName?: string
  profileEmail?: string
  profilePhone?: string
  currencyCode: string
  /** Prefilled from browser / profile */
  suggestedCity?: string
  suggestedLat?: number | null
  suggestedLon?: number | null
}

const YES = /^(так|yes|ok|добре|давай|згод|опубліку|publish|підтвердж|ага|угу)/i
const NO = /^(ні|no|не треба|потім|later|неа)/i
const SKIP = /^(skip|пропустити|немає|не знаю|хз|idk|—|-)$/i
const USE_GEO = /^(гео|geo|моє місце|my location|визначити|авто|gps)/i

/** Cost estimate / budget calculator — not an emergency job diagnose. */
function wantsCostEstimate(text: string): boolean {
  return /(кошторис|оцінк\w*\s+варт|скільки\s*(це\s*)?кошт|калькулятор\s*варт|зроби(ти)?\s*коштор|estimate|cost\s*estim|budget\s*estim|how\s*much\s*(will\s*it\s*)?cost)/i.test(
    text,
  )
}

/** Planned renovation / remodel — not “how long has it been broken”. */
function isPlannedRenovation(text: string): boolean {
  const q = text.toLowerCase()
  if (/(злама|тече|аварі|немає\s*світл|нема\s*світл|кондиц|кондец|затоп|іскри)/i.test(q)) {
    return false
  }
  return /(повн\w*\s*ремонт|капремонт|євроремонт|ремонт\s*(будинк|квартир|дому|хат|оселі)|house\s*renov|full\s*renov|apartment\s*renov|renovation|remodel)/i.test(
    q,
  )
}

function estimatorProjectTypeFromText(text: string): string {
  const q = text.toLowerCase()
  if (/(будинк|дому|хат|house)/i.test(q)) return 'house_renovation'
  if (/(квартир|apartment|flat)/i.test(q)) return 'renovation'
  if (/(ванн|bathroom)/i.test(q)) return 'bathroom'
  if (/(кухн|kitchen)/i.test(q)) return 'kitchen'
  return 'house_renovation'
}

function meta(draft: JobRequestDraft): Record<string, string> {
  return { ...(draft.guideMeta ?? {}) }
}

function withMeta(draft: JobRequestDraft, patch: Record<string, string>): JobRequestDraft {
  return { ...draft, guideMeta: { ...meta(draft), ...patch } }
}

function findCategory(
  slug: string,
  categories: SalesCategoryOption[],
): SalesCategoryOption | null {
  return categories.find((c) => c.slug === slug) ?? null
}

function detectIntent(text: string): GuideIntent | null {
  const q = text.toLowerCase()
  if (/(реклам|банер|advert|маркетинг|просуван|ads?\b)/i.test(q)) return 'advertising'
  if (/(вакан|шукаю (праців|мастер|майстр|співроб)|hiring|job offer|робота для майстра)/i.test(q)) {
    return 'vacancy'
  }
  if (/(здам|продам|куплю|оренда|продаж|sell|rent|buy\b|sale)/i.test(q)) return 'sell_rent'
  if (
    /(профіль|зареєстр|стати майстр|компані|contractor|professional account|відкрити кабінет)/i.test(
      q,
    )
  ) {
    if (/(компан|company|фірм|ООО|ТОВ)/i.test(q)) return 'profile_company'
    return 'profile_pro'
  }
  // Planned renovation / estimate handled separately in welcome — do not force job_service here.
  if (wantsCostEstimate(q) || isPlannedRenovation(q)) return 'job_service'
  if (
    /(нема|немає|злама|протік|тече|не працю|погано|виклик|пофарб|прибра|електр|сантех|світл|розетк|щиток|запах|загоря|майстр|кондиц|кондец|охолод|help|fix|broken|leak)/i.test(
      q,
    )
  ) {
    return 'job_service'
  }
  return null
}

type ProblemKind =
  | 'power_outage'
  | 'ac_cooling'
  | 'plumbing'
  | 'heating'
  | 'appliance'
  | 'painting'
  | 'cleaning'
  | 'general'

type ProblemGuess = {
  tradeRole: TradeRole
  categorySlug: string
  summary: string
  urgent: boolean
  kind: ProblemKind
}

function guessProblem(text: string): ProblemGuess | null {
  const q = text.toLowerCase().replace(/і/g, 'і')
  const urgent = /(терміново|зараз|сьогодні|аварі|asap|urgent)/i.test(q)

  // Air conditioner / HVAC — before generic "нема" rules
  if (
    /(кондиц|кондец|кондеціон|кондиціон|спліт|спліт|cooler|air.?cond|не.?охолод|погано.?холод|не.?дує.?холод|ac\b)/i.test(
      q,
    )
  ) {
    return {
      tradeRole: 'hvac',
      categorySlug: 'handyman',
      summary: 'Кондиціонер погано холодить / несправний',
      urgent: false,
      kind: 'ac_cooling',
    }
  }

  if (
    /(нема\s*св[аіеіиі]*тл|немає\s*св[аіеіиі]*тл|вимкнуло\s*світл|пропал[оа]\s*світл|no\s*light|power\s*out|нема\s*електр|нема\s*сваітл|нема\s*свитл)/i.test(
      q,
    ) ||
    (/(нема|немає)/i.test(q) && /(світл|свет|светл|світло|сваітл|свитл|light|power)/i.test(q))
  ) {
    return {
      tradeRole: 'electrician',
      categorySlug: 'electrical',
      summary: 'Немає світла / електрики',
      urgent: true,
      kind: 'power_outage',
    }
  }

  if (/(опален|батаре|радіатор|котел|тепло|не.?гріє|heating)/i.test(q)) {
    return {
      tradeRole: 'plumber',
      categorySlug: 'handyman',
      summary: 'Проблема з опаленням',
      urgent: /(не.?гріє|холодн)/i.test(q),
      kind: 'heating',
    }
  }

  if (/(тече|протік|унітаз|кран|труб|затоп|сантех|leak|plumb)/i.test(q)) {
    return {
      tradeRole: 'plumber',
      categorySlug: 'handyman',
      summary: 'Проблема з водою / сантехнікою',
      urgent: /(тече|затоп)/i.test(q),
      kind: 'plumbing',
    }
  }

  if (/(пральн|посудом|холодильник|духовк|плит|appliance|техника|техніч)/i.test(q)) {
    return {
      tradeRole: 'handyman',
      categorySlug: 'handyman',
      summary: 'Побутова техніка',
      urgent: false,
      kind: 'appliance',
    }
  }

  if (/(пофарб|фарб|paint|стін)/i.test(q)) {
    return {
      tradeRole: 'painter',
      categorySlug: 'construction',
      summary: 'Малярні / фарбування',
      urgent: false,
      kind: 'painting',
    }
  }

  if (isPlannedRenovation(text)) {
    return {
      tradeRole: 'general',
      categorySlug: 'construction',
      summary: text.trim().slice(0, 80) || 'Ремонт / реконструкція',
      urgent: false,
      kind: 'general',
    }
  }

  if (/(прибр|cleaning|прибиран)/i.test(q)) {
    return {
      tradeRole: 'cleaner',
      categorySlug: 'cleaning',
      summary: 'Прибирання',
      urgent: false,
      kind: 'cleaning',
    }
  }

  if (/(запах гару|горить|іскри|щиток|автомат вибив|коротк)/i.test(q)) {
    return {
      tradeRole: 'electrician',
      categorySlug: 'electrical',
      summary: 'Підозра на електричну аварію',
      urgent: true,
      kind: 'power_outage',
    }
  }

  if (/(розетк|вимикач|люстр|лампоч|провід)/i.test(q)) {
    return {
      tradeRole: 'handyman',
      categorySlug: 'handyman',
      summary: 'Дрібна електрика / фурнітура',
      urgent: false,
      kind: 'general',
    }
  }

  if (/(електрик|electrical|wiring)/i.test(q)) {
    return {
      tradeRole: 'electrician',
      categorySlug: 'electrical',
      summary: text.trim().slice(0, 80),
      urgent,
      kind: 'power_outage',
    }
  }

  if (text.trim().length >= 8) {
    return {
      tradeRole: 'general',
      categorySlug: 'handyman',
      summary: text.trim().slice(0, 80),
      urgent,
      kind: 'general',
    }
  }
  return null
}

/** Symptom question + quick replies — depends on problem kind, NOT one template. */
function symptomPrompt(kind: ProblemKind, locale: string): {
  replyText: string
  quickReplies: string[]
} {
  const uk = !locale || locale.startsWith('uk') || locale.startsWith('ru')
  switch (kind) {
    case 'ac_cooling':
      return {
        replyText: uk
          ? 'Що саме помічаєте з кондиціонером? (можна кілька слів)'
          : 'What exactly is wrong with the AC?',
        quickReplies: uk
          ? [
              'Дує, але повітря тепле',
              'Слабко холодить',
              'Тече вода',
              'Шумить / гуде',
              'Давно не чистили фільтр',
              'Не знаю',
            ]
          : ['Blows warm air', 'Weak cooling', 'Leaking water', 'Noisy', 'Filter never cleaned', 'Not sure'],
      }
    case 'power_outage':
      return {
        replyText: uk
          ? 'Чи були запах гару, іскри, вибивало автомат — чи темно лише в одній кімнаті?'
          : 'Any burning smell, sparks, tripped breaker — or dark in one room only?',
        quickReplies: uk
          ? ['Запах гару / іскри', 'Вибило автомат', 'Темно всюди', 'Лише одна кімната', 'Не знаю']
          : ['Burning smell / sparks', 'Breaker tripped', 'Whole place dark', 'One room only', 'Not sure'],
      }
    case 'plumbing':
      return {
        replyText: uk
          ? 'Де тече / що не працює? Сильний напір чи капає?'
          : 'Where is the leak / what fails? Strong flow or dripping?',
        quickReplies: uk
          ? ['Тече кран', 'Труба / стояк', 'Унітаз', 'Затоплення', 'Немає води', 'Не знаю']
          : ['Faucet leak', 'Pipe', 'Toilet', 'Flooding', 'No water', 'Not sure'],
      }
    case 'heating':
      return {
        replyText: uk
          ? 'Батареї холодні всюди чи в одній кімнаті? Котел працює?'
          : 'Are radiators cold everywhere or in one room? Is the boiler running?',
        quickReplies: uk
          ? ['Усюди холодно', 'Одна кімната', 'Котел не стартує', 'Була вода під котлом', 'Не знаю']
          : ['Everywhere cold', 'One room', 'Boiler won’t start', 'Water under boiler', 'Not sure'],
      }
    case 'appliance':
      return {
        replyText: uk
          ? 'Яка техніка і що саме робить (не вмикається, шумить, помилка на екрані)?'
          : 'Which appliance and what happens (won’t start, noise, error code)?',
        quickReplies: uk
          ? ['Не вмикається', 'Шумить', 'Код помилки', 'Тече', 'Не знаю']
          : ['Won’t start', 'Noise', 'Error code', 'Leaking', 'Not sure'],
      }
    case 'painting':
      return {
        replyText: uk
          ? 'Що фарбувати і яка площа приблизно?'
          : 'What needs painting and roughly what area?',
        quickReplies: uk
          ? ['Кімната', 'Квартира', 'Фасад', 'Двері/вікна', 'Не знаю']
          : ['One room', 'Whole flat', 'Facade', 'Doors/windows', 'Not sure'],
      }
    case 'cleaning':
      return {
        replyText: uk ? 'Яке прибирання потрібно?' : 'What kind of cleaning do you need?',
        quickReplies: uk
          ? ['Після ремонту', 'Підтримка', 'Генеральне', 'Офіс', 'Не знаю']
          : ['After renovation', 'Regular', 'Deep clean', 'Office', 'Not sure'],
      }
    default:
      return {
        replyText: uk
          ? 'Що саме потрібно зробити? Коротко опишіть обсяг робіт.'
          : 'What exactly needs to be done? Briefly describe the scope.',
        quickReplies: uk
          ? ['Повний ремонт', 'Частковий ремонт', 'Кошторис', 'Знайти бригаду', 'Не знаю']
          : ['Full renovation', 'Partial work', 'Cost estimate', 'Find a crew', 'Not sure'],
      }
  }
}

function resolveTradeAfterSymptoms(
  draft: JobRequestDraft,
  symptoms: string,
): { tradeRole: TradeRole; categorySlug: string; reasonKey: TranslationKey; replyText?: string } {
  const kind = (draft.problemKind || 'general') as ProblemKind
  const s = `${draft.problemText || ''} ${symptoms}`.toLowerCase()
  const uk = true

  if (kind === 'ac_cooling') {
    // Electrical danger only if clear electrical signs on the AC unit
    if (/(запах гару|іскр|дим|горить провод|автомат вибив)/i.test(s)) {
      return {
        tradeRole: 'electrician',
        categorySlug: 'electrical',
        reasonKey: 'salesBot.tradeElectrician',
        replyText: uk
          ? 'Є ознаки електрики — краще викликати електрика (безпека). Далі потрібна ваша локація.'
          : 'Sounds electrical — better call an electrician. Next I need your location.',
      }
    }
    return {
      tradeRole: 'hvac',
      categorySlug: 'handyman',
      reasonKey: 'salesBot.tradeHandyman',
      replyText: uk
        ? 'Схоже на майстра з кондиціонерів (чистка / фреон / сервіс). Далі — ваше місто, щоб знайти когось поруч.'
        : 'Looks like an AC technician job. Next — your location to find someone nearby.',
    }
  }

  if (kind === 'power_outage') {
    if (/(запах|гар|дим|іскр|щиток|уся квартир|весь будинок|автомат|горить|темн.*всюд)/i.test(s)) {
      return {
        tradeRole: 'electrician',
        categorySlug: 'electrical',
        reasonKey: 'salesBot.tradeElectrician',
        replyText: uk
          ? 'Це робота електрика. Далі визначу локацію і покажу майстрів поруч.'
          : 'This needs an electrician. Next I’ll get your location and show nearby pros.',
      }
    }
    if (/(одна ламп|розетк|люстр|нема в одній|тільки кімнат|лише одна)/i.test(s)) {
      return {
        tradeRole: 'handyman',
        categorySlug: 'handyman',
        reasonKey: 'salesBot.tradeHandyman',
        replyText: uk
          ? 'Якщо темно лише локально — часто вистачить домашнього майстра. Далі — локація.'
          : 'If it’s only one room, a handyman may be enough. Next — location.',
      }
    }
    return {
      tradeRole: 'electrician',
      categorySlug: 'electrical',
      reasonKey: 'salesBot.tradeElectrician',
      replyText: uk
        ? 'Для відсутності світла зазвичай потрібен електрик. Далі — локація.'
        : 'Power loss usually needs an electrician. Next — location.',
    }
  }

  if (kind === 'plumbing' || kind === 'heating') {
    return {
      tradeRole: 'plumber',
      categorySlug: 'handyman',
      reasonKey: 'salesBot.tradeHandyman',
      replyText: uk
        ? 'Потрібен сантехнік / майстер з опалення. Далі — ваше місто.'
        : 'You’ll need a plumber / heating tech. Next — your city.',
    }
  }

  if (kind === 'cleaning') {
    return {
      tradeRole: 'cleaner',
      categorySlug: 'cleaning',
      reasonKey: 'salesBot.tradeHandyman',
      replyText: uk ? 'Підберу клінінг. Далі — місто.' : 'I’ll find cleaners. Next — city.',
    }
  }

  if (kind === 'painting') {
    return {
      tradeRole: 'painter',
      categorySlug: 'construction',
      reasonKey: 'salesBot.tradeHandyman',
      replyText: uk ? 'Потрібен маляр. Далі — місто.' : 'You’ll need a painter. Next — city.',
    }
  }

  return {
    tradeRole: draft.tradeRole || 'handyman',
    categorySlug: draft.categorySlug || 'handyman',
    reasonKey: 'salesBot.tradeHandyman',
    replyText: uk
      ? 'Підберу майстра під цю задачу. Далі — ваше місто або «Гео».'
      : 'I’ll match a pro for this. Next — your city or “Geo”.',
  }
}

function applyCategory(
  draft: JobRequestDraft,
  slug: string,
  ctx: SalesBotContext,
): JobRequestDraft {
  const cat = findCategory(slug, ctx.categories)
  return {
    ...draft,
    categorySlug: slug,
    categoryId: cat?.id || draft.categoryId,
  }
}

function buildJobDescription(draft: JobRequestDraft): string {
  const parts = [
    draft.problemText,
    draft.diagnoseDuration ? `Як давно: ${draft.diagnoseDuration}` : '',
    draft.diagnoseSymptoms ? `Ознаки: ${draft.diagnoseSymptoms}` : '',
    draft.tradeRole ? `Потрібен: ${draft.tradeRole}` : '',
  ].filter(Boolean)
  const text = parts.join('\n')
  return text.length >= 15 ? text : `${text}\nПотрібна допомога майстра.`
}

export function getInitialTurn(ctx: SalesBotContext): SalesBotTurnResult {
  const draft = emptyJobRequestDraft()
  draft.currency = ctx.currencyCode
  if (ctx.profileName) draft.contactName = ctx.profileName
  if (ctx.profileEmail) draft.contactEmail = ctx.profileEmail
  if (ctx.profilePhone) draft.contactPhone = ctx.profilePhone
  if (ctx.suggestedCity) draft.location = ctx.suggestedCity
  if (ctx.suggestedLat != null) draft.latitude = ctx.suggestedLat
  if (ctx.suggestedLon != null) draft.longitude = ctx.suggestedLon

  return {
    replyKey: 'salesBot.welcome',
    step: 'welcome',
    draft,
    quickReplies: [
      'Немає світла',
      'Реклама',
      'Стати майстром',
      'Вакансія',
      'Продам / здам',
    ],
    canPublish: false,
  }
}

function askGeo(draft: JobRequestDraft): SalesBotTurnResult {
  const hasCity = Boolean(draft.location?.trim())
  return {
    replyKey: hasCity ? 'salesBot.geoConfirm' : 'salesBot.askGeo',
    replyParams: { city: draft.location || '' },
    step: 'geo',
    draft,
    quickReplies: hasCity
      ? ['Гео', draft.location!, 'Інше місто']
      : ['Гео', 'Київ', 'Львів', 'Warsaw'],
    canPublish: false,
  }
}

function afterTradeResolved(
  draft: JobRequestDraft,
  ctx: SalesBotContext,
  resolved: {
    tradeRole: TradeRole
    categorySlug: string
    reasonKey: TranslationKey
    replyText?: string
  },
): SalesBotTurnResult {
  const label =
    ctx.categoryLabels[draft.categorySlug || ''] || draft.categorySlug || ''
  const nextDraft: JobRequestDraft = {
    ...draft,
    description: buildJobDescription(draft),
    deadlineDays: draft.deadlineDays ?? 7,
    listingType: 'service_request',
  }
  const geoAsk = askGeo(nextDraft)
  const tradeLine = (resolved.replyText || '').trim()
  const geoHintUk =
    'Щоб показати майстрів поруч, потрібно визначити вашу геолокацію — зараз спробую «Гео», або напишіть місто.'
  const geoHintEn =
    'To show nearby pros I need your location — detecting GPS now, or type your city.'
  const geoHint =
    (ctx.locale || '').toLowerCase().startsWith('uk') ||
    (ctx.locale || '').toLowerCase().startsWith('ru')
      ? geoHintUk
      : geoHintEn
  return {
    ...geoAsk,
    replyKey: resolved.reasonKey,
    replyParams: { trade: label, city: nextDraft.location || '' },
    replyText: [tradeLine, geoHint].filter(Boolean).join('\n\n'),
    quickReplies: geoAsk.quickReplies,
    // Auto-trigger browser geolocation in useSalesChat.
    sessionFlags: { request_geo: '1' },
  }
}

function hasUsableGeo(draft: JobRequestDraft): boolean {
  const city = draft.location?.trim()
  if (!city || city.length < 2) return false
  return (
    draft.latitude != null &&
    draft.longitude != null &&
    Number.isFinite(draft.latitude) &&
    Number.isFinite(draft.longitude)
  )
}

function matchesTurn(draft: JobRequestDraft): SalesBotTurnResult {
  if (!draft.location?.trim()) {
    return askGeo(draft)
  }
  return {
    replyKey: 'salesBot.showMatches',
    replyParams: {
      city: draft.location || '',
      trade: draft.categorySlug || '',
    },
    step: 'show_matches',
    draft: {
      ...draft,
      description: buildJobDescription(draft),
      title: buildDraftTitle(draft),
    },
    quickReplies: ['Так, опублікувати заявку', 'Ні, лише контакти'],
    canPublish: false,
    needsMatches: true,
  }
}

function startAdvertising(draft: JobRequestDraft): SalesBotTurnResult {
  return {
    replyKey: 'salesBot.adAskGoal',
    step: 'ad_goal',
    draft: { ...draft, intent: 'advertising' },
    quickReplies: ['Більше клієнтів', 'Банер на головній', 'Промо майстра'],
    canPublish: false,
  }
}

function startProfile(draft: JobRequestDraft, company: boolean): SalesBotTurnResult {
  return {
    replyKey: company ? 'salesBot.profileAskCompany' : 'salesBot.profileAskName',
    step: 'profile_name',
    draft: {
      ...draft,
      intent: company ? 'profile_company' : 'profile_pro',
      guideMeta: { ...meta(draft), role: company ? 'company' : 'professional' },
    },
    canPublish: false,
  }
}

function startVacancy(draft: JobRequestDraft): SalesBotTurnResult {
  return {
    replyKey: 'salesBot.vacancyAskTitle',
    step: 'vacancy_title',
    draft: {
      ...draft,
      intent: 'vacancy',
      listingType: 'service_offer',
      categorySlug: 'vacancies',
    },
    canPublish: false,
  }
}

function startSell(draft: JobRequestDraft): SalesBotTurnResult {
  return {
    replyKey: 'salesBot.sellAskMode',
    step: 'sell_mode',
    draft: {
      ...draft,
      intent: 'sell_rent',
      listingType: 'item_sale',
      categorySlug: 'sell-rent',
    },
    quickReplies: ['Продам', 'Здам в оренду', 'Куплю'],
    canPublish: false,
  }
}

function startCostEstimate(text: string, draft: JobRequestDraft, ctx: SalesBotContext): SalesBotTurnResult {
  const uk = !ctx.locale || ctx.locale.startsWith('uk') || ctx.locale.startsWith('ru')
  const projectTypeId = estimatorProjectTypeFromText(text)
  try {
    sessionStorage.setItem(
      'dimarket_estimator_ai_prefill',
      JSON.stringify({
        description: text.trim(),
        projectTypeId,
        source: 'sales_chat',
      }),
    )
  } catch {
    /* ignore */
  }
  return {
    replyKey: 'salesBot.welcome',
    replyText: uk
      ? 'Це виглядає як проєкт з кошторисом — відкриваю калькулятор вартості. Там уточнимо площу й деталі, і AI порахує орієнтовний бюджет.'
      : 'This looks like a budget estimate — opening the cost calculator. We’ll confirm size and details, then AI will give a Low–High range.',
    step: 'done',
    draft: {
      ...draft,
      intent: 'job_service',
      problemText: text.trim(),
      problemKind: 'general',
      guideMeta: { ...meta(draft), estimate: '1', projectTypeId },
    },
    quickReplies: [],
    canPublish: false,
    navigateTo: '/cost-estimator',
  }
}

function startPlannedRenovation(
  text: string,
  draft: JobRequestDraft,
  ctx: SalesBotContext,
): SalesBotTurnResult {
  const uk = !ctx.locale || ctx.locale.startsWith('uk') || ctx.locale.startsWith('ru')
  const guess = guessProblem(text)
  let next: JobRequestDraft = {
    ...draft,
    intent: 'job_service',
    problemText: text.trim(),
    problemKind: 'general',
    listingType: 'service_request',
    deadlineDays: 30,
  }
  if (guess) {
    next = applyCategory(
      { ...next, tradeRole: guess.tradeRole, problemKind: guess.kind },
      guess.categorySlug,
      ctx,
    )
  } else {
    next = applyCategory({ ...next, tradeRole: 'general' }, 'construction', ctx)
  }
  return {
    replyKey: 'salesBot.welcome',
    replyText: uk
      ? 'Зрозумів: плановий ремонт (не аварія). Що зробимо далі?'
      : 'Got it: planned renovation (not an emergency). What next?',
    step: 'renovation_choice',
    draft: next,
    quickReplies: uk
      ? ['Зробити кошторис', 'Знайти майстрів', 'Опублікувати заявку']
      : ['Make cost estimate', 'Find pros', 'Publish job request'],
    canPublish: false,
  }
}

function startJobFromText(
  text: string,
  draft: JobRequestDraft,
  ctx: SalesBotContext,
): SalesBotTurnResult {
  if (wantsCostEstimate(text)) {
    return startCostEstimate(text, draft, ctx)
  }
  if (isPlannedRenovation(text)) {
    return startPlannedRenovation(text, draft, ctx)
  }

  const guess = guessProblem(text)
  let next: JobRequestDraft = {
    ...draft,
    intent: 'job_service',
    problemText: text.trim(),
    listingType: 'service_request',
  }
  if (guess) {
    next = applyCategory(
      {
        ...next,
        tradeRole: guess.tradeRole,
        problemKind: guess.kind,
        deadlineDays: guess.urgent ? 3 : 14,
      },
      guess.categorySlug,
      ctx,
    )
  } else {
    next.problemKind = 'general'
  }

  // Planned / non-urgent work: skip “how long has it been broken?” chips.
  const skipDuration =
    !guess?.urgent &&
    (guess?.kind === 'painting' ||
      guess?.kind === 'cleaning' ||
      guess?.kind === 'general' ||
      !guess)

  if (skipDuration) {
    const kind = (next.problemKind || 'general') as ProblemKind
    const pack = symptomPrompt(kind, ctx.locale)
    return {
      replyKey: 'salesBot.diagnoseSymptoms',
      replyText: pack.replyText,
      step: 'diagnose_symptoms',
      draft: { ...next, diagnoseDuration: 'планово' },
      quickReplies: pack.quickReplies,
      canPublish: false,
    }
  }

  return {
    replyKey: 'salesBot.diagnoseDuration',
    replyParams: { problem: guess?.summary || text.trim().slice(0, 60) },
    step: 'diagnose_duration',
    draft: next,
    quickReplies: ['Щойно', 'Кілька годин', 'З учора', 'Кілька днів'],
    canPublish: false,
  }
}

export function processSalesBotTurn(
  step: SalesBotStep,
  draft: JobRequestDraft,
  userMessage: string,
  ctx: SalesBotContext,
): SalesBotTurnResult {
  const text = userMessage.trim()
  const next = { ...draft, guideMeta: meta(draft) }

  // ——— Welcome: detect intent from free text ———
  if (step === 'welcome' || step === 'category') {
    if (wantsCostEstimate(text)) {
      return startCostEstimate(text, next, ctx)
    }
    if (isPlannedRenovation(text)) {
      return startPlannedRenovation(text, next, ctx)
    }
    const intent = detectIntent(text) || (guessProblem(text) ? 'job_service' : null)
    if (!intent) {
      return {
        replyKey: 'salesBot.intentUnknown',
        step: 'welcome',
        draft: next,
        quickReplies: [
          'Немає світла',
          'Кошторис ремонту',
          'Реклама',
          'Стати майстром',
          'Вакансія',
          'Продам / здам',
        ],
        canPublish: false,
      }
    }
    if (intent === 'advertising') return startAdvertising(next)
    if (intent === 'profile_company') return startProfile(next, true)
    if (intent === 'profile_pro') return startProfile(next, false)
    if (intent === 'vacancy') return startVacancy(next)
    if (intent === 'sell_rent') return startSell(next)
    return startJobFromText(text, next, ctx)
  }

  if (step === 'renovation_choice') {
    if (wantsCostEstimate(text) || /кошторис|estimate|бюджет|budget|калькулятор/i.test(text)) {
      return startCostEstimate(next.problemText || text, next, ctx)
    }
    if (/майстр|про|find|знайти|підібр/i.test(text)) {
      next.description = buildJobDescription(next)
      next.title = buildDraftTitle(next, ctx.categoryLabels[next.categorySlug || ''])
      return {
        ...askGeo(next),
        sessionFlags: { request_geo: '1' },
        replyText:
          !ctx.locale || ctx.locale.startsWith('uk') || ctx.locale.startsWith('ru')
            ? 'Добре — знайдемо майстрів поруч. Потрібна локація (або «Гео»).'
            : 'OK — I’ll find nearby pros. Need your location (or tap “Гео”).',
      }
    }
    if (YES.test(text) || /опублік|заявк|publish/i.test(text)) {
      next.description = buildJobDescription(next)
      next.title = buildDraftTitle(next, ctx.categoryLabels[next.categorySlug || ''])
      return {
        ...askGeo(next),
        sessionFlags: { request_geo: '1' },
      }
    }
    return startPlannedRenovation(next.problemText || text, next, ctx)
  }

  // ——— Job diagnostics ———
  if (step === 'diagnose_duration') {
    next.diagnoseDuration = text
    const kind = (next.problemKind || guessProblem(next.problemText || '')?.kind || 'general') as ProblemKind
    next.problemKind = kind
    const pack = symptomPrompt(kind, ctx.locale)
    return {
      replyKey: 'salesBot.diagnoseSymptoms',
      replyText: pack.replyText,
      step: 'diagnose_symptoms',
      draft: next,
      quickReplies: pack.quickReplies,
      canPublish: false,
    }
  }

  if (step === 'diagnose_symptoms') {
    next.diagnoseSymptoms = text
    if (!next.problemKind) {
      next.problemKind = guessProblem(next.problemText || '')?.kind || 'general'
    }
    const resolved = resolveTradeAfterSymptoms(next, text)
    next.tradeRole = resolved.tradeRole
    const withCat = applyCategory(next, resolved.categorySlug, ctx)
    return afterTradeResolved(withCat, ctx, resolved)
  }

  if (step === 'trade_confirm') {
    if (/електр|electric/i.test(text)) {
      const withCat = applyCategory(
        { ...next, tradeRole: 'electrician' },
        'electrical',
        ctx,
      )
      return askGeo(withCat)
    }
    if (/майстер|handyman|домашн/i.test(text)) {
      const withCat = applyCategory({ ...next, tradeRole: 'handyman' }, 'handyman', ctx)
      return askGeo(withCat)
    }
    return {
      replyKey: 'salesBot.tradeConfirmAsk',
      step: 'trade_confirm',
      draft: next,
      quickReplies: ['Електрик', 'Домашній майстер'],
      canPublish: false,
    }
  }

  if (step === 'geo') {
    if (USE_GEO.test(text) || /^гео$/i.test(text)) {
      return {
        replyKey: 'salesBot.geoLocating',
        step: 'geo',
        draft: next,
        quickReplies: [],
        canPublish: false,
        sessionFlags: { request_geo: '1' },
      }
    }
    if (/інше|other|змінити/i.test(text)) {
      return {
        replyKey: 'salesBot.askCity',
        replyParams: { category: ctx.categoryLabels[next.categorySlug || ''] || '' },
        step: 'geo',
        draft: { ...next, location: undefined, latitude: null, longitude: null },
        quickReplies: ['Гео', 'Київ', 'Львів', 'Warsaw'],
        canPublish: false,
      }
    }
    // "Так" alone is not enough — require city text, chip, or successful GPS.
    if (YES.test(text)) {
      if (hasUsableGeo(next) || next.location?.trim()) {
        next.description = buildJobDescription(next)
        next.title = buildDraftTitle(next, ctx.categoryLabels[next.categorySlug || ''])
        return matchesTurn(next)
      }
      return {
        ...askGeo(next),
        sessionFlags: { request_geo: '1' },
      }
    }
    if (text.length < 2 && !next.location) {
      return {
        replyKey: 'salesBot.cityTooShort',
        step: 'geo',
        draft: next,
        quickReplies: ['Гео', 'Київ', 'Львів'],
        canPublish: false,
      }
    }
    if (text.length >= 2 && !USE_GEO.test(text)) {
      next.location = text
      // City typed without coords — still usable for matching; prefer GPS when possible.
      if (next.latitude == null || next.longitude == null) {
        next.latitude = null
        next.longitude = null
      }
    }
    if (!next.location?.trim()) {
      return {
        ...askGeo(next),
        sessionFlags: { request_geo: '1' },
      }
    }
    next.description = buildJobDescription(next)
    next.title = buildDraftTitle(next, ctx.categoryLabels[next.categorySlug || ''])
    return matchesTurn(next)
  }

  if (step === 'show_matches' || step === 'ask_publish') {
    if (!next.location?.trim()) {
      return {
        ...askGeo(next),
        sessionFlags: { request_geo: '1' },
      }
    }
    if (YES.test(text) || /опублік|заявк|publish/i.test(text)) {
      if (draftNeedsContact(next)) {
        return {
          replyKey: 'salesBot.askContact',
          step: 'contact',
          draft: next,
          canPublish: false,
        }
      }
      return {
        replyKey: 'salesBot.confirmPublishJob',
        replyParams: {
          category: ctx.categoryLabels[next.categorySlug || ''] || next.categorySlug || '',
          city: next.location || '',
          description: (next.description || '').slice(0, 180),
        },
        step: 'confirm',
        draft: next,
        quickReplies: ['Так, опублікувати', 'Ні'],
        canPublish: false,
      }
    }
    if (NO.test(text) || /контакт|лише/i.test(text)) {
      return {
        replyKey: 'salesBot.matchesOnlyDone',
        step: 'done',
        draft: next,
        quickReplies: ['Спочатку'],
        canPublish: false,
      }
    }
    return {
      replyKey: 'salesBot.askPublishHint',
      step: 'ask_publish',
      draft: next,
      quickReplies: ['Так, опублікувати заявку', 'Ні, лише контакти'],
      canPublish: false,
      needsMatches: true,
    }
  }

  if (step === 'confirm' && next.intent === 'job_service') {
    if (YES.test(text)) {
      if (!next.location?.trim()) {
        return {
          ...askGeo(next),
          sessionFlags: { request_geo: '1' },
        }
      }
      return {
        replyKey: 'salesBot.publishing',
        step: 'confirm',
        draft: {
          ...next,
          description: buildJobDescription(next),
          title: buildDraftTitle(next, ctx.categoryLabels[next.categorySlug || '']),
        },
        canPublish: true,
      }
    }
    if (NO.test(text)) {
      return {
        replyKey: 'salesBot.diagnoseSymptoms',
        step: 'diagnose_symptoms',
        draft: next,
        canPublish: false,
      }
    }
    return {
      replyKey: 'salesBot.confirmHint',
      step: 'confirm',
      draft: next,
      quickReplies: ['Так, опублікувати', 'Ні'],
      canPublish: false,
    }
  }

  if (step === 'contact') {
    const phoneMatch = text.match(/\+?[\d\s()-]{8,}/)
    const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)
    if (phoneMatch) next.contactPhone = phoneMatch[0].replace(/\s/g, '')
    if (emailMatch) next.contactEmail = emailMatch[0]
    if (!phoneMatch && !emailMatch && text.includes('@')) next.contactEmail = text
    if (draftNeedsContact(next)) {
      return {
        replyKey: 'salesBot.contactRequired',
        step: 'contact',
        draft: next,
        canPublish: false,
      }
    }
    if (next.intent === 'vacancy') {
      return vacancyConfirm(next, ctx)
    }
    if (next.intent === 'sell_rent') {
      return sellConfirm(next)
    }
    return {
      replyKey: 'salesBot.confirmPublishJob',
      replyParams: {
        category: ctx.categoryLabels[next.categorySlug || ''] || '',
        city: next.location || '',
        description: (next.description || '').slice(0, 180),
      },
      step: 'confirm',
      draft: next,
      quickReplies: ['Так, опублікувати', 'Ні'],
      canPublish: false,
    }
  }

  // ——— Advertising ———
  if (step === 'ad_goal') {
    const d = withMeta(next, { ad_goal: text })
    return {
      replyKey: 'salesBot.adAskGeo',
      step: 'ad_geo',
      draft: d,
      quickReplies: ['Уся країна', 'Моє місто', 'Європа'],
      canPublish: false,
    }
  }
  if (step === 'ad_geo') {
    const d = withMeta(next, { ad_geo: text })
    return {
      replyKey: 'salesBot.adAskBudget',
      step: 'ad_budget',
      draft: d,
      quickReplies: ['50€', '100€', '200€', 'Ще не знаю'],
      canPublish: false,
    }
  }
  if (step === 'ad_budget') {
    const d = withMeta(next, { ad_budget: text })
    return {
      replyKey: 'salesBot.adReady',
      replyParams: {
        goal: meta(d).ad_goal || '',
        geo: meta(d).ad_geo || '',
        budget: text,
      },
      step: 'ad_ready',
      draft: d,
      quickReplies: ['Відкрити конструктор реклами'],
      canPublish: false,
      navigateTo: '/advertising',
      sessionFlags: { dimarket_ad_guide_start: '1' },
    }
  }
  if (step === 'ad_ready') {
    return {
      replyKey: 'salesBot.adReady',
      replyParams: {
        goal: meta(next).ad_goal || '',
        geo: meta(next).ad_geo || '',
        budget: meta(next).ad_budget || '',
      },
      step: 'done',
      draft: next,
      navigateTo: '/advertising',
      sessionFlags: { dimarket_ad_guide_start: '1' },
      canPublish: false,
    }
  }

  // ——— Profile ———
  if (step === 'profile_name') {
    const d = withMeta(next, { display_name: text })
    d.contactName = text
    return {
      replyKey: 'salesBot.profileAskCity',
      step: 'profile_city',
      draft: d,
      quickReplies: ctx.suggestedCity ? [ctx.suggestedCity, 'Гео'] : ['Гео', 'Київ'],
      canPublish: false,
    }
  }
  if (step === 'profile_city') {
    if (USE_GEO.test(text)) {
      return {
        replyKey: 'salesBot.geoLocating',
        step: 'profile_city',
        draft: next,
        sessionFlags: { request_geo: '1' },
        canPublish: false,
      }
    }
    const d = { ...next, location: text.length >= 2 ? text : next.location }
    return {
      replyKey: 'salesBot.profileAskTrade',
      step: 'profile_trade',
      draft: d,
      quickReplies: ['Електрика', 'Сантехніка', 'Ремонт', 'Прибирання'],
      canPublish: false,
    }
  }
  if (step === 'profile_trade') {
    const d = withMeta(next, { trade: text })
    return {
      replyKey: 'salesBot.profileAskPhone',
      step: 'profile_phone',
      draft: d,
      canPublish: false,
    }
  }
  if (step === 'profile_phone') {
    const phoneMatch = text.match(/\+?[\d\s()-]{8,}/)
    if (phoneMatch) next.contactPhone = phoneMatch[0].replace(/\s/g, '')
    else if (!SKIP.test(text)) next.contactPhone = text
    const role = meta(next).role || 'professional'
    return {
      replyKey: 'salesBot.profileReady',
      replyParams: {
        name: meta(next).display_name || next.contactName || '',
        city: next.location || '',
        trade: meta(next).trade || '',
      },
      step: 'profile_ready',
      draft: next,
      quickReplies: ['Відкрити реєстрацію'],
      canPublish: false,
      navigateTo: '/register',
      sessionFlags: {
        dimarket_profile_guide: JSON.stringify({
          role,
          name: meta(next).display_name || next.contactName,
          city: next.location,
          trade: meta(next).trade,
          phone: next.contactPhone,
        }),
      },
    }
  }
  if (step === 'profile_ready') {
    return {
      replyKey: 'salesBot.profileReady',
      replyParams: {
        name: meta(next).display_name || '',
        city: next.location || '',
        trade: meta(next).trade || '',
      },
      step: 'done',
      draft: next,
      navigateTo: '/register',
      canPublish: false,
    }
  }

  // ——— Vacancy ———
  if (step === 'vacancy_title') {
    next.title = text
    next.problemText = text
    const cat = findCategory('vacancies', ctx.categories)
    if (cat) {
      next.categoryId = cat.id
      next.categorySlug = 'vacancies'
    }
    return {
      replyKey: 'salesBot.vacancyAskCity',
      step: 'vacancy_city',
      draft: next,
      canPublish: false,
    }
  }
  if (step === 'vacancy_city') {
    next.location = text
    return {
      replyKey: 'salesBot.vacancyAskSalary',
      step: 'vacancy_salary',
      draft: next,
      quickReplies: ['Договірна', '1500€', '2000€', 'пропустити'],
      canPublish: false,
    }
  }
  if (step === 'vacancy_salary') {
    if (!SKIP.test(text) && !/догов/i.test(text)) {
      const n = parseFloat(text.replace(/[^\d.]/g, ''))
      if (Number.isFinite(n)) next.price = n
    }
    return {
      replyKey: 'salesBot.vacancyAskDesc',
      step: 'vacancy_desc',
      draft: next,
      canPublish: false,
    }
  }
  if (step === 'vacancy_desc') {
    if (text.length < 15) {
      return {
        replyKey: 'salesBot.descriptionTooShort',
        step: 'vacancy_desc',
        draft: next,
        canPublish: false,
      }
    }
    next.description = text
    if (draftNeedsContact(next)) {
      return {
        replyKey: 'salesBot.askContact',
        step: 'contact',
        draft: next,
        canPublish: false,
      }
    }
    return vacancyConfirm(next, ctx)
  }
  if (step === 'vacancy_confirm') {
    if (YES.test(text)) {
      return {
        replyKey: 'salesBot.publishing',
        step: 'vacancy_confirm',
        draft: next,
        canPublish: true,
      }
    }
    return {
      replyKey: 'salesBot.confirmHint',
      step: 'vacancy_confirm',
      draft: next,
      quickReplies: ['Так, опублікувати', 'Ні'],
      canPublish: false,
    }
  }

  // ——— Sell / rent ———
  if (step === 'sell_mode') {
    let mode = 'sell'
    if (/здам|оренд|rent/i.test(text)) mode = 'rent'
    if (/купл|buy|wanted/i.test(text)) mode = 'buy'
    const d = withMeta(next, { sell_mode: mode })
    d.listingType = mode === 'buy' ? 'item_wanted' : 'item_sale'
    const cat = findCategory('sell-rent', ctx.categories)
    if (cat) {
      d.categoryId = cat.id
      d.categorySlug = 'sell-rent'
    }
    return {
      replyKey: 'salesBot.sellAskWhat',
      step: 'sell_what',
      draft: d,
      canPublish: false,
    }
  }
  if (step === 'sell_what') {
    next.title = text
    next.problemText = text
    return {
      replyKey: 'salesBot.sellAskCity',
      step: 'sell_city',
      draft: next,
      canPublish: false,
    }
  }
  if (step === 'sell_city') {
    next.location = text
    return {
      replyKey: 'salesBot.sellAskPrice',
      step: 'sell_price',
      draft: next,
      quickReplies: ['Договірна', '100€', '500€', 'пропустити'],
      canPublish: false,
    }
  }
  if (step === 'sell_price') {
    if (!SKIP.test(text) && !/догов/i.test(text)) {
      const n = parseFloat(text.replace(/[^\d.]/g, ''))
      if (Number.isFinite(n)) next.price = n
    }
    return {
      replyKey: 'salesBot.sellAskDesc',
      step: 'sell_desc',
      draft: next,
      canPublish: false,
    }
  }
  if (step === 'sell_desc') {
    if (text.length < 15) {
      return {
        replyKey: 'salesBot.descriptionTooShort',
        step: 'sell_desc',
        draft: next,
        canPublish: false,
      }
    }
    next.description = `${meta(next).sell_mode || 'sell'}: ${next.title}\n${text}`
    if (draftNeedsContact(next)) {
      return {
        replyKey: 'salesBot.askContact',
        step: 'contact',
        draft: next,
        canPublish: false,
      }
    }
    return sellConfirm(next)
  }
  if (step === 'sell_confirm') {
    if (YES.test(text)) {
      return {
        replyKey: 'salesBot.publishing',
        step: 'sell_confirm',
        draft: next,
        canPublish: true,
      }
    }
    return {
      replyKey: 'salesBot.confirmHint',
      step: 'sell_confirm',
      draft: next,
      quickReplies: ['Так, опублікувати', 'Ні'],
      canPublish: false,
    }
  }

  if (step === 'done') {
    return getInitialTurn(ctx)
  }

  // Legacy confirm for non-job
  if (step === 'confirm') {
    if (YES.test(text)) {
      return {
        replyKey: 'salesBot.publishing',
        step: 'confirm',
        draft: next,
        canPublish: true,
      }
    }
    return {
      replyKey: 'salesBot.confirmHint',
      step: 'confirm',
      draft: next,
      quickReplies: ['Так, опублікувати', 'Ні'],
      canPublish: false,
    }
  }

  return getInitialTurn(ctx)
}

function vacancyConfirm(draft: JobRequestDraft, ctx: SalesBotContext): SalesBotTurnResult {
  return {
    replyKey: 'salesBot.vacancyConfirm',
    replyParams: {
      title: draft.title || '',
      city: draft.location || '',
      salary: draft.price != null ? String(draft.price) : '—',
      description: (draft.description || '').slice(0, 160),
    },
    step: 'vacancy_confirm',
    draft,
    quickReplies: ['Так, опублікувати', 'Ні'],
    canPublish: false,
  }
}

function sellConfirm(draft: JobRequestDraft): SalesBotTurnResult {
  return {
    replyKey: 'salesBot.sellConfirm',
    replyParams: {
      title: draft.title || '',
      city: draft.location || '',
      price: draft.price != null ? String(draft.price) : '—',
      mode: meta(draft).sell_mode || 'sell',
      description: (draft.description || '').slice(0, 160),
    },
    step: 'sell_confirm',
    draft,
    quickReplies: ['Так, опублікувати', 'Ні'],
    canPublish: false,
  }
}

/** @deprecated kept for callers expecting category list helper */
export function categoryListText(
  categories: SalesCategoryOption[],
  labels: Record<string, string>,
): string {
  return categories.map((c, i) => `${i + 1}. ${labels[c.slug] || c.name}`).join('\n')
}
