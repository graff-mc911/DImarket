import type { RegistrationRole } from './profileSync'
import type { TranslationKey } from './i18n'

export type AudienceLandingId = 'professionals' | 'companies' | 'advertisers'

export interface AudienceLandingConfig {
  id: AudienceLandingId
  registerRole: RegistrationRole
  registerPath: string
  eyebrowKey: TranslationKey
  titleKey: TranslationKey
  subtitleKey: TranslationKey
  ctaKey: TranslationKey
  freeNoteKey: TranslationKey
  benefitKeys: [TranslationKey, TranslationKey, TranslationKey, TranslationKey]
  stepKeys: [TranslationKey, TranslationKey, TranslationKey]
  launchPitchKey: TranslationKey
}

export const AUDIENCE_LANDINGS: Record<AudienceLandingId, AudienceLandingConfig> = {
  professionals: {
    id: 'professionals',
    registerRole: 'professional',
    registerPath: '/register?role=professional',
    eyebrowKey: 'landing.pro.eyebrow',
    titleKey: 'landing.pro.title',
    subtitleKey: 'landing.pro.subtitle',
    ctaKey: 'landing.pro.cta',
    freeNoteKey: 'landing.pro.freeNote',
    benefitKeys: [
      'landing.pro.benefit1',
      'landing.pro.benefit2',
      'landing.pro.benefit3',
      'landing.pro.benefit4',
    ],
    stepKeys: [
      'landing.pro.step1',
      'landing.pro.step2',
      'landing.pro.step3',
    ],
    launchPitchKey: 'landing.pro.launchPitch',
  },
  companies: {
    id: 'companies',
    registerRole: 'company',
    registerPath: '/register?role=company',
    eyebrowKey: 'landing.company.eyebrow',
    titleKey: 'landing.company.title',
    subtitleKey: 'landing.company.subtitle',
    ctaKey: 'landing.company.cta',
    freeNoteKey: 'landing.company.freeNote',
    benefitKeys: [
      'landing.company.benefit1',
      'landing.company.benefit2',
      'landing.company.benefit3',
      'landing.company.benefit4',
    ],
    stepKeys: [
      'landing.company.step1',
      'landing.company.step2',
      'landing.company.step3',
    ],
    launchPitchKey: 'landing.company.launchPitch',
  },
  advertisers: {
    id: 'advertisers',
    registerRole: 'advertiser',
    registerPath: '/register?role=advertiser',
    eyebrowKey: 'landing.advertiser.eyebrow',
    titleKey: 'landing.advertiser.title',
    subtitleKey: 'landing.advertiser.subtitle',
    ctaKey: 'landing.advertiser.cta',
    freeNoteKey: 'landing.advertiser.freeNote',
    benefitKeys: [
      'landing.advertiser.benefit1',
      'landing.advertiser.benefit2',
      'landing.advertiser.benefit3',
      'landing.advertiser.benefit4',
    ],
    stepKeys: [
      'landing.advertiser.step1',
      'landing.advertiser.step2',
      'landing.advertiser.step3',
    ],
    launchPitchKey: 'landing.advertiser.launchPitch',
  },
}
