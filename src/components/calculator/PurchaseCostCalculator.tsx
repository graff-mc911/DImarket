import { useMemo, useState } from 'react'
import { Building2, Calculator, Car, Info, Sparkles } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import {
  getCalculatorCountryConfig,
  listCalculatorCountries,
} from '../../config/calculatorRules'
import {
  calculateCarCost,
  calculateRealEstateCost,
} from '../../services/calculatorService'
import type {
  AssetType,
  CalculationResult,
  CarCondition,
  PropertyCondition,
} from '../../types/calculator'
import type { TranslationKey } from '../../lib/i18n'

export type PurchaseCostCalculatorProps = {
  /** Prefill asset category when embedding into a listing card. */
  initialAssetType?: AssetType
  /** Prefill base price (listing price). */
  initialPrice?: number
  /** Prefill ISO country code (ES, DE, PL, …). */
  initialCountry?: string
  /** Compact layout for embedding inside asset view pages. */
  embedded?: boolean
  className?: string
}

type CountryOption = { code: string; name: string }

const PROPERTY_QUICK = [100_000, 200_000, 300_000] as const
const CAR_QUICK = [10_000, 20_000, 35_000] as const

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  PLN: 'zł',
  UAH: '₴',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  SEK: 'kr',
  DKK: 'kr',
  BGN: 'лв',
}

const SUFFIX_CURRENCIES = new Set(['PLN', 'UAH', 'CZK', 'HUF', 'RON', 'SEK', 'DKK', 'BGN'])


const ITEM_LABEL_UK: Record<string, string> = {
  'es-re-resale-itp': 'ITP (податок на передачу)',
  'es-re-resale-notary': 'Нотаріус',
  'es-re-resale-registry': 'Реєстр власності',
  'es-re-resale-legal-gestoria': 'Юридичні / Gestoría',
  'es-re-new-iva': 'IVA (ПДВ)',
  'es-re-new-ajd': 'AJD (гербовий збір)',
  'es-re-new-notary-registry-legal': 'Нотаріус + реєстр + юрист',
  'es-car-used-itp': 'ITP (податок на передачу)',
  'es-car-used-dgt-transfer': 'Збір DGT за переоформлення',
  'es-car-used-gestoria': 'Gestoria / адмін. збір',
  'es-car-new-iedmt': 'IEDMT (реєстраційний податок CO₂)',
  'es-car-new-dgt-registration': 'Збір DGT за реєстрацію',
  'es-car-new-plates-docs': 'Номери та документи',
  'de-re-resale-grunderwerbsteuer': 'Grunderwerbsteuer (податок на купівлю)',
  'de-re-resale-notary-registry': 'Нотаріус + земельний реєстр',
  'de-re-new-grunderwerbsteuer': 'Grunderwerbsteuer (податок на купівлю)',
  'de-re-new-notary-registry': 'Нотаріус + земельний реєстр',
  'de-car-used-transfer': 'Збір за переоформлення',
  'de-car-new-vat': 'ПДВ (MwSt)',
  'de-car-new-registration': 'Реєстраційний збір',
  'pl-re-resale-pcc': 'PCC (податок на цивільно-правові угоди)',
  'pl-re-resale-notary': 'Нотаріус',
  'pl-re-resale-registry': 'Збір земельного реєстру',
  'pl-re-new-vat': 'ПДВ (житло ≤150 м²)',
  'pl-re-new-notary': 'Нотаріус',
  'pl-re-new-registry': 'Збір земельного реєстру',
  'pl-car-used-pcc': 'PCC (податок на угоду)',
  'pl-car-used-registration': 'Реєстраційний збір',
}

function currencySymbol(code: string | undefined): string {
  if (!code) return '€'
  return CURRENCY_SYMBOLS[code] ?? code
}

function formatMoney(amount: number, currencyCode: string): string {
  const symbol = currencySymbol(currencyCode)
  const body = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return SUFFIX_CURRENCIES.has(currencyCode) ? `${body} ${symbol}` : `${symbol}${body}`
}

function countryLabelKey(code: string): TranslationKey {
  return `purchaseCalc.country.${code}` as TranslationKey
}

function itemLabel(id: string, fallback: string, languageCode: string): string {
  if (languageCode === 'uk' && ITEM_LABEL_UK[id]) return ITEM_LABEL_UK[id]
  return fallback
}

/**
 * Interactive turnkey purchase cost calculator.
 * Visual language matches Dimarket home `cabinet-sheet` sections.
 */
