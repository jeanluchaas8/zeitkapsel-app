import { NextResponse } from 'next/server'
import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  abschiedsnotiz: z.string().max(2000).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { lernendeId: string } },
) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  // Prüfen ob Lernende zur selben Klasse gehört wie die Lehrperson
  const { rows: check } = await pool.query(`
    SELECT l.id, l.ausgetreten_am
    FROM lernende l
    JOIN klasse_lehrperson kl ON kl.klasse_id = l.klasse_id
    WHERE l.id = $1 AND kl.lehrperson_id = $2
  `, [params.lernendeId, lehrpersonId])

  if (!check[0]) return NextResponse.json({ fehler: 'Lernende/r nicht gefunden' }, { status: 404 })
  if (check[0].ausgetreten_am) return NextResponse.json({ fehler: 'Bereits ausgetreten' }, { status: 400 })

  // Austritt markieren
  await pool.query(
    'UPDATE lernende SET ausgetreten_am = NOW() WHERE id = $1',
    [params.lernendeId],
  )

  // Quiz-Anmeldung der laufenden Woche entfernen
  await pool.query(
    `DELETE FROM quiz_anmeldung
     WHERE lernende_id = $1
       AND woche = EXTRACT(WEEK FROM NOW())::INT
       AND jahr  = EXTRACT(YEAR FROM NOW())::INT`,
    [params.lernendeId],
  )

  // Brief abrufen oder erstellen
  const { rows: briefe } = await pool.query(
    'SELECT id, status FROM brief WHERE lernende_id = $1',
    [params.lernendeId],
  )

  let briefId: string

  if (briefe[0]) {
    const brief = briefe[0] as { id: string; status: string }
    briefId = brief.id

    // Brief als zugestellt markieren (falls noch nicht zugestellt)
    if (brief.status !== 'zugestellt' && brief.status !== 'zugestellt_ausdruck_pendent') {
      await pool.query(
        `UPDATE brief SET status = 'zugestellt', zugestellt_am = NOW() WHERE id = $1`,
        [brief.id],
      )
    }
  } else {
    // Kein Brief vorhanden → leeren Brief erstellen und direkt zustellen
    // (damit die Feedbacks für die Lernenden sichtbar werden)
    const { rows: neu } = await pool.query(
      `INSERT INTO brief (lernende_id, status, zugestellt_am)
       VALUES ($1, 'zugestellt', NOW()) RETURNING id`,
      [params.lernendeId],
    )
    briefId = (neu[0] as { id: string }).id
  }

  // Abschiedsnotiz als Kommentar speichern
  if (eingabe.data.abschiedsnotiz?.trim()) {
    await pool.query(
      `INSERT INTO kommentar (brief_id, lehrperson_id, typ, inhalt)
       VALUES ($1, $2, 'digital', $3)
       ON CONFLICT (brief_id, lehrperson_id) DO UPDATE SET inhalt = $3`,
      [briefId, lehrpersonId, eingabe.data.abschiedsnotiz.trim()],
    )
  }

  // Alle geschriebenen Jahresfeedbacks dieser Lernenden bleiben auf 'geschrieben'
  // → werden automatisch sichtbar, da der Brief jetzt 'zugestellt' ist
  // (keine weiteren DB-Änderungen nötig)

  return NextResponse.json({ ok: true })
}
