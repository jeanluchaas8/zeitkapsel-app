import { pool } from './pool.js'

export interface KlasseMitLernende {
  id: string
  bezeichnung: string
  beruf: string
  lehrstart: string
  lehrabschluss: string
  anzahl_lernende: number
}

export interface LernendeMitBriefStatus {
  id: string
  vorname: string
  nachname: string
  email: string
  brief_id: string | null
  brief_status: string | null
  brief_typ: string | null
  brief_sichtbar: boolean | null
  hat_kommentar: boolean
}

export interface KommentarZeile {
  id: string
  brief_id: string
  lehrperson_id: string
  typ: string
  inhalt: string | null
  datei_pfad: string | null
  erstellt_am: string
}

// Alle Klassen der Lehrperson mit Lernenden-Anzahl
export async function klassenFuerLehrperson(lehrpersonId: string): Promise<KlasseMitLernende[]> {
  const { rows } = await pool.query<KlasseMitLernende>(
    `SELECT k.id, k.bezeichnung, k.beruf, k.lehrstart, k.lehrabschluss,
            COUNT(l.id)::INT AS anzahl_lernende
     FROM klasse k
     JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
     LEFT JOIN lernende l ON l.klasse_id = k.id
     WHERE kl.lehrperson_id = $1
     GROUP BY k.id
     ORDER BY k.lehrabschluss DESC`,
    [lehrpersonId],
  )
  return rows
}

// Alle Lernenden einer Klasse mit deren Brief-Status und ob die LP ausgewählt wurde
export async function lernendeInKlasse(
  klasseId: string,
  lehrpersonId: string,
): Promise<LernendeMitBriefStatus[]> {
  const { rows } = await pool.query<LernendeMitBriefStatus>(
    `SELECT l.id, l.vorname, l.nachname, l.email,
            b.id AS brief_id,
            b.status AS brief_status,
            b.typ AS brief_typ,
            la.brief_sichtbar,
            (k.id IS NOT NULL) AS hat_kommentar
     FROM lernende l
     LEFT JOIN brief b ON b.lernende_id = l.id
     LEFT JOIN lp_auswahl la ON la.brief_id = b.id AND la.lehrperson_id = $2
     LEFT JOIN kommentar k ON k.brief_id = b.id AND k.lehrperson_id = $2
     WHERE l.klasse_id = $1
     ORDER BY l.nachname, l.vorname`,
    [klasseId, lehrpersonId],
  )
  return rows
}

// Brief-Inhalt laden — nur wenn Lernende/r die LP ausgewählt hat UND brief_sichtbar = true
export async function briefFuerLehrperson(briefId: string, lehrpersonId: string) {
  const { rows } = await pool.query(
    `SELECT b.id, b.typ, b.inhalt, b.status, b.versiegelt_am,
            l.vorname, l.nachname,
            la.brief_sichtbar,
            k.lehrabschluss
     FROM brief b
     JOIN lernende l ON l.id = b.lernende_id
     JOIN klasse k ON k.id = l.klasse_id
     LEFT JOIN lp_auswahl la ON la.brief_id = b.id AND la.lehrperson_id = $2
     WHERE b.id = $1`,
    [briefId, lehrpersonId],
  )
  return rows[0] ?? null
}

// Eigenen Kommentar laden
export async function kommentarLaden(
  briefId: string,
  lehrpersonId: string,
): Promise<KommentarZeile | null> {
  const { rows } = await pool.query<KommentarZeile>(
    'SELECT * FROM kommentar WHERE brief_id = $1 AND lehrperson_id = $2',
    [briefId, lehrpersonId],
  )
  return rows[0] ?? null
}

// Digitalen Kommentar erstellen oder aktualisieren
export async function kommentarSpeichern(
  briefId: string,
  lehrpersonId: string,
  inhalt: string,
): Promise<KommentarZeile> {
  const { rows } = await pool.query<KommentarZeile>(
    `INSERT INTO kommentar (brief_id, lehrperson_id, typ, inhalt)
     VALUES ($1, $2, 'digital', $3)
     ON CONFLICT (brief_id, lehrperson_id)
     DO UPDATE SET inhalt = $3, typ = 'digital', datei_pfad = NULL
     RETURNING *`,
    [briefId, lehrpersonId, inhalt],
  )
  return rows[0]!
}

export async function kommentarLoeschen(briefId: string, lehrpersonId: string): Promise<void> {
  await pool.query(
    'DELETE FROM kommentar WHERE brief_id = $1 AND lehrperson_id = $2',
    [briefId, lehrpersonId],
  )
}

// Prüft ob die LP der Klasse dieser Lernenden zugewiesen ist
export async function lehrpersonHatZugangZuBrief(
  briefId: string,
  lehrpersonId: string,
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1
     FROM brief b
     JOIN lernende l ON l.id = b.lernende_id
     JOIN klasse_lehrperson kl ON kl.klasse_id = l.klasse_id
     WHERE b.id = $1 AND kl.lehrperson_id = $2`,
    [briefId, lehrpersonId],
  )
  return rows.length > 0
}
