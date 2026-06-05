import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { auth } from '@/auth'
import type { Rolle } from '@/lib/typen'

async function lehrpersonPruefen() {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle } | undefined)?.rolle
  return rolle === 'lehrperson' || rolle === 'admin'
}

export async function GET() {
  const { rows } = await pool.query(
    'SELECT schluessel, bezeichnung, wert FROM konfiguration ORDER BY schluessel'
  )
  return NextResponse.json(rows)
}

export async function PATCH(req: Request) {
  if (!(await lehrpersonPruefen())) {
    return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  }

  const aenderungen = await req.json() as Record<string, string>

  for (const [schluessel, wert] of Object.entries(aenderungen)) {
    await pool.query(
      'UPDATE konfiguration SET wert = $1 WHERE schluessel = $2',
      [wert, schluessel],
    )
  }

  return NextResponse.json({ ok: true })
}
