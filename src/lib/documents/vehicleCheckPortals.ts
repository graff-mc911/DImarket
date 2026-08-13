/**
 * Official (or government-run) portals to check a vehicle before / after purchase.
 * Prefer national transport authorities — never invent commercial “VIN check” affiliates.
 */

export type VehicleCheckPortal = {
  name: string
  url: string
  /** Short EN purpose for UI fallback */
  purposeEn: string
  purposeUk: string
}

const DEFAULT_EU: VehicleCheckPortal = {
  name: 'Your Europe — Vehicles',
  url: 'https://europa.eu/youreurope/citizens/vehicles/',
  purposeEn: 'EU overview of vehicle registration and cross-border rules',
  purposeUk: 'Огляд ЄС щодо реєстрації авто та правил між країнами',
}

/** Country → official vehicle check / history / registration info portals */
export const VEHICLE_CHECK_PORTALS: Record<string, VehicleCheckPortal[]> = {
  DE: [
    {
      name: 'KBA — Auskunft Zentrales Fahrzeugregister (ZFZR)',
      url: 'https://www.kba.de/DE/Themen/ZentraleRegister/ZFZR/Auskunft/zfzr_auskunft_inhalt.html',
      purposeEn: 'Official central vehicle register information (KBA)',
      purposeUk: 'Офіційна довідка з центрального реєстру ТЗ (KBA)',
    },
    {
      name: 'KBA — Online-Services / eCoC',
      url: 'https://www.kba.de/DE/Home/home_node.html',
      purposeEn: 'KBA online services including eCoC / register self-service',
      purposeUk: 'Онлайн-сервіси KBA, зокрема eCoC / самообслуговування реєстрів',
    },
  ],
  AT: [
    {
      name: 'oesterreich.gv.at — Fahrzeug / Zulassung',
      url: 'https://www.oesterreich.gv.at/',
      purposeEn: 'Austrian government vehicle / registration guidance',
      purposeUk: 'Австрійський держпортал: авто / реєстрація',
    },
  ],
  FR: [
    {
      name: 'HistoVec — historique du véhicule',
      url: 'https://histovec.interieur.gouv.fr/',
      purposeEn: 'Official French vehicle administrative/technical history',
      purposeUk: 'Офіційна історія авто у Франції (HistoVec)',
    },
    {
      name: 'ANTS — Immatriculation / cession',
      url: 'https://immatriculation.ants.gouv.fr/',
      purposeEn: 'Official transfer / registration procedures (ANTS)',
      purposeUk: 'Офіційне переоформлення / реєстрація (ANTS)',
    },
  ],
  BE: [
    {
      name: 'Car-Pass (Belgique)',
      url: 'https://www.car-pass.be/',
      purposeEn: 'Mandatory Belgian odometer / history certificate scheme',
      purposeUk: 'Обов’язковий бельгійський Car-Pass (пробіг / історія)',
    },
    {
      name: 'Mobility Belgium',
      url: 'https://mobility.belgium.be/',
      purposeEn: 'Federal mobility / vehicle information',
      purposeUk: 'Федеральна мобільність / інформація про ТЗ',
    },
  ],
  ES: [
    {
      name: 'DGT — Informe de vehículo',
      url: 'https://sede.dgt.gob.es/es/vehiculos/informe-de-vehiculo/',
      purposeEn: 'Official DGT vehicle report (informe)',
      purposeUk: 'Офіційний звіт DGT про транспортний засіб',
    },
    {
      name: 'DGT — Transferencia / cambio de titularidad',
      url: 'https://sede.dgt.gob.es/es/tramites-y-multas/tu-vehiculo/transferencias-de-vehiculos/',
      purposeEn: 'Official ownership transfer procedure',
      purposeUk: 'Офіційна зміна власника (трансфер)',
    },
  ],
  PL: [
    {
      name: 'Historia pojazdu (CEPiK)',
      url: 'https://www.historia-pojazdu.gov.pl/',
      purposeEn: 'Official Polish vehicle history (CEPiK)',
      purposeUk: 'Офіційна історія авто в Польщі (CEPiK)',
    },
  ],
  IT: [
    {
      name: 'Portale dell’Automobilista',
      url: 'https://www.ilportaledellautomobilista.it/',
      purposeEn: 'Italian driver/vehicle portal (Ministero)',
      purposeUk: 'Італійський портал водія / ТЗ',
    },
    {
      name: 'ACI / PRA — Pubblico Registro Automobilistico',
      url: 'https://www.aci.it/',
      purposeEn: 'PRA ownership / registration checks via ACI',
      purposeUk: 'Перевірка PRA / власності через ACI',
    },
  ],
  PT: [
    {
      name: 'IMT — Instituto da Mobilidade e dos Transportes',
      url: 'https://www.imt-ip.pt/',
      purposeEn: 'Portuguese vehicle registration / IMT services',
      purposeUk: 'Португальська реєстрація ТЗ / сервіси IMT',
    },
  ],
  NL: [
    {
      name: 'RDW — Kenteken check (OVI)',
      url: 'https://ovi.rdw.nl/',
      purposeEn: 'Official Dutch plate / vehicle data (RDW)',
      purposeUk: 'Офіційні дані за номером NL (RDW)',
    },
  ],
  UK: [
    {
      name: 'GOV.UK — Check MOT history',
      url: 'https://www.gov.uk/check-mot-history',
      purposeEn: 'Official UK MOT history',
      purposeUk: 'Офіційна історія MOT (UK)',
    },
    {
      name: 'GOV.UK — Get vehicle information from DVLA',
      url: 'https://www.gov.uk/get-vehicle-information-from-dvla',
      purposeEn: 'Official DVLA vehicle information',
      purposeUk: 'Офіційні дані DVLA про авто',
    },
  ],
  IE: [
    {
      name: 'Motor Tax Online / NVDF (Ireland)',
      url: 'https://www.motortax.ie/',
      purposeEn: 'Irish motor tax / vehicle records entry points',
      purposeUk: 'Ірландський motor tax / записи про ТЗ',
    },
  ],
  SE: [
    {
      name: 'Transportstyrelsen — Fordonsuppgifter',
      url: 'https://fordonsuppgifter.transportstyrelsen.se/',
      purposeEn: 'Official Swedish vehicle data',
      purposeUk: 'Офіційні дані про авто (Швеція)',
    },
  ],
  DK: [
    {
      name: 'Motorregister (SKAT)',
      url: 'https://motorregister.skat.dk/',
      purposeEn: 'Danish motor register',
      purposeUk: 'Данський реєстр ТЗ',
    },
  ],
  FI: [
    {
      name: 'Traficom — Ajoneuvotiedot',
      url: 'https://www.traficom.fi/',
      purposeEn: 'Finnish Traficom vehicle information',
      purposeUk: 'Фінський Traficom — дані про ТЗ',
    },
  ],
  CZ: [
    {
      name: 'dataovozidlech.cz (MD ČR)',
      url: 'https://www.dataovozidlech.cz/',
      purposeEn: 'Czech official vehicle data portal',
      purposeUk: 'Чеський офіційний портал даних про ТЗ',
    },
  ],
  SK: [
    {
      name: 'Slovensko.sk / Ministerstvo dopravy',
      url: 'https://www.slovensko.sk/',
      purposeEn: 'Slovak e-government transport entry',
      purposeUk: 'Словацький е-уряд / транспорт',
    },
  ],
  RO: [
    {
      name: 'DRPCIV România',
      url: 'https://www.drpciv.ro/',
      purposeEn: 'Romanian vehicle registration authority',
      purposeUk: 'Румунський орган реєстрації ТЗ (DRPCIV)',
    },
  ],
  HU: [
    {
      name: 'Nyilvántartó — jármű',
      url: 'https://www.nyilvantarto.hu/',
      purposeEn: 'Hungarian vehicle registry entry points',
      purposeUk: 'Угорський реєстр ТЗ',
    },
  ],
  GR: [
    {
      name: 'gov.gr — Οχήματα',
      url: 'https://www.gov.gr/',
      purposeEn: 'Greek gov.gr vehicle services',
      purposeUk: 'Грецькі сервіси gov.gr щодо ТЗ',
    },
  ],
  CH: [
    {
      name: 'ASTRA — Strassenfahrzeuge',
      url: 'https://www.astra.admin.ch/',
      purposeEn: 'Swiss federal roads office (ASTRA)',
      purposeUk: 'Швейцарське федеральне відомство доріг (ASTRA)',
    },
  ],
  NO: [
    {
      name: 'Statens vegvesen — Kjøretøy',
      url: 'https://www.vegvesen.no/',
      purposeEn: 'Norwegian Public Roads Administration vehicle services',
      purposeUk: 'Норвезькі сервіси щодо ТЗ (Statens vegvesen)',
    },
  ],
  LU: [
    {
      name: 'SNCA Luxembourg',
      url: 'https://www.snca.lu/',
      purposeEn: 'Luxembourg vehicle registration (SNCA)',
      purposeUk: 'Люксембурзька реєстрація ТЗ (SNCA)',
    },
  ],
}

export function vehicleCheckPortalsFor(countryCode: string | null | undefined): VehicleCheckPortal[] {
  const code = (countryCode || '').toUpperCase()
  const list = VEHICLE_CHECK_PORTALS[code]
  if (list?.length) return list
  return [DEFAULT_EU]
}

export function isVehicleDocumentSlug(slug: string): boolean {
  return (
    slug === 'vehicle-purchase-contract' ||
    slug === 'vehicle-purchase-commercial' ||
    slug === 'vehicle-rental-contract'
  )
}
