import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../../contexts/AppContext'

interface CategoryFaqProps {
  categoryTitle: string
}

export function CategoryFaq({ categoryTitle }: CategoryFaqProps) {
  const { t } = useApp()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const items = useMemo(
    () => [
      {
        q: t('catPage.faq1q').replace('{category}', categoryTitle),
        a: t('catPage.faq1a').replace(/\{category\}/g, categoryTitle),
      },
      {
        q: t('catPage.faq2q').replace('{category}', categoryTitle),
        a: t('catPage.faq2a').replace(/\{category\}/g, categoryTitle),
      },
      {
        q: t('catPage.faq3q').replace('{category}', categoryTitle),
        a: t('catPage.faq3a').replace(/\{category\}/g, categoryTitle),
      },
      {
        q: t('catPage.faq4q').replace('{category}', categoryTitle),
        a: t('catPage.faq4a').replace(/\{category\}/g, categoryTitle),
      },
    ],
    [categoryTitle, t],
  )

  const faqJsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    }),
    [items],
  )

  return (
    <section className="cat-section" aria-labelledby="cat-faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="cat-section__head">
        <h2 id="cat-faq">{t('catPage.faqTitle')}</h2>
      </div>
      <div className="cat-faq">
        {items.map((item, index) => {
          const open = openIndex === index
          return (
            <div key={item.q} className={`cat-faq__item ${open ? 'is-open' : ''}`}>
              <button
                type="button"
                className="cat-faq__q"
                aria-expanded={open}
                aria-controls={`cat-faq-answer-${index}`}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.q}</span>
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
              {open ? (
                <p id={`cat-faq-answer-${index}`} className="cat-faq__a">
                  {item.a}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
