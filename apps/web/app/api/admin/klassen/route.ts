import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function lehrpersonOderAdminPruefen(): Promise<string | null> {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle } | undefined)?.rolle
  if (rolle !== 'admin' && rolle !== 'lehrperson') return null
  return (session!.user as { id: string }).id
}

const schema = z.object({
  bezeichnung: z.string().min(1),
  beruf: z.string().min(1),
  lehrstart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lehrabschluss: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(req: NextRequest) {
  const lehrpersonId = await lehrpersonOderAdminPruefen()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows: schulen } = await pool.query('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) return NextResponse.json({ fehler: 'Keine Schule erfasst' }, { status: 400 })

  if (new Date(eingabe.data.lehrabschluss) <= new Date(eingabe.data.lehrstart)) {
    return NextResponse.json({ fehler: 'Lehrabschluss muss nach Lehrstart liegen' }, { status: 400 })
  }

  const { rows } = await pool.query(
    `INSERT INTO klasse (schule_id, bezeichnung, beruf, lehrstart, lehrabschluss)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [schulen[0].id, eingabe.data.bezeichnung, eingabe.data.beruf, eingabe.data.lehrstart, eingabe.data.lehrabschluss],
  )
  const klasse = rows[0] as { id: string }

  // Erstellende Lehrperson automatisch zur Klasse zuweisen
  await pool.query(
    `INSERT INTO klasse_lehrperson (klasse_id, lehrperson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [klasse.id, lehrpersonId],
  )

  return NextResponse.json(klasse, { status: 201 })
}
