// Aus dem Schulnetz-Klassenplan SJ 2025/2026 extrahierte Klassen
export interface KlassenZeile {
  bezeichnung: string
  klp: string
  berufsfeld: string        // Kürzel für die Filtergruppe
  berufsVorschlag: string   // vorgeschlagener Beruf (kann leer sein)
  lehrjahr: number          // erkanntes Lehrjahr (1–4)
}

// Präfix → Beruf-Mapping
const BERUF: Record<string, string> = {
  'INFA':   'Informatiker/in Applikationsentwicklung EFZ',
  'INFP':   'Informatiker/in Plattformentwicklung EFZ',
  'INFAWU': 'Informatiker/in Applikationsentwicklung EFZ',
  'ICT':    'ICT-Fachmann/-frau EFZ',
  'EI':     'Elektroinstallateur/in EFZ',
  'ELO':    'Elektroniker/in EFZ',
  'ET':     'Elektroinstallateur/in EFZ',
  'E_EG':   'Elektroinstallateur/in EFZ',
  'MOE':    'Montage-Elektriker/in EFZ',
  'FAGE':   'Fachfrau/Fachmann Gesundheit EFZ',
  'FAGEV':  'Fachfrau/Fachmann Gesundheit EFZ',
  'FABE':   'Fachfrau/Fachmann Betreuung EFZ',
  'FAHH':   'Fachfrau/Fachmann Hotellerie-Hauswirtschaft EFZ',
  'KO':     'Koch/Köchin EFZ',
  'CO':     'Coiffeur/-euse EFZ',
  'C_BB':   'Coiffeur/-euse EFZ',
  'C_BP':   'Coiffeur/-euse EFZ',
  'SR':     'Schreiner/in EFZ',
  'SI':     'Sanitärinstallateur/in EFZ',
  'PM':     'Polymechaniker/in EFZ',
  'KR':     'Konstrukteur/in EFZ',
  'MR':     'Maurer/in EFZ',
  'ZA':     'Zahntechniker/in EFZ',
  'ZFA':    'Zeichner/in EFZ Fachrichtung Architektur',
  'ZFI':    'Zeichner/in EFZ Fachrichtung Ingenieurbau',
  'AMT':    'Automobil-Mechatroniker/in EFZ',
  'AU':     'Automobil-Fachmann/-frau EFZ',
  'ATAA':   'Automatiker/in EFZ',
  'ATRP':   'Reifenpraktiker/in EBA',
  'ATAGS':  'Automobil-Fachmann/-frau EFZ',
  'AF':     'Automobil-Fachmann/-frau EFZ',
  'ATKA':   'Automobil-Mechatroniker/in EFZ',
  'ATPHH':  'Fachfrau/Fachmann Hotellerie-Hauswirtschaft EFZ',
  'ATEP':   'Automatiker/in EFZ',
  'BMA':    'Berufsmaturität Ausrichtung A',
  'BMI':    'Berufsmaturität Ausrichtung I',
  'BML':    'Berufsmaturität Ausrichtung L',
  'BMP':    'Berufsmaturität Ausrichtung P',
  'BMVZG':  'Berufsmaturität VZ Gesundheit',
  'BMVZS':  'Berufsmaturität VZ Soziales',
  'BMVZT':  'Berufsmaturität VZ Technik',
  'ABUAT':  'Allgemeinbildung ABU',
  'ABUA':   'Allgemeinbildung ABU',
  'ABUE':   'Allgemeinbildung ABU',
  'ABUI':   'Allgemeinbildung ABU',
  'HFIEA':  'HF Informatik und Netzwerktechnik (Abend)',
  'HFIES':  'HF Informatik und Netzwerktechnik (Samstag)',
  'HFIEED': 'HF Informatik und Netzwerktechnik',
  'HFTGP':  'HF Techniker/in Gebäudetechnik (Präsenz)',
  'HFTGT':  'HF Techniker/in Gebäudetechnik (Teilzeit)',
  'KA':     'Kaufmännisch',
  'KBAA':   'Kaufmännische Berufsmaturität A',
  'KBAB':   'Kaufmännische Berufsmaturität B',
  'FHW':    'Fachfrau/Fachmann Hotellerie-Hauswirtschaft EFZ',
  'INVOL':  '',
}

// Berufsfeld-Gruppen für die Filterleiste
export const BERUFSFELDER: Record<string, string> = {
  'INF':  'Informatik',
  'ELO':  'Elektro & Elektronik',
  'FAB':  'Betreuung & Gesundheit',
  'KOC':  'Küche & Coiffeur',
  'BAU':  'Bau & Holz',
  'AUT':  'Automobil & Automatik',
  'MEC':  'Metall & Polymechanik',
  'ZEI':  'Zeichner & Zahntechnik',
  'BM':   'Berufsmaturität',
  'ABU':  'Allgemeinbildung',
  'HF':   'Höhere Fachschule',
  'SON':  'Sonstiges',
}

