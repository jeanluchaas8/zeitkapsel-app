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
  frage: z.string().min(5).optional(),
  antwort_a: z.string().min(1).optional(),
  antwort_b: z.string().min(1).optional(),
  antwort_c: z.string().min(1).optional(),
  antwort_d: z.string().min(1).optional(),
  richtig: z.enum(['a','b','c','d']).optional(),
  punkte: z.number().int().min(1).max(10).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  const d = eingabe.data
  const felder = Object.entries(d).filter(([,v]) => v !== undefined)
  if (felder.length === 0) return NextResponse.json({ fehler: 'Keine Änderungen' }, { status: 400 })
  const sets = felder.map(([k],i) => `${k} = $${i+1}`).join(', ')
  const vals = [...felder.map(([,v]) => v), params.id]
  const { rows } = await pool.query(`UPDATE kapsel_quiz SET ${sets} WHERE id = $${felder.length+1} RETURNING *`, vals)
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  await pool.query('DELETE FROM kapsel_quiz WHERE id = $1', [params.id])
  return new NextResponse(null, { status: 204 })
}
