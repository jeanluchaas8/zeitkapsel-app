import { getLernendeId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

function aktuellesLehrjahr(lehrstart: Date): number {
  const diff = (Date.now() - lehrstart.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return Math.min(4, Math.max(1, Math.ceil(diff)))
}

// GET — eigene Feedback-Anfragen und Status
export async function GET() {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  // Klasse + Lehrpersonen
  const { rows: klasseRows } = await pool.query(`
    SELECT k.lehrstart, k.lehrabschluss,
           ROUND(EXTRACT(EPOCH FROM AGE(k.lehrabschluss, k.lehrstart)) / (365.25 * 86400))::INT AS lehrdauer
    FROM lernende l JOIN klasse k ON k.id = l.klasse_id WHERE l.id = $1
  `, [lernendeId])
  if (!klasseRows[0]) return NextResponse.json({ fehler: 'Klasse nicht gefunden' }, { status: 404 })

  const { lehrstart, lehrabschluss, lehrdauer } = klasseRows[0] as {
    lehrstart: Date; lehrabschluss: Date; lehrdauer: number
  }
  const aktLehrjahr = aktuellesLehrjahr(new Date(lehrstart))
  const istLetztesJahr = aktLehrjahr >= (lehrdauer || 4)

  // Lehrpersonen der Klasse
  const { rows: lehrpersonen } = await pool.query(`
    SELECT lp.id, lp.vorname, lp.nachname, lp.fachbereich
    FROM lehrperson lp
    JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
    JOIN lernende l ON l.klasse_id = kl.klasse_id
    WHERE l.id = $1 AND lp.status = 'aktiv'
    ORDER BY lp.nachname
  `, [lernendeId])

  // Eigene Anfragen
  const { rows: anfragen } = await pool.query(`
    SELECT f.id, f.lehrperson_id, f.typ, f.status, f.anfrage_text,
           f.inhalt, f.aktualisiert_am,
           lp.vorname AS lp_vorname, lp.nachname AS lp_nachname
    FROM feedback f
    JOIN lehrperson lp ON lp.id = f.lehrperson_id
    WHERE f.lernende_id = $1 ORDER BY f.typ, lp.nachname
  `, [lernendeId])

  const istZugestellt = ['zugestellt','zugestellt_ausdruck_pendent'].includes(
    (await pool.query('SELECT status FROM brief WHERE lernende_id = $1', [lernendeId])).rows[0]?.status ?? ''
  )

  return NextResponse.json({
    lehrpersonen, anfragen, aktLehrjahr, lehrdauer: lehrdauer || 4,
    istLetztesJahr, istZugestellt,
    lehrabschluss: new Date(lehrabschluss).toLocaleDateString('de-CH'),
  })
}

// POST — Feedback anfragen
export async function POST(req: Request) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const schema = z.object({
    lehrpersonId: z.string().uuid(),
    typ: z.enum(['lehrjahr_1','lehrjahr_2','lehrjahr_3','lehrjahr_4','abschluss']),
    anfrage_text: z.string().min(10).max(1000),
  })
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { lehrpersonId, typ, anfrage_text } = eingabe.data

  // Prüfen ob LP zur Klasse gehört
  const { rows: check } = await pool.query(`
    SELECT 1 FROM lehrperson lp
    JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
    JOIN lernende l ON l.klasse_id = kl.klasse_id
    WHERE l.id = $1 AND lp.id = $2
  `, [lernendeId, lehrpersonId])
  if (!check[0]) return NextResponse.json({ fehler: 'Lehrperson nicht in deiner Klasse' }, { status: 403 })

  const { rows } = await pool.query(`
    INSERT INTO feedback (lernende_id, lehrperson_id, typ, anfrage_text, inhalt, status)
    VALUES ($1, $2, $3, $4, '', 'angefragt')
    ON CONFLICT (lernende_id, lehrperson_id, typ)
    DO UPDATE SET anfrage_text = $4, status = CASE WHEN feedback.status = 'geschrieben' THEN 'geschrieben' ELSE 'angefragt' END
    RETURNING *
  `, [lernendeId, lehrpersonId, typ, anfrage_text])

  // ── E-Mail-Benachrichtigung an LP ────────────────────────────────────────
  try {
    const { rows: lernRows } = await pool.query(
      'SELECT vorname, nachname FROM lernende WHERE id = $1', [lernendeId]
    )
    const { rows: lpRows } = await pool.query(
      'SELECT vorname, nachname, email FROM lehrperson WHERE id = $1', [lehrpersonId]
    )
    const lern = lernRows[0] as { vorname: string; nachname: string } | undefined
    const lp   = lpRows[0]  as { vorname: string; nachname: string; email: string } | undefined

    const TYP_LABEL: Record<string, string> = {
      lehrjahr_1: '1. Lehrjahr', lehrjahr_2: '2. Lehrjahr',
      lehrjahr_3: '3. Lehrjahr', lehrjahr_4: '4. Lehrjahr',
      abschluss: 'Abschluss-Feedback',
    }

    if (lern && lp) {
      const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
        to: lp.email,
        subject: `Feedback-Anfrage von ${lern.vorname} ${lern.nachname} — Zeitkapsel`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#1c1917">📋 Neue Feedback-Anfrage</h2>
            <p>Hallo ${lp.vorname}</p>
            <p>
              <strong>${lern.vorname} ${lern.nachname}</strong> hat dir eine Feedback-Anfrage
              für das <strong>${TYP_LABEL[typ] ?? typ}</strong> gesendet:
            </p>
            <blockquote style="border-left:3px solid #e7e5e4;padding:8px 16px;color:#57534e;margin:16px 0">
              ${anfrage_text.replace(/\n/g, '<br>')}
            </blockquote>
            <p>
              <a href="${baseUrl}/lehrperson/lernende/${lernendeId}/feedback"
                 style="display:inline-block;background:#1c1917;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                Feedback schreiben →
              </a>
            </p>
            <p style="color:#a8a29e;font-size:12px;margin-top:24px">
              Zeitkapsel · Diese E-Mail wurde automatisch gesendet.
            </p>
          </div>
        `,
      })
    }
  } catch (err) {
    // E-Mail-Fehler nicht an Client weitergeben — Feedback wurde bereits gespeichert
    console.error('[FEEDBACK-MAIL]', err)
  }

  return NextResponse.json(rows[0])
}
