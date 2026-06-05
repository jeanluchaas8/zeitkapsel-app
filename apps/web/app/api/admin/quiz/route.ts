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
  standortId: z.string().uuid(),
  frage: z.string().min(5),
  antwort_a: z.string().min(1),
  antwort_b: z.string().min(1),
  antwort_c: z.string().min(1),
  antwort_d: z.string().min(1),
  richtig: z.enum(['a','b','c','d']),
  punkte: z.number().int().min(1).max(10).default(3),
})

export async function GET(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const standortId = searchParams.get('standortId')
  const { rows } = await pool.query(
    standortId
      ? 'SELECT * FROM kapsel_quiz WHERE standort_id = $1 ORDER BY erstellt_am'
      : 'SELECT * FROM kapsel_quiz ORDER BY erstellt_am',
    standortId ? [standortId] : []
  )
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  const d = eingabe.data
  const { rows } = await pool.query(
    `INSERT INTO kapsel_quiz (standort_id, frage, antwort_a, antwort_b, antwort_c, antwort_d, richtig, punkte)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [d.standortId, d.frage, d.antwort_a, d.antwort_b, d.antwort_c, d.antwort_d, d.richtig, d.punkte]
  )
  return NextResponse.json(rows[0], { status: 201 })
}