export function PurchaseCostCalculator({
  initialAssetType = 'real_estate',
  initialPrice,
  initialCountry = 'ES',
  embedded = false,
  className = '',
}: PurchaseCostCalculatorProps) {
  const { t, language } = useApp()

  const countryOptions = useMemo<CountryOption[]>(() => {
    return listCalculatorCountries()
      .map((c) => ({
        code: String(c.countryCode).toUpperCase(),
        name: c.countryName,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, language.code || 'en'))
  }, [language.code])

  const supportedCodes = useMemo(
    () => new Set(countryOptions.map((c) => c.code)),
    [countryOptions],
  )

  const normalizeCountry = (code: string | undefined): string => {
    const upper = (code || 'ES').trim().toUpperCase()
    return supportedCodes.has(upper) ? upper : 'ES'
  }

  const [countryCode, setCountryCode] = useState(() => {
    const upper = (initialCountry || 'ES').trim().toUpperCase()
    return upper || 'ES'
  })
  const [assetType, setAssetType] = useState<AssetType>(initialAssetType)
  const [propertyCondition, setPropertyCondition] = useState<PropertyCondition>('resale')
  const [carCondition, setCarCondition] = useState<CarCondition>('used')
  const [basePrice, setBasePrice] = useState<number>(() => {
    if (initialPrice != null && Number.isFinite(initialPrice) && initialPrice > 0) {
      return Math.round(initialPrice)
    }
    return initialAssetType === 'car' ? 20_000 : 200_000
  })
  const [co2Emissions, setCo2Emissions] = useState(120)

  const countryConfig = getCalculatorCountryConfig(countryCode)
  const currency = countryConfig?.currency ?? 'EUR'
  const isSupported = supportedCodes.has(countryCode)
  const showCo2 = assetType === 'car' && carCondition === 'new'
  const quickBudgets = assetType === 'car' ? CAR_QUICK : PROPERTY_QUICK

  const result: CalculationResult | null = useMemo(() => {
    if (!isSupported || !(basePrice > 0)) return null
    try {
      if (assetType === 'real_estate') {
        return calculateRealEstateCost({
          countryCode,
          basePrice,
          condition: propertyCondition,
        })
      }
      return calculateCarCost({
        countryCode,
        basePrice,
        condition: carCondition,
        co2Emissions: showCo2 ? co2Emissions : undefined,
      })
    } catch {
      return null
    }
  }, [
    assetType,
    basePrice,
    carCondition,
    co2Emissions,
    countryCode,
    isSupported,
    propertyCondition,
    showCo2,
  ])

  const tipBudget = result?.finalTotalPrice ?? 0
  const tipMaxAsset = result ? tipBudget - result.totalTaxesAndFees : 0

  const shellClass = [
    'cabinet-sheet purchase-cost-calculator',
    embedded ? 'purchase-cost-calculator--embedded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <div className="cabinet-sheet__head">
        <div className="dimarket-categories__head mb-0" style={{ textAlign: 'left' }}>
          <p className="dimarket-categories__eyebrow" style={{ textAlign: 'left' }}>
            {embedded ? t('purchaseCalc.embedTitle') : t('purchaseCalc.eyebrow')}
          </p>
          {!embedded && (
            <>
              <h2 className="dimarket-categories__title" style={{ textAlign: 'left' }}>
                {t('purchaseCalc.title')}
              </h2>
              <p className="home-section__subtitle mt-2 max-w-3xl" style={{ textAlign: 'left' }}>
                {t('purchaseCalc.subtitle')}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="purchase-cost-calculator__layout">
        <div className="purchase-cost-calculator__controls">
          <label className="purchase-cost-calculator__field">
            <span>{t('purchaseCalc.country')}</span>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(normalizeCountry(e.target.value))}
              className="purchase-cost-calculator__select"
            >
              {countryOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {t(countryLabelKey(opt.code))}
                </option>
              ))}
            </select>
          </label>

          <div className="purchase-cost-calculator__field">
            <span>{t('purchaseCalc.category')}</span>
            <div className="purchase-cost-calculator__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={assetType === 'real_estate'}
                className={
                  assetType === 'real_estate'
                    ? 'purchase-cost-calculator__tab is-active'
                    : 'purchase-cost-calculator__tab'
                }
                onClick={() => {
                  setAssetType('real_estate')
                  if (basePrice < 50_000) setBasePrice(200_000)
                }}
              >
                <Building2 className="h-4 w-4" aria-hidden />
                {t('purchaseCalc.realEstate')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={assetType === 'car'}
                className={
                  assetType === 'car'
                    ? 'purchase-cost-calculator__tab is-active'
                    : 'purchase-cost-calculator__tab'
                }
                onClick={() => {
                  setAssetType('car')
                  if (basePrice > 80_000) setBasePrice(20_000)
                }}
              >
                <Car className="h-4 w-4" aria-hidden />
                {t('purchaseCalc.car')}
              </button>
            </div>
          </div>

          <div className="purchase-cost-calculator__field">
            <span>{t('purchaseCalc.condition')}</span>
            <div className="purchase-cost-calculator__tabs" role="tablist">
              {assetType === 'real_estate' ? (
                <>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={propertyCondition === 'resale'}
                    className={
                      propertyCondition === 'resale'
                        ? 'purchase-cost-calculator__tab is-active'
                        : 'purchase-cost-calculator__tab'
                    }
                    onClick={() => setPropertyCondition('resale')}
                  >
                    {t('purchaseCalc.resale')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={propertyCondition === 'new_build'}
                    className={
                      propertyCondition === 'new_build'
                        ? 'purchase-cost-calculator__tab is-active'
                        : 'purchase-cost-calculator__tab'
                    }
                    onClick={() => setPropertyCondition('new_build')}
                  >
                    {t('purchaseCalc.newBuild')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={carCondition === 'used'}
                    className={
                      carCondition === 'used'
                        ? 'purchase-cost-calculator__tab is-active'
                        : 'purchase-cost-calculator__tab'
                    }
                    onClick={() => setCarCondition('used')}
                  >
                    {t('purchaseCalc.used')}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={carCondition === 'new'}
                    className={
                      carCondition === 'new'
                        ? 'purchase-cost-calculator__tab is-active'
                        : 'purchase-cost-calculator__tab'
                    }
                    onClick={() => setCarCondition('new')}
                  >
                    {t('purchaseCalc.new')}
                  </button>
                </>
              )}
            </div>
          </div>

          <label className="purchase-cost-calculator__field">
            <span>{t('purchaseCalc.basePrice')}</span>
            <div className="purchase-cost-calculator__price-row">
              <span className="purchase-cost-calculator__currency" aria-hidden>
                {currencySymbol(currency)}
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={Number.isFinite(basePrice) ? basePrice : 0}
                onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value) || 0))}
                className="purchase-cost-calculator__input"
              />
            </div>
          </label>

          <div className="purchase-cost-calculator__field">
            <span>{t('purchaseCalc.quickBudget')}</span>
            <div className="purchase-cost-calculator__chips">
              {quickBudgets.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={
                    basePrice === amount
                      ? 'purchase-cost-calculator__chip is-active'
                      : 'purchase-cost-calculator__chip'
                  }
                  onClick={() => setBasePrice(amount)}
                >
                  {formatMoney(amount, 'EUR')}
                </button>
              ))}
            </div>
          </div>

          {showCo2 && (
            <label className="purchase-cost-calculator__field">
              <span>{t('purchaseCalc.co2')}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={co2Emissions}
                onChange={(e) => setCo2Emissions(Math.max(0, Number(e.target.value) || 0))}
                className="purchase-cost-calculator__input"
              />
              <small className="purchase-cost-calculator__hint">{t('purchaseCalc.co2Hint')}</small>
            </label>
          )}
        </div>

        <div className="purchase-cost-calculator__results">
          {!isSupported || !result ? (
            <div className="purchase-cost-calculator__empty" role="status">
              <Info
                className="h-5 w-5 shrink-0 text-[color:var(--brand-primary,#ff9900)]"
                aria-hidden
              />
              <p>{t('purchaseCalc.unsupported')}</p>
            </div>
          ) : (
            <>
              <div className="purchase-cost-calculator__panel">
                <div className="purchase-cost-calculator__panel-head">
                  <Calculator className="h-4 w-4" aria-hidden />
                  <h3>{t('purchaseCalc.breakdown')}</h3>
                </div>

                <div className="purchase-cost-calculator__row purchase-cost-calculator__row--base">
                  <span>{t('purchaseCalc.basePriceRow')}</span>
                  <strong>{formatMoney(result.basePrice, currency)}</strong>
                </div>

                <ul className="purchase-cost-calculator__items">
                  {result.items.map((row) => (
                    <li key={row.id} className="purchase-cost-calculator__row">
                      <span>
                        {itemLabel(row.id, row.name, language.code)}
                        {row.ratePercent != null ? (
                          <em className="purchase-cost-calculator__rate"> {row.ratePercent}%</em>
                        ) : null}
                      </span>
                      <strong>{formatMoney(row.amount, currency)}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="purchase-cost-calculator__totals">
                <div className="purchase-cost-calculator__total-card purchase-cost-calculator__total-card--extra">
                  <span>{t('purchaseCalc.extraCosts')}</span>
                  <strong>{formatMoney(result.totalTaxesAndFees, currency)}</strong>
                </div>
                <div className="purchase-cost-calculator__total-card purchase-cost-calculator__total-card--final">
                  <span>{t('purchaseCalc.finalTotal')}</span>
                  <strong>{formatMoney(result.finalTotalPrice, currency)}</strong>
                </div>
              </div>

              <div className="purchase-cost-calculator__tip" role="note">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                <p>
                  {t('purchaseCalc.tip')
                    .replace('{budget}', formatMoney(tipBudget, currency))
                    .replace('{maxAsset}', formatMoney(Math.max(0, tipMaxAsset), currency))}
                </p>
              </div>

              <p className="purchase-cost-calculator__disclaimer">{t('purchaseCalc.disclaimer')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
