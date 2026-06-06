import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim().toLowerCase()
  if (!email) return NextResponse.json(null)

  const { rows } = await pool.query(
    `SELECT vorname, nachname, fachbereich, b.bezeichnung AS beruf, lp.beruf_id
     FROM lehrperson lp
     LEFT JOIN berufe b ON b.id = lp.beruf_id
     WHERE LOWER(lp.email) = $1 AND lp.status = 'vorerfasst'
     LIMIT 1`,
    [email]
  )

  if (!rows[0]) return NextResponse.json(null)

  const lp = rows[0] as {
    vorname: string; nachname: string; fachbereich: string
    beruf: string | null; beruf_id: string | null
  }

  return NextResponse.json({
    vorname: lp.vorname,
    nachname: lp.nachname,
    fachbereich: lp.fachbereich,
    beruf: lp.beruf ?? '',
    beruf_id: lp.beruf_id ?? '',
  })
}