function berufsfeld(praefix: string): string {
  if (praefix.startsWith('INF') || praefix === 'ICT') return 'INF'
  if (['EI','ELO','ET','MOE','E_EG'].includes(praefix)) return 'ELO'
  if (praefix.startsWith('FAB') || praefix.startsWith('FAGE') || praefix === 'FAHH' || praefix === 'FHW') return 'FAB'
  if (['KO','CO','C_BB','C_BP'].includes(praefix)) return 'KOC'
  if (['SR','SI','MR'].includes(praefix)) return 'BAU'
  if (['AMT','AU','ATAA','ATAGS','ATEP','ATKA','ATPHH','ATRP','AF'].includes(praefix)) return 'AUT'
  if (['PM','KR'].includes(praefix)) return 'MEC'
  if (praefix.startsWith('ZA') || praefix.startsWith('ZF')) return 'ZEI'
  if (praefix.startsWith('BM') || praefix.startsWith('KBA') || praefix === 'KA') return 'BM'
  if (praefix.startsWith('ABU')) return 'ABU'
  if (praefix.startsWith('HF')) return 'HF'
  return 'SON'
}

// Lehrjahr aus Klassenbezeichnung ableiten (SJ 2025/26 = Referenzjahr)
function lehrjahr(bezeichnung: string): number {
  // Jahr-basiert: _26=1.LJ, _25=2.LJ, _24=3.LJ, _23=4.LJ
  const yearMatch = bezeichnung.match(/_?(\d{2})([a-z]?)$/)
  if (yearMatch) {
    const yr = parseInt(yearMatch[1])
    if (yr >= 20 && yr <= 30) {
      return Math.max(1, Math.min(4, 2026 - (2000 + yr)))
    }
  }
  // Direkte Lehrjahr-Ziffer: INFA1a, ELO2, SR3
  const numMatch = bezeichnung.match(/[A-Z]+_?([1-4])([a-z]?)$|[A-Z]+([1-4])[a-z]/)
  if (numMatch) {
    const n = parseInt(numMatch[1] || numMatch[3])
    return Math.min(4, Math.max(1, n))
  }
  return 1
}

function praefix(bezeichnung: string): string {
  // Exact prefix lookups (longest match first)
  const prefixes = Object.keys(BERUF).sort((a, b) => b.length - a.length)
  for (const p of prefixes) {
    if (bezeichnung.startsWith(p)) return p
  }
  // Fallback: letters only
  return bezeichnung.replace(/[^A-Z_]/g, '')
}

