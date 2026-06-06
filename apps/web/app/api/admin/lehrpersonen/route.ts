import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schemaVoll = z.object({
  vorname:      z.string().min(1),
  nachname:     z.string().min(1),
  email:        z.string().email(),
  fachbereich:  z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
  beruf_id:     z.string().uuid().optional().or(z.literal('')),
  passwort:     z.string().min(8),
  ist_admin:    z.boolean().default(false),
  nurVorerfassen: z.literal(false).optional(),
})

const schemaVorerfassung = z.object({
  vorname:      z.string().min(1),
  nachname:     z.string().min(1),
  email:        z.string().email(),
  fachbereich:  z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
  beruf_id:     z.string().uuid().optional().or(z.literal('')),
  nurVorerfassen: z.literal(true),
})

export async function POST(req: NextRequest) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const body = await req.json() as Record<string, unknown>
  const { rows: schulen } = await pool.query('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) return NextResponse.json({ fehler: 'Keine Schule erfasst' }, { status: 400 })
  const schuleId = (schulen[0] as { id: string }).id

  // Vorerfassung (kein Passwort)
  if (body.nurVorerfassen === true) {
    const eingabe = schemaVorerfassung.safeParse(body)
    if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
    const d = eingabe.data

    // Beruf-ID validieren
    const berufId = d.beruf_id || null

    try {
      // Falls bereits vorerfasst → aktualisieren
      const existing = await pool.query(
        `SELECT id FROM lehrperson WHERE email = $1 AND status = 'vorerfasst'`, [d.email]
      )
      if (existing.rows[0]) {
        await pool.query(
          `UPDATE lehrperson SET vorname=$1, nachname=$2, fachbereich=$3, beruf_id=$4 WHERE id=$5`,
          [d.vorname, d.nachname, d.fachbereich, berufId, (existing.rows[0] as { id: string }).id]
        )
        return NextResponse.json({ ok: true, aktualisiert: true })
      }

      await pool.query(
        `INSERT INTO lehrperson (schule_id, vorname, nachname, email, fachbereich, beruf_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'vorerfasst')`,
        [schuleId, d.vorname, d.nachname, d.email, d.fachbereich, berufId]
      )
      return NextResponse.json({ ok: true }, { status: 201 })
    } catch {
      return NextResponse.json({ fehler: 'E-Mail bereits vorhanden' }, { status: 409 })
    }
  }

  // Vollständige Erfassung (mit Passwort, sofort aktiv)
  const eingabe = schemaVoll.safeParse(body)
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  const d = eingabe.data
  const berufId = d.beruf_id || null

  try {
    const { rows } = await pool.query(
      `INSERT INTO lehrperson (schule_id, vorname, nachname, email, fachbereich, beruf_id, passwort_hash, ist_admin, status)
       VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf')), $8, 'aktiv') RETURNING id, vorname, nachname, email`,
      [schuleId, d.vorname, d.nachname, d.email, d.fachbereich, berufId, d.passwort, d.ist_admin],
    )
    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ fehler: 'E-Mail bereits vorhanden' }, { status: 409 })
  }
}
