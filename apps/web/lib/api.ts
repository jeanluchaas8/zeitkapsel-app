import { pool } from './db'
import { auth } from '@/auth'
import type { Rolle } from './typen'

// Hilfsfunktion: Aktuelle Lernende-ID aus der Session
export async function getLernendeId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user || (session.user as { rolle?: Rolle }).rolle !== 'lernende') return null
  return (session.user as { id: string }).id
}

// Hilfsfunktion: Aktuelle Lehrperson-ID aus der Session
export async function getLehrpersonId(): Promise<string | null> {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle })?.rolle
  if (!session?.user || (rolle !== 'lehrperson' && rolle !== 'admin')) return null
  return (session.user as { id: string }).id
}

// Server-seitige DB-Abfragen für Server Components

export async function getBrief(lernendeId: string) {
  const { rows } = await pool.query(
    `SELECT b.*,
      COALESCE(json_agg(json_build_object(
        'lehrperson_id', la.lehrperson_id,
        'brief_sichtbar', la.brief_sichtbar,
        'vorname', lp.vorname,
        'nachname', lp.nachname,
        'fachbereich', lp.fachbereich
      )) FILTER (WHERE la.id IS NOT NULL), '[]') AS lp_auswahl
     FROM brief b
     LEFT JOIN lp_auswahl la ON la.brief_id = b.id
     LEFT JOIN lehrperson lp ON lp.id = la.lehrperson_id
     WHERE b.lernende_id = $1
     GROUP BY b.id`,
    [lernendeId],
  )
  return rows[0] ?? null
}

export async function getLehrpersonenFuerLernende(lernendeId: string) {
  const { rows } = await pool.query(
    `SELECT lp.id, lp.vorname, lp.nachname, lp.fachbereich
     FROM lehrperson lp
     JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
     JOIN lernende l ON l.klasse_id = kl.klasse_id
     WHERE l.id = $1
     ORDER BY lp.nachname, lp.vorname`,
    [lernendeId],
  )
  return rows
}

