import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

const schema = z.object({
  klasse_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle } | undefined)?.rolle
  if (rolle !== 'lehrperson' && rolle !== 'admin') {
    return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  }
  const lehrpersonId = (session!.user as { id: string }).id

  const e = schema.safeParse(await req.json())
  if (!e.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  // Klasse muss existieren
  const { rows } = await pool.query<{ id: string; bezeichnung: string }>(
    'SELECT id, bezeichnung FROM klasse WHERE id = $1',
    [e.data.klasse_id]
  )
  if (!rows[0]) return NextResponse.json({ fehler: 'Klasse nicht gefunden' }, { status: 404 })

  await pool.query(
    `INSERT INTO klasse_lehrperson (klasse_id, lehrperson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [e.data.klasse_id, lehrpersonId]
  )

  return NextResponse.json({ ok: true, klasse: rows[0] })
}
