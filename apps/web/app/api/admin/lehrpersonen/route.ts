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
  vorname:     z.string().min(1),
  nachname:    z.string().min(1),
  email:       z.string().email(),
  fachbereich: z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
  beruf_id:    z.string().uuid().optional().or(z.literal('')),
  passwort:    z.string().min(8),
  ist_admin:   z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows: schulen } = await pool.query('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) return NextResponse.json({ fehler: 'Keine Schule erfasst' }, { status: 400 })

  const d = eingabe.data
  try {
    const { rows } = await pool.query(
      `INSERT INTO lehrperson (schule_id, vorname, nachname, email, fachbereich, beruf_id, passwort_hash, ist_admin, status)
       VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf')), $8, 'aktiv') RETURNING id, vorname, nachname, email`,
      [schulen[0].id, d.vorname, d.nachname, d.email, d.fachbereich, d.beruf_id || null, d.passwort, d.ist_admin],
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ fehler: 'E-Mail bereits vorhanden' }, { status: 409 })
  }
}
