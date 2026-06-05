import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schema = z.object({
  ort: z.string().min(1),
  land: z.string().min(1),
  kontinent: z.string().min(1),
  kategorie: z.string().min(1),
  emoji: z.string().min(1),
  info: z.string().min(1),
  temp: z.string().default(''),
  lat: z.number(),
  lng: z.number(),
  foto: z.string().default(''),
  foto_alt: z.string().default(''),
  wiki_titel: z.string().default(''),
  link: z.string().default(''),
  link_text: z.string().default(''),
  aktiv: z.boolean().default(true),
})

export async function GET(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const kategorie = searchParams.get('kategorie')
  const kontinent = searchParams.get('kontinent')
  const land = searchParams.get('land')
  const suche = searchParams.get('suche')

  let query = 'SELECT * FROM kapsel_standorte WHERE 1=1'
  const params: unknown[] = []
  let i = 1

  if (kategorie) { query += ` AND kategorie = $${i++}`; params.push(kategorie) }
  if (kontinent) { query += ` AND kontinent = $${i++}`; params.push(kontinent) }
  if (land) { query += ` AND land ILIKE $${i++}`; params.push(`%${land}%`) }
  if (suche) { query += ` AND (ort ILIKE $${i} OR info ILIKE $${i++})`; params.push(`%${suche}%`) }

  query += ' ORDER BY ort ASC'

  const { rows } = await pool.query(query, params)
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const d = eingabe.data
  const { rows } = await pool.query(
    `INSERT INTO kapsel_standorte
      (ort, land, kontinent, kategorie, emoji, info, temp, lat, lng, foto, foto_alt, wiki_titel, link, link_text, aktiv)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [d.ort, d.land, d.kontinent, d.kategorie, d.emoji, d.info, d.temp, d.lat, d.lng, d.foto, d.foto_alt, d.wiki_titel, d.link, d.link_text, d.aktiv]
  )
  return NextResponse.json(rows[0], { status: 201 })
}
