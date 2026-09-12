/**
 * Indicative purchase-cost presets for remaining EU countries + Ukraine.
 * Spain / Germany / Poland stay in `calculatorRules.ts` with richer market detail.
 *
 * These are planning averages (residential property / private cars), not legal advice.
 */

import type { CostRule, CountryCalculatorConfig } from '../types/calculator'

type EuPreset = {
  code: string
  name: string
  currency: string
  /** Resale property transfer / stamp tax %. */
  resaleTransferPercent: number
  resaleTransferName: string
  /** New-build residential VAT % (often already in developer price). */
  newBuildVatPercent: number
  /** Notary / conveyancing share of base (resale & new). */
  notaryPercent?: number
  /** Fixed land-registry / registration fee in local currency. */
  registryFixed?: number
  /** Used-car transfer / stamp tax % (0 if only a flat fee). */
  usedCarTransferPercent?: number
  usedCarTransferName?: string
  usedCarRegistrationFee: number
  newCarVatPercent: number
  newCarRegistrationFee: number
  notes?: string
}

function pct(
  id: string,
  name: string,
  ratePercent: number,
  type: CostRule['type'] = 'tax',
  extra?: Partial<CostRule>,
): CostRule {
  return {
    id,
    name,
    type,
    isMandatory: true,
    calculation: { kind: 'percent_of_base', ratePercent },
    ...extra,
  }
}

function fixed(
  id: string,
  name: string,
  amount: number,
  type: CostRule['type'] = 'fee',
  extra?: Partial<CostRule>,
): CostRule {
  return {
    id,
    name,
    type,
    isMandatory: true,
    calculation: { kind: 'fixed', amount },
    ...extra,
  }
}

function buildCountry(p: EuPreset): CountryCalculatorConfig {
  const code = p.code.toLowerCase()
  const notaryPercent = p.notaryPercent ?? 0
  const registryFixed = p.registryFixed ?? 0

  const resale: CostRule[] = []
  if (p.resaleTransferPercent > 0) {
    resale.push(pct(`${code}-re-resale-transfer`, p.resaleTransferName, p.resaleTransferPercent))
  }
  if (notaryPercent > 0) {
    resale.push(pct(`${code}-re-resale-notary`, 'Notary / Legal', notaryPercent, 'legal'))
  }
  if (registryFixed > 0) {
    resale.push(fixed(`${code}-re-resale-registry`, 'Land Registry Fee', registryFixed))
  }

  const newBuild: CostRule[] = [
    pct(`${code}-re-new-vat`, 'VAT (new build)', p.newBuildVatPercent, 'tax', {
      oftenIncludedInBasePrice: true,
      notes: 'Often included in the developer / dealer quote.',
    }),
  ]
  if (notaryPercent > 0) {
    newBuild.push(pct(`${code}-re-new-notary`, 'Notary / Legal', notaryPercent, 'legal'))
  }
  if (registryFixed > 0) {
    newBuild.push(fixed(`${code}-re-new-registry`, 'Land Registry Fee', registryFixed))
  }

  const usedCars: CostRule[] = []
  if ((p.usedCarTransferPercent ?? 0) > 0) {
    usedCars.push(
      pct(
        `${code}-car-used-transfer`,
        p.usedCarTransferName ?? 'Transfer Tax',
        p.usedCarTransferPercent!,
      ),
    )
  }
  usedCars.push(
    fixed(`${code}-car-used-registration`, 'Registration / Transfer Fee', p.usedCarRegistrationFee),
  )

  const newCars: CostRule[] = [
    pct(`${code}-car-new-vat`, 'VAT', p.newCarVatPercent, 'tax', {
      oftenIncludedInBasePrice: true,
    }),
    fixed(`${code}-car-new-registration`, 'Registration Fee', p.newCarRegistrationFee),
  ]

  return {
    countryCode: p.code,
    countryName: p.name,
    currency: p.currency,
    notes: p.notes,
    realEstate: {
      resale,
      new_build: newBuild,
      notes: 'Indicative residential averages for planning.',
    },
    cars: {
      used: usedCars,
      new: newCars,
      notes: 'Private-sale / dealer planning averages; exclude import/customs unless noted.',
    },
  }
}

