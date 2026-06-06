import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const { id } = await params
  await pool.query('DELETE FROM lehrperson_vorerfassung WHERE id = $1', [id])
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  const { id } = await params
  const body = await req.json() as { vorname?: string; nachname?: string; fachbereich?: string; beruf?: string }
  const { rows } = await pool.query(
    `UPDATE lehrperson_vorerfassung
     SET vorname=COALESCE($1,vorname), nachname=COALESCE($2,nachname),
         fachbereich=COALESCE($3,fachbereich), beruf=COALESCE($4,beruf)
     WHERE id=$5 RETURNING *`,
    [body.vorname, body.nachname, body.fachbereich, body.beruf, id]
  )
  if (!rows[0]) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(rows[0])
}
