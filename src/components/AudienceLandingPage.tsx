import { ArrowRight, CheckCircle2, MapPin } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { navigateTo } from '../lib/navigation'
import { LAUNCH_MARKETS } from '../lib/launchMarkets'
import type { AudienceLandingConfig } from '../lib/audienceLanding'

interface AudienceLandingPageProps {
  config: AudienceLandingConfig
}

export function AudienceLandingPage({ config }: AudienceLandingPageProps) {
  const { t } = useApp()

  return (
    <div className="py-8 pb-24 lg:pb-8">
      <section className="glass-panel p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-700)]">
          {t(config.eyebrowKey)}
        </p>
        <h1 className="mt-2 max-w-3xl font-[var(--font-display)] text-3xl font-extrabold tracking-tight text-[var(--ink-900)] md:text-4xl">
          {t(config.titleKey)}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-600)]">
          {t(config.subtitleKey)}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => navigateTo(config.registerPath)}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-full"
          >
            <span>{t(config.ctaKey)}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            className="btn-secondary rounded-full"
          >
            {t('landing.signIn')}
          </button>
        </div>

        <p className="mt-4 text-sm font-semibold text-[#6366f1]">
          {t(config.freeNoteKey)}
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-5 md:p-6">
          <h2 className="text-xl font-extrabold text-[var(--ink-900)]">
            {t('landing.benefitsTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {config.benefitKeys.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-sm leading-6 text-[var(--ink-700)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-600)]" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-5 md:p-6">
          <h2 className="text-xl font-extrabold text-[var(--ink-900)]">
            {t('landing.stepsTitle')}
          </h2>
          <ol className="mt-4 space-y-4">
            {config.stepKeys.map((key, index) => (
              <li key={key} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(199,138,96,0.16)] text-xs font-extrabold text-[var(--accent-700)]">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-[var(--ink-700)]">{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="glass-panel mt-6 p-5 md:p-6">
        <h2 className="text-xl font-extrabold text-[var(--ink-900)]">
          {t('landing.launchCitiesTitle')}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-600)]">
          {t(config.launchPitchKey)}
        </p>
        <p className="mt-2 text-sm text-[var(--ink-500)]">{t('launch.globalNote')}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {LAUNCH_MARKETS.map((market) => (
            <div
              key={market.id}
              className="rounded-none border border-[var(--glass-border)] bg-white p-4"
            >
              <div className="flex items-center gap-1.5 text-sm font-extrabold text-[var(--ink-900)]">
                <MapPin className="h-4 w-4 text-[var(--accent-600)]" />
                <span>{market.city}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--ink-500)]">
                {market.region}, {market.countryCode}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-none border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.06)] p-6 text-center md:p-8">
        <h2 className="text-2xl font-extrabold text-[var(--ink-900)]">
          {t('landing.finalCtaTitle')}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--ink-600)]">
          {t('landing.finalCtaText')}
        </p>
        <button
          type="button"
          onClick={() => navigateTo(config.registerPath)}
          className="btn-primary mt-5 inline-flex items-center gap-2 rounded-full"
        >
          <span>{t(config.ctaKey)}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  )
}
