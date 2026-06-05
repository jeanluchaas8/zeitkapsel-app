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
  ort: z.string().min(1).optional(),
  land: z.string().min(1).optional(),
  kontinent: z.string().optional(),
  kategorie: z.string().optional(),
  emoji: z.string().optional(),
  info: z.string().optional(),
  temp: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  foto: z.string().optional(),
  foto_alt: z.string().optional(),
  wiki_titel: z.string().optional(),
  link: z.string().optional(),
  link_text: z.string().optional(),
  aktiv: z.boolean().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const d = eingabe.data
  const sets: string[] = []
  const vals: unknown[] = []
  let i = 1

  const felder = ['ort','land','kontinent','kategorie','emoji','info','temp','lat','lng','foto','foto_alt','wiki_titel','link','link_text','aktiv'] as const
  for (const f of felder) {
    if (d[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(d[f]) }
  }
  if (sets.length === 0) return NextResponse.json({ fehler: 'Keine Änderungen' }, { status: 400 })

  vals.push(params.id)
  const { rows } = await pool.query(
    `UPDATE kapsel_standorte SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  )
  if (!rows[0]) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  await pool.query('DELETE FROM kapsel_standorte WHERE id = $1', [params.id])
  return new NextResponse(null, { status: 204 })
}
