import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

function aktuelleWoche() {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const woche = Math.ceil(((now.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  return { woche, jahr: now.getFullYear() }
}

// GET — alle Anmeldungen dieser Woche für die Klassen der Lehrperson
export async function GET(req: Request) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const klasseId = searchParams.get('klasseId')
  const { woche, jahr } = aktuelleWoche()

  let query = `
    SELECT
      qa.id AS anmeldung_id, qa.standort_id, qa.woche, qa.jahr,
      l.id AS lernende_id, l.vorname, l.nachname,
      ks.ort, ks.emoji,
      kq.id AS quiz_id, kq.frage, kq.antwort_a, kq.antwort_b, kq.antwort_c, kq.antwort_d, kq.richtig, kq.punkte,
      qe.id AS ergebnis_id, qe.korrekt, qe.gewaehlte_antwort, qe.punkte AS erhaltene_punkte
    FROM quiz_anmeldung qa
    JOIN lernende l ON l.id = qa.lernende_id
    JOIN klasse_lehrperson kl ON kl.klasse_id = l.klasse_id
    JOIN kapsel_standorte ks ON ks.id = qa.standort_id
    LEFT JOIN kapsel_quiz kq ON kq.standort_id = qa.standort_id
    LEFT JOIN quiz_ergebnis qe ON qe.anmeldung_id = qa.id
    WHERE kl.lehrperson_id = $1 AND qa.woche = $2 AND qa.jahr = $3
  `
  const params: unknown[] = [lehrpersonId, woche, jahr]

  if (klasseId) { query += ` AND l.klasse_id = $4`; params.push(klasseId) }
  query += ' ORDER BY l.nachname, l.vorname'

  const { rows } = await pool.query(query, params)
  return NextResponse.json(rows)
}

// POST — Losziehung: zufälligen Teilnehmer wählen
export async function POST(req: Request) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { klasseId } = await req.json() as { klasseId: string }
  const { woche, jahr } = aktuelleWoche()

  // Anmeldungen dieser Woche — Standort darf in der Klasse noch nicht gespielt worden sein
  const { rows: kandidaten } = await pool.query(`
    SELECT qa.id, qa.standort_id, l.id AS lernende_id, l.vorname, l.nachname,
           ks.ort, ks.emoji,
           kq.id AS quiz_id, kq.frage, kq.antwort_a, kq.antwort_b, kq.antwort_c, kq.antwort_d, kq.punkte
    FROM quiz_anmeldung qa
    JOIN lernende l ON l.id = qa.lernende_id
    JOIN kapsel_standorte ks ON ks.id = qa.standort_id
    LEFT JOIN kapsel_quiz kq ON kq.standort_id = qa.standort_id
    LEFT JOIN quiz_ergebnis qe ON qe.anmeldung_id = qa.id
    WHERE l.klasse_id = $1 AND qa.woche = $2 AND qa.jahr = $3
      AND qe.id IS NULL  -- noch nicht bewertet
      AND NOT standort_schon_gespielt($1, qa.standort_id)  -- Standort neu für Klasse
  `, [klasseId, woche, jahr])

  if (kandidaten.length === 0) {
    return NextResponse.json({ fehler: 'Keine Teilnehmenden für diese Woche' }, { status: 404 })
  }

  // Zufällig auswählen
  const ausgeloost = kandidaten[Math.floor(Math.random() * kandidaten.length)]
  return NextResponse.json(ausgeloost)
}

// PATCH — Antwort auswerten und Punkte vergeben
export async function PATCH(req: Request) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { anmeldungId, quizId, gewaehlteAntwort } = await req.json() as {
    anmeldungId: string
    quizId: string
    gewaehlteAntwort: string
  }

  // Richtige Antwort holen
  const { rows: quiz } = await pool.query(
    'SELECT richtig, punkte FROM kapsel_quiz WHERE id = $1', [quizId]
  )
  if (!quiz[0]) return NextResponse.json({ fehler: 'Quiz nicht gefunden' }, { status: 404 })

  const korrekt = quiz[0].richtig === gewaehlteAntwort
  const punkte = korrekt ? (quiz[0].punkte as number) : 0

  const { rows } = await pool.query(
    `INSERT INTO quiz_ergebnis (anmeldung_id, quiz_id, lehrperson_id, gewaehlte_antwort, korrekt, punkte)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [anmeldungId, quizId, lehrpersonId, gewaehlteAntwort, korrekt, punkte]
  )

  return NextResponse.json({ ...rows[0], richtigeAntwort: quiz[0].richtig })
}
