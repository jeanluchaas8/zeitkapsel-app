import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

const schema = z.object({
  lehrpersonen: z.array(z.object({
    vorname:     z.string().min(1),
    nachname:    z.string().min(1),
    email:       z.string().email(),
    fachbereich: z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
    beruf:       z.string().optional(),
    passwort:    z.string().min(6),
  })),
})

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as { rolle?: Rolle } | undefined)?.rolle !== 'admin') {
    return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  }

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) {
    return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { rows: schulen } = await pool.query('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) return NextResponse.json({ fehler: 'Keine Schule konfiguriert' }, { status: 400 })
  const schuleId = (schulen[0] as { id: string }).id

  let importiert = 0
  let uebersprungen = 0

  for (const lp of eingabe.data.lehrpersonen) {
    // Beruf-ID ermitteln, wenn Berufskunde und Beruf angegeben
    let berufId: string | null = null
    if (lp.fachbereich === 'Berufskunde' && lp.beruf) {
      const { rows: berufRows } = await pool.query(
        'SELECT id FROM berufe WHERE bezeichnung = $1 AND aktiv = TRUE LIMIT 1',
        [lp.beruf]
      )
      if (berufRows[0]) berufId = (berufRows[0] as { id: string }).id
    }

    try {
      await pool.query(
        `INSERT INTO lehrperson (schule_id, vorname, nachname, email, fachbereich, beruf_id, passwort_hash, status)
         VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf')), 'aktiv')`,
        [schuleId, lp.vorname, lp.nachname, lp.email, lp.fachbereich, berufId, lp.passwort]
      )
      importiert++
    } catch {
      // Duplikat (unique constraint on email) → überspringen
      uebersprungen++
    }
  }

  return NextResponse.json({ importiert, uebersprungen })
}
