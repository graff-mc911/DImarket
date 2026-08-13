/**
 * Official / model form field schemas by country + document slug.
 *
 * RULES:
 * - Field names mirror publicly published official or government-model blanks
 *   (CERFA, DGT, GewA1-aligned, service-public modèles, gov.pl, etc.).
 * - We do NOT paste full copyrighted contract bodies.
 * - Labels are in the form’s official language.
 * - Always link sourceUrl to the official portal page for the blank/model.
 * - lastVerified stays null until a human or OSM check confirms the URL.
 */

import type { TranslationKey } from '../i18n'
import type { DocumentRecord, FormFieldDef, OfficialFormPack } from './types'
import { isVehicleDocumentSlug, vehicleCheckPortalsFor } from './vehicleCheckPortals'

function f(
  id: string,
  label: string,
  type: FormFieldDef['type'],
  opts?: Partial<FormFieldDef>,
): FormFieldDef {
  return {
    id,
    label,
    labelKey: 'docs.field.custom',
    type,
    ...opts,
  }
}

/** Germany — Wohnraummietvertrag field structure (BGB / Verbraucherzentrale-aligned headings) */
const deRental: OfficialFormPack = {
  modelName: 'Wohnraummietvertrag (BGB-Struktur / Musterfelder)',
  language: 'de',
  sourceName: 'Gesetze im Internet — BGB Mietrecht + bund.de',
  sourceUrl: 'https://www.gesetze-im-internet.de/bgb/',
  lastVerified: null,
  noticeLocal:
    'Felder entsprechen üblichen Angaben in deutschen Wohnraummietverträgen (BGB). Kein amtliches Einheitsformular — vor Unterschrift prüfen und ggf. Rechtsberatung einholen.',
  noticeEn:
    'Fields follow common German residential lease headings (BGB). Not a single federal blank — verify before signing.',
  fields: [
    f('vermieter_name', 'Vermieter (Name / Firma)', 'text', { required: true, section: 'Vertragsparteien' }),
    f('vermieter_anschrift', 'Anschrift des Vermieters', 'text', { required: true, section: 'Vertragsparteien' }),
    f('mieter_name', 'Mieter (Name)', 'text', { required: true, profileKey: 'full_name', section: 'Vertragsparteien' }),
    f('mieter_anschrift', 'Anschrift des Mieters', 'text', { profileKey: 'location', section: 'Vertragsparteien' }),
    f('mietsache_adresse', 'Anschrift der Mietsache', 'text', { required: true, section: 'Mietsache' }),
    f('wohnflaeche', 'Wohnfläche (m²)', 'number', { section: 'Mietsache' }),
    f('zimmerzahl', 'Anzahl der Zimmer', 'number', { section: 'Mietsache' }),
    f('kaltmiete', 'Nettokaltmiete (€ / Monat)', 'number', { required: true, section: 'Miete & Kaution' }),
    f('nebenkosten', 'Betriebskostenvorauszahlung (€ / Monat)', 'number', { section: 'Miete & Kaution' }),
    f('heizkosten', 'Heizkostenvorauszahlung (€ / Monat)', 'number', { section: 'Miete & Kaution' }),
    f('kaution', 'Kaution (€, max. 3 Nettokaltmieten üblich)', 'number', { section: 'Miete & Kaution' }),
    f('beginn', 'Mietbeginn', 'date', { required: true, section: 'Laufzeit' }),
    f('befristung', 'Befristung / Ende (falls befristet)', 'date', { section: 'Laufzeit' }),
    f('kuendigungsfrist', 'Kündigungsfrist', 'text', { section: 'Laufzeit', placeholder: 'z. B. 3 Monate zum Monatsende' }),
    f('uebergabe', 'Übergabeprotokoll / Zählerstände', 'textarea', { section: 'Übergabe' }),
    f('unterschrift_datum', 'Datum der Unterschrift', 'date', { section: 'Unterschrift' }),
  ],
}

/** Germany — Privater Kfz-Kaufvertrag (Gebrauchtwagen), field layout per common Muster blank */
const deVehicle: OfficialFormPack = {
  modelName: 'Kaufvertrag über ein Gebrauchtkraftfahrzeug von privat',
  language: 'de',
  sourceName: 'Muster — Privater Kfz-Kaufvertrag (Feldstruktur)',
  sourceUrl: 'https://www.kba.de/',
  lastVerified: null,
  noticeLocal:
    'Feldstruktur wie im üblichen privaten Kfz-Kaufvertrag (Abschnitte I–VI). Kein amtliches Einheitsformular — vor Unterschrift mit Ihrem PDF-Muster vergleichen. Halterwechsel: örtliche Zulassungsstelle / KBA.',
  noticeEn:
    'Field layout matches the usual German private used-car purchase blank (sections I–VI). Not a federal form — compare with your PDF before signing. Registration: local Zulassungsstelle / KBA.',
  fields: [
    // Verkäufer
    f('verk_name', 'Name, Vorname (Verkäufer)', 'text', {
      required: true,
      section: 'Verkäufer (privat)',
    }),
    f('verk_strasse', 'Straße, Nr. (Verkäufer)', 'text', { required: true, section: 'Verkäufer (privat)' }),
    f('verk_plz_ort', 'PLZ / Wohnort (Verkäufer)', 'text', { required: true, section: 'Verkäufer (privat)' }),
    f('verk_telefon', 'Telefon (Verkäufer)', 'phone', { section: 'Verkäufer (privat)' }),
    f('verk_email', 'E-Mail (Verkäufer)', 'email', { section: 'Verkäufer (privat)' }),
    f('verk_ausweis', 'Personalausweis- / Reisepass-Nr. (Verkäufer)', 'text', {
      section: 'Verkäufer (privat)',
    }),
    f('verk_ausweis_behoerde', 'Ausstellungsbehörde (Verkäufer)', 'text', {
      section: 'Verkäufer (privat)',
    }),
    // Käufer
    f('kauf_name', 'Name, Vorname (Käufer)', 'text', {
      required: true,
      profileKey: 'full_name',
      section: 'Käufer',
    }),
    f('kauf_strasse', 'Straße, Nr. (Käufer)', 'text', {
      required: true,
      profileKey: 'location',
      section: 'Käufer',
    }),
    f('kauf_plz_ort', 'PLZ / Wohnort (Käufer)', 'text', { required: true, section: 'Käufer' }),
    f('kauf_telefon', 'Telefon (Käufer)', 'phone', { profileKey: 'phone', section: 'Käufer' }),
    f('kauf_email', 'E-Mail (Käufer)', 'email', { profileKey: 'email', section: 'Käufer' }),
    f('kauf_ausweis', 'Personalausweis- / Reisepass-Nr. (Käufer)', 'text', { section: 'Käufer' }),
    f('kauf_ausweis_behoerde', 'Ausstellungsbehörde (Käufer)', 'text', { section: 'Käufer' }),
    // I. Fahrzeug
    f('marke', 'Marke', 'text', { required: true, section: 'I. Fahrzeug' }),
    f('modell', 'Modell', 'text', { required: true, section: 'I. Fahrzeug' }),
    f('fahrzeugart', 'Fahrzeugart', 'text', { section: 'I. Fahrzeug', placeholder: 'z. B. PKW, Motorrad' }),
    f('kw_ps', 'kW / PS', 'text', { section: 'I. Fahrzeug' }),
    f('hubraum', 'Hubraum (cm³)', 'text', { section: 'I. Fahrzeug' }),
    f('fin', 'Fahrzeugidentifikations-Nr. (FIN)', 'text', { required: true, section: 'I. Fahrzeug' }),
    f('kennzeichen', 'Amtliches Kennzeichen', 'text', { section: 'I. Fahrzeug' }),
    f('erstzulassung', 'Erstzulassung', 'date', { section: 'I. Fahrzeug' }),
    f('co2', 'CO₂-Effizienzklasse', 'text', { section: 'I. Fahrzeug' }),
    f('naechste_hu', 'Nächste Hauptuntersuchung', 'date', { section: 'I. Fahrzeug' }),
    f('brief_nr', 'Fahrzeugbrief-Nr. / Zulassungsbescheinigung Teil II', 'text', {
      section: 'I. Fahrzeug',
    }),
    f('zubehoer', 'Zusatzausstattung / Zubehör', 'textarea', {
      section: 'I. Fahrzeug',
      placeholder: 'z. B. Radio, Felgen, Navigationsgerät',
    }),
    f('gesamtpreis', 'Gesamtpreis (€)', 'number', { required: true, section: 'I. Fahrzeug' }),
    // II. Gewährleistung — structure only, not full clause text
    f('gewaehrleistung', 'Gewährleistung / Sachmängelhaftung', 'select', {
      section: 'II. Gewährleistung',
      required: true,
      options: [
        {
          value: 'ausschluss_besichtigt',
          labelKey: 'docs.field.custom',
          label: 'Wie besichtigt — Ausschluss der Sachmängelhaftung (außer Ziffer III)',
        },
        {
          value: 'mit_zusicherung',
          labelKey: 'docs.field.custom',
          label: 'Mit Zusicherungen nach Ziffer III',
        },
      ],
    }),
    // III. Zusicherungen
    f('eigentum_allein', 'Alleiniges Eigentum des Verkäufers', 'select', {
      section: 'III. Zusicherungen des Verkäufers',
      options: [
        { value: 'ja', labelKey: 'docs.field.custom', label: 'ja' },
        { value: 'nein', labelKey: 'docs.field.custom', label: 'nein' },
      ],
    }),
    f('gesamtfahrleistung', 'Gesamtfahrleistung (km)', 'number', {
      required: true,
      section: 'III. Zusicherungen des Verkäufers',
    }),
    f('motor', 'Motor', 'select', {
      section: 'III. Zusicherungen des Verkäufers',
      options: [
        { value: 'original', labelKey: 'docs.field.custom', label: 'Originalmotor' },
        { value: 'austausch', labelKey: 'docs.field.custom', label: 'Austauschmotor' },
      ],
    }),
    f('austauschmotor_km', 'km-Leistung Austauschmotor (falls zutreffend)', 'number', {
      section: 'III. Zusicherungen des Verkäufers',
    }),
    f('unfallschaeden', 'Unfallschäden', 'textarea', {
      section: 'III. Zusicherungen des Verkäufers',
      placeholder: 'keinen Unfallschaden / folgende Unfallschäden: …',
    }),
    f('sonstige_schaeden', 'Sonstige Beschädigungen', 'textarea', {
      section: 'III. Zusicherungen des Verkäufers',
      placeholder: 'keine sonstigen Beschädigungen / folgende: …',
    }),
    f('vorbesitzer', 'Anzahl Vorbesitzer (soweit bekannt)', 'text', {
      section: 'III. Zusicherungen des Verkäufers',
    }),
    f('gewerblich', 'Gewerblich genutzt (Taxi, Miet-, Fahrschulwagen)', 'select', {
      section: 'III. Zusicherungen des Verkäufers',
      options: [
        { value: 'ja', labelKey: 'docs.field.custom', label: 'ja' },
        { value: 'nein', labelKey: 'docs.field.custom', label: 'nein' },
      ],
    }),
    f('import', 'Importfahrzeug', 'select', {
      section: 'III. Zusicherungen des Verkäufers',
      options: [
        { value: 'ja', labelKey: 'docs.field.custom', label: 'ja' },
        { value: 'nein', labelKey: 'docs.field.custom', label: 'nein' },
      ],
    }),
    // IV
    f('sondervereinbarungen', 'Sondervereinbarungen / Erklärungen des Käufers', 'textarea', {
      section: 'IV. Erklärungen des Käufers',
    }),
    // V
    f('unterlagen_schein', 'Fahrzeugschein / Zulassungsbescheinigung Teil I', 'select', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
      options: [
        { value: 'erhalten', labelKey: 'docs.field.custom', label: 'erhalten' },
        { value: 'nicht', labelKey: 'docs.field.custom', label: 'nicht erhalten' },
      ],
    }),
    f('unterlagen_brief', 'Fahrzeugbrief / Zulassungsbescheinigung Teil II', 'select', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
      options: [
        { value: 'erhalten', labelKey: 'docs.field.custom', label: 'erhalten' },
        { value: 'nicht', labelKey: 'docs.field.custom', label: 'nicht erhalten' },
      ],
    }),
    f('unterlagen_stilllegung', 'Stilllegungsbescheinigung', 'select', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
      options: [
        { value: 'erhalten', labelKey: 'docs.field.custom', label: 'erhalten' },
        { value: 'nicht', labelKey: 'docs.field.custom', label: 'nicht erhalten' },
        { value: 'entfaellt', labelKey: 'docs.field.custom', label: 'entfällt' },
      ],
    }),
    f('unterlagen_hu', 'Untersuchungsbericht (TÜV/DEKRA/ADAC)', 'select', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
      options: [
        { value: 'erhalten', labelKey: 'docs.field.custom', label: 'erhalten' },
        { value: 'nicht', labelKey: 'docs.field.custom', label: 'nicht erhalten' },
      ],
    }),
    f('unterlagen_schluessel', 'Fahrzeug mit Schlüssel(n)', 'select', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
      options: [
        { value: 'erhalten', labelKey: 'docs.field.custom', label: 'erhalten' },
        { value: 'nicht', labelKey: 'docs.field.custom', label: 'nicht erhalten' },
      ],
    }),
    f('unterlagen_sonstige', 'Sonstige/weitere Unterlagen', 'textarea', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
    }),
    f('anzahlung', 'Anzahlung (€)', 'number', { section: 'V. Kfz-Unterlagen und Bezahlung' }),
    f('zahlungsvereinbarung', 'Zahlungsvereinbarung', 'textarea', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
    }),
    f('ummeldung_tage', 'Ummeldung spätestens innerhalb von … Tagen ab Übergabe', 'number', {
      section: 'V. Kfz-Unterlagen und Bezahlung',
      placeholder: 'z. B. 7',
    }),
    // VI
    f('uebergabe_ort', 'Ort der Übergabe', 'text', { section: 'VI. Übergabebestätigung' }),
    f('uebergabe_datum', 'Datum der Übergabe', 'date', {
      required: true,
      section: 'VI. Übergabebestätigung',
    }),
    f('uebergabe_uhrzeit', 'Uhrzeit der Übergabe', 'text', {
      section: 'VI. Übergabebestätigung',
      placeholder: 'z. B. 14:30',
    }),
    f('uebergabe_bestaetigt', 'Fahrzeug wurde übergeben', 'select', {
      section: 'VI. Übergabebestätigung',
      options: [
        { value: 'ja', labelKey: 'docs.field.custom', label: 'ja' },
        { value: 'nein', labelKey: 'docs.field.custom', label: 'nein' },
      ],
    }),
  ],
}

