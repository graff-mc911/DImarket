import { useEffect, useId, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

const FAQ_KEYS = [
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
] as const

export function HomeFaq() {
  const { t } = useApp()
  const baseId = useId()
  const [open, setOpen] = useState<string | null>('q1')

  const items = useMemo(
    () =>
      FAQ_KEYS.map((key) => ({
        key,
        question: t(`homePremium.faq.${key}.q`),
        answer: t(`homePremium.faq.${key}.a`),
      })),
    [t],
  )

  useEffect(() => {
    const scriptId = 'home-faq-jsonld'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()

    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      document.getElementById(scriptId)?.remove()
    }
  }, [items])

  return (
    <section
      className="home-section home-section--tight layout-page-gutter"
      aria-labelledby="home-faq-title"
    >
      <div className="home-section__head home-section__head--center">
        <div>
          <p className="home-section__eyebrow">{t('homePremium.faqEyebrow')}</p>
          <h2 id="home-faq-title" className="home-section__title">
            {t('homePremium.faqTitle')}
          </h2>
          <p className="home-section__subtitle">{t('homePremium.faqSubtitle')}</p>
        </div>
      </div>

      <div className="home-faq">
        {items.map((item) => {
          const isOpen = open === item.key
          const panelId = `${baseId}-${item.key}-panel`
          const btnId = `${baseId}-${item.key}-btn`
          return (
            <div key={item.key} className={`home-faq__item ${isOpen ? 'is-open' : ''}`}>
              <h3>
                <button
                  id={btnId}
                  type="button"
                  className="home-faq__trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : item.key)}
                >
                  <span>{item.question}</span>
                  <ChevronDown className="home-faq__chevron" aria-hidden />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                hidden={!isOpen}
                className="home-faq__panel"
              >
                <p>{item.answer}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
