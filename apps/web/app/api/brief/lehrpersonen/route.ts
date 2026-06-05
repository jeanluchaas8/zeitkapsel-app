import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function briefIdLaden(lernendeId: string): Promise<string | null> {
  const { rows } = await pool.query('SELECT id FROM brief WHERE lernende_id = $1', [lernendeId])
  return rows[0]?.id ?? null
}

async function lernendePruefen() {
  const session = await auth()
  if (!session?.user || (session.user as { rolle?: Rolle }).rolle !== 'lernende') return null
  return session.user as { id: string }
}

const putSchema = z.object({
  lehrperson_id: z.string().uuid(),
  brief_sichtbar: z.boolean(),
})

export async function PUT(req: NextRequest) {
  const nutzer = await lernendePruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const briefId = await briefIdLaden(nutzer.id)
  if (!briefId) return NextResponse.json({ fehler: 'Kein Brief gefunden' }, { status: 404 })

  const eingabe = putSchema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  await pool.query(
    `INSERT INTO lp_auswahl (brief_id, lehrperson_id, brief_sichtbar)
     VALUES ($1, $2, $3)
     ON CONFLICT (brief_id, lehrperson_id)
     DO UPDATE SET brief_sichtbar = $3, einstellungen_geaendert_am = NOW()`,
    [briefId, eingabe.data.lehrperson_id, eingabe.data.brief_sichtbar],
  )

  const { rows } = await pool.query(
    `SELECT la.*, lp.vorname, lp.nachname, lp.fachbereich
     FROM lp_auswahl la JOIN lehrperson lp ON lp.id = la.lehrperson_id
     WHERE la.brief_id = $1`,
    [briefId],
  )
  return NextResponse.json(rows)
}

const deleteSchema = z.object({ lehrperson_id: z.string().uuid() })

export async function DELETE(req: NextRequest) {
  const nutzer = await lernendePruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const briefId = await briefIdLaden(nutzer.id)
  if (!briefId) return NextResponse.json({ fehler: 'Kein Brief gefunden' }, { status: 404 })

  const eingabe = deleteSchema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  await pool.query(
    'DELETE FROM lp_auswahl WHERE brief_id = $1 AND lehrperson_id = $2',
    [briefId, eingabe.data.lehrperson_id],
  )
  return new NextResponse(null, { status: 204 })
}
