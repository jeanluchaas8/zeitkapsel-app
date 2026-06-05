import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const TYPEN = ['lehrjahr_1','lehrjahr_2','lehrjahr_3','lehrjahr_4','abschluss'] as const
const TYP_TEXT: Record<string, string> = {
  lehrjahr_1: '1. Lehrjahr',
  lehrjahr_2: '2. Lehrjahr',
  lehrjahr_3: '3. Lehrjahr',
  lehrjahr_4: '4. Lehrjahr',
  abschluss:  'Abschluss-Feedback',
}

const schema = z.object({
  lernendeId: z.string().uuid(),
  typ: z.enum(TYPEN),
  inhalt: z.string().min(10).max(5000),
})

// GET — alle Feedbacks dieser LP für eine/n Lernende/n
export async function GET(req: Request) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const lernendeId = searchParams.get('lernendeId')
  if (!lernendeId) return NextResponse.json({ fehler: 'lernendeId fehlt' }, { status: 400 })

  const { rows: check } = await pool.query(`
    SELECT l.id, l.vorname, l.nachname, k.bezeichnung AS klasse,
           k.lehrstart, k.lehrabschluss,
           -- Lehrdauer korrekt via Epoch berechnen (nicht nur Jahr-Anteil)
           ROUND(EXTRACT(EPOCH FROM AGE(k.lehrabschluss, k.lehrstart)) / (365.25 * 86400))::INT AS lehrdauer,
           b.inhalt AS brief_inhalt,
           la.brief_sichtbar,
           -- Brief erst 28 Tage vor Abschluss oder nach Austritt sichtbar
           (l.ausgetreten_am IS NOT NULL OR k.lehrabschluss <= NOW() + INTERVAL '28 days') AS brief_freigegeben,
           -- Abschluss-Feedback erst 30 Tage vor Abschluss schreibbar
           (k.lehrabschluss <= NOW() + INTERVAL '30 days') AS abschluss_schreibbar
    FROM lernende l
    JOIN klasse k ON k.id = l.klasse_id
    JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
    LEFT JOIN brief b ON b.lernende_id = l.id
    LEFT JOIN lp_auswahl la ON la.brief_id = b.id AND la.lehrperson_id = $2
    WHERE l.id = $1 AND kl.lehrperson_id = $2
  `, [lernendeId, lehrpersonId])

  if (!check[0]) return NextResponse.json({ fehler: 'Kein Zugang' }, { status: 403 })
  const lernende = check[0] as {
    id: string; vorname: string; nachname: string; klasse: string
    lehrstart: string; lehrabschluss: string; lehrdauer: number
    brief_inhalt: string | null; brief_sichtbar: boolean | null
    brief_freigegeben: boolean; abschluss_schreibbar: boolean
  }

  const { rows: eigene } = await pool.query(
    'SELECT * FROM feedback WHERE lernende_id = $1 AND lehrperson_id = $2 ORDER BY typ',
    [lernendeId, lehrpersonId]
  )

  const start = new Date(lernende.lehrstart)
  const jetzt = new Date()
  const jahreDiff = (jetzt.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  const lehrdauer = Math.max(2, lernende.lehrdauer)
  const aktuellesLehrjahr = Math.min(lehrdauer, Math.max(1, Math.ceil(jahreDiff)))

  return NextResponse.json({
    lernende,
    eigene,
    aktuellesLehrjahr,
    lehrdauer,
    abschlussSchreibbar: lernende.abschluss_schreibbar,
    brief: {
      inhalt: lernende.brief_freigegeben && lernende.brief_sichtbar ? lernende.brief_inhalt : null,
      freigegeben: lernende.brief_freigegeben,
      sichtbar: lernende.brief_sichtbar,
    },
    typTexte: TYP_TEXT,
  })
}

