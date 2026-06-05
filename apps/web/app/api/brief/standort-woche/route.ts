import { getLernendeId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

function aktuelleWoche() {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const woche = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return { woche, jahr: now.getFullYear() }
}

export async function GET() {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { woche, jahr } = aktuelleWoche()

  // Bestehende Zuweisung dieser Woche holen
  const { rows: bestehendeRows } = await pool.query(
    `SELECT lsw.standort_id, ks.ort, ks.emoji, ks.lat, ks.lng, ks.info, ks.temp,
            ks.foto, ks.foto_alt, ks.wiki_titel, ks.link, ks.link_text
     FROM lernende_standort_woche lsw
     JOIN kapsel_standorte ks ON ks.id = lsw.standort_id
     WHERE lsw.lernende_id = $1 AND lsw.woche = $2 AND lsw.jahr = $3`,
    [lernendeId, woche, jahr]
  )

  if (bestehendeRows[0]) {
    return NextResponse.json({ standortId: bestehendeRows[0].standort_id as string, standort: bestehendeRows[0] })
  }

  // Neu: zufälligen Standort zuweisen
  // Ausschliessen von Standorten die diese Lernende/r schon hatte (letzte 10 Wochen)
  const { rows: neuerStandort } = await pool.query(
    `SELECT id, ort, emoji, lat, lng, info, temp, foto, foto_alt, wiki_titel, link, link_text
     FROM kapsel_standorte
     WHERE aktiv = TRUE
       AND id NOT IN (
         SELECT standort_id FROM lernende_standort_woche
         WHERE lernende_id = $1 AND (woche > $2 - 10 OR jahr > $3)
       )
     ORDER BY RANDOM()
     LIMIT 1`,
    [lernendeId, woche, jahr]
  )

  // Fallback falls alle schon besucht
  const standort = neuerStandort[0] ?? (await pool.query(
    'SELECT id, ort, emoji, lat, lng, info, temp, foto, foto_alt, wiki_titel, link, link_text FROM kapsel_standorte WHERE aktiv = TRUE ORDER BY RANDOM() LIMIT 1'
  )).rows[0]

  if (!standort) return NextResponse.json({ fehler: 'Keine Standorte verfügbar' }, { status: 404 })

  // Zuweisung speichern
  await pool.query(
    'INSERT INTO lernende_standort_woche (lernende_id, woche, jahr, standort_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [lernendeId, woche, jahr, standort.id]
  )

  return NextResponse.json({ standortId: standort.id as string, standort })
}