export async function getKlassenFuerLehrperson(lehrpersonId: string) {
  const { rows } = await pool.query(
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

export async function getLernendeInKlasse(klasseId: string, lehrpersonId: string) {
  const { rows } = await pool.query(
    `SELECT l.id, l.vorname, l.nachname, l.email,
            b.id AS brief_id, b.status AS brief_status, b.typ AS brief_typ,
            la.brief_sichtbar,
            (k2.id IS NOT NULL) AS hat_kommentar
     FROM lernende l
     LEFT JOIN brief b ON b.lernende_id = l.id
     LEFT JOIN lp_auswahl la ON la.brief_id = b.id AND la.lehrperson_id = $2
     LEFT JOIN kommentar k2 ON k2.brief_id = b.id AND k2.lehrperson_id = $2
     WHERE l.klasse_id = $1
     ORDER BY l.nachname, l.vorname`,
    [klasseId, lehrpersonId],
  )
  return rows
}

export async function getBriefFuerLehrperson(briefId: string, lehrpersonId: string) {
  const { rows } = await pool.query(
    `SELECT b.id, b.typ, b.inhalt, b.status, b.versiegelt_am,
            l.id AS lernende_id, l.vorname, l.nachname, l.ausgetreten_am,
            k.lehrabschluss,
            la.brief_sichtbar,
            -- Brief-Inhalt nur sichtbar wenn: ausgetreten ODER ≤28 Tage bis Abschluss
            (l.ausgetreten_am IS NOT NULL
             OR k.lehrabschluss <= NOW() + INTERVAL '28 days') AS inhalt_freigegeben
     FROM brief b
     JOIN lernende l ON l.id = b.lernende_id
     JOIN klasse k ON k.id = l.klasse_id
     LEFT JOIN lp_auswahl la ON la.brief_id = b.id AND la.lehrperson_id = $2
     WHERE b.id = $1`,
    [briefId, lehrpersonId],
  )
  return rows[0] ?? null
}

export async function getLernende(lernendeId: string) {
  const { rows } = await pool.query(
    `SELECT l.vorname, l.nachname, l.ausgetreten_am, k.beruf, k.lehrstart, k.lehrabschluss,
            ROUND(EXTRACT(EPOCH FROM AGE(k.lehrabschluss, k.lehrstart)) / (365.25 * 86400))::INT AS lehrdauer
     FROM lernende l
     JOIN klasse k ON k.id = l.klasse_id
     WHERE l.id = $1`,
    [lernendeId],
  )
  return rows[0] ?? null
}

export async function getSchuljahresenden(): Promise<Array<{ datum: string; schuljahr: string }>> {
  const { rows } = await pool.query(`
    SELECT (
      (beginn - INTERVAL '28 days') -
      (((EXTRACT(DOW FROM beginn - INTERVAL '28 days')::INT - 5 + 7) % 7) * INTERVAL '1 day')
    )::date AS datum, schuljahr
    FROM schulferien
    WHERE bezeichnung = 'Sommerferien'
    ORDER BY beginn
  `)
  return rows.map(r => ({
    datum: (r.datum as Date).toISOString().slice(0, 10),
    schuljahr: r.schuljahr as string,
  }))
}

export async function getKonfiguration(): Promise<Record<string, string>> {
  const { rows } = await pool.query('SELECT schluessel, wert FROM konfiguration')
  return Object.fromEntries(rows.map((r) => [r.schluessel as string, r.wert as string]))
}

export async function getKommentar(briefId: string, lehrpersonId: string) {
  const { rows } = await pool.query(
    'SELECT * FROM kommentar WHERE brief_id = $1 AND lehrperson_id = $2',
    [briefId, lehrpersonId],
  )
  return rows[0] ?? null
}

// ── Rangliste-Hilfsfunktionen ────────────────────────────────────────────

/** Gibt die URL für ein Lernenden-Avatar zurück. */
export function avatarUrl(seed: string, url: string, vorname: string): string {
  if (url) return url
  if (seed?.includes(':')) {
    const [stil, s] = seed.split(':')
    return `https://api.dicebear.com/7.x/${stil}/svg?seed=${encodeURIComponent(s)}&backgroundColor=b6e3f4,c0aede`
  }
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent((vorname ?? 'u').toLowerCase())}&backgroundColor=b6e3f4`
}

/** Berechnet den Quiz-Stichtag (14 Tage vor Sommerferien). */
export function quizStichtag(sommerferienbeginn: Date): Date {
  const d = new Date(sommerferienbeginn)
  d.setDate(d.getDate() - 14)
  return d
}

export interface SchuljahrFenster {
  alleSchuljahre: string[]
  aktuellesSchuljahr: string
  gewaehltes: string
  sjBeginn: Date | null
  stichtag: Date | null
  schuljahr: string
  istAbgelaufen: boolean
  tageNoch: number | null
}

/**
 * Lädt alle nötigen Schuljahr-Daten für Ranglisten.
 * @param gewuenscht – schuljahr aus searchParams (optional)
 */
export async function getSchuljahrFenster(gewuenscht?: string): Promise<SchuljahrFenster> {
  const jetzt = new Date()

  const { rows: alleJahreRows } = await pool.query(`
    SELECT DISTINCT sb.schuljahr
    FROM schulferien sb
    JOIN schulferien sf ON sf.schuljahr = sb.schuljahr AND sf.bezeichnung = 'Sommerferien'
    WHERE sb.bezeichnung = 'Schuljahresbeginn'
    ORDER BY sb.schuljahr DESC
  `)
  const alleSchuljahre = alleJahreRows.map(r => r.schuljahr as string)

  const { rows: aktuellesRows } = await pool.query(`
    SELECT schuljahr FROM schulferien
    WHERE bezeichnung = 'Schuljahresbeginn' AND beginn <= $1::date
    ORDER BY beginn DESC LIMIT 1
  `, [jetzt.toISOString().slice(0, 10)])
  const aktuellesSchuljahr = (aktuellesRows[0]?.schuljahr as string) ?? alleSchuljahre[0] ?? ''

  const gewaehltes = gewuenscht && alleSchuljahre.includes(gewuenscht)
    ? gewuenscht
    : aktuellesSchuljahr

  const { rows: sjRows } = await pool.query(`
    SELECT sb.beginn AS sj_beginn, sf.beginn AS sf_beginn, sb.schuljahr
    FROM schulferien sb
    JOIN schulferien sf ON sf.schuljahr = sb.schuljahr AND sf.bezeichnung = 'Sommerferien'
    WHERE sb.bezeichnung = 'Schuljahresbeginn' AND sb.schuljahr = $1
  `, [gewaehltes])

  const sjBeginn  = sjRows[0] ? new Date(sjRows[0].sj_beginn as string) : null
  const sfBeginn  = sjRows[0] ? new Date(sjRows[0].sf_beginn as string) : null
  const stichtag  = sfBeginn ? quizStichtag(sfBeginn) : null
  const schuljahr = (sjRows[0]?.schuljahr as string) ?? gewaehltes
  const istAbgelaufen = stichtag ? jetzt > stichtag : false
  const tageNoch = stichtag ? Math.ceil((stichtag.getTime() - jetzt.getTime()) / 86400000) : null

  return { alleSchuljahre, aktuellesSchuljahr, gewaehltes, sjBeginn, stichtag, schuljahr, istAbgelaufen, tageNoch }
}

export const KM_BONUS: Record<number, number> = { 1: 3, 2: 2, 3: 1 }

export interface RanglisteEintrag {
  id: string
  vorname: string
  nachname: string
  avatar_seed: string
  avatar_url: string
  versiegelt_am: string | null
  quiz_punkte: number
  richtig: number
  total: number
  km: number
  kmRang: number
  kmBonus: number
  gesamt: number
  rang: number
}

/**
 * Lädt Lernende einer Klasse mit Quiz-Punkten und berechnet KM-Bonus + Rang.
 */
export async function getRanglisteEintraege(
  klasseId: string,
  sjBeginn: Date | null,
  stichtag: Date | null,
  getKmProLernende: (lernende: { id: string; versiegeltAm: Date | null }[]) => Promise<Map<string, number>>
): Promise<RanglisteEintrag[]> {
  const { rows: lernende } = await pool.query(`
    SELECT l.id, l.vorname, l.nachname, l.avatar_seed, l.avatar_url,
           b.versiegelt_am,
           COALESCE(SUM(CASE
             WHEN ($2::timestamptz IS NULL OR qe.durchgefuehrt_am >= $2)
              AND ($3::timestamptz IS NULL OR qe.durchgefuehrt_am <= $3)
             THEN qe.punkte ELSE 0
           END), 0)::INT AS quiz_punkte,
           COUNT(CASE
             WHEN ($2::timestamptz IS NULL OR qe.durchgefuehrt_am >= $2)
              AND ($3::timestamptz IS NULL OR qe.durchgefuehrt_am <= $3)
              AND qe.korrekt THEN 1
           END)::INT AS richtig,
           COUNT(CASE
             WHEN ($2::timestamptz IS NULL OR qe.durchgefuehrt_am >= $2)
              AND ($3::timestamptz IS NULL OR qe.durchgefuehrt_am <= $3)
             THEN 1
           END)::INT AS total
    FROM lernende l
    LEFT JOIN brief b ON b.lernende_id = l.id
    LEFT JOIN quiz_anmeldung qa ON qa.lernende_id = l.id
    LEFT JOIN quiz_ergebnis qe ON qe.anmeldung_id = qa.id
    WHERE l.klasse_id = $1 AND l.ausgetreten_am IS NULL
    GROUP BY l.id, l.vorname, l.nachname, l.avatar_seed, l.avatar_url, b.versiegelt_am
  `, [klasseId, sjBeginn?.toISOString() ?? null, stichtag?.toISOString() ?? null])

  const kmMap = await getKmProLernende(
    lernende.map(l => ({
      id: l.id as string,
      versiegeltAm: l.versiegelt_am ? new Date(l.versiegelt_am as string) : null,
    }))
  )

  // KM-Rang berechnen
  const kmSortiert = [...kmMap.entries()].sort((a, b) => b[1] - a[1])
  const kmRangMap = new Map<string, number>()
  let letzterKm = -1, letzterRang = 0
  for (const [id, km] of kmSortiert) {
    if (km !== letzterKm) { letzterRang++; letzterKm = km }
    if (km > 0) kmRangMap.set(id, letzterRang)
  }

  // Gesamt + sortieren
  const rows = lernende.map(l => {
    const id = l.id as string
    const km = kmMap.get(id) ?? 0
    const kmRang = kmRangMap.get(id) ?? 99
    const kmBonus = KM_BONUS[kmRang] ?? 0
    const gesamt = (l.quiz_punkte as number) + kmBonus
    return {
      id, vorname: l.vorname as string, nachname: l.nachname as string,
      avatar_seed: l.avatar_seed as string, avatar_url: l.avatar_url as string,
      versiegelt_am: l.versiegelt_am as string | null,
      quiz_punkte: l.quiz_punkte as number, richtig: l.richtig as number, total: l.total as number,
      km, kmRang, kmBonus, gesamt, rang: 0,
    }
  }).sort((a, b) => b.gesamt - a.gesamt || b.km - a.km)

  // Rang vergeben (Gleichstand → gleicher Rang)
  let prevGesamt = -1, prevRangVal = 0
  return rows.map(r => {
    if (r.gesamt !== prevGesamt) { prevRangVal++; prevGesamt = r.gesamt }
    return { ...r, rang: prevRangVal }
  })
}
