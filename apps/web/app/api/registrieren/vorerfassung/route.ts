import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

// Autocomplete: Suche nach Name in Vorerfassungsliste
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const { rows } = await pool.query(
    `SELECT id, vorname, nachname, fachbereich, beruf
     FROM lehrperson_vorerfassung
     WHERE vorname ILIKE $1 OR nachname ILIKE $1
        OR (vorname || ' ' || nachname) ILIKE $1
     ORDER BY nachname, vorname
     LIMIT 10`,
    [`%${q}%`]
  )

  return NextResponse.json(rows)
}
