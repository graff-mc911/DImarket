// ============================================================
// Profile.tsx — Особиста сторінка профілю авторизованого користувача
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  Calendar,
  Edit3,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { deleteCurrentAccount } from '../lib/deleteAccount'
import { Profile as ProfileType } from '../lib/types'
import { PortfolioManager } from '../components/portfolio/PortfolioManager'
import { ReviewFeed } from '../components/reviews/ReviewFeed'
import { ScbLightPanel } from '../components/ScbLightPanel'
import { isSiteOwner } from '../lib/siteOwner'

function normalizeWebsiteHref(url: string | null | undefined): string {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function Profile() {
  const { user: contextUser, profile: contextProfile, t, signOut } = useApp()

  const [userId, setUserId] = useState<string | null>(contextUser?.id ?? null)
  const [profile, setProfile] = useState<ProfileType | null>(contextProfile)
  const [activeListingsCount, setActiveListingsCount] = useState(0)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'reviews'>('portfolio')
  const [accountBusy, setAccountBusy] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  const loadProfileData = useCallback(async (uid: string) => {
    setLoading(true)
    setLoadError(null)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle()

      if (profileError) throw profileError

      if (profileData) {
        setProfile(profileData)
      } else {
        setProfile(null)
      }

      const { count, error: listingsError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', uid)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())

      if (listingsError) throw listingsError
      setActiveListingsCount(count ?? 0)
    } catch (error) {
      console.error('Помилка завантаження профілю:', error)
      setLoadError(t('settings.error.loadProfile'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      let activeUser = contextUser

      if (!activeUser) {
        const {
          data: { user: remoteUser },
          error,
        } = await supabase.auth.getUser()

        if (cancelled) return
        if (error) {
          console.error('Profile auth:', error)
        }
        activeUser = remoteUser ?? null
      }

      if (!activeUser) {
        setAuthChecked(true)
        navigateTo('/login')
        return
      }

      setUserId(activeUser.id)
      if (contextProfile && contextProfile.id === activeUser.id) {
        setProfile(contextProfile)
      }

      setAuthChecked(true)
      await loadProfileData(activeUser.id)
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [contextUser, contextProfile, loadProfileData])

  useEffect(() => {
    if (!userId || !contextProfile || contextProfile.id !== userId) return
    setProfile(contextProfile)
  }, [contextProfile, userId])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="glass-card p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
          <p className="muted-text mt-4 text-sm">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  if (!userId) {
    return null
  }

  const formatMemberSince = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={
          i < Math.round(rating)
            ? 'h-4 w-4 fill-current text-[#c78a60]'
            : 'h-4 w-4 text-[var(--glass-border-strong)]'
        }
      />
    ))

  const initials = profile?.full_name
    ? profile.full_name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() || '')
        .join('')
    : 'DI'

  const phoneHref = profile?.phone ? `tel:${profile.phone}` : ''
  const websiteHref = normalizeWebsiteHref(profile?.website)
  const websiteText = profile?.website ? profile.website.replace(/^https?:\/\//, '') : ''
  const ratingValue = Number(profile?.rating ?? 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="glass-card p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--glass-border)] border-t-[var(--accent-700)]" />
          <p className="muted-text mt-4 text-sm">{t('profile.loading')}</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="py-10">
        <div className="glass-card mx-auto max-w-md p-8 text-center">
          <p className="text-sm text-[#a44a3a]">{loadError}</p>
          <button
            type="button"
            onClick={() => userId && void loadProfileData(userId)}
            className="btn-primary mt-4 rounded-full"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="layout-page-content py-8 pb-24 lg:pb-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="glass-panel fade-rise overflow-hidden">
          <div className="relative h-32 border-b border-[rgba(148,163,184,0.22)] bg-[#f3f0ea]">
            <button
              type="button"
              onClick={() => navigateTo('/settings')}
              className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-[rgba(148,163,184,0.22)] bg-white px-3 py-1.5 text-sm font-semibold text-[#2f2a24] transition hover:bg-[#f7f5f2]"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {t('profile.editProfile')}
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4">
              {profile?.profile_photo || profile?.avatar_url ? (
                <img
                  src={profile.profile_photo || profile.avatar_url || ''}
                  alt={profile.full_name || 'Profile'}
                  className="h-24 w-24 rounded-none border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-none border-4 border-white bg-white text-xl font-bold shadow-lg"
                  style={{ color: 'var(--accent-700)' }}
                >
                  {initials}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h1
                  className="text-2xl font-bold tracking-[-0.03em]"
                  style={{ color: 'var(--ink-900)' }}
                >
                  {profile?.full_name || '—'}
                </h1>

                {profile?.location && (
                  <div
                    className="mt-1 flex items-center gap-1.5 text-sm"
                    style={{ color: 'var(--ink-500)' }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}

                {ratingValue > 0 && profile && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex">{renderStars(ratingValue)}</div>
                    <span className="text-sm font-bold" style={{ color: 'var(--ink-900)' }}>
                      {ratingValue.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
                      ({profile.total_reviews} {t('profile.reviewsCount')})
                    </span>
                  </div>
                )}

                {profile?.bio && (
                  <p className="muted-text mt-3 max-w-xl text-sm leading-relaxed">{profile.bio}</p>
                )}

                {!profile && (
                  <p className="muted-text mt-3 text-sm">{t('profile.emptyHint')}</p>
                )}
              </div>

              <div className="flex flex-col gap-2.5 text-sm sm:min-w-[200px]">
                {phoneHref && profile?.phone && (
                  <a
                    href={phoneHref}
                    className="flex items-center gap-2 transition"
                    style={{ color: 'var(--ink-700)' }}
                  >
                    <Phone className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                    {profile.phone}
                  </a>
                )}

                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition"
                    style={{ color: 'var(--ink-700)' }}
                  >
                    <Globe className="h-4 w-4" style={{ color: 'var(--accent-500)' }} />
                    <span className="max-w-[150px] truncate">{websiteText}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}

                {profile?.created_at && (
                  <div className="flex items-center gap-2" style={{ color: 'var(--ink-500)' }}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('profile.memberSince')} {formatMemberSince(profile.created_at)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2" style={{ color: 'var(--ink-500)' }}>
                  <MessageCircle className="h-4 w-4" />
                  <span>
                    {activeListingsCount} {t('profile.activeAds')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-[var(--glass-border)] pt-5 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={accountBusy}
                onClick={() => {
                  void (async () => {
                    setAccountBusy(true)
                    setAccountError(null)
                    try {
                      await signOut()
                      navigateTo('/')
                    } catch {
                      setAccountError(t('common.error'))
                    } finally {
                      setAccountBusy(false)
                    }
                  })()
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2f2a24] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {t('header.signOut')}
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/settings')}
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-full"
              >
                <Edit3 className="h-4 w-4" />
                {t('header.settings')}
              </button>
              <button
                type="button"
                disabled={accountBusy}
                onClick={() => {
                  const confirmed = window.confirm(t('settings.confirm.deleteAccount'))
                  if (!confirmed) return
                  void (async () => {
                    setAccountBusy(true)
                    setAccountError(null)
                    try {
                      await deleteCurrentAccount()
                      navigateTo('/')
                    } catch (err) {
                      console.error(err)
                      setAccountError(t('settings.error.deleteAccount'))
                    } finally {
                      setAccountBusy(false)
                    }
                  })()
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(185,63,63,0.35)] bg-[rgba(255,237,232,0.55)] px-5 py-2.5 text-sm font-semibold text-[#b14e37] transition hover:bg-[rgba(255,237,232,0.9)] disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {t('settings.deleteAccountButton')}
              </button>
            </div>
            {accountError ? (
              <p className="mt-3 text-sm text-[#a44a3a]">{accountError}</p>
            ) : null}
          </div>
        </div>

        {userId &&
        (profile?.user_role === 'professional' ||
          profile?.user_role === 'company' ||
          profile?.is_professional ||
          isSiteOwner(profile, contextUser?.email)) ? (
          <ScbLightPanel userId={userId} />
        ) : null}

        <div className="glass-card">
          <div className="flex border-b border-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => setActiveTab('portfolio')}
              className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
              style={
                activeTab === 'portfolio'
                  ? { borderBottom: '2px solid var(--accent-700)', color: 'var(--accent-700)' }
                  : { color: 'var(--ink-500)' }
              }
            >
              <ImageIcon className="h-4 w-4" />
              {t('profile.portfolio')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className="flex flex-1 items-center justify-center gap-2 py-4 text-sm font-semibold transition-all"
              style={
                activeTab === 'reviews'
                  ? { borderBottom: '2px solid var(--accent-700)', color: 'var(--accent-700)' }
                  : { color: 'var(--ink-500)' }
              }
            >
              <Star className="h-4 w-4" />
              {t('profile.reviews')}
              {(profile?.total_reviews ?? 0) > 0 && (
                <span className="rounded-full border border-[var(--glass-border)] bg-white px-2 py-0.5 text-xs">
                  {profile?.total_reviews}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'portfolio' && (
            <div className="p-5">
              <PortfolioManager profileId={userId} viewerId={userId} editable />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-5">
              {userId ? (
                <ReviewFeed
                  professionalId={userId}
                  viewerId={userId}
                  viewerName={profile?.full_name || contextUser?.email || null}
                />
              ) : null}
            </div>
          )}
        </div>

        <div className="pb-4 text-center">
          <button
            type="button"
            onClick={() => navigateTo('/my-listings')}
            className="inline-flex items-center gap-2 text-sm font-semibold transition"
            style={{ color: 'var(--accent-700)' }}
          >
            {t('profile.viewAllListings')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
