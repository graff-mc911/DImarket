import { Bot, ShieldCheck, Wallet } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

export function HomeWhyDimarket() {
  const { t } = useApp()

  const cards = [
    {
      icon: ShieldCheck,
      title: t('homePremium.whyVerifiedTitle'),
      text: t('homePremium.whyVerifiedText'),
    },
    {
      icon: Bot,
      title: t('homePremium.whyAiTitle'),
      text: t('homePremium.whyAiText'),
    },
    {
      icon: Wallet,
      title: t('homePremium.whyPaymentsTitle'),
      text: t('homePremium.whyPaymentsText'),
    },
  ]

  return (
    <section className="home-section home-section--muted layout-page-gutter" aria-labelledby="home-why-title">
      <div className="cabinet-sheet">
        <div className="cabinet-sheet__head">
          <div className="dimarket-categories__head mb-0" style={{ textAlign: 'center' }}>
            <p className="dimarket-categories__eyebrow">{t('homePremium.whyEyebrow')}</p>
            <h2 id="home-why-title" className="dimarket-categories__title">
              {t('homePremium.whyTitle')}
            </h2>
            <p className="home-section__subtitle" style={{ marginTop: '0.35rem' }}>
              {t('homePremium.whySubtitle')}
            </p>
          </div>
        </div>

        <div className="cabinet-sheet__grid" role="list">
          {cards.map((card) => (
            <article key={card.title} className="home-why-card" role="listitem">
              <span className="home-why-card__icon" aria-hidden>
                <card.icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