// POST — Feedback erstellen oder aktualisieren
export async function POST(req: Request) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { lernendeId, typ, inhalt } = eingabe.data

  // Zugang + Zeitprüfung für Abschluss-Feedback
  const { rows: check } = await pool.query(`
    SELECT k.lehrabschluss,
           (k.lehrabschluss <= NOW() + INTERVAL '30 days') AS abschluss_schreibbar
    FROM lernende l
    JOIN klasse k ON k.id = l.klasse_id
    JOIN klasse_lehrperson kl ON kl.klasse_id = l.klasse_id
    WHERE l.id = $1 AND kl.lehrperson_id = $2
  `, [lernendeId, lehrpersonId])

  if (!check[0]) return NextResponse.json({ fehler: 'Kein Zugang' }, { status: 403 })

  // Abschluss-Feedback nur 30 Tage vor Abschluss erlaubt
  if (typ === 'abschluss' && !check[0].abschluss_schreibbar) {
    const ab = new Date(check[0].lehrabschluss as string)
    ab.setDate(ab.getDate() - 30)
    return NextResponse.json({
      fehler: `Das Abschluss-Feedback kann erst ab ${ab.toLocaleDateString('de-CH')} verfasst werden (30 Tage vor dem Lehrabschluss).`,
    }, { status: 403 })
  }

  const { rows } = await pool.query(`
    INSERT INTO feedback (lernende_id, lehrperson_id, typ, inhalt)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (lernende_id, lehrperson_id, typ)
    DO UPDATE SET inhalt = $4, aktualisiert_am = NOW()
    RETURNING *
  `, [lernendeId, lehrpersonId, typ, inhalt])

  // Status auf 'geschrieben' setzen falls es eine Anfrage gab
  await pool.query(`
    UPDATE feedback SET status = 'geschrieben'
    WHERE lernende_id = $1 AND lehrperson_id = $2 AND typ = $3
  `, [lernendeId, lehrpersonId, typ])

  // ── E-Mail an Lernende (nur Jahresfeedbacks — sofort sichtbar) ───────────
  if (typ !== 'abschluss') {
    try {
      const { rows: lernRows } = await pool.query(
        'SELECT vorname, email FROM lernende WHERE id = $1', [lernendeId]
      )
      const { rows: lpRows } = await pool.query(
        'SELECT vorname, nachname FROM lehrperson WHERE id = $1', [lehrpersonId]
      )
      const lern = lernRows[0] as { vorname: string; email: string } | undefined
      const lp   = lpRows[0]  as { vorname: string; nachname: string } | undefined

      if (lern?.email && lp) {
        const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
          to: lern.email,
          subject: `${lp.vorname} ${lp.nachname} hat dein Feedback geschrieben — Zeitkapsel`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
              <h2 style="color:#1c1917">💬 Neues Feedback für dich</h2>
              <p>Hallo ${lern.vorname}</p>
              <p>
                <strong>${lp.vorname} ${lp.nachname}</strong> hat dein angefragtes Feedback
                für das <strong>${TYP_TEXT[typ] ?? typ}</strong> fertiggestellt.
              </p>
              <p>Du kannst es ab sofort in deiner Zeitkapsel lesen:</p>
              <p>
                <a href="${baseUrl}/brief"
                   style="display:inline-block;background:#1c1917;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                  Feedback lesen →
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
      console.error('[FEEDBACK-LERNENDE-MAIL]', err)
    }
  }

  return NextResponse.json(rows[0])
}

// DELETE — Feedback löschen
export async function DELETE(req: Request) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const lernendeId = searchParams.get('lernendeId')
  const typ = searchParams.get('typ')
  if (!lernendeId || !typ) return NextResponse.json({ fehler: 'Parameter fehlen' }, { status: 400 })

  await pool.query(
    'DELETE FROM feedback WHERE lernende_id = $1 AND lehrperson_id = $2 AND typ = $3',
    [lernendeId, lehrpersonId, typ]
  )
  return new NextResponse(null, { status: 204 })
}