// Rohdaten aus dem PDF
const PDF_KLASSEN: [string, string][] = [
  ['ABUA_26','Schmidt W.'],['ABUAT1','Hegglin C.'],['ABUE1a','Schmidt W.'],
  ['ABUE1b','Hegglin C.'],['ABUI_26','Buder'],['AF1','Sajo'],['AF2','Becci'],
  ['AF3','Essig'],['AMT1','Sajo'],['AMT2','Althaus'],['AMT3','Eichm'],
  ['AMT4','Essig'],['ATAA1','Eichm'],['ATAA2','Eichm'],['ATAGS1a','Stranieri'],
  ['ATAGS1b','Stranieri'],['ATAGS2','Stranieri'],['ATEP1','Trost'],
  ['ATEP2','Trost'],['ATKA1','Wildhaber'],['ATKA2','Wildhaber'],
  ['ATPHH1','Makart'],['ATPHH2','Makart'],['ATRP1a','Petranca'],
  ['ATRP1b','Petranca'],['ATRP2','Petranca'],['AU1','Mettler'],
  ['AU2','Alder'],['AU3','Theiler'],['AU4','Mettler'],['BMA1','Speck'],
  ['BMA2a','Speck'],['BMA2b','Fessler'],['BMA3','Landolt'],['BMA4','Vejnovic D.'],
  ['BMI1a','Heraty'],['BMI1b','Heraty'],['BMI2','Baur'],['BMI3','Vejnovic D.'],
  ['BMI4','Baur'],['BML1','Zgraggen K.'],['BMP1','Parodi'],['BMP2','Tuzi'],
  ['BMP3','Landolt'],['BMP4','Parodi'],['BMVZG1a','Sch'],['BMVZG1b','Sch'],
  ['BMVZG1c','Stamm'],['BMVZS1','K'],['BMVZT1a','Babey'],['BMVZT1b','Bolliger'],
  ['C_BB25','Winkler'],['C_BP26','Winkler'],['CO1','Imgrüth T.'],
  ['CO2','Imgrüth T.'],['CO3','Winkler'],['COA','Trachsler'],
  ['E_EG24','Torriani'],['E_EG25','Torriani'],['EI1a','Moser A.'],
  ['EI1b','Henggeler'],['EI2a','Henggeler'],['EI2b','Wirz'],['EI3a','Rohrer'],
  ['EI3b','Henggeler'],['EI4','Gallo'],['ELO1','Roos L.'],['ELO2','Herzog'],
  ['ELO3','Baumann'],['ELO4','Roos L.'],['ET1','Trost'],['ET2','Furrer'],
  ['ET3a','Furrer'],['ET3b','Furrer'],['FABE1a','Quni'],['FABE1b','Ezer'],
  ['FABE1c','Steffen'],['FABE1d','Hauenschild'],['FABE1e','Bieri'],
  ['FABE2a','R'],['FABE2b','Bieler'],['FABE2c','Jung'],['FABE2d','Freivogel'],
  ['FABE2e','Pauli Ra.'],['FABE2f','Vollmer'],['FABE3a','Hauenschild'],
  ['FABE3b','Steffen'],['FABE3c','Bucher'],['FABE3d','Bieler'],
  ['FABE3e','Vollmer'],['FAGE1a','Pauli Reg.'],['FAGE1b','Casillo'],
  ['FAGE1c','Erni'],['FAGE1e','L'],['FAGE2a','Pauli Reg.'],
  ['FAGE2b','Casillo'],['FAGE2c','Bradley'],['FAGE2d','Isler'],
  ['FAGE3a','L'],['FAGE3b','Casillo'],['FAGE3c','Casillo'],
  ['FAGEV1a','M'],['FAGEV1b','Moell'],['FAGEV1d','Moell'],
  ['FAGEV2a','M'],['FAGEV2b','Moell'],['FAGEV2d','Marty'],
  ['FAHH1','Affentranger'],['FAHH2','Zurbuchen'],['FHW3','Makart'],
  ['HFIEA1','Schmid T.'],['HFIEA2','Schmid T.'],['HFIEA3','Schmid T.'],
  ['HFIEED3','Burkard'],['HFIES1','Schmid T.'],['HFIES2','Schmid T.'],
  ['HFIES3','Schmid T.'],['HFTGP1','Hostettler'],['HFTGT1','Hostettler'],
  ['ICT1','M'],['ICT2','M'],['ICT3','M'],['INFA1a','Lindauer'],
  ['INFA1b','Gisler'],['INFA1f','Barry'],['INFA1g','Lindauer'],
  ['INFA2a','Bammert'],['INFA2b','Bammert'],['INFA2f','Bammert'],
  ['INFA2g','Bammert'],['INFA3a','Gisler'],['INFA3b','Gisler'],
  ['INFA3f','Gisler'],['INFA4a','Dober'],['INFA4b','Haas'],
  ['INFA4c','Pulfer'],['INFAWU1','Lindauer'],['INFAWU2','Gisler'],
  ['INFP1a','Barry'],['INFP1b','Nussbaumer'],['INFP1c','Acklin'],
  ['INFP2a','Acklin'],['INFP2b','Hausheer'],['INFP2c','Acklin'],
  ['INFP3a','Pulfer'],['INFP3b','Pulfer'],['INFP4a','Nussbaumer'],
  ['INFP4b','Pulfer'],['INFP4c','Nussbaumer'],['INVOL1','Sch'],
  ['KA_25a','Amberg'],['KA_26a','Amberg'],['KA_26b','Amberg'],
  ['KBAA','Montag'],['KBAB','Montag'],['KO1a','Wildhaber'],
  ['KO1b','Mehr'],['KO2a','Alt'],['KO2b','Alt'],['KO3a','Alt'],
  ['KO3b','Alt'],['KO3c','Alt'],['KR1','Kleiner'],['KR2','Kleiner'],
  ['KR3','Heimburger'],['KR4','Kleiner'],['MOE1a','Gallo'],['MOE1b','Wirz'],
  ['MOE2a','Moser A.'],['MOE2b','Wirz'],['MOE3a','Freimann'],
  ['MOE3b','Moser A.'],['MR1','Schawalder'],['MR2','Moos'],
  ['MR3','Schawalder'],['PM1','Carulli'],['PM2','Kleiner'],
  ['PM3','Carulli'],['PM4','Carulli'],['SI1','Carminitana'],
  ['SI2','Furrer'],['SI3','Furrer'],['SI4','Carminitana'],
  ['SR1','Zgraggen B.'],['SR2','Zgraggen B.'],['SR3','Zgraggen B.'],
  ['SR4','Zgraggen B.'],['ZA1a','Marbacher'],['ZA1b','Perchtaler'],
  ['ZA2a','Werne'],['ZA2b','Marbacher'],['ZA3a','Marbacher'],
  ['ZA3b','Perchtaler'],['ZA4','Schork'],['ZFA1a','Hegi'],
  ['ZFA1b','Hegi'],['ZFA2a','Hegi'],['ZFA2b','Hegi'],['ZFA3','Arnelas'],
  ['ZFA4a','Hegi'],['ZFA4b','Hegi'],['ZFI1','Grepper'],['ZFI2','Grepper'],
  ['ZFI3','Grepper'],['ZFI4','Grepper'],
]

export const ALLE_KLASSEN: KlassenZeile[] = PDF_KLASSEN.map(([bez, klp]) => {
  const p = praefix(bez)
  return {
    bezeichnung: bez,
    klp,
    berufsfeld: berufsfeld(p),
    berufsVorschlag: BERUF[p] ?? '',
    lehrjahr: lehrjahr(bez),
  }
})
