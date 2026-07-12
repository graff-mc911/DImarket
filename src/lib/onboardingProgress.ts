import type { Profile } from './types'
import type { RegistrationRole } from './profileSync'

export interface OnboardingStep {
  id: string
  labelKey: string
  done: boolean
}

export interface OnboardingState {
  steps: OnboardingStep[]
  completedCount: number
  totalCount: number
  isReady: boolean
}

interface OnboardingInput {
  profile: Profile | null
  workSubcategoryCount: number
  role: RegistrationRole | 'client' | 'owner'
  advertiserVisitedAds?: boolean
}

export function buildOnboardingState(input: OnboardingInput): OnboardingState | null {
  const { profile, workSubcategoryCount, role, advertiserVisitedAds = false } = input
  if (!profile) return null

  if (role === 'advertiser') {
    const steps: OnboardingStep[] = [
      {
        id: 'name',
        labelKey: 'onboarding.advertiser.name',
        done: Boolean(profile.full_name?.trim()),
      },
      {
        id: 'location',
        labelKey: 'onboarding.advertiser.location',
        done: Boolean(profile.location?.trim()),
      },
      {
        id: 'phone',
        labelKey: 'onboarding.advertiser.phone',
        done: Boolean(profile.phone?.trim()),
      },
      {
        id: 'advertising',
        labelKey: 'onboarding.advertiser.exploreAds',
        done: advertiserVisitedAds,
      },
    ]
    const completedCount = steps.filter((s) => s.done).length
    return {
      steps,
      completedCount,
      totalCount: steps.length,
      isReady: completedCount >= 3,
    }
  }

  if (role !== 'professional' && role !== 'company') return null

  const steps: OnboardingStep[] = [
    {
      id: 'photo',
      labelKey: 'onboarding.pro.photo',
      done: Boolean(profile.profile_photo?.trim()),
    },
    {
      id: 'bio',
      labelKey: 'onboarding.pro.bio',
      done: (profile.bio?.trim().length ?? 0) >= 20,
    },
    {
      id: 'categories',
      labelKey: 'onboarding.pro.categories',
      done: workSubcategoryCount > 0,
    },
    {
      id: 'location',
      labelKey: 'onboarding.pro.location',
      done: Boolean(profile.location?.trim()),
    },
    {
      id: 'phone',
      labelKey: 'onboarding.pro.phone',
      done: Boolean(profile.phone?.trim()),
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  return {
    steps,
    completedCount,
    totalCount: steps.length,
    isReady: completedCount === steps.length,
  }
}
