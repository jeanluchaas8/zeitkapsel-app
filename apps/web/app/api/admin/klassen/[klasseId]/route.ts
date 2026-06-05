import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function lehrpersonOderAdminId(): Promise<string | null> {
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

export async function GET(
  _req: Request,
  { params }: { params: { klasseId: string } },
) {
  const userId = await lehrpersonOderAdminId()
  if (!userId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { rows } = await pool.query(
    'SELECT id, bezeichnung, beruf, lehrstart, lehrabschluss FROM klasse WHERE id = $1',
    [params.klasseId],
  )
  if (!rows[0]) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PATCH(
  req: Request,
  { params }: { params: { klasseId: string } },
) {
  const userId = await lehrpersonOderAdminId()
  if (!userId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  if (new Date(eingabe.data.lehrabschluss) <= new Date(eingabe.data.lehrstart)) {
    return NextResponse.json({ fehler: 'Lehrabschluss muss nach Lehrstart liegen' }, { status: 400 })
  }

  const { rows } = await pool.query(
    `UPDATE klasse
     SET bezeichnung = $1, beruf = $2, lehrstart = $3, lehrabschluss = $4
     WHERE id = $5
     RETURNING *`,
    [eingabe.data.bezeichnung, eingabe.data.beruf, eingabe.data.lehrstart, eingabe.data.lehrabschluss, params.klasseId],
  )

  if (!rows[0]) return NextResponse.json({ fehler: 'Klasse nicht gefunden' }, { status: 404 })
  return NextResponse.json(rows[0])
}
