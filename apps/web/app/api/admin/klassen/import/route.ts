import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

const KlasseSchema = z.object({
  bezeichnung: z.string().min(1),
  beruf: z.string(),
  lehrstart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lehrabschluss: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const BodySchema = z.object({
  klassen: z.array(KlasseSchema).min(1).max(300),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle } | undefined)?.rolle
  if (rolle !== 'admin') {
    return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { rows: schulen } = await pool.query<{ id: string }>('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) {
    return NextResponse.json({ fehler: 'Keine Schule erfasst' }, { status: 400 })
  }
  const schuleId = schulen[0].id

  let importiert = 0
  let uebersprungen = 0

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const k of body.data.klassen) {
      // Duplikat-Prüfung
      const { rows: check } = await client.query<{ id: string }>(
        'SELECT id FROM klasse WHERE bezeichnung = $1',
        [k.bezeichnung]
      )
      if (check.length > 0) {
        uebersprungen++
        continue
      }

      const beruf = k.beruf.trim() || 'Nicht zugewiesen'
      if (new Date(k.lehrabschluss) <= new Date(k.lehrstart)) {
        uebersprungen++
        continue
      }

      await client.query(
        `INSERT INTO klasse (schule_id, bezeichnung, beruf, lehrstart, lehrabschluss)
         VALUES ($1, $2, $3, $4, $5)`,
        [schuleId, k.bezeichnung, beruf, k.lehrstart, k.lehrabschluss]
      )
      importiert++
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('[import] Fehler:', err)
    return NextResponse.json({ fehler: 'Datenbankfehler beim Import' }, { status: 500 })
  } finally {
    client.release()
  }

  return NextResponse.json({ importiert, uebersprungen }, { status: 200 })
}
