import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function lernendePruefen() {
  const session = await auth()
  if (!session?.user) return null
  if ((session.user as { rolle?: Rolle }).rolle !== 'lernende') return null
  return session.user as { id: string; email: string }
}

// GET — eigenen Brief laden
export async function GET() {
  const nutzer = await lernendePruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { rows } = await pool.query(
    `SELECT b.*,
      COALESCE(json_agg(json_build_object(
        'lehrperson_id', la.lehrperson_id,
        'brief_sichtbar', la.brief_sichtbar,
        'vorname', lp.vorname,
        'nachname', lp.nachname,
        'fachbereich', lp.fachbereich
      )) FILTER (WHERE la.id IS NOT NULL), '[]') AS lp_auswahl
     FROM brief b
     LEFT JOIN lp_auswahl la ON la.brief_id = b.id
     LEFT JOIN lehrperson lp ON lp.id = la.lehrperson_id
     WHERE b.lernende_id = $1
     GROUP BY b.id`,
    [nutzer.id],
  )
  if (!rows[0]) return NextResponse.json({ fehler: 'Kein Brief vorhanden' }, { status: 404 })
  return NextResponse.json(rows[0])
}

// POST — neuen Brief erstellen
const erstellenSchema = z.object({
  typ: z.enum(['digital', 'foto']),
  zustellart: z.enum(['mail', 'print', 'both']),
})

export async function POST(req: NextRequest) {
  const nutzer = await lernendePruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const vorhandener = await pool.query('SELECT id FROM brief WHERE lernende_id = $1', [nutzer.id])
  if (vorhandener.rows[0]) return NextResponse.json({ fehler: 'Brief bereits vorhanden' }, { status: 409 })

  const eingabe = erstellenSchema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  // Lehrabschluss der Klasse laden
  const { rows: klasseRows } = await pool.query(
    'SELECT k.lehrabschluss FROM klasse k JOIN lernende l ON l.klasse_id = k.id WHERE l.id = $1',
    [nutzer.id],
  )
  const lehrabschluss = klasseRows[0]?.lehrabschluss as Date | undefined
  const gesperrtAb = lehrabschluss
    ? new Date(new Date(lehrabschluss).getTime() - 28 * 86400000).toISOString().slice(0, 10)
    : null

  const { rows } = await pool.query(
    `INSERT INTO brief (lernende_id, typ, zustellart, einstellungen_gesperrt_ab)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nutzer.id, eingabe.data.typ, eingabe.data.zustellart, gesperrtAb],
  )
  return NextResponse.json(rows[0], { status: 201 })
}

// PUT — Inhalt des Briefes bearbeiten (nur im Entwurf)
const aktualisierenSchema = z.object({
  inhalt: z.string().max(10000),
})

export async function PUT(req: NextRequest) {
  const nutzer = await lernendePruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { rows: briefRows } = await pool.query(
    'SELECT * FROM brief WHERE lernende_id = $1', [nutzer.id],
  )
  const brief = briefRows[0]
  if (!brief) return NextResponse.json({ fehler: 'Kein Brief gefunden' }, { status: 404 })
  if (brief.status !== 'entwurf') return NextResponse.json({ fehler: 'Brief bereits versiegelt' }, { status: 409 })

  const eingabe = aktualisierenSchema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows } = await pool.query(
    'UPDATE brief SET inhalt = $2 WHERE id = $1 RETURNING *',
    [brief.id, eingabe.data.inhalt],
  )
  return NextResponse.json(rows[0])
}

// PATCH — Zustellart ändern (auch nach Versiegeln, bis zur Zustellung)
const zustellartSchema = z.object({
  zustellart: z.enum(['mail', 'print', 'both']),
})

export async function PATCH(req: NextRequest) {
  const nutzer = await lernendePruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const { rows: briefRows } = await pool.query(
    'SELECT id, status FROM brief WHERE lernende_id = $1', [nutzer.id],
  )
  const brief = briefRows[0]
  if (!brief) return NextResponse.json({ fehler: 'Kein Brief gefunden' }, { status: 404 })

  const bereitsZugestellt = ['zugestellt', 'zugestellt_ausdruck_pendent'].includes(brief.status as string)
  if (bereitsZugestellt) {
    return NextResponse.json({ fehler: 'Brief wurde bereits zugestellt' }, { status: 409 })
  }

  const eingabe = zustellartSchema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows } = await pool.query(
    'UPDATE brief SET zustellart = $2 WHERE id = $1 RETURNING *',
    [brief.id, eingabe.data.zustellart],
  )
  return NextResponse.json(rows[0])
}
