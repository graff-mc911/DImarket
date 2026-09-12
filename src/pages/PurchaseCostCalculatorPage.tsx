import { useEffect } from 'react'
import { PurchaseCostCalculator } from '../components/calculator/PurchaseCostCalculator'
import { useApp } from '../contexts/AppContext'

/** Standalone purchase cost calculator — /purchase-calculator */
export function PurchaseCostCalculatorPage() {
  const { t } = useApp()

  useEffect(() => {
    const title = `${t('purchaseCalc.title')} · Dimarket`
    const description = t('purchaseCalc.subtitle')
    document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)
  }, [t])

  return (
    <div className="home-premium">
      <section
        className="home-section layout-page-gutter py-6"
        aria-labelledby="purchase-calculator-title"
      >
        <h1 id="purchase-calculator-title" className="sr-only">
          {t('purchaseCalc.title')}
        </h1>
        <PurchaseCostCalculator />
      </section>
    </div>
  )
}
