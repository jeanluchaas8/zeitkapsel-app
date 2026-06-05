import { NextResponse } from 'next/server'
import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({ klasseId: z.string().uuid() })

export async function PATCH(
  req: Request,
  { params }: { params: { lernendeId: string } },
) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  // Prüfen ob Lernende in einer Klasse dieser Lehrperson ist
  const { rows: check } = await pool.query(`
    SELECT l.id FROM lernende l
    JOIN klasse_lehrperson kl ON kl.klasse_id = l.klasse_id
    WHERE l.id = $1 AND kl.lehrperson_id = $2 AND l.ausgetreten_am IS NULL
  `, [params.lernendeId, lehrpersonId])

  if (!check[0]) return NextResponse.json({ fehler: 'Lernende/r nicht gefunden' }, { status: 404 })

  // Neue Klasse muss aktiv (nicht abgeschlossen) sein
  const { rows: klasse } = await pool.query(
    'SELECT id FROM klasse WHERE id = $1 AND lehrabschluss >= CURRENT_DATE',
    [eingabe.data.klasseId],
  )
  if (!klasse[0]) return NextResponse.json({ fehler: 'Klasse nicht gefunden oder bereits abgeschlossen' }, { status: 400 })

  await pool.query(
    'UPDATE lernende SET klasse_id = $1 WHERE id = $2',
    [eingabe.data.klasseId, params.lernendeId],
  )

  return NextResponse.json({ ok: true })
}