/** Germany — commercial / B2B Kfz-Kaufvertrag (Firma + MwSt) */
const deVehicleCommercial: OfficialFormPack = {
  modelName: 'Kfz-Kaufvertrag (gewerblich / Unternehmer)',
  language: 'de',
  sourceName: 'Muster — gewerblicher Kfz-Kaufvertrag + Zulassung KBA',
  sourceUrl: 'https://www.kba.de/',
  lastVerified: null,
  noticeLocal:
    'Feldstruktur für den Verkauf zwischen Unternehmern / mit MwSt-Ausweis. Vor Unterschrift prüfen; Halterwechsel über Zulassungsstelle. Kein amtliches Einheitsformular.',
  noticeEn:
    'Commercial / B2B German vehicle sale field layout (company + VAT). Complete registration at Zulassungsstelle — not a single federal blank.',
  fields: [
    f('verk_firma', 'Firma Verkäufer', 'text', { required: true, profileKey: 'company_name', section: 'Verkäufer (gewerblich)' }),
    f('verk_ustid', 'USt-IdNr. Verkäufer', 'text', { section: 'Verkäufer (gewerblich)' }),
    f('verk_vertreter', 'Vertretungsberechtigte Person', 'text', { required: true, section: 'Verkäufer (gewerblich)' }),
    f('verk_strasse', 'Straße, Nr.', 'text', { required: true, section: 'Verkäufer (gewerblich)' }),
    f('verk_plz_ort', 'PLZ / Ort', 'text', { required: true, section: 'Verkäufer (gewerblich)' }),
    f('verk_telefon', 'Telefon', 'phone', { section: 'Verkäufer (gewerblich)' }),
    f('verk_email', 'E-Mail', 'email', { section: 'Verkäufer (gewerblich)' }),
    f('kauf_firma', 'Firma Käufer', 'text', { required: true, section: 'Käufer (gewerblich)' }),
    f('kauf_ustid', 'USt-IdNr. Käufer', 'text', { section: 'Käufer (gewerblich)' }),
    f('kauf_vertreter', 'Vertretungsberechtigte Person', 'text', {
      required: true,
      profileKey: 'full_name',
      section: 'Käufer (gewerblich)',
    }),
    f('kauf_strasse', 'Straße, Nr.', 'text', { required: true, profileKey: 'location', section: 'Käufer (gewerblich)' }),
    f('kauf_plz_ort', 'PLZ / Ort', 'text', { required: true, section: 'Käufer (gewerblich)' }),
    f('kauf_telefon', 'Telefon', 'phone', { profileKey: 'phone', section: 'Käufer (gewerblich)' }),
    f('kauf_email', 'E-Mail', 'email', { profileKey: 'email', section: 'Käufer (gewerblich)' }),
    f('marke', 'Marke', 'text', { required: true, section: 'I. Fahrzeug' }),
    f('modell', 'Modell / Typ', 'text', { required: true, section: 'I. Fahrzeug' }),
    f('fahrzeugart', 'Fahrzeugart', 'text', { section: 'I. Fahrzeug' }),
    f('kw_ps', 'kW / PS', 'text', { section: 'I. Fahrzeug' }),
    f('fin', 'FIN', 'text', { required: true, section: 'I. Fahrzeug' }),
    f('kennzeichen', 'Amtliches Kennzeichen', 'text', { section: 'I. Fahrzeug' }),
    f('erstzulassung', 'Erstzulassung', 'date', { section: 'I. Fahrzeug' }),
    f('kilometerstand', 'Kilometerstand', 'number', { required: true, section: 'I. Fahrzeug' }),
    f('brief_nr', 'Zulassungsbescheinigung Teil II (Nr.)', 'text', { section: 'I. Fahrzeug' }),
    f('netto', 'Netto-Kaufpreis (€)', 'number', { required: true, section: 'II. Preis / MwSt' }),
    f('mwst_satz', 'MwSt-Satz (%)', 'number', { section: 'II. Preis / MwSt', placeholder: '19' }),
    f('mwst_betrag', 'MwSt-Betrag (€)', 'number', { section: 'II. Preis / MwSt' }),
    f('brutto', 'Brutto-Kaufpreis (€)', 'number', { required: true, section: 'II. Preis / MwSt' }),
    f('differenzbesteuerung', 'Differenzbesteuerung (§ 25a UStG)?', 'select', {
      section: 'II. Preis / MwSt',
      options: [
        { value: 'nein', labelKey: 'docs.field.custom', label: 'nein — Regelbesteuerung' },
        { value: 'ja', labelKey: 'docs.field.custom', label: 'ja — Differenzbesteuerung' },
      ],
    }),
    f('rechnungsnr', 'Rechnungsnummer', 'text', { section: 'II. Preis / MwSt' }),
    f('zahlungsart', 'Zahlungsart / Vereinbarung', 'textarea', { section: 'II. Preis / MwSt' }),
    f('maengel', 'Mängel / Garantie / Gewährleistung', 'textarea', { section: 'III. Zustand' }),
    f('uebergabe_ort', 'Übergabeort', 'text', { section: 'IV. Übergabe' }),
    f('uebergabe_datum', 'Übergabedatum', 'date', { required: true, section: 'IV. Übergabe' }),
    f('unterlagen', 'Übergebene Unterlagen', 'textarea', {
      section: 'IV. Übergabe',
      placeholder: 'ZB I / ZB II / Schlüssel / HU-Bericht …',
    }),
  ],
}

/** Germany — Gewerbeanmeldung (GewA1-aligned field names) */
const deBusiness: OfficialFormPack = {
  modelName: 'Gewerbeanmeldung — Felder analog GewA1',
  language: 'de',
  sourceName: 'BMWK / bund.de — Gewerbeanmeldung',
  sourceUrl: 'https://www.bund.de/Content/DE/Leistung/A/gewerbeanmeldung.html',
  lastVerified: null,
  noticeLocal:
    'Feldbezeichnungen analog zur Gewerbeanmeldung (GewA1). Das amtliche Formular beim zuständigen Gewerbeamt / Online-Dienst verwenden.',
  noticeEn: 'Field names aligned with German GewA1 trade registration. Use the official form at your Gewerbeamt.',
  fields: [
    f('anmelder_name', 'Name des Anmelders', 'text', { required: true, profileKey: 'full_name', section: 'Anmelder' }),
    f('anmelder_geburt', 'Geburtsdatum', 'date', { section: 'Anmelder' }),
    f('anmelder_anschrift', 'Wohnanschrift', 'text', { required: true, profileKey: 'location', section: 'Anmelder' }),
    f('anmelder_telefon', 'Telefon', 'phone', { profileKey: 'phone', section: 'Anmelder' }),
    f('anmelder_email', 'E-Mail', 'email', { profileKey: 'email', section: 'Anmelder' }),
    f('firma', 'Firma / Geschäftsbezeichnung', 'text', { required: true, section: 'Betrieb' }),
    f('betriebsanschrift', 'Betriebsstätte (Anschrift)', 'text', { required: true, section: 'Betrieb' }),
    f('taetigkeit', 'Ausgeübte Tätigkeit / Gewerbe', 'textarea', { required: true, section: 'Betrieb' }),
    f('beginn', 'Beginn der Tätigkeit', 'date', { required: true, section: 'Betrieb' }),
    f('rechtsform', 'Rechtsform (z. B. Einzelunternehmen, GmbH)', 'text', { section: 'Betrieb' }),
    f('mitarbeiter', 'Zahl der Beschäftigten (falls bekannt)', 'number', { section: 'Betrieb' }),
    f('steuer_id', 'Steuerliche Identifikationsnummer / USt-IdNr. (falls vorhanden)', 'text', { section: 'Steuern' }),
  ],
}

const deEmployment: OfficialFormPack = {
  modelName: 'Arbeitsvertrag — Mindestangaben (NachwG / BGB)',
  language: 'de',
  sourceName: 'Gesetze im Internet — Nachweisgesetz',
  sourceUrl: 'https://www.gesetze-im-internet.de/nachwg_2022/',
  lastVerified: null,
  noticeLocal:
    'Mindestangaben nach Nachweisgesetz. Kein einheitliches Bundesformular — Muster prüfen und anpassen.',
  noticeEn: 'Minimum particulars under German Nachweisgesetz. Not a single federal blank.',
  fields: [
    f('arbeitgeber', 'Arbeitgeber', 'text', { required: true, section: 'Parteien' }),
    f('arbeitgeber_anschrift', 'Anschrift Arbeitgeber', 'text', { section: 'Parteien' }),
    f('arbeitnehmer', 'Arbeitnehmer', 'text', { required: true, profileKey: 'full_name', section: 'Parteien' }),
    f('taetigkeit', 'Tätigkeit / Kurzbeschreibung', 'textarea', { required: true, section: 'Tätigkeit' }),
    f('beginn', 'Beginn des Arbeitsverhältnisses', 'date', { required: true, section: 'Bedingungen' }),
    f('befristung', 'Befristung (falls ja)', 'date', { section: 'Bedingungen' }),
    f('arbeitsort', 'Arbeitsort', 'text', { section: 'Bedingungen' }),
    f('arbeitszeit', 'Arbeitszeit (Wochenstunden)', 'text', { section: 'Bedingungen' }),
    f('verguetung', 'Vergütung (€ brutto)', 'number', { required: true, section: 'Vergütung' }),
    f('urlaub', 'Urlaubstage / Jahr', 'number', { section: 'Vergütung' }),
    f('kuendigung', 'Kündigungsfristen', 'text', { section: 'Beendigung' }),
    f('unterschrift_datum', 'Datum', 'date', { section: 'Unterschrift' }),
  ],
}

const deWorks: OfficialFormPack = {
  modelName: 'Werkvertrag / Renovierung — Vertragsfelder (BGB Werkvertragsrecht)',
  language: 'de',
  sourceName: 'Gesetze im Internet — BGB Werkvertrag',
  sourceUrl: 'https://www.gesetze-im-internet.de/bgb/',
  lastVerified: null,
  noticeLocal:
    'Struktur nach typischen deutschen Werkverträgen (BGB). Kein amtliches Einheitsblankett.',
  noticeEn: 'Structure of typical German works contracts (BGB). Not an official blank.',
  fields: [
    f('besteller', 'Besteller / Auftraggeber', 'text', { required: true, profileKey: 'full_name', section: 'Parteien' }),
    f('unternehmer', 'Unternehmer / Auftragnehmer', 'text', { required: true, profileKey: 'company_name', section: 'Parteien' }),
    f('bauort', 'Ort der Leistung', 'text', { required: true, profileKey: 'location', section: 'Leistung' }),
    f('leistungsbeschreibung', 'Leistungsbeschreibung', 'textarea', { required: true, section: 'Leistung' }),
    f('material', 'Materialien (wer stellt)', 'textarea', { section: 'Leistung' }),
    f('preis', 'Vergütung / Preis (€)', 'number', { required: true, section: 'Vergütung' }),
    f('zahlungsplan', 'Zahlungsplan', 'textarea', { section: 'Vergütung' }),
    f('fertigstellung', 'Fertigstellungstermin', 'date', { section: 'Termine' }),
    f('gewaehrleistung', 'Gewährleistung', 'textarea', { section: 'Gewährleistung' }),
    f('abnahme', 'Abnahme', 'textarea', { section: 'Abnahme' }),
    f('unterschrift_datum', 'Datum', 'date', { section: 'Unterschrift' }),
  ],
}

