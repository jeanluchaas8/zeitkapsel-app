import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHmac } from 'crypto'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schema = z.object({
  vorname: z.string().min(1),
  nachname: z.string().min(1),
  email: z.string().email(),
  fachbereich: z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
  passwort: z.string().min(8),
  ist_admin: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows: schulen } = await pool.query('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) return NextResponse.json({ fehler: 'Keine Schule erfasst' }, { status: 400 })

  const passwortHash = createHmac('sha256', process.env.AUTH_SECRET ?? '')
    .update(eingabe.data.passwort)
    .digest('hex')

  try {
    const { rows } = await pool.query(
      `INSERT INTO lehrperson (schule_id, vorname, nachname, email, fachbereich, passwort_hash, ist_admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, vorname, nachname, email`,
      [schulen[0].id, eingabe.data.vorname, eingabe.data.nachname, eingabe.data.email,
       eingabe.data.fachbereich, passwortHash, eingabe.data.ist_admin],
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ fehler: 'E-Mail bereits vorhanden' }, { status: 409 })
  }
}
