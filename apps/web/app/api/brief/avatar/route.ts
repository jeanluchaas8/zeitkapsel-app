import { getLernendeId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ seed: z.string().min(1).max(100) })

export async function GET() {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })
  const { rows } = await pool.query('SELECT avatar_seed, avatar_url FROM lernende WHERE id = $1', [lernendeId])
  return NextResponse.json({
    seed: rows[0]?.avatar_seed ?? '',
    url: rows[0]?.avatar_url ?? '',
  })
}

export async function POST(req: Request) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültig' }, { status: 400 })
  // Seed setzen, Upload-URL leeren
  await pool.query(
    'UPDATE lernende SET avatar_seed = $1, avatar_url = $2 WHERE id = $3',
    [eingabe.data.seed, '', lernendeId]
  )
  return NextResponse.json({ ok: true })
}
