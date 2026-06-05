import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Rolle } from '@/lib/typen'

export async function POST() {
  const session = await auth()
  if (!session?.user || (session.user as { rolle?: Rolle }).rolle !== 'lernende') {
    return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })
  }
  const nutzer = session.user as { id: string }

  const { rows: briefRows } = await pool.query(
    'SELECT * FROM brief WHERE lernende_id = $1', [nutzer.id],
  )
  const brief = briefRows[0]
  if (!brief) return NextResponse.json({ fehler: 'Kein Brief gefunden' }, { status: 404 })
  if (brief.status !== 'entwurf') return NextResponse.json({ fehler: 'Brief bereits versiegelt' }, { status: 409 })
  if (brief.typ === 'digital' && !brief.inhalt?.trim()) {
    return NextResponse.json({ fehler: 'Brief enthält noch keinen Text' }, { status: 400 })
  }

  const { rows } = await pool.query(
    `UPDATE brief SET status = 'versiegelt', versiegelt_am = NOW()
     WHERE id = $1 RETURNING *`,
    [brief.id],
  )
  return NextResponse.json(rows[0])
}
