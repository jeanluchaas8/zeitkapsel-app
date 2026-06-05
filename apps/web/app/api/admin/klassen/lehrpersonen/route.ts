import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schema = z.object({
  klasse_id: z.string().uuid(),
  lehrperson_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const e = schema.safeParse(await req.json())
  if (!e.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  await pool.query(
    `INSERT INTO klasse_lehrperson (klasse_id, lehrperson_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [e.data.klasse_id, e.data.lehrperson_id],
  )
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const e = schema.safeParse(await req.json())
  if (!e.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  await pool.query(
    'DELETE FROM klasse_lehrperson WHERE klasse_id = $1 AND lehrperson_id = $2',
    [e.data.klasse_id, e.data.lehrperson_id],
  )
  return new NextResponse(null, { status: 204 })
}
