// Gemeinsame TypeScript-Typen für Frontend und Backend

export type BriefTyp = 'digital' | 'foto'
export type BriefStatus = 'entwurf' | 'versiegelt' | 'zugestellt' | 'ausdruck_pendent' | 'zugestellt_ausdruck_pendent'
export type Zustellart = 'mail' | 'print' | 'both'
export type KommentarTyp = 'digital' | 'foto'
export type EmailTyp = 'brief_versiegelt' | 'lp_einladung' | 'erinnerung_5w' | 'lp_benachrichtigung_4w' | 'zustellung'
export type EmailStatus = 'gesendet' | 'fehlgeschlagen' | 'bounced'
export type Fachbereich = 'Berufskunde' | 'Sport' | 'Allgemeinbildung'

export interface Schule {
  id: string
  name: string
  domain: string | null
  erstellt_am: string
}

export interface Klasse {
  id: string
  schule_id: string
  bezeichnung: string
  beruf: string
  lehrstart: string
  lehrabschluss: string
  erstellt_am: string
}

export interface Lehrperson {
  id: string
  schule_id: string
  vorname: string
  nachname: string
  email: string
  fachbereich: Fachbereich
  erstellt_am: string
}

export interface Lernende {
  id: string
  klasse_id: string
  vorname: string
  nachname: string
  email: string
  beitritt_datum: string
  erstellt_am: string
}

export interface Brief {
  id: string
  lernende_id: string
  typ: BriefTyp
  inhalt: string | null
  status: BriefStatus
  zustellart: Zustellart
  versiegelt_am: string | null
  zugestellt_am: string | null
  einstellungen_gesperrt_ab: string | null
  erstellt_am: string
}

export interface BriefFoto {
  id: string
  brief_id: string
  seite: number
  datei_pfad: string
  hochgeladen_am: string
}

export interface LpAuswahl {
  id: string
  brief_id: string
  lehrperson_id: string
  brief_sichtbar: boolean
  gewaehlt_am: string
  einstellungen_geaendert_am: string | null
}

export interface Kommentar {
  id: string
  brief_id: string
  lehrperson_id: string
  typ: KommentarTyp
  inhalt: string | null
  datei_pfad: string | null
  erstellt_am: string
}
