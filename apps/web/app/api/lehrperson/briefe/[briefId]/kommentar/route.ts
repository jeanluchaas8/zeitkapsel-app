import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function lehrpersonPruefen() {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle } | undefined)?.rolle
  if (!session?.user || (rolle !== 'lehrperson' && rolle !== 'admin')) return null
  return session.user as { id: string }
}

async function zugangPruefen(briefId: string, lehrpersonId: string): Promise<{ erlaubt: boolean; fehler?: string }> {
  const { rows } = await pool.query(
    `SELECT k.lehrabschluss
     FROM brief b
     JOIN lernende l ON l.id = b.lernende_id
     JOIN klasse k ON k.id = l.klasse_id
     JOIN klasse_lehrperson kl ON kl.klasse_id = l.klasse_id
     WHERE b.id = $1 AND kl.lehrperson_id = $2`,
    [briefId, lehrpersonId],
  )
  if (rows.length === 0) return { erlaubt: false, fehler: 'Kein Zugang' }

  const lehrabschluss = new Date(rows[0].lehrabschluss as string)
  const freigegebAb = new Date(lehrabschluss)
  freigegebAb.setDate(freigegebAb.getDate() - 28)

  if (new Date() < freigegebAb) {
    return {
      erlaubt: false,
      fehler: `Kommentare können erst ab ${freigegebAb.toLocaleDateString('de-CH')} geschrieben werden (28 Tage vor Lehrabschluss).`,
    }
  }
  return { erlaubt: true }
}

const kommentarSchema = z.object({ inhalt: z.string().min(1).max(5000) })

export async function PUT(req: NextRequest, { params }: { params: { briefId: string } }) {
  const nutzer = await lehrpersonPruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })
  const zugang = await zugangPruefen(params.briefId, nutzer.id)
  if (!zugang.erlaubt) {
    return NextResponse.json({ fehler: zugang.fehler ?? 'Kein Zugang' }, { status: 403 })
  }

  const eingabe = kommentarSchema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows } = await pool.query(
    `INSERT INTO kommentar (brief_id, lehrperson_id, typ, inhalt)
     VALUES ($1, $2, 'digital', $3)
     ON CONFLICT (brief_id, lehrperson_id)
     DO UPDATE SET inhalt = $3, typ = 'digital', datei_pfad = NULL
     RETURNING *`,
    [params.briefId, nutzer.id, eingabe.data.inhalt],
  )
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: { params: { briefId: string } }) {
  const nutzer = await lehrpersonPruefen()
  if (!nutzer) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })
  const zugang = await zugangPruefen(params.briefId, nutzer.id)
  if (!zugang.erlaubt) {
    return NextResponse.json({ fehler: zugang.fehler ?? 'Kein Zugang' }, { status: 403 })
  }

  await pool.query('DELETE FROM kommentar WHERE brief_id = $1 AND lehrperson_id = $2', [params.briefId, nutzer.id])
  return new NextResponse(null, { status: 204 })
}
