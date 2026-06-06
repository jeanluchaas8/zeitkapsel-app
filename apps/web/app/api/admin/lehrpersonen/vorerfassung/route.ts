import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schema = z.object({
  vorname:     z.string().min(1),
  nachname:    z.string().min(1),
  fachbereich: z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
  beruf:       z.string().default(''),
})

export async function GET() {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const { rows } = await pool.query(
    'SELECT id, vorname, nachname, fachbereich, beruf FROM lehrperson_vorerfassung ORDER BY nachname, vorname'
  )
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  const d = eingabe.data
  const { rows } = await pool.query(
    `INSERT INTO lehrperson_vorerfassung (vorname, nachname, fachbereich, beruf)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [d.vorname, d.nachname, d.fachbereich, d.beruf]
  )
  return NextResponse.json(rows[0], { status: 201 })
}