/** France — bail d'habitation (modèle type) */
const frRental: OfficialFormPack = {
  modelName: 'Bail d’habitation — modèle type (service-public)',
  language: 'fr',
  sourceName: 'Service-Public — Bail d’habitation',
  sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/R2740',
  lastVerified: null,
  noticeLocal:
    'Champs alignés sur le modèle type de bail d’habitation (service-public.fr). Téléchargez le modèle officiel et vérifiez avant signature.',
  noticeEn: 'Fields aligned with the French official residential lease model on service-public.fr.',
  fields: [
    f('bailleur', 'Bailleur', 'text', { required: true, section: 'Parties' }),
    f('bailleur_adresse', 'Adresse du bailleur', 'text', { section: 'Parties' }),
    f('locataire', 'Locataire', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('locataire_adresse', 'Adresse du locataire', 'text', { profileKey: 'location', section: 'Parties' }),
    f('logement_adresse', 'Adresse du logement', 'text', { required: true, section: 'Logement' }),
    f('surface', 'Surface habitable (m²)', 'number', { required: true, section: 'Logement' }),
    f('pieces', 'Nombre de pièces', 'number', { section: 'Logement' }),
    f('usage', 'Usage (habitation)', 'text', { section: 'Logement', placeholder: 'habitation principale' }),
    f('loyer', 'Loyer mensuel (€)', 'number', { required: true, section: 'Loyer' }),
    f('charges', 'Provisions pour charges (€)', 'number', { section: 'Loyer' }),
    f('depot', 'Dépôt de garantie (€)', 'number', { section: 'Loyer' }),
    f('debut', 'Date de prise d’effet', 'date', { required: true, section: 'Durée' }),
    f('duree', 'Durée du bail', 'text', { section: 'Durée', placeholder: '3 ans (vide) / 1 an (meublé)…' }),
    f('etat_lieux', 'État des lieux', 'textarea', { section: 'Annexes' }),
    f('date_signature', 'Date de signature', 'date', { section: 'Signature' }),
  ],
}

const frVehicle: OfficialFormPack = {
  modelName: 'CERFA 13703* — Certificat de cession d’un véhicule d’occasion',
  language: 'fr',
  sourceName: 'Service-Public / ANTS — CERFA 13703',
  sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/R2032',
  lastVerified: null,
  noticeLocal:
    'Champs du certificat de cession officiel (CERFA 13703*). Déclarez la cession sur ANTS / service-public — le PDF/CERFA officiel fait foi.',
  noticeEn:
    'Fields of the official French used-vehicle transfer certificate (CERFA 13703*). File the transfer on ANTS — the official CERFA is authoritative.',
  fields: [
    f('ancien_nom', 'Ancien propriétaire — nom / prénom ou raison sociale', 'text', {
      required: true,
      section: 'Ancien propriétaire',
    }),
    f('ancien_adresse', 'Adresse', 'text', { required: true, section: 'Ancien propriétaire' }),
    f('ancien_cp_ville', 'Code postal / commune', 'text', { section: 'Ancien propriétaire' }),
    f('nouveau_nom', 'Nouveau propriétaire — nom / prénom ou raison sociale', 'text', {
      required: true,
      profileKey: 'full_name',
      section: 'Nouveau propriétaire',
    }),
    f('nouveau_adresse', 'Adresse', 'text', { required: true, profileKey: 'location', section: 'Nouveau propriétaire' }),
    f('nouveau_cp_ville', 'Code postal / commune', 'text', { section: 'Nouveau propriétaire' }),
    f('marque', 'Marque', 'text', { required: true, section: 'Véhicule' }),
    f('type', 'Type / variante / version', 'text', { section: 'Véhicule' }),
    f('vin', 'Numéro d’identification (VIN)', 'text', { required: true, section: 'Véhicule' }),
    f('immat', 'Numéro d’immatriculation', 'text', { required: true, section: 'Véhicule' }),
    f('date_1ere', 'Date de 1re immatriculation', 'date', { section: 'Véhicule' }),
    f('kilometrage', 'Kilométrage au compteur', 'number', { required: true, section: 'Véhicule' }),
    f('date_cession', 'Date de cession', 'date', { required: true, section: 'Cession' }),
    f('heure_cession', 'Heure de cession', 'text', { section: 'Cession' }),
    f('prix', 'Prix de cession (€)', 'number', { section: 'Cession' }),
  ],
}

const frVehicleCommercial: OfficialFormPack = {
  ...frVehicle,
  modelName: 'CERFA 13703* — Cession (professionnel / société)',
  noticeLocal:
    'Même CERFA 13703* pour cession pro. Indiquez SIRET / raison sociale. Déclaration obligatoire sur ANTS.',
  noticeEn: 'Same CERFA 13703* for professional transfer — include SIRET / company name. File on ANTS.',
  fields: [
    f('ancien_raison', 'Ancien propriétaire — raison sociale', 'text', {
      required: true,
      profileKey: 'company_name',
      section: 'Ancien propriétaire (pro)',
    }),
    f('ancien_siret', 'SIRET', 'text', { section: 'Ancien propriétaire (pro)' }),
    f('ancien_adresse', 'Adresse', 'text', { required: true, section: 'Ancien propriétaire (pro)' }),
    f('nouveau_raison', 'Nouveau propriétaire — raison sociale', 'text', {
      required: true,
      section: 'Nouveau propriétaire (pro)',
    }),
    f('nouveau_siret', 'SIRET', 'text', { section: 'Nouveau propriétaire (pro)' }),
    f('nouveau_adresse', 'Adresse', 'text', { required: true, profileKey: 'location', section: 'Nouveau propriétaire (pro)' }),
    f('marque', 'Marque', 'text', { required: true, section: 'Véhicule' }),
    f('type', 'Type / variante / version', 'text', { section: 'Véhicule' }),
    f('vin', 'VIN', 'text', { required: true, section: 'Véhicule' }),
    f('immat', 'Immatriculation', 'text', { required: true, section: 'Véhicule' }),
    f('kilometrage', 'Kilométrage', 'number', { required: true, section: 'Véhicule' }),
    f('date_cession', 'Date de cession', 'date', { required: true, section: 'Cession' }),
    f('heure_cession', 'Heure', 'text', { section: 'Cession' }),
    f('prix_ht', 'Prix HT (€)', 'number', { section: 'Cession' }),
    f('tva', 'TVA (€)', 'number', { section: 'Cession' }),
    f('prix_ttc', 'Prix TTC (€)', 'number', { required: true, section: 'Cession' }),
  ],
}

const frBusiness: OfficialFormPack = {
  modelName: 'Création d’entreprise — parcours formalités (guichet unique)',
  language: 'fr',
  sourceName: 'Guichet unique des formalités des entreprises',
  sourceUrl: 'https://formalites.entreprises.gouv.fr/',
  lastVerified: null,
  noticeLocal:
    'Champs du parcours de formalités (guichet unique). Déposez le dossier sur formalites.entreprises.gouv.fr.',
  noticeEn: 'Fields for the French one-stop business formalities desk.',
  fields: [
    f('declarant', 'Déclarant', 'text', { required: true, profileKey: 'full_name', section: 'Identité' }),
    f('adresse', 'Adresse', 'text', { required: true, profileKey: 'location', section: 'Identité' }),
    f('email', 'E-mail', 'email', { profileKey: 'email', section: 'Identité' }),
    f('telephone', 'Téléphone', 'phone', { profileKey: 'phone', section: 'Identité' }),
    f('denomination', 'Dénomination / nom commercial', 'text', { required: true, section: 'Activité' }),
    f('forme', 'Forme juridique (micro, EURL, SAS…)', 'text', { required: true, section: 'Activité' }),
    f('activite', 'Activité principale', 'textarea', { required: true, section: 'Activité' }),
    f('siege', 'Adresse du siège', 'text', { required: true, section: 'Activité' }),
    f('debut', 'Date de début d’activité', 'date', { required: true, section: 'Activité' }),
  ],
}

const frEmployment: OfficialFormPack = {
  modelName: 'Contrat de travail — mentions obligatoires (Code du travail)',
  language: 'fr',
  sourceName: 'Service-Public — Contrat de travail',
  sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/N19871',
  lastVerified: null,
  noticeLocal: 'Mentions usuelles du contrat de travail en France. Vérifier sur service-public.fr.',
  noticeEn: 'Usual French employment contract particulars.',
  fields: [
    f('employeur', 'Employeur', 'text', { required: true, section: 'Parties' }),
    f('salarie', 'Salarié', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('poste', 'Emploi / qualification', 'text', { required: true, section: 'Poste' }),
    f('lieu', 'Lieu de travail', 'text', { section: 'Poste' }),
    f('debut', 'Date d’embauche', 'date', { required: true, section: 'Conditions' }),
    f('duree', 'Durée (CDI / CDD)', 'text', { section: 'Conditions' }),
    f('temps', 'Durée du travail', 'text', { section: 'Conditions' }),
    f('remuneration', 'Rémunération (€ brut)', 'number', { required: true, section: 'Rémunération' }),
    f('convention', 'Convention collective', 'text', { section: 'Rémunération' }),
    f('date_signature', 'Date', 'date', { section: 'Signature' }),
  ],
}

const frWorks: OfficialFormPack = {
  modelName: 'Devis / contrat de travaux — mentions (consommation)',
  language: 'fr',
  sourceName: 'Service-Public — Travaux',
  sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/N311',
  lastVerified: null,
  noticeLocal: 'Champs typiques devis/contrat de travaux. Vérifier obligations sur service-public.fr.',
  noticeEn: 'Typical French works quote/contract fields.',
  fields: [
    f('client', 'Client', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('professionnel', 'Professionnel', 'text', { required: true, profileKey: 'company_name', section: 'Parties' }),
    f('adresse_travaux', 'Adresse des travaux', 'text', { required: true, profileKey: 'location', section: 'Travaux' }),
    f('description', 'Description des travaux', 'textarea', { required: true, section: 'Travaux' }),
    f('materiaux', 'Fourniture des matériaux', 'textarea', { section: 'Travaux' }),
    f('prix', 'Prix TTC (€)', 'number', { required: true, section: 'Prix' }),
    f('delai', 'Délai d’exécution', 'date', { section: 'Délais' }),
    f('paiement', 'Modalités de paiement', 'textarea', { section: 'Prix' }),
    f('garantie', 'Garanties', 'textarea', { section: 'Garanties' }),
    f('date_signature', 'Date', 'date', { section: 'Signature' }),
  ],
}

/** Spain — contrato de arrendamiento de vivienda (LAU structure) */
const esRental: OfficialFormPack = {
  modelName: 'Contrato de arrendamiento de vivienda (estructura LAU)',
  language: 'es',
  sourceName: 'BOE — Ley de Arrendamientos Urbanos',
  sourceUrl: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=058_Codigo_de_Arrendamientos_Urbanos&tipo=C&modo=2',
  lastVerified: null,
  noticeLocal:
    'Campos alineados con la estructura habitual de contratos de arrendamiento de vivienda (LAU). No sustituye un modelo notarial o el PDF oficial de su comunidad.',
  noticeEn: 'Fields aligned with Spanish LAU residential lease structure. Not a substitute for an official regional PDF.',
  fields: [
    f('arrendador', 'Arrendador', 'text', { required: true, section: 'Partes' }),
    f('arrendador_nif', 'NIF/NIE del arrendador', 'text', { section: 'Partes' }),
    f('arrendatario', 'Arrendatario', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
    f('arrendatario_nif', 'NIF/NIE del arrendatario', 'text', { section: 'Partes' }),
    f('finca', 'Identificación de la finca / dirección', 'text', { required: true, section: 'Objeto' }),
    f('referencia_catastral', 'Referencia catastral (si consta)', 'text', { section: 'Objeto' }),
    f('superficie', 'Superficie útil (m²)', 'number', { section: 'Objeto' }),
    f('renta', 'Renta mensual (€)', 'number', { required: true, section: 'Renta y fianza' }),
    f('fianza', 'Fianza (€)', 'number', { section: 'Renta y fianza' }),
    f('actualizacion', 'Actualización de renta', 'text', { section: 'Renta y fianza' }),
    f('duracion', 'Duración / prórrogas', 'text', { required: true, section: 'Duración' }),
    f('inicio', 'Fecha de inicio', 'date', { required: true, section: 'Duración' }),
    f('inventario', 'Inventario / estado de la vivienda', 'textarea', { section: 'Anexos' }),
    f('fecha_firma', 'Fecha de firma', 'date', { section: 'Firma' }),
  ],
}

const esVehicle: OfficialFormPack = {
  modelName: 'Contrato de compraventa de vehículo + datos para transferencia DGT',
  language: 'es',
  sourceName: 'DGT — Transferencia de vehículos',
  sourceUrl: 'https://sede.dgt.gob.es/es/tramites-y-multas/tu-vehiculo/transferencias-de-vehiculos/',
  lastVerified: null,
  noticeLocal:
    'Campos del contrato privado y datos habituales del expediente DGT. El cambio de titularidad se formaliza en la sede DGT / gestoría — no sustituye el trámite oficial.',
  noticeEn:
    'Private sale + usual DGT transfer data. Complete ownership change on the official DGT portal / gestor.',
  fields: [
    f('vendedor', 'Vendedor — nombre / razón social', 'text', { required: true, section: 'Vendedor' }),
    f('vendedor_nif', 'NIF/NIE/CIF vendedor', 'text', { required: true, section: 'Vendedor' }),
    f('vendedor_domicilio', 'Domicilio vendedor', 'text', { section: 'Vendedor' }),
    f('comprador', 'Comprador — nombre / razón social', 'text', {
      required: true,
      profileKey: 'full_name',
      section: 'Comprador',
    }),
    f('comprador_nif', 'NIF/NIE/CIF comprador', 'text', { required: true, section: 'Comprador' }),
    f('comprador_domicilio', 'Domicilio comprador', 'text', { profileKey: 'location', section: 'Comprador' }),
    f('marca', 'Marca', 'text', { required: true, section: 'Vehículo' }),
    f('modelo', 'Modelo', 'text', { required: true, section: 'Vehículo' }),
    f('matricula', 'Matrícula', 'text', { required: true, section: 'Vehículo' }),
    f('bastidor', 'Número de bastidor (VIN)', 'text', { required: true, section: 'Vehículo' }),
    f('fecha_matriculacion', 'Fecha de primera matriculación', 'date', { section: 'Vehículo' }),
    f('kilometros', 'Kilómetros', 'number', { required: true, section: 'Vehículo' }),
    f('itv', 'ITV vigente hasta', 'date', { section: 'Vehículo' }),
    f('precio', 'Precio (€)', 'number', { required: true, section: 'Precio y entrega' }),
    f('forma_pago', 'Forma de pago', 'textarea', { section: 'Precio y entrega' }),
    f('fecha_entrega', 'Fecha de entrega', 'date', { required: true, section: 'Precio y entrega' }),
    f('documentacion', 'Documentación entregada', 'textarea', {
      section: 'Precio y entrega',
      placeholder: 'Permiso de circulación, ficha técnica, ITV…',
    }),
    f('fecha_firma', 'Fecha de firma', 'date', { section: 'Firma' }),
  ],
}

const esVehicleCommercial: OfficialFormPack = {
  ...esVehicle,
  modelName: 'Compraventa de vehículo entre empresas + transferencia DGT',
  noticeLocal:
    'Compraventa mercantil (CIF, factura/IVA). La transferencia se tramita en DGT. Revise obligaciones fiscales (IVA / IGIC).',
  noticeEn: 'B2B Spanish vehicle sale (CIF, invoice/VAT) + DGT transfer data.',
  fields: [
    f('vendedor', 'Vendedor — razón social', 'text', {
      required: true,
      profileKey: 'company_name',
      section: 'Vendedor (empresa)',
    }),
    f('vendedor_cif', 'CIF vendedor', 'text', { required: true, section: 'Vendedor (empresa)' }),
    f('vendedor_domicilio', 'Domicilio fiscal', 'text', { section: 'Vendedor (empresa)' }),
    f('comprador', 'Comprador — razón social', 'text', { required: true, section: 'Comprador (empresa)' }),
    f('comprador_cif', 'CIF comprador', 'text', { required: true, section: 'Comprador (empresa)' }),
    f('comprador_domicilio', 'Domicilio fiscal', 'text', {
      profileKey: 'location',
      section: 'Comprador (empresa)',
    }),
    f('marca', 'Marca', 'text', { required: true, section: 'Vehículo' }),
    f('modelo', 'Modelo', 'text', { required: true, section: 'Vehículo' }),
    f('matricula', 'Matrícula', 'text', { required: true, section: 'Vehículo' }),
    f('bastidor', 'Bastidor (VIN)', 'text', { required: true, section: 'Vehículo' }),
    f('kilometros', 'Kilómetros', 'number', { required: true, section: 'Vehículo' }),
    f('base', 'Base imponible (€)', 'number', { required: true, section: 'Factura / IVA' }),
    f('iva', 'IVA (€)', 'number', { section: 'Factura / IVA' }),
    f('total', 'Total (€)', 'number', { required: true, section: 'Factura / IVA' }),
    f('factura_n', 'Nº factura', 'text', { section: 'Factura / IVA' }),
    f('fecha_entrega', 'Fecha de entrega', 'date', { required: true, section: 'Entrega' }),
    f('fecha_firma', 'Fecha de firma', 'date', { section: 'Firma' }),
  ],
}

const esBusiness: OfficialFormPack = {
  modelName: 'Alta de actividad / censo (AEAT) + constitución',
  language: 'es',
  sourceName: 'AEAT — Censos de empresarios (modelo 036/037)',
  sourceUrl: 'https://sede.agenciatributaria.gob.es/',
  lastVerified: null,
  noticeLocal:
    'Campos orientativos del alta censal / inicio de actividad. Presente el modelo oficial 036/037 en la AEAT y el resto de trámites en el PAE / registro.',
  noticeEn: 'Indicative fields for Spanish tax census registration (models 036/037).',
  fields: [
    f('titular', 'Titular / representante', 'text', { required: true, profileKey: 'full_name', section: 'Identificación' }),
    f('nif', 'NIF/NIE', 'text', { required: true, section: 'Identificación' }),
    f('domicilio', 'Domicilio fiscal', 'text', { required: true, profileKey: 'location', section: 'Identificación' }),
    f('email', 'Correo electrónico', 'email', { profileKey: 'email', section: 'Identificación' }),
    f('telefono', 'Teléfono', 'phone', { profileKey: 'phone', section: 'Identificación' }),
    f('forma', 'Forma jurídica (autónomo, SL…)', 'text', { required: true, section: 'Actividad' }),
    f('epigrafe', 'Epígrafe IAE / descripción actividad', 'textarea', { required: true, section: 'Actividad' }),
    f('inicio', 'Fecha de inicio', 'date', { required: true, section: 'Actividad' }),
    f('local', 'Local de negocio (si existe)', 'text', { section: 'Actividad' }),
  ],
}

const esEmployment: OfficialFormPack = {
  modelName: 'Contrato de trabajo — datos SEPE / modelo oficial',
  language: 'es',
  sourceName: 'SEPE — Contratos',
  sourceUrl: 'https://www.sepe.es/HomeSepe/empresas/Contratos.html',
  lastVerified: null,
  noticeLocal: 'Datos habituales del contrato de trabajo. Use los modelos oficiales del SEPE para el alta.',
  noticeEn: 'Usual Spanish employment contract data — use official SEPE models.',
  fields: [
    f('empresa', 'Empresa', 'text', { required: true, section: 'Partes' }),
    f('trabajador', 'Trabajador/a', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
    f('puesto', 'Puesto / categoría', 'text', { required: true, section: 'Puesto' }),
    f('jornada', 'Jornada', 'text', { section: 'Condiciones' }),
    f('inicio', 'Fecha de inicio', 'date', { required: true, section: 'Condiciones' }),
    f('modalidad', 'Modalidad (indefinido, temporal…)', 'text', { section: 'Condiciones' }),
    f('salario', 'Salario (€)', 'number', { required: true, section: 'Retribución' }),
    f('convenio', 'Convenio colectivo', 'text', { section: 'Retribución' }),
    f('fecha_firma', 'Fecha', 'date', { section: 'Firma' }),
  ],
}

const esWorks: OfficialFormPack = {
  modelName: 'Contrato de obra / reforma — cláusulas habituales',
  language: 'es',
  sourceName: 'BOE / normativa de consumidores',
  sourceUrl: 'https://www.boe.es/',
  lastVerified: null,
  noticeLocal: 'Estructura habitual de contrato de obra/reforma en España. Revisar con profesional antes de firmar.',
  noticeEn: 'Usual Spanish works/renovation contract structure.',
  fields: [
    f('promotor', 'Promotor / cliente', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
    f('contratista', 'Contratista', 'text', { required: true, profileKey: 'company_name', section: 'Partes' }),
    f('obra_direccion', 'Dirección de la obra', 'text', { required: true, profileKey: 'location', section: 'Obra' }),
    f('objeto', 'Objeto de la obra', 'textarea', { required: true, section: 'Obra' }),
    f('materiales', 'Materiales', 'textarea', { section: 'Obra' }),
    f('precio', 'Precio (€)', 'number', { required: true, section: 'Precio' }),
    f('plazo', 'Plazo de ejecución', 'date', { section: 'Plazos' }),
    f('pagos', 'Forma de pago', 'textarea', { section: 'Precio' }),
    f('garantia', 'Garantía', 'textarea', { section: 'Garantía' }),
    f('fecha_firma', 'Fecha', 'date', { section: 'Firma' }),
  ],
}

/** Poland */
const plRental: OfficialFormPack = {
  modelName: 'Umowa najmu lokalu mieszkalnego — pola typowe (KC)',
  language: 'pl',
  sourceName: 'gov.pl / ISAP — Kodeks cywilny',
  sourceUrl: 'https://www.gov.pl/',
  lastVerified: null,
  noticeLocal:
    'Pola zgodne z typową umową najmu w Polsce (Kodeks cywilny). Sprawdź wzór na gov.pl i skonsultuj przed podpisaniem.',
  noticeEn: 'Typical Polish residential lease fields (Civil Code).',
  fields: [
    f('wynajmujacy', 'Wynajmujący', 'text', { required: true, section: 'Strony' }),
    f('najemca', 'Najemca', 'text', { required: true, profileKey: 'full_name', section: 'Strony' }),
    f('adres_lokalu', 'Adres lokalu', 'text', { required: true, section: 'Przedmiot' }),
    f('powierzchnia', 'Powierzchnia (m²)', 'number', { section: 'Przedmiot' }),
    f('czynsz', 'Czynsz (PLN / miesiąc)', 'number', { required: true, section: 'Opłaty' }),
    f('oplaty', 'Opłaty dodatkowe', 'textarea', { section: 'Opłaty' }),
    f('kaucja', 'Kaucja (PLN)', 'number', { section: 'Opłaty' }),
    f('poczatek', 'Data rozpoczęcia', 'date', { required: true, section: 'Okres' }),
    f('koniec', 'Data zakończenia (jeśli terminowa)', 'date', { section: 'Okres' }),
    f('protokol', 'Protokół zdawczo-odbiorczy', 'textarea', { section: 'Załączniki' }),
    f('data_podpisu', 'Data podpisania', 'date', { section: 'Podpis' }),
  ],
}

const plVehicle: OfficialFormPack = {
  modelName: 'Umowa kupna-sprzedaży pojazdu + rejestracja',
  language: 'pl',
  sourceName: 'gov.pl — Rejestracja pojazdów',
  sourceUrl: 'https://www.gov.pl/web/gov/zarejestruj-pojazd',
  lastVerified: null,
  noticeLocal: 'Pola typowej umowy kupna-sprzedaży + dane do rejestracji. Dopełnij formalności w urzędzie.',
  noticeEn: 'Typical Polish vehicle sale + registration fields.',
  fields: [
    f('sprzedawca', 'Sprzedawca', 'text', { required: true, section: 'Strony' }),
    f('nabywca', 'Nabywca', 'text', { required: true, profileKey: 'full_name', section: 'Strony' }),
    f('marka', 'Marka', 'text', { required: true, section: 'Pojazd' }),
    f('model', 'Model', 'text', { required: true, section: 'Pojazd' }),
    f('vin', 'Numer VIN', 'text', { required: true, section: 'Pojazd' }),
    f('rejestracja', 'Numer rejestracyjny', 'text', { section: 'Pojazd' }),
    f('przebieg', 'Przebieg (km)', 'number', { section: 'Pojazd' }),
    f('cena', 'Cena (PLN)', 'number', { required: true, section: 'Cena' }),
    f('data_umowy', 'Data umowy', 'date', { required: true, section: 'Podpis' }),
  ],
}

const plBusiness: OfficialFormPack = {
  modelName: 'CEIDG — wpis działalności gospodarczej',
  language: 'pl',
  sourceName: 'CEIDG / biznes.gov.pl',
  sourceUrl: 'https://www.biznes.gov.pl/',
  lastVerified: null,
  noticeLocal: 'Pola wniosku CEIDG. Wniosek złóż na biznes.gov.pl / CEIDG.',
  noticeEn: 'CEIDG business registration fields — file on biznes.gov.pl.',
  fields: [
    f('imie_nazwisko', 'Imię i nazwisko', 'text', { required: true, profileKey: 'full_name', section: 'Dane' }),
    f('pesel_nip', 'PESEL / NIP', 'text', { section: 'Dane' }),
    f('adres', 'Adres zamieszkania', 'text', { required: true, profileKey: 'location', section: 'Dane' }),
    f('email', 'E-mail', 'email', { profileKey: 'email', section: 'Dane' }),
    f('firma', 'Nazwa firmy', 'text', { required: true, section: 'Działalność' }),
    f('pkd', 'Kod PKD / opis działalności', 'textarea', { required: true, section: 'Działalność' }),
    f('adres_firmy', 'Adres wykonywania działalności', 'text', { required: true, section: 'Działalność' }),
    f('data_rozpoczecia', 'Data rozpoczęcia', 'date', { required: true, section: 'Działalność' }),
  ],
}

/** Italy */
const itRental: OfficialFormPack = {
  modelName: 'Contratto di locazione abitativa — canoni (Agenzia Entrate)',
  language: 'it',
  sourceName: 'Agenzia delle Entrate — Locazioni',
  sourceUrl: 'https://www.agenziaentrate.gov.it/portale/web/guest/schede/fabbricatiterreni/contratti-di-locazione',
  lastVerified: null,
  noticeLocal:
    'Campi tipici del contratto di locazione abitativa. Registrare il contratto presso l’Agenzia delle Entrate secondo le istruzioni ufficiali.',
  noticeEn: 'Typical Italian residential lease fields — register with Agenzia delle Entrate.',
  fields: [
    f('locatore', 'Locatore', 'text', { required: true, section: 'Parti' }),
    f('conduttore', 'Conduttore', 'text', { required: true, profileKey: 'full_name', section: 'Parti' }),
    f('immobile', 'Indirizzo immobile', 'text', { required: true, section: 'Immobile' }),
    f('dati_catastali', 'Dati catastali', 'text', { section: 'Immobile' }),
    f('canone', 'Canone mensile (€)', 'number', { required: true, section: 'Canone' }),
    f('deposito', 'Deposito cauzionale (€)', 'number', { section: 'Canone' }),
    f('inizio', 'Data inizio', 'date', { required: true, section: 'Durata' }),
    f('durata', 'Durata (es. 4+4)', 'text', { section: 'Durata' }),
    f('data_firma', 'Data firma', 'date', { section: 'Firma' }),
  ],
}

const itVehicle: OfficialFormPack = {
  modelName: 'Passaggio di proprietà — atto di vendita veicolo',
  language: 'it',
  sourceName: 'ACI / Motorizzazione',
  sourceUrl: 'https://www.aci.it/',
  lastVerified: null,
  noticeLocal: 'Campi tipici dell’atto di vendita. Completare il passaggio presso ACI/PRA / Motorizzazione.',
  noticeEn: 'Typical Italian vehicle sale deed fields.',
  fields: [
    f('venditore', 'Venditore', 'text', { required: true, section: 'Parti' }),
    f('acquirente', 'Acquirente', 'text', { required: true, profileKey: 'full_name', section: 'Parti' }),
    f('marca', 'Marca', 'text', { required: true, section: 'Veicolo' }),
    f('modello', 'Modello', 'text', { required: true, section: 'Veicolo' }),
    f('telaio', 'Numero di telaio', 'text', { required: true, section: 'Veicolo' }),
    f('targa', 'Targa', 'text', { required: true, section: 'Veicolo' }),
    f('prezzo', 'Prezzo (€)', 'number', { required: true, section: 'Prezzo' }),
    f('data', 'Data', 'date', { required: true, section: 'Firma' }),
  ],
}

const itBusiness: OfficialFormPack = {
  modelName: 'Comunica / Registro Imprese — avvio attività',
  language: 'it',
  sourceName: 'impresa.italia.it / Registro Imprese',
  sourceUrl: 'https://www.registroimprese.it/',
  lastVerified: null,
  noticeLocal: 'Campi del percorso di avvio impresa. Presentare la pratica sul portale ufficiale.',
  noticeEn: 'Italian business start fields — file on the official Registro Imprese portal.',
  fields: [
    f('richiedente', 'Richiedente', 'text', { required: true, profileKey: 'full_name', section: 'Identità' }),
    f('codice_fiscale', 'Codice fiscale', 'text', { section: 'Identità' }),
    f('indirizzo', 'Indirizzo', 'text', { required: true, profileKey: 'location', section: 'Identità' }),
    f('denominazione', 'Denominazione', 'text', { required: true, section: 'Attività' }),
    f('forma', 'Forma giuridica', 'text', { required: true, section: 'Attività' }),
    f('ateco', 'Codice ATECO / attività', 'textarea', { required: true, section: 'Attività' }),
    f('sede', 'Sede legale', 'text', { required: true, section: 'Attività' }),
    f('inizio', 'Data inizio', 'date', { required: true, section: 'Attività' }),
  ],
}

const itWorks: OfficialFormPack = {
  modelName: 'Contratto d’appalto / ristrutturazione — elementi tipici',
  language: 'it',
  sourceName: 'Codice Civile / gov.it — consumatori',
  sourceUrl: 'https://www.gov.it/',
  lastVerified: null,
  noticeLocal:
    'Struttura tipica dei contratti d’appalto / ristrutturazione in Italia. Verificare obblighi e, se necessario, rivolgersi a un professionista.',
  noticeEn: 'Typical Italian works/renovation contract structure.',
  fields: [
    f('committente', 'Committente', 'text', { required: true, profileKey: 'full_name', section: 'Parti' }),
    f('appaltatore', 'Appaltatore', 'text', { required: true, profileKey: 'company_name', section: 'Parti' }),
    f('luogo', 'Luogo dei lavori', 'text', { required: true, profileKey: 'location', section: 'Lavori' }),
    f('oggetto', 'Oggetto dei lavori', 'textarea', { required: true, section: 'Lavori' }),
    f('materiali', 'Materiali', 'textarea', { section: 'Lavori' }),
    f('corrispettivo', 'Corrispettivo (€)', 'number', { required: true, section: 'Prezzo' }),
    f('termine', 'Termine di esecuzione', 'date', { section: 'Tempi' }),
    f('pagamenti', 'Modalità di pagamento', 'textarea', { section: 'Prezzo' }),
    f('garanzia', 'Garanzia', 'textarea', { section: 'Garanzia' }),
    f('data', 'Data', 'date', { section: 'Firma' }),
  ],
}

/** Portugal */
const ptRental: OfficialFormPack = {
  modelName: 'Contrato de arrendamento habitacional',
  language: 'pt',
  sourceName: 'Portal das Finanças / DRE',
  sourceUrl: 'https://www.portaldasfinancas.gov.pt/',
  lastVerified: null,
  noticeLocal: 'Campos típicos do contrato de arrendamento em Portugal. Registe no Portal das Finanças conforme as regras oficiais.',
  noticeEn: 'Typical Portuguese residential lease fields — register on Portal das Finanças.',
  fields: [
    f('senhorio', 'Senhorio', 'text', { required: true, section: 'Partes' }),
    f('arrendatario', 'Arrendatário', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
    f('imovel', 'Morada do imóvel', 'text', { required: true, section: 'Imóvel' }),
    f('renda', 'Renda mensal (€)', 'number', { required: true, section: 'Renda' }),
    f('caucao', 'Caução (€)', 'number', { section: 'Renda' }),
    f('inicio', 'Data de início', 'date', { required: true, section: 'Prazo' }),
    f('prazo', 'Prazo do contrato', 'text', { section: 'Prazo' }),
    f('data_assinatura', 'Data de assinatura', 'date', { section: 'Assinatura' }),
  ],
}

const ptVehicle: OfficialFormPack = {
  modelName: 'Contrato de compra e venda de veículo + registo IMT',
  language: 'pt',
  sourceName: 'IMT — Registo de propriedade',
  sourceUrl: 'https://www.imt-ip.pt/',
  lastVerified: null,
  noticeLocal: 'Campos do contrato particular e dados para registo no IMT.',
  noticeEn: 'Portuguese vehicle sale + IMT registration fields.',
  fields: [
    f('vendedor', 'Vendedor', 'text', { required: true, section: 'Partes' }),
    f('comprador', 'Comprador', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
    f('marca', 'Marca', 'text', { required: true, section: 'Veículo' }),
    f('modelo', 'Modelo', 'text', { required: true, section: 'Veículo' }),
    f('matricula', 'Matrícula', 'text', { required: true, section: 'Veículo' }),
    f('quadro', 'Nº de quadro', 'text', { required: true, section: 'Veículo' }),
    f('preco', 'Preço (€)', 'number', { required: true, section: 'Preço' }),
    f('data', 'Data', 'date', { required: true, section: 'Assinatura' }),
  ],
}

const ptBusiness: OfficialFormPack = {
  modelName: 'Empresa na Hora / Balcão do Empreendedor',
  language: 'pt',
  sourceName: 'Empresa na Hora / gov.pt',
  sourceUrl: 'https://eportugal.gov.pt/',
  lastVerified: null,
  noticeLocal: 'Campos do percurso Empresa na Hora / formalidades. Submeta no balcão oficial.',
  noticeEn: 'Portuguese Empresa na Hora / entrepreneur desk fields.',
  fields: [
    f('requerente', 'Requerente', 'text', { required: true, profileKey: 'full_name', section: 'Identificação' }),
    f('nif', 'NIF', 'text', { section: 'Identificação' }),
    f('morada', 'Morada', 'text', { required: true, profileKey: 'location', section: 'Identificação' }),
    f('firma', 'Firma / denominação', 'text', { required: true, section: 'Atividade' }),
    f('forma', 'Forma jurídica', 'text', { required: true, section: 'Atividade' }),
    f('cae', 'CAE / atividade', 'textarea', { required: true, section: 'Atividade' }),
    f('sede', 'Sede', 'text', { required: true, section: 'Atividade' }),
    f('inicio', 'Data de início', 'date', { required: true, section: 'Atividade' }),
  ],
}

/** Netherlands */
const nlRental: OfficialFormPack = {
  modelName: 'Huurovereenkomst woonruimte — standaardvelden',
  language: 'nl',
  sourceName: 'Rijksoverheid — Huren',
  sourceUrl: 'https://www.rijksoverheid.nl/onderwerpen/huurwoning',
  lastVerified: null,
  noticeLocal: 'Velden zoals in gangbare Nederlandse huurovereenkomsten. Controleer op rijksoverheid.nl.',
  noticeEn: 'Common Dutch residential lease fields.',
  fields: [
    f('verhuurder', 'Verhuurder', 'text', { required: true, section: 'Partijen' }),
    f('huurder', 'Huurder', 'text', { required: true, profileKey: 'full_name', section: 'Partijen' }),
    f('adres', 'Adres van de woning', 'text', { required: true, section: 'Woning' }),
    f('huurprijs', 'Kale huur (€ / maand)', 'number', { required: true, section: 'Huur' }),
    f('servicekosten', 'Servicekosten (€)', 'number', { section: 'Huur' }),
    f('borg', 'Borg (€)', 'number', { section: 'Huur' }),
    f('ingangsdatum', 'Ingangsdatum', 'date', { required: true, section: 'Duur' }),
    f('einddatum', 'Einddatum (indien bepaald)', 'date', { section: 'Duur' }),
    f('handtekening_datum', 'Datum ondertekening', 'date', { section: 'Ondertekening' }),
  ],
}

const nlBusiness: OfficialFormPack = {
  modelName: 'KVK inschrijving — onderneming starten',
  language: 'nl',
  sourceName: 'KVK — Bedrijf starten',
  sourceUrl: 'https://www.kvk.nl/starten/',
  lastVerified: null,
  noticeLocal: 'Velden voor KVK-inschrijving. Schrijf in via kvk.nl.',
  noticeEn: 'Dutch KVK registration fields.',
  fields: [
    f('ondernemer', 'Ondernemer', 'text', { required: true, profileKey: 'full_name', section: 'Gegevens' }),
    f('adres', 'Adres', 'text', { required: true, profileKey: 'location', section: 'Gegevens' }),
    f('email', 'E-mail', 'email', { profileKey: 'email', section: 'Gegevens' }),
    f('handelsnaam', 'Handelsnaam', 'text', { required: true, section: 'Onderneming' }),
    f('rechtsvorm', 'Rechtsvorm', 'text', { required: true, section: 'Onderneming' }),
    f('activiteiten', 'Activiteiten', 'textarea', { required: true, section: 'Onderneming' }),
    f('startdatum', 'Startdatum', 'date', { required: true, section: 'Onderneming' }),
  ],
}

const nlVehicle: OfficialFormPack = {
  modelName: 'Koopovereenkomst voertuig + RDW overschrijving',
  language: 'nl',
  sourceName: 'RDW — Voertuig overschrijven',
  sourceUrl: 'https://www.rdw.nl/',
  lastVerified: null,
  noticeLocal: 'Velden koopovereenkomst + RDW-overschrijving.',
  noticeEn: 'Dutch vehicle sale + RDW transfer fields.',
  fields: [
    f('verkoper', 'Verkoper', 'text', { required: true, section: 'Partijen' }),
    f('koper', 'Koper', 'text', { required: true, profileKey: 'full_name', section: 'Partijen' }),
    f('merk', 'Merk', 'text', { required: true, section: 'Voertuig' }),
    f('model', 'Model', 'text', { required: true, section: 'Voertuig' }),
    f('vin', 'VIN / chassisnummer', 'text', { required: true, section: 'Voertuig' }),
    f('kenteken', 'Kenteken', 'text', { required: true, section: 'Voertuig' }),
    f('prijs', 'Koopprijs (€)', 'number', { required: true, section: 'Prijs' }),
    f('datum', 'Datum', 'date', { required: true, section: 'Ondertekening' }),
  ],
}

type SlugKey =
  | 'residential-rental-contract'
  | 'commercial-rental-contract'
  | 'vehicle-purchase-contract'
  | 'vehicle-purchase-commercial'
  | 'vehicle-rental-contract'
  | 'employment-contract'
  | 'renovation-contract'
  | 'construction-contract'
  | 'services-agreement'
  | 'business-registration'
  | 'property-purchase-contract'
  | 'warranty-agreement'
  | 'deposit-agreement'
  | 'subcontract-agreement'
  | 'work-completion-act'
  | 'handover-act'

const BY_COUNTRY: Record<string, Partial<Record<SlugKey, OfficialFormPack>>> = {
  DE: {
    'residential-rental-contract': deRental,
    'commercial-rental-contract': { ...deRental, modelName: 'Gewerberaummietvertrag — Felder (BGB)' },
    'vehicle-purchase-contract': deVehicle,
    'vehicle-purchase-commercial': deVehicleCommercial,
    'employment-contract': deEmployment,
    'renovation-contract': deWorks,
    'construction-contract': deWorks,
    'services-agreement': deWorks,
    'business-registration': deBusiness,
    'property-purchase-contract': {
      ...deRental,
      modelName: 'Immobilienkauf — Vertragsfelder (Beurkundung / Notar)',
      sourceName: 'BMI / bund.de — Immobilien',
      sourceUrl: 'https://www.bund.de/',
      noticeLocal:
        'Immobilienkauf in Deutschland ist notariell beurkundungspflichtig. Diese Felder sind nur eine Vorbereitung — der Notar erstellt die Urkunde.',
      noticeEn: 'German property purchase requires notarial deed — these fields are preparatory only.',
      fields: [
        f('verkaeufer', 'Verkäufer', 'text', { required: true, section: 'Parteien' }),
        f('kaeufer', 'Käufer', 'text', { required: true, profileKey: 'full_name', section: 'Parteien' }),
        f('objekt', 'Objekt / Grundbuchbezeichnung', 'textarea', { required: true, section: 'Objekt' }),
        f('kaufpreis', 'Kaufpreis (€)', 'number', { required: true, section: 'Preis' }),
        f('notar', 'Notar (Name / Ort)', 'text', { section: 'Beurkundung' }),
        f('termin', 'Beurkundungstermin', 'date', { section: 'Beurkundung' }),
      ],
    },
    'warranty-agreement': {
      ...deWorks,
      modelName: 'Gewährleistungs-/Garantievereinbarung',
      fields: [
        f('auftragnehmer', 'Auftragnehmer', 'text', { required: true, section: 'Parteien' }),
        f('auftraggeber', 'Auftraggeber', 'text', { required: true, profileKey: 'full_name', section: 'Parteien' }),
        f('leistung', 'Leistung / Objekt', 'textarea', { required: true, section: 'Gegenstand' }),
        f('frist', 'Gewährleistungsfrist', 'text', { required: true, section: 'Frist' }),
        f('umfang', 'Umfang der Gewährleistung', 'textarea', { section: 'Umfang' }),
        f('datum', 'Datum', 'date', { section: 'Unterschrift' }),
      ],
    },
  },
  AT: {
    'residential-rental-contract': {
      ...deRental,
      sourceName: 'oesterreich.gv.at — Miete',
      sourceUrl: 'https://www.oesterreich.gv.at/',
      noticeLocal: 'Felder analog üblicher österreichischer Mietverträge. Auf oesterreich.gv.at prüfen.',
      noticeEn: 'Typical Austrian lease fields — verify on oesterreich.gv.at.',
    },
    'vehicle-purchase-contract': {
      ...deVehicle,
      sourceName: 'oesterreich.gv.at — Fahrzeug',
      sourceUrl: 'https://www.oesterreich.gv.at/',
    },
    'vehicle-purchase-commercial': {
      ...deVehicleCommercial,
      sourceName: 'oesterreich.gv.at — Fahrzeug / Gewerbe',
      sourceUrl: 'https://www.oesterreich.gv.at/',
    },
    'business-registration': {
      ...deBusiness,
      modelName: 'Gewerbeanmeldung Österreich',
      sourceName: 'oesterreich.gv.at — Gewerbe',
      sourceUrl: 'https://www.oesterreich.gv.at/',
    },
    'employment-contract': deEmployment,
    'renovation-contract': deWorks,
    'construction-contract': deWorks,
    'services-agreement': deWorks,
  },
  FR: {
    'residential-rental-contract': frRental,
    'commercial-rental-contract': {
      ...frRental,
      modelName: 'Bail commercial — champs (Code de commerce)',
      sourceUrl: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/N24268',
    },
    'vehicle-purchase-contract': frVehicle,
    'vehicle-purchase-commercial': frVehicleCommercial,
    'employment-contract': frEmployment,
    'renovation-contract': frWorks,
    'construction-contract': frWorks,
    'services-agreement': frWorks,
    'business-registration': frBusiness,
  },
  BE: {
    'residential-rental-contract': {
      ...frRental,
      sourceName: 'Belgium.be — Location',
      sourceUrl: 'https://www.belgium.be/',
      noticeLocal: 'Champs typiques (BE). Vérifier les règles régionales (Bruxelles / Wallonie / Flandre).',
      noticeEn: 'Typical Belgian lease fields — check regional rules.',
    },
    'vehicle-purchase-contract': {
      ...frVehicle,
      sourceName: 'DIV / Belgium.be / Car-Pass',
      sourceUrl: 'https://www.car-pass.be/',
      noticeLocal:
        'Champs type cession + Car-Pass obligatoire en Belgique. Vérifier sur car-pass.be et mobility.belgium.be.',
      noticeEn: 'Belgian transfer fields + mandatory Car-Pass — verify on car-pass.be.',
    },
    'vehicle-purchase-commercial': {
      ...frVehicleCommercial,
      sourceName: 'DIV / Belgium.be / Car-Pass',
      sourceUrl: 'https://www.car-pass.be/',
    },
    'business-registration': {
      ...frBusiness,
      sourceName: 'Belgium.be — Créer une entreprise',
      sourceUrl: 'https://www.belgium.be/',
    },
    'employment-contract': frEmployment,
    'renovation-contract': frWorks,
    'construction-contract': frWorks,
    'services-agreement': frWorks,
  },
  ES: {
    'residential-rental-contract': esRental,
    'commercial-rental-contract': {
      ...esRental,
      modelName: 'Contrato de arrendamiento de local de negocio',
    },
    'vehicle-purchase-contract': esVehicle,
    'vehicle-purchase-commercial': esVehicleCommercial,
    'vehicle-rental-contract': {
      ...esVehicle,
      modelName: 'Contrato de alquiler de vehículo (particular / renting)',
      noticeLocal:
        'Campos habituales de alquiler de vehículo. No sustituye el contrato del arrendador ni trámites DGT si aplican.',
      noticeEn: 'Usual Spanish vehicle rental fields — not a substitute for the lessor’s contract.',
      fields: [
        f('arrendador', 'Arrendador', 'text', { required: true, section: 'Partes' }),
        f('arrendatario', 'Arrendatario', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('marca', 'Marca', 'text', { required: true, section: 'Vehículo' }),
        f('modelo', 'Modelo', 'text', { required: true, section: 'Vehículo' }),
        f('matricula', 'Matrícula', 'text', { required: true, section: 'Vehículo' }),
        f('bastidor', 'Bastidor (VIN)', 'text', { section: 'Vehículo' }),
        f('precio_dia', 'Precio / día o período (€)', 'number', { required: true, section: 'Precio' }),
        f('inicio', 'Inicio', 'date', { required: true, section: 'Duración' }),
        f('fin', 'Fin', 'date', { required: true, section: 'Duración' }),
        f('deposito', 'Depósito (€)', 'number', { section: 'Precio' }),
        f('fecha_firma', 'Fecha de firma', 'date', { section: 'Firma' }),
      ],
    },
    'employment-contract': esEmployment,
    'renovation-contract': esWorks,
    'construction-contract': esWorks,
    'services-agreement': esWorks,
    'subcontract-agreement': {
      ...esWorks,
      modelName: 'Contrato de subcontratación / obra — campos habituales',
      noticeLocal: 'Estructura habitual de subcontrato de obra. Revisar con profesional antes de firmar.',
      noticeEn: 'Usual Spanish subcontract fields — review before signing.',
    },
    'warranty-agreement': {
      ...esWorks,
      modelName: 'Acuerdo de garantía / postventa',
      fields: [
        f('prestador', 'Prestador', 'text', { required: true, profileKey: 'company_name', section: 'Partes' }),
        f('cliente', 'Cliente', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('objeto', 'Objeto / trabajo', 'textarea', { required: true, section: 'Garantía' }),
        f('plazo', 'Plazo de garantía', 'text', { required: true, section: 'Garantía' }),
        f('cobertura', 'Cobertura', 'textarea', { section: 'Garantía' }),
        f('fecha', 'Fecha', 'date', { section: 'Firma' }),
      ],
    },
    'work-completion-act': {
      ...esWorks,
      modelName: 'Acta de recepción / fin de obra',
      fields: [
        f('cliente', 'Cliente', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('contratista', 'Contratista', 'text', { required: true, profileKey: 'company_name', section: 'Partes' }),
        f('obra', 'Descripción de la obra', 'textarea', { required: true, section: 'Obra' }),
        f('fecha_recepcion', 'Fecha de recepción', 'date', { required: true, section: 'Recepción' }),
        f('observaciones', 'Observaciones / reservas', 'textarea', { section: 'Recepción' }),
      ],
    },
    'handover-act': {
      ...esWorks,
      modelName: 'Acta de entrega / inventario',
      fields: [
        f('parte_a', 'Parte A', 'text', { required: true, section: 'Partes' }),
        f('parte_b', 'Parte B', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('objeto', 'Objeto entregado', 'textarea', { required: true, section: 'Entrega' }),
        f('estado', 'Estado / inventario', 'textarea', { section: 'Entrega' }),
        f('fecha', 'Fecha', 'date', { required: true, section: 'Firma' }),
      ],
    },
    'deposit-agreement': {
      language: 'es',
      modelName: 'Contrato de arras / señal',
      sourceName: 'BOE — Código Civil (arras)',
      sourceUrl: 'https://www.boe.es/biblioteca_juridica/codigos/codigo.php?id=42&modo=2&nota=0',
      lastVerified: null,
      noticeLocal:
        'Campos habituales de un contrato de arras. No sustituye asesoramiento ni la escritura posterior.',
      noticeEn: 'Usual Spanish deposit (arras) agreement fields.',
      fields: [
        f('entregante', 'Entregante de las arras', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('receptor', 'Receptor', 'text', { required: true, section: 'Partes' }),
        f('importe', 'Importe (€)', 'number', { required: true, section: 'Arras' }),
        f('finalidad', 'Finalidad / bien', 'textarea', { required: true, section: 'Arras' }),
        f('plazo', 'Plazo para formalizar', 'date', { section: 'Arras' }),
        f('fecha_firma', 'Fecha de firma', 'date', { section: 'Firma' }),
      ],
    },
    'business-registration': esBusiness,
    'property-purchase-contract': {
      ...esRental,
      modelName: 'Compraventa de inmueble — datos previos a escritura',
      sourceName: 'BOE / Notariado',
      sourceUrl: 'https://www.boe.es/',
      noticeLocal: 'La compraventa habitualmente requiere escritura pública. Estos campos son preparatorios.',
      noticeEn: 'Spanish property sale usually requires a notarial deed — preparatory fields only.',
      fields: [
        f('vendedor', 'Vendedor', 'text', { required: true, section: 'Partes' }),
        f('comprador', 'Comprador', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('finca', 'Finca / dirección', 'text', { required: true, section: 'Inmueble' }),
        f('precio', 'Precio (€)', 'number', { required: true, section: 'Precio' }),
        f('notario', 'Notario', 'text', { section: 'Escritura' }),
        f('fecha', 'Fecha prevista', 'date', { section: 'Escritura' }),
      ],
    },
  },
  PL: {
    'residential-rental-contract': plRental,
    'commercial-rental-contract': plRental,
    'vehicle-purchase-contract': plVehicle,
    'vehicle-purchase-commercial': {
      ...plVehicle,
      modelName: 'Umowa kupna-sprzedaży pojazdu (firma / VAT) + CEPiK',
      noticeLocal:
        'Pola umowy firmowej + dane do rejestracji. Sprawdź historię na historia-pojazdu.gov.pl i dopełnij formalności w urzędzie.',
      noticeEn: 'Polish B2B vehicle sale fields + CEPiK history check.',
      fields: [
        f('sprzedawca', 'Sprzedawca — firma', 'text', {
          required: true,
          profileKey: 'company_name',
          section: 'Strony',
        }),
        f('nip_s', 'NIP sprzedawcy', 'text', { section: 'Strony' }),
        f('nabywca', 'Nabywca — firma', 'text', { required: true, section: 'Strony' }),
        f('nip_n', 'NIP nabywcy', 'text', { section: 'Strony' }),
        f('marka', 'Marka', 'text', { required: true, section: 'Pojazd' }),
        f('model', 'Model', 'text', { required: true, section: 'Pojazd' }),
        f('vin', 'VIN', 'text', { required: true, section: 'Pojazd' }),
        f('rejestracja', 'Nr rejestracyjny', 'text', { section: 'Pojazd' }),
        f('przebieg', 'Przebieg (km)', 'number', { required: true, section: 'Pojazd' }),
        f('netto', 'Cena netto (PLN)', 'number', { required: true, section: 'Cena / VAT' }),
        f('vat', 'VAT (PLN)', 'number', { section: 'Cena / VAT' }),
        f('brutto', 'Cena brutto (PLN)', 'number', { required: true, section: 'Cena / VAT' }),
        f('data_umowy', 'Data umowy', 'date', { required: true, section: 'Podpis' }),
      ],
    },
    'business-registration': plBusiness,
    'employment-contract': {
      ...plRental,
      modelName: 'Umowa o pracę — elementy (Kodeks pracy)',
      sourceUrl: 'https://www.gov.pl/',
      fields: [
        f('pracodawca', 'Pracodawca', 'text', { required: true, section: 'Strony' }),
        f('pracownik', 'Pracownik', 'text', { required: true, profileKey: 'full_name', section: 'Strony' }),
        f('stanowisko', 'Stanowisko', 'text', { required: true, section: 'Warunki' }),
        f('wymiar', 'Wymiar czasu pracy', 'text', { section: 'Warunki' }),
        f('poczatek', 'Data rozpoczęcia', 'date', { required: true, section: 'Warunki' }),
        f('wynagrodzenie', 'Wynagrodzenie (PLN)', 'number', { required: true, section: 'Płaca' }),
        f('data', 'Data', 'date', { section: 'Podpis' }),
      ],
    },
    'renovation-contract': {
      ...plRental,
      modelName: 'Umowa o roboty budowlane / remont',
      fields: [
        f('zamawiajacy', 'Zamawiający', 'text', { required: true, profileKey: 'full_name', section: 'Strony' }),
        f('wykonawca', 'Wykonawca', 'text', { required: true, profileKey: 'company_name', section: 'Strony' }),
        f('adres', 'Adres robót', 'text', { required: true, profileKey: 'location', section: 'Przedmiot' }),
        f('zakres', 'Zakres robót', 'textarea', { required: true, section: 'Przedmiot' }),
        f('cena', 'Cena (PLN)', 'number', { required: true, section: 'Cena' }),
        f('termin', 'Termin', 'date', { section: 'Termin' }),
        f('data', 'Data', 'date', { section: 'Podpis' }),
      ],
    },
  },
  IT: {
    'residential-rental-contract': itRental,
    'commercial-rental-contract': itRental,
    'vehicle-purchase-contract': itVehicle,
    'vehicle-purchase-commercial': {
      ...itVehicle,
      modelName: 'Passaggio di proprietà — vendita tra imprese (PRA/ACI)',
      noticeLocal:
        'Campi per vendita tra imprese. Completare il passaggio al PRA/ACI e verificare su Portale dell’Automobilista.',
      noticeEn: 'Italian B2B vehicle sale — complete PRA/ACI transfer.',
      fields: [
        f('venditore', 'Venditore — ragione sociale', 'text', {
          required: true,
          profileKey: 'company_name',
          section: 'Parti',
        }),
        f('piva_v', 'P. IVA venditore', 'text', { section: 'Parti' }),
        f('acquirente', 'Acquirente — ragione sociale', 'text', { required: true, section: 'Parti' }),
        f('piva_a', 'P. IVA acquirente', 'text', { section: 'Parti' }),
        f('marca', 'Marca', 'text', { required: true, section: 'Veicolo' }),
        f('modello', 'Modello', 'text', { required: true, section: 'Veicolo' }),
        f('telaio', 'Telaio', 'text', { required: true, section: 'Veicolo' }),
        f('targa', 'Targa', 'text', { required: true, section: 'Veicolo' }),
        f('prezzo_imponibile', 'Imponibile (€)', 'number', { required: true, section: 'Prezzo / IVA' }),
        f('iva', 'IVA (€)', 'number', { section: 'Prezzo / IVA' }),
        f('prezzo', 'Totale (€)', 'number', { required: true, section: 'Prezzo / IVA' }),
        f('data', 'Data', 'date', { required: true, section: 'Firma' }),
      ],
    },
    'business-registration': itBusiness,
    'employment-contract': {
      ...itRental,
      modelName: 'Contratto di lavoro — elementi essenziali',
      sourceUrl: 'https://www.gov.it/',
      fields: [
        f('datore', 'Datore di lavoro', 'text', { required: true, section: 'Parti' }),
        f('lavoratore', 'Lavoratore', 'text', { required: true, profileKey: 'full_name', section: 'Parti' }),
        f('mansioni', 'Mansioni', 'textarea', { required: true, section: 'Rapporto' }),
        f('inizio', 'Data inizio', 'date', { required: true, section: 'Rapporto' }),
        f('retribuzione', 'Retribuzione (€)', 'number', { required: true, section: 'Retribuzione' }),
        f('ccnl', 'CCNL', 'text', { section: 'Retribuzione' }),
        f('data', 'Data', 'date', { section: 'Firma' }),
      ],
    },
    'renovation-contract': itWorks,
    'construction-contract': itWorks,
    'services-agreement': itWorks,
  },
  PT: {
    'residential-rental-contract': ptRental,
    'commercial-rental-contract': ptRental,
    'vehicle-purchase-contract': ptVehicle,
    'vehicle-purchase-commercial': {
      ...ptVehicle,
      modelName: 'Compra e venda de veículo (empresa) + registo IMT',
      noticeLocal: 'Campos B2B + registo IMT. Verifique no portal IMT antes de assinar.',
      noticeEn: 'Portuguese B2B vehicle sale + IMT registration fields.',
      fields: [
        f('vendedor', 'Vendedor — firma', 'text', {
          required: true,
          profileKey: 'company_name',
          section: 'Partes',
        }),
        f('nif_v', 'NIF vendedor', 'text', { section: 'Partes' }),
        f('comprador', 'Comprador — firma', 'text', { required: true, section: 'Partes' }),
        f('nif_c', 'NIF comprador', 'text', { section: 'Partes' }),
        f('marca', 'Marca', 'text', { required: true, section: 'Veículo' }),
        f('modelo', 'Modelo', 'text', { required: true, section: 'Veículo' }),
        f('matricula', 'Matrícula', 'text', { required: true, section: 'Veículo' }),
        f('quadro', 'Nº de quadro', 'text', { required: true, section: 'Veículo' }),
        f('preco_s_iva', 'Preço s/ IVA (€)', 'number', { required: true, section: 'Preço' }),
        f('iva', 'IVA (€)', 'number', { section: 'Preço' }),
        f('preco', 'Preço c/ IVA (€)', 'number', { required: true, section: 'Preço' }),
        f('data', 'Data', 'date', { required: true, section: 'Assinatura' }),
      ],
    },
    'business-registration': ptBusiness,
    'employment-contract': {
      ...ptRental,
      modelName: 'Contrato de trabalho — elementos',
      sourceUrl: 'https://eportugal.gov.pt/',
      fields: [
        f('empregador', 'Empregador', 'text', { required: true, section: 'Partes' }),
        f('trabalhador', 'Trabalhador', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('categoria', 'Categoria profissional', 'text', { required: true, section: 'Condições' }),
        f('inicio', 'Data de início', 'date', { required: true, section: 'Condições' }),
        f('remuneracao', 'Remuneração (€)', 'number', { required: true, section: 'Remuneração' }),
        f('data', 'Data', 'date', { section: 'Assinatura' }),
      ],
    },
    'renovation-contract': {
      ...ptRental,
      modelName: 'Contrato de empreitada / obras',
      fields: [
        f('dono_obra', 'Dono de obra', 'text', { required: true, profileKey: 'full_name', section: 'Partes' }),
        f('empreiteiro', 'Empreiteiro', 'text', { required: true, profileKey: 'company_name', section: 'Partes' }),
        f('local', 'Local da obra', 'text', { required: true, profileKey: 'location', section: 'Obra' }),
        f('objeto', 'Objeto', 'textarea', { required: true, section: 'Obra' }),
        f('preco', 'Preço (€)', 'number', { required: true, section: 'Preço' }),
        f('prazo', 'Prazo', 'date', { section: 'Prazo' }),
        f('data', 'Data', 'date', { section: 'Assinatura' }),
      ],
    },
  },
  NL: {
    'residential-rental-contract': nlRental,
    'commercial-rental-contract': nlRental,
    'vehicle-purchase-contract': nlVehicle,
    'vehicle-purchase-commercial': {
      ...nlVehicle,
      modelName: 'Koopovereenkomst voertuig (zakelijk) + RDW',
      noticeLocal: 'Zakelijke koopvelden. Controleer het voertuig via RDW OVI en rond overschrijving af.',
      noticeEn: 'Dutch B2B vehicle sale fields — check via RDW OVI.',
      fields: [
        f('verkoper', 'Verkoper — bedrijfsnaam', 'text', {
          required: true,
          profileKey: 'company_name',
          section: 'Partijen',
        }),
        f('kvk_v', 'KvK-nummer verkoper', 'text', { section: 'Partijen' }),
        f('koper', 'Koper — bedrijfsnaam', 'text', { required: true, section: 'Partijen' }),
        f('kvk_k', 'KvK-nummer koper', 'text', { section: 'Partijen' }),
        f('merk', 'Merk', 'text', { required: true, section: 'Voertuig' }),
        f('model', 'Model', 'text', { required: true, section: 'Voertuig' }),
        f('vin', 'Chassisnummer', 'text', { required: true, section: 'Voertuig' }),
        f('kenteken', 'Kenteken', 'text', { required: true, section: 'Voertuig' }),
        f('prijs_ex', 'Prijs excl. btw (€)', 'number', { required: true, section: 'Prijs' }),
        f('btw', 'Btw (€)', 'number', { section: 'Prijs' }),
        f('prijs', 'Prijs incl. btw (€)', 'number', { required: true, section: 'Prijs' }),
        f('datum', 'Datum', 'date', { required: true, section: 'Ondertekening' }),
      ],
    },
    'business-registration': nlBusiness,
    'employment-contract': {
      ...nlRental,
      modelName: 'Arbeidsovereenkomst — kerngegevens',
      sourceUrl: 'https://www.rijksoverheid.nl/',
      fields: [
        f('werkgever', 'Werkgever', 'text', { required: true, section: 'Partijen' }),
        f('werknemer', 'Werknemer', 'text', { required: true, profileKey: 'full_name', section: 'Partijen' }),
        f('functie', 'Functie', 'text', { required: true, section: 'Arbeid' }),
        f('ingang', 'Ingangsdatum', 'date', { required: true, section: 'Arbeid' }),
        f('salaris', 'Salaris (€)', 'number', { required: true, section: 'Beloning' }),
        f('datum', 'Datum', 'date', { section: 'Ondertekening' }),
      ],
    },
    'renovation-contract': {
      ...nlRental,
      modelName: 'Aannemingsovereenkomst / renovatie',
      fields: [
        f('opdrachtgever', 'Opdrachtgever', 'text', { required: true, profileKey: 'full_name', section: 'Partijen' }),
        f('aannemer', 'Aannemer', 'text', { required: true, profileKey: 'company_name', section: 'Partijen' }),
        f('locatie', 'Locatie werkzaamheden', 'text', { required: true, profileKey: 'location', section: 'Werk' }),
        f('omschrijving', 'Omschrijving', 'textarea', { required: true, section: 'Werk' }),
        f('prijs', 'Prijs (€)', 'number', { required: true, section: 'Prijs' }),
        f('oplevering', 'Opleverdatum', 'date', { section: 'Planning' }),
        f('datum', 'Datum', 'date', { section: 'Ondertekening' }),
      ],
    },
  },
}

// Mirror renovation → construction / services where missing
for (const code of Object.keys(BY_COUNTRY)) {
  const bag = BY_COUNTRY[code]
  if (!bag) continue
  if (bag['renovation-contract']) {
    bag['construction-contract'] ??= bag['renovation-contract']
    bag['services-agreement'] ??= bag['renovation-contract']
  }
  // Commercial vehicle falls back to EN commercial structure via getOfficialFormPack;
  // if private exists but commercial missing, clone private with commercial title hint.
  if (bag['vehicle-purchase-contract'] && !bag['vehicle-purchase-commercial']) {
    const priv = bag['vehicle-purchase-contract']
    bag['vehicle-purchase-commercial'] = {
      ...priv,
      modelName: `${priv.modelName} (commercial / B2B)`,
      noticeEn: `${priv.noticeEn} Use company / VAT fields as required in ${code}.`,
      noticeLocal: `${priv.noticeLocal} · ${code}: Firmen-/MwSt-Angaben ergänzen.`,
    }
  }
}

const enRental: OfficialFormPack = {
  modelName: 'Assured / private residential tenancy — core fields (UK/IE guidance)',
  language: 'en',
  sourceName: 'GOV.UK — Private renting / Your Europe',
  sourceUrl: 'https://www.gov.uk/private-renting',
  lastVerified: null,
  noticeLocal:
    'Fields follow common UK/IE private tenancy particulars. Use the official national model where published (e.g. GOV.UK / RTB Ireland).',
  noticeEn:
    'Fields follow common UK/IE private tenancy particulars. Use the official national model where published.',
  fields: [
    f('landlord', 'Landlord', 'text', { required: true, section: 'Parties' }),
    f('tenant', 'Tenant', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('property', 'Property address', 'text', { required: true, section: 'Property' }),
    f('rent', 'Rent (per month)', 'number', { required: true, section: 'Rent' }),
    f('deposit', 'Deposit', 'number', { section: 'Rent' }),
    f('start', 'Tenancy start date', 'date', { required: true, section: 'Term' }),
    f('end', 'End date (if fixed term)', 'date', { section: 'Term' }),
    f('signed', 'Date signed', 'date', { section: 'Signature' }),
  ],
}

const enBusiness: OfficialFormPack = {
  modelName: 'Register a business — core particulars',
  language: 'en',
  sourceName: 'GOV.UK — Set up a business / Your Europe',
  sourceUrl: 'https://www.gov.uk/set-up-business',
  lastVerified: null,
  noticeLocal: 'Core registration fields. Complete the filing on the official national portal.',
  noticeEn: 'Core registration fields. Complete the filing on the official national portal.',
  fields: [
    f('applicant', 'Applicant name', 'text', { required: true, profileKey: 'full_name', section: 'Identity' }),
    f('address', 'Address', 'text', { required: true, profileKey: 'location', section: 'Identity' }),
    f('email', 'Email', 'email', { profileKey: 'email', section: 'Identity' }),
    f('business_name', 'Business name', 'text', { required: true, section: 'Business' }),
    f('legal_form', 'Legal form', 'text', { required: true, section: 'Business' }),
    f('activity', 'Main activity', 'textarea', { required: true, section: 'Business' }),
    f('start', 'Start date', 'date', { required: true, section: 'Business' }),
  ],
}

const enVehicle: OfficialFormPack = {
  modelName: 'Vehicle sale agreement + registration transfer',
  language: 'en',
  sourceName: 'GOV.UK — Sold, transferred or got a vehicle',
  sourceUrl: 'https://www.gov.uk/sold-bought-vehicle',
  lastVerified: null,
  noticeLocal: 'Common private sale fields. Complete V5C / national transfer on the official portal.',
  noticeEn: 'Common private sale fields. Complete national transfer on the official portal.',
  fields: [
    f('seller', 'Seller', 'text', { required: true, section: 'Parties' }),
    f('buyer', 'Buyer', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('make', 'Make', 'text', { required: true, section: 'Vehicle' }),
    f('model', 'Model', 'text', { required: true, section: 'Vehicle' }),
    f('vin', 'VIN', 'text', { required: true, section: 'Vehicle' }),
    f('reg', 'Registration number', 'text', { required: true, section: 'Vehicle' }),
    f('price', 'Price', 'number', { required: true, section: 'Price' }),
    f('date', 'Date', 'date', { required: true, section: 'Signature' }),
  ],
}

const enWorks: OfficialFormPack = {
  modelName: 'Building / renovation works agreement — core fields',
  language: 'en',
  sourceName: 'Your Europe / national consumer portals',
  sourceUrl: 'https://europa.eu/youreurope/',
  lastVerified: null,
  noticeLocal: 'Core works-contract fields. Verify consumer rules on your national portal.',
  noticeEn: 'Core works-contract fields. Verify consumer rules on your national portal.',
  fields: [
    f('client', 'Client', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('contractor', 'Contractor', 'text', { required: true, profileKey: 'company_name', section: 'Parties' }),
    f('site', 'Works address', 'text', { required: true, profileKey: 'location', section: 'Works' }),
    f('scope', 'Scope of works', 'textarea', { required: true, section: 'Works' }),
    f('price', 'Price', 'number', { required: true, section: 'Price' }),
    f('deadline', 'Completion date', 'date', { section: 'Schedule' }),
    f('date', 'Date', 'date', { section: 'Signature' }),
  ],
}

const enEmployment: OfficialFormPack = {
  modelName: 'Employment contract — written statement particulars',
  language: 'en',
  sourceName: 'GOV.UK — Employment contracts',
  sourceUrl: 'https://www.gov.uk/employment-contracts-and-conditions',
  lastVerified: null,
  noticeLocal: 'Particulars commonly required in writing. Use national guidance for mandatory terms.',
  noticeEn: 'Particulars commonly required in writing. Use national guidance for mandatory terms.',
  fields: [
    f('employer', 'Employer', 'text', { required: true, section: 'Parties' }),
    f('employee', 'Employee', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
    f('job_title', 'Job title', 'text', { required: true, section: 'Role' }),
    f('start', 'Start date', 'date', { required: true, section: 'Terms' }),
    f('pay', 'Pay', 'number', { required: true, section: 'Pay' }),
    f('hours', 'Hours of work', 'text', { section: 'Terms' }),
    f('date', 'Date', 'date', { section: 'Signature' }),
  ],
}

const EN_PACK: Partial<Record<SlugKey, OfficialFormPack>> = {
  'residential-rental-contract': enRental,
  'commercial-rental-contract': enRental,
  'vehicle-purchase-contract': enVehicle,
  'vehicle-purchase-commercial': {
    ...enVehicle,
    modelName: 'Vehicle sale agreement (business / VAT) + DVLA / national transfer',
    noticeLocal:
      'B2B sale particulars. Complete V5C / national transfer and check MOT / DVLA (or national equivalent).',
    noticeEn:
      'B2B sale particulars. Complete V5C / national transfer and check MOT / DVLA (or national equivalent).',
    fields: [
      f('seller', 'Seller — company name', 'text', {
        required: true,
        profileKey: 'company_name',
        section: 'Parties',
      }),
      f('seller_vat', 'Seller VAT / company number', 'text', { section: 'Parties' }),
      f('buyer', 'Buyer — company name', 'text', { required: true, section: 'Parties' }),
      f('buyer_vat', 'Buyer VAT / company number', 'text', { section: 'Parties' }),
      f('make', 'Make', 'text', { required: true, section: 'Vehicle' }),
      f('model', 'Model', 'text', { required: true, section: 'Vehicle' }),
      f('vin', 'VIN', 'text', { required: true, section: 'Vehicle' }),
      f('reg', 'Registration number', 'text', { required: true, section: 'Vehicle' }),
      f('mileage', 'Mileage', 'number', { required: true, section: 'Vehicle' }),
      f('net', 'Net price', 'number', { required: true, section: 'Price / VAT' }),
      f('vat', 'VAT', 'number', { section: 'Price / VAT' }),
      f('price', 'Gross price', 'number', { required: true, section: 'Price / VAT' }),
      f('date', 'Date', 'date', { required: true, section: 'Signature' }),
    ],
  },
  'vehicle-rental-contract': {
    ...enVehicle,
    modelName: 'Vehicle hire / rental agreement — core fields',
    noticeLocal: 'Core vehicle hire fields. Use the lessor’s official contract and national rules.',
    noticeEn: 'Core vehicle hire fields. Use the lessor’s official contract and national rules.',
  },
  'employment-contract': enEmployment,
  'renovation-contract': enWorks,
  'construction-contract': enWorks,
  'services-agreement': enWorks,
  'subcontract-agreement': enWorks,
  'warranty-agreement': enWorks,
  'work-completion-act': enWorks,
  'handover-act': enWorks,
  'deposit-agreement': {
    ...enRental,
    modelName: 'Deposit / reservation agreement — core fields',
    fields: [
      f('payer', 'Payer', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
      f('receiver', 'Receiver', 'text', { required: true, section: 'Parties' }),
      f('amount', 'Amount', 'number', { required: true, section: 'Deposit' }),
      f('purpose', 'Purpose', 'textarea', { required: true, section: 'Deposit' }),
      f('date', 'Date', 'date', { section: 'Signature' }),
    ],
  },
  'business-registration': enBusiness,
  'property-purchase-contract': {
    ...enRental,
    modelName: 'Property purchase — preparatory particulars',
    noticeLocal: 'Preparatory fields only — conveyancing / notary rules are national.',
    noticeEn: 'Preparatory fields only — conveyancing / notary rules are national.',
    fields: [
      f('seller', 'Seller', 'text', { required: true, section: 'Parties' }),
      f('buyer', 'Buyer', 'text', { required: true, profileKey: 'full_name', section: 'Parties' }),
      f('property', 'Property', 'textarea', { required: true, section: 'Property' }),
      f('price', 'Price', 'number', { required: true, section: 'Price' }),
      f('date', 'Target completion date', 'date', { section: 'Completion' }),
    ],
  },
}

BY_COUNTRY.UK = EN_PACK
BY_COUNTRY.IE = {
  ...EN_PACK,
  'residential-rental-contract': {
    ...enRental,
    sourceName: 'RTB Ireland / gov.ie',
    sourceUrl: 'https://www.rtb.ie/',
    noticeLocal: 'Aligned with Irish private tenancy particulars — check RTB / gov.ie models.',
    noticeEn: 'Aligned with Irish private tenancy particulars — check RTB / gov.ie models.',
  },
  'business-registration': {
    ...enBusiness,
    sourceName: 'CRO Ireland',
    sourceUrl: 'https://www.cro.ie/',
  },
}
BY_COUNTRY.MT = EN_PACK
BY_COUNTRY.CY = EN_PACK

/** Linguistic / regional fallbacks when a country pack is incomplete */
const FALLBACK_COUNTRY: Record<string, string> = {
  CH: 'DE',
  LU: 'FR',
  RO: 'IT',
  CZ: 'DE',
  SK: 'DE',
  HU: 'DE',
  BG: 'DE',
  SE: 'DE',
  DK: 'DE',
  FI: 'DE',
  GR: 'DE',
  HR: 'DE',
  SI: 'DE',
  LT: 'DE',
  LV: 'DE',
  EE: 'DE',
}

export function getOfficialFormPack(
  countryCode: string,
  slug: string,
): OfficialFormPack | null {
  const code = countryCode.toUpperCase()
  const key = slug as SlugKey
  const direct = BY_COUNTRY[code]?.[key]
  if (direct) return direct

  const fb = FALLBACK_COUNTRY[code]
  if (fb && BY_COUNTRY[fb]?.[key]) {
    const pack = BY_COUNTRY[fb]![key]!
    return {
      ...pack,
      noticeEn: `${pack.noticeEn} Starting structure for ${code} — always use your national official portal/form.`,
      noticeLocal: `${pack.noticeLocal} · ${code}: check national official portal / form.`,
    }
  }

  // Last resort: English GOV.UK-aligned structure
  const en = EN_PACK[key]
  if (en) {
    return {
      ...en,
      noticeEn: `${en.noticeEn} Generic EU/EN starting structure for ${code} — replace with national official blank.`,
      noticeLocal: `${en.noticeLocal} · ${code}: use national official blank.`,
    }
  }
  return null
}

export function fieldDisplayLabel(field: FormFieldDef, t: (key: TranslationKey) => string): string {
  return field.label || t(field.labelKey as TranslationKey)
}

/** Attach official-model fields + source to a catalog document. */
export function withOfficialForm(doc: DocumentRecord): DocumentRecord {
  const pack = getOfficialFormPack(doc.countryCode, doc.slug)
  const withPortals =
    isVehicleDocumentSlug(doc.slug)
      ? { relatedPortals: vehicleCheckPortalsFor(doc.countryCode) }
      : {}

  if (!pack) {
    return Object.keys(withPortals).length ? { ...doc, ...withPortals } : doc
  }
  return {
    ...doc,
    language: pack.language,
    formFields: pack.fields,
    officialForm: {
      modelName: pack.modelName,
      noticeLocal: pack.noticeLocal,
      noticeEn: pack.noticeEn,
    },
    source: {
      name: pack.sourceName,
      url: pack.sourceUrl,
      lastVerified: pack.lastVerified,
    },
    lastVerified: pack.lastVerified,
    version: doc.version.includes('pointer') ? doc.version : '2026.08-official-fields',
    descriptionEn: pack.noticeEn,
    descriptionUk: pack.noticeLocal,
    templateNeedsLegalReview: true,
    ...withPortals,
  }
}
