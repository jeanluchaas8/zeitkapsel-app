import { getLernendeId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

function aktuelleWoche() {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const woche = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return { woche, jahr: now.getFullYear() }
}

// GET — Quiz-Status für den aktuellen Standort + Punkte
export async function GET(req: Request) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const standortId = searchParams.get('standortId') ?? ''
  const { woche, jahr } = aktuelleWoche()

  // Klasse des Lernenden
  const { rows: lRows } = await pool.query('SELECT klasse_id FROM lernende WHERE id = $1', [lernendeId])
  const klasseId = lRows[0]?.klasse_id as string ?? ''

  // Ist dieser Standort in der Klasse bereits gespielt worden?
  const { rows: gespieltRows } = await pool.query(`
    SELECT COUNT(*) AS n
    FROM quiz_ergebnis qe
    JOIN quiz_anmeldung qa ON qa.id = qe.anmeldung_id
    JOIN lernende l ON l.id = qa.lernende_id
    WHERE l.klasse_id = $1 AND qa.standort_id = $2
  `, [klasseId, standortId])
  const schonGespielt = parseInt(gespieltRows[0]?.n ?? '0') > 0

  // Anmeldung dieser Woche
  const { rows: anmeldung } = await pool.query(
    'SELECT id FROM quiz_anmeldung WHERE lernende_id = $1 AND woche = $2 AND jahr = $3',
    [lernendeId, woche, jahr]
  )

  // Gesamtpunkte + Rang
  const { rows: punkte } = await pool.query(`
    SELECT COALESCE(SUM(qe.punkte), 0) AS gesamt,
           COUNT(CASE WHEN qe.korrekt THEN 1 END) AS richtig,
           COUNT(qe.id) AS total
    FROM quiz_ergebnis qe
    JOIN quiz_anmeldung qa ON qa.id = qe.anmeldung_id
    WHERE qa.lernende_id = $1
  `, [lernendeId])

  const { rows: rang } = await pool.query(`
    SELECT COUNT(*) + 1 AS rang
    FROM (
      SELECT qa.lernende_id, SUM(qe.punkte) AS summe
      FROM quiz_ergebnis qe
      JOIN quiz_anmeldung qa ON qa.id = qe.anmeldung_id
      JOIN lernende l2 ON l2.id = qa.lernende_id
      JOIN lernende l1 ON l1.klasse_id = l2.klasse_id
      WHERE l1.id = $1
      GROUP BY qa.lernende_id
    ) sub
    WHERE sub.summe > (
      SELECT COALESCE(SUM(qe2.punkte), 0)
      FROM quiz_ergebnis qe2
      JOIN quiz_anmeldung qa2 ON qa2.id = qe2.anmeldung_id
      WHERE qa2.lernende_id = $1
    )
  `, [lernendeId])

  // Quiz-Frage + Lösung laden wenn schon gespielt
  let quizFrage = null
  if (schonGespielt && standortId) {
    const { rows: frageRows } = await pool.query(
      `SELECT kq.frage, kq.antwort_a, kq.antwort_b, kq.antwort_c, kq.antwort_d, kq.richtig,
              qe.gewaehlte_antwort, qe.korrekt,
              l2.vorname AS beantwortet_von
       FROM kapsel_quiz kq
       LEFT JOIN quiz_anmeldung qa ON qa.standort_id = kq.standort_id
       LEFT JOIN quiz_ergebnis qe ON qe.anmeldung_id = qa.id
       LEFT JOIN lernende l2 ON l2.id = qa.lernende_id
       JOIN lernende l ON l.id = $1
       WHERE kq.standort_id = $2
         AND l2.klasse_id = l.klasse_id
       ORDER BY qe.durchgefuehrt_am DESC
       LIMIT 1`,
      [lernendeId, standortId]
    )
    if (frageRows[0]) quizFrage = frageRows[0]
  }

  return NextResponse.json({
    angemeldet: anmeldung.length > 0,
    schonGespielt,
    quizFrage,
    woche, jahr,
    punkte: {
      gesamt: parseInt(punkte[0]?.gesamt ?? '0'),
      richtig: parseInt(punkte[0]?.richtig ?? '0'),
      total: parseInt(punkte[0]?.total ?? '0'),
      rang: parseInt(rang[0]?.rang ?? '1'),
    },
  })
}

// POST — Anmelden
export async function POST(req: Request) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { standortId } = await req.json() as { standortId: string }
  const { woche, jahr } = aktuelleWoche()

  // Klasse holen
  const { rows: lRows } = await pool.query('SELECT klasse_id FROM lernende WHERE id = $1', [lernendeId])
  const klasseId = lRows[0]?.klasse_id as string ?? ''

  // Bereits von dieser Klasse gespielt?
  const { rows: gespieltRows } = await pool.query(`
    SELECT COUNT(*) AS n
    FROM quiz_ergebnis qe
    JOIN quiz_anmeldung qa ON qa.id = qe.anmeldung_id
    JOIN lernende l ON l.id = qa.lernende_id
    WHERE l.klasse_id = $1 AND qa.standort_id = $2
  `, [klasseId, standortId])

  if (parseInt(gespieltRows[0]?.n ?? '0') > 0) {
    return NextResponse.json(
      { fehler: 'Dieser Standort wurde in deiner Klasse bereits gespielt.' },
      { status: 409 }
    )
  }

  try {
    await pool.query(
      `INSERT INTO quiz_anmeldung (lernende_id, standort_id, woche, jahr)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [lernendeId, standortId, woche, jahr]
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ fehler: 'Anmeldung fehlgeschlagen' }, { status: 500 })
  }
}

// DELETE — Abmelden
export async function DELETE() {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { woche, jahr } = aktuelleWoche()
  await pool.query(
    'DELETE FROM quiz_anmeldung WHERE lernende_id = $1 AND woche = $2 AND jahr = $3',
    [lernendeId, woche, jahr]
  )
  return NextResponse.json({ ok: true })
}
