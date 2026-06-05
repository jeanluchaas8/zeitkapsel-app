import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

export async function GET() {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const { rows } = await pool.query('SELECT id, bezeichnung, lehrdauer, aktiv FROM berufe ORDER BY bezeichnung')
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const schema = z.object({ bezeichnung: z.string().min(2), lehrdauer: z.number().int().min(2).max(4).default(4) })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  try {
    const { rows } = await pool.query(
      'INSERT INTO berufe (bezeichnung, lehrdauer) VALUES ($1, $2) RETURNING *',
      [eingabe.data.bezeichnung, eingabe.data.lehrdauer]
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ fehler: 'Beruf bereits vorhanden' }, { status: 409 })
  }
}

export async function PATCH(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const schema = z.object({
    id: z.string().uuid(),
    bezeichnung: z.string().min(2).optional(),
    lehrdauer: z.number().int().min(2).max(4).optional(),
    aktiv: z.boolean().optional(),
  })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  try {
    const { rows } = await pool.query(
      `UPDATE berufe SET
        bezeichnung = COALESCE($2, bezeichnung),
        lehrdauer   = COALESCE($3, lehrdauer),
        aktiv       = COALESCE($4, aktiv)
       WHERE id = $1 RETURNING *`,
      [eingabe.data.id, eingabe.data.bezeichnung ?? null, eingabe.data.lehrdauer ?? null, eingabe.data.aktiv ?? null]
    )
    if (!rows[0]) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch {
    return NextResponse.json({ fehler: 'Bezeichnung bereits vorhanden' }, { status: 409 })
  }
}
