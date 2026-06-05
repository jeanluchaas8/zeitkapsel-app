import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Rolle } from '@/lib/typen'
import { holeBildUrlFuerArtikel } from '../../bildHelper'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

// PATCH: Alle Standorte ohne Bild reparieren
export async function PATCH(_req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { rows } = await pool.query(
    "SELECT id, wiki_titel, ort FROM kapsel_standorte WHERE foto = '' OR foto IS NULL ORDER BY ort"
  )

  let repariert = 0
  for (const row of rows as Array<{ id: string; wiki_titel: string; ort: string }>) {
    const bildUrl = await holeBildUrlFuerArtikel(row.wiki_titel || row.ort.replace(/\s+/g, '_'))
    if (bildUrl) {
      await pool.query('UPDATE kapsel_standorte SET foto = $1 WHERE id = $2', [bildUrl, row.id])
      repariert++
    }
    await new Promise(r => setTimeout(r, 400)) // Rate-Limiting vermeiden
  }

  return NextResponse.json({ repariert, gesamt: rows.length })
}
