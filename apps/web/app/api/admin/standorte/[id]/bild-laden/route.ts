import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { Rolle } from '@/lib/typen'
import { holeBildUrlFuerArtikel } from '../../bildHelper'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

// POST: Einzelnen Standort reparieren
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { rows } = await pool.query('SELECT wiki_titel, ort FROM kapsel_standorte WHERE id = $1', [params.id])
  if (!rows[0]) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })

  const { wiki_titel, ort } = rows[0] as { wiki_titel: string; ort: string }
  const bildUrl = await holeBildUrlFuerArtikel(wiki_titel || ort.replace(/\s+/g, '_'))

  if (!bildUrl) return NextResponse.json({ fehler: 'Kein Foto gefunden — bitte manuell eingeben' }, { status: 404 })

  await pool.query('UPDATE kapsel_standorte SET foto = $1 WHERE id = $2', [bildUrl, params.id])
  return NextResponse.json({ foto: bildUrl })
}
