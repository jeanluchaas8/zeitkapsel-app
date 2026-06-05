import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schema = z.record(z.string(), z.string())

export async function PUT(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  for (const [schluessel, wert] of Object.entries(eingabe.data)) {
    await pool.query(
      `UPDATE konfiguration SET wert = $1 WHERE schluessel = $2`,
      [wert, schluessel],
    )
  }

  return NextResponse.json({ ok: true })
}