/** All EU members except ES/DE/PL (kept as detailed presets) + Ukraine. */
const EU_UA_PRESETS: EuPreset[] = [
  {
    code: 'AT',
    name: 'Austria',
    currency: 'EUR',
    resaleTransferPercent: 3.5,
    resaleTransferName: 'Grunderwerbsteuer',
    newBuildVatPercent: 20,
    notaryPercent: 2,
    usedCarRegistrationFee: 150,
    newCarVatPercent: 20,
    newCarRegistrationFee: 200,
  },
  {
    code: 'BE',
    name: 'Belgium',
    currency: 'EUR',
    resaleTransferPercent: 12,
    resaleTransferName: 'Registration Duties',
    newBuildVatPercent: 21,
    notaryPercent: 1,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 21,
    newCarRegistrationFee: 150,
    notes: 'Flanders/Wallonia/Brussels rates vary; 12% used as planning baseline.',
  },
  {
    code: 'BG',
    name: 'Bulgaria',
    currency: 'BGN',
    resaleTransferPercent: 3,
    resaleTransferName: 'Local Transfer Tax',
    newBuildVatPercent: 20,
    notaryPercent: 1,
    registryFixed: 50,
    usedCarTransferPercent: 2,
    usedCarTransferName: 'Transfer Tax',
    usedCarRegistrationFee: 50,
    newCarVatPercent: 20,
    newCarRegistrationFee: 100,
  },
  {
    code: 'HR',
    name: 'Croatia',
    currency: 'EUR',
    resaleTransferPercent: 3,
    resaleTransferName: 'Real Estate Transfer Tax',
    newBuildVatPercent: 25,
    notaryPercent: 1,
    registryFixed: 50,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 25,
    newCarRegistrationFee: 150,
  },
  {
    code: 'CY',
    name: 'Cyprus',
    currency: 'EUR',
    resaleTransferPercent: 5,
    resaleTransferName: 'Transfer Fees',
    newBuildVatPercent: 19,
    notaryPercent: 1,
    registryFixed: 100,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 19,
    newCarRegistrationFee: 150,
  },
  {
    code: 'CZ',
    name: 'Czechia',
    currency: 'CZK',
    resaleTransferPercent: 0,
    resaleTransferName: 'Transfer Tax (abolished)',
    newBuildVatPercent: 21,
    notaryPercent: 1,
    registryFixed: 2000,
    usedCarRegistrationFee: 800,
    newCarVatPercent: 21,
    newCarRegistrationFee: 1200,
    notes: 'Property transfer tax abolished; notary + registry remain.',
  },
  {
    code: 'DK',
    name: 'Denmark',
    currency: 'DKK',
    resaleTransferPercent: 0.6,
    resaleTransferName: 'Registration Duty',
    newBuildVatPercent: 25,
    notaryPercent: 0.5,
    usedCarRegistrationFee: 500,
    newCarVatPercent: 25,
    newCarRegistrationFee: 1000,
  },
  {
    code: 'EE',
    name: 'Estonia',
    currency: 'EUR',
    resaleTransferPercent: 0,
    resaleTransferName: 'Transfer Tax',
    newBuildVatPercent: 22,
    notaryPercent: 0.5,
    registryFixed: 50,
    usedCarRegistrationFee: 130,
    newCarVatPercent: 22,
    newCarRegistrationFee: 150,
  },
  {
    code: 'FI',
    name: 'Finland',
    currency: 'EUR',
    resaleTransferPercent: 1.5,
    resaleTransferName: 'Transfer Tax',
    newBuildVatPercent: 24,
    notaryPercent: 0.5,
    registryFixed: 100,
    usedCarRegistrationFee: 150,
    newCarVatPercent: 24,
    newCarRegistrationFee: 200,
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    resaleTransferPercent: 5.8,
    resaleTransferName: 'Droits de mutation',
    newBuildVatPercent: 20,
    notaryPercent: 1.5,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 20,
    newCarRegistrationFee: 150,
    notes: 'Resale notaire package typically ~7–8% total; split here for clarity.',
  },
  {
    code: 'GR',
    name: 'Greece',
    currency: 'EUR',
    resaleTransferPercent: 3.09,
    resaleTransferName: 'Transfer Tax',
    newBuildVatPercent: 24,
    notaryPercent: 1,
    registryFixed: 100,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 24,
    newCarRegistrationFee: 200,
  },
  {
    code: 'HU',
    name: 'Hungary',
    currency: 'HUF',
    resaleTransferPercent: 4,
    resaleTransferName: 'Stamp Duty',
    newBuildVatPercent: 27,
    notaryPercent: 1,
    registryFixed: 10000,
    usedCarRegistrationFee: 20000,
    newCarVatPercent: 27,
    newCarRegistrationFee: 30000,
  },
  {
    code: 'IE',
    name: 'Ireland',
    currency: 'EUR',
    resaleTransferPercent: 1,
    resaleTransferName: 'Stamp Duty',
    newBuildVatPercent: 13.5,
    notaryPercent: 1,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 23,
    newCarRegistrationFee: 150,
    notes: 'Irish new-car VRT is vehicle-specific; fee here is a planning placeholder.',
  },
  {
    code: 'IT',
    name: 'Italy',
    currency: 'EUR',
    resaleTransferPercent: 9,
    resaleTransferName: 'Imposta di registro / catastale',
    newBuildVatPercent: 10,
    notaryPercent: 1,
    registryFixed: 200,
    usedCarRegistrationFee: 80,
    newCarVatPercent: 22,
    newCarRegistrationFee: 150,
    notes: 'First-home rates can be lower; 9% / 10% used as planning baseline.',
  },
  {
    code: 'LV',
    name: 'Latvia',
    currency: 'EUR',
    resaleTransferPercent: 2,
    resaleTransferName: 'Stamp Duty',
    newBuildVatPercent: 21,
    notaryPercent: 0.5,
    registryFixed: 50,
    usedCarRegistrationFee: 50,
    newCarVatPercent: 21,
    newCarRegistrationFee: 100,
  },
  {
    code: 'LT',
    name: 'Lithuania',
    currency: 'EUR',
    resaleTransferPercent: 0,
    resaleTransferName: 'Transfer Tax',
    newBuildVatPercent: 21,
    notaryPercent: 0.5,
    registryFixed: 50,
    usedCarRegistrationFee: 50,
    newCarVatPercent: 21,
    newCarRegistrationFee: 100,
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    currency: 'EUR',
    resaleTransferPercent: 7,
    resaleTransferName: 'Registration + Transcription Duties',
    newBuildVatPercent: 17,
    notaryPercent: 1,
    usedCarRegistrationFee: 50,
    newCarVatPercent: 17,
    newCarRegistrationFee: 100,
  },
  {
    code: 'MT',
    name: 'Malta',
    currency: 'EUR',
    resaleTransferPercent: 5,
    resaleTransferName: 'Stamp Duty',
    newBuildVatPercent: 18,
    notaryPercent: 1,
    registryFixed: 50,
    usedCarRegistrationFee: 50,
    newCarVatPercent: 18,
    newCarRegistrationFee: 100,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    currency: 'EUR',
    resaleTransferPercent: 2,
    resaleTransferName: 'Overdrachtsbelasting',
    newBuildVatPercent: 21,
    notaryPercent: 0.5,
    usedCarRegistrationFee: 70,
    newCarVatPercent: 21,
    newCarRegistrationFee: 100,
    notes: 'Primary residence can be 2%; investment property may be higher.',
  },
  {
    code: 'PT',
    name: 'Portugal',
    currency: 'EUR',
    resaleTransferPercent: 6,
    resaleTransferName: 'IMT (mid-band estimate)',
    newBuildVatPercent: 23,
    notaryPercent: 1,
    registryFixed: 200,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 23,
    newCarRegistrationFee: 150,
    notes: 'IMT is progressive; 6% is a mid-band planning estimate + stamp often ~0.8%.',
  },
  {
    code: 'RO',
    name: 'Romania',
    currency: 'RON',
    resaleTransferPercent: 3,
    resaleTransferName: 'Notary / Transfer Package',
    newBuildVatPercent: 19,
    notaryPercent: 1,
    registryFixed: 100,
    usedCarRegistrationFee: 100,
    newCarVatPercent: 19,
    newCarRegistrationFee: 150,
  },
  {
    code: 'SK',
    name: 'Slovakia',
    currency: 'EUR',
    resaleTransferPercent: 0,
    resaleTransferName: 'Transfer Tax',
    newBuildVatPercent: 20,
    notaryPercent: 1,
    registryFixed: 50,
    usedCarRegistrationFee: 50,
    newCarVatPercent: 20,
    newCarRegistrationFee: 100,
  },
  {
    code: 'SI',
    name: 'Slovenia',
    currency: 'EUR',
    resaleTransferPercent: 2,
    resaleTransferName: 'Real Estate Transfer Tax',
    newBuildVatPercent: 22,
    notaryPercent: 1,
    registryFixed: 50,
    usedCarRegistrationFee: 50,
    newCarVatPercent: 22,
    newCarRegistrationFee: 100,
  },
  {
    code: 'SE',
    name: 'Sweden',
    currency: 'SEK',
    resaleTransferPercent: 1.5,
    resaleTransferName: 'Stamp Duty',
    newBuildVatPercent: 25,
    notaryPercent: 0.5,
    registryFixed: 825,
    usedCarRegistrationFee: 600,
    newCarVatPercent: 25,
    newCarRegistrationFee: 800,
  },
  {
    code: 'UA',
    name: 'Ukraine',
    currency: 'UAH',
    resaleTransferPercent: 2,
    resaleTransferName: 'State Duty + Pension Fee',
    newBuildVatPercent: 20,
    notaryPercent: 1,
    registryFixed: 5000,
    usedCarRegistrationFee: 3000,
    newCarVatPercent: 20,
    newCarRegistrationFee: 5000,
    notes: 'Domestic market averages; import/customs/excise for foreign cars are not included.',
  },
]

export const EU_UA_CALCULATOR_CONFIGS: Record<string, CountryCalculatorConfig> = Object.fromEntries(
  EU_UA_PRESETS.map((p) => [p.code, buildCountry(p)]),
)
