// Server-Only — kein 'use client' hier, wird nur von Server Components importiert
import { pool } from '@/lib/db'
import type { Standort } from './KapselStandort'
import { STANDORTE, wocheSeitEpoche } from './KapselStandort'

function dbZuStandort(row: Record<string, unknown>): Standort {
  return {
    ort: row.ort as string, land: row.land as string, emoji: row.emoji as string,
    info: row.info as string, temp: row.temp as string,
    lat: row.lat as number, lng: row.lng as number,
    foto: row.foto as string, fotoAlt: row.foto_alt as string,
    wikiTitel: row.wiki_titel as string,
    link: row.link as string, linkText: row.link_text as string,
  }
}

async function alleStandorte(): Promise<Standort[]> {
  try {
    const { rows } = await pool.query('SELECT * FROM kapsel_standorte WHERE aktiv = TRUE ORDER BY ort')
    if (rows.length > 0) return rows.map(dbZuStandort)
  } catch (err) {
    console.error('[STANDORTE] DB-Fehler, Fallback auf statische Liste:', err)
  }
  return STANDORTE
}

function standortFuerWocheAusListe(liste: Standort[], lernendeId: string, datum: Date): Standort {
  const woche = wocheSeitEpoche(datum)
  const idHash = lernendeId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return liste[Math.abs(idHash + woche * 13) % liste.length]
}

export async function getStandort(lernendeId: string): Promise<Standort> {
  const liste = await alleStandorte()
  return standortFuerWocheAusListe(liste, lernendeId, new Date())
}

export async function getVerlauf(lernendeId: string, versiegeltAm: Date): Promise<Standort[]> {
  const liste = await alleStandorte()
  return verlaufAusListe(liste, lernendeId, versiegeltAm)
}

// Verlauf aus vorgeladener Liste (für Batch-Berechnungen ohne extra DB-Anfragen)
function verlaufAusListe(liste: Standort[], lernendeId: string, versiegeltAm: Date): Standort[] {
  const besucht = new Set<string>()
  const verlauf: Standort[] = []
  const heute = new Date()
  const datum = new Date(versiegeltAm)
  datum.setHours(0, 0, 0, 0)
  while (datum <= heute) {
    const s = standortFuerWocheAusListe(liste, lernendeId, new Date(datum))
    if (!besucht.has(s.ort)) { besucht.add(s.ort); verlauf.push(s) }
    datum.setDate(datum.getDate() + 7)
  }
  return verlauf
}

/** Km für alle Lernenden einer Klasse auf einmal berechnen (1× DB-Anfrage für Standorte) */
export async function getKmProLernende(
  lernende: Array<{ id: string; versiegeltAm: Date | null }>
): Promise<Map<string, number>> {
  const liste = await alleStandorte()
  const ergebnis = new Map<string, number>()

  for (const l of lernende) {
    if (!l.versiegeltAm) { ergebnis.set(l.id, 0); continue }
    const verlauf = verlaufAusListe(liste, l.id, l.versiegeltAm)
    // Haversine-Summe
    let km = 0
    for (let i = 1; i < verlauf.length; i++) {
      const a = verlauf[i - 1], b = verlauf[i]
      const R = 6371
      const dLat = (b.lat - a.lat) * Math.PI / 180
      const dLng = (b.lng - a.lng) * Math.PI / 180
      const x = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
      km += Math.round(2 * R * Math.asin(Math.sqrt(x)))
    }
    ergebnis.set(l.id, km)
  }
  return ergebnis
}
