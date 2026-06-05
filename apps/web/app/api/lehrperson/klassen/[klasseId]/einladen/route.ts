import { NextResponse } from 'next/server'
import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({
  vorname: z.string().min(1).max(100),
  nachname: z.string().min(1).max(100),
  email: z.string().email(),
})

export async function POST(
  req: Request,
  { params }: { params: { klasseId: string } }
) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { vorname, nachname, email } = eingabe.data

  // Prüfen ob LP Zugang zur Klasse hat
  const { rows: klasseRows } = await pool.query(`
    SELECT k.id, k.bezeichnung, lp.vorname AS lp_vorname, lp.nachname AS lp_nachname
    FROM klasse k
    JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
    JOIN lehrperson lp ON lp.id = $2
    WHERE k.id = $1 AND kl.lehrperson_id = $2
  `, [params.klasseId, lehrpersonId])

  if (!klasseRows[0]) return NextResponse.json({ fehler: 'Klasse nicht gefunden' }, { status: 404 })
  const klasse = klasseRows[0] as { id: string; bezeichnung: string; lp_vorname: string; lp_nachname: string }

  // Prüfen ob E-Mail bereits existiert
  const { rows: existing } = await pool.query(
    'SELECT id FROM lernende WHERE email = $1',
    [email.toLowerCase()]
  )
  if (existing[0]) return NextResponse.json({ fehler: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })

  // Lernende/n anlegen
  const { rows: neu } = await pool.query(`
    INSERT INTO lernende (vorname, nachname, email, klasse_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [vorname, nachname, email.toLowerCase(), params.klasseId])

  const lernendeId = (neu[0] as { id: string }).id

  // Brief-Eintrag erstellen
  await pool.query(
    `INSERT INTO brief (lernende_id, status) VALUES ($1, 'entwurf')`,
    [lernendeId]
  )

  // Einladungs-E-Mail senden
  const resendKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
  const webUrl = process.env.WEB_URL ?? 'http://localhost:3000'

  if (resendKey) {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: `Du wurdest zur Zeitkapsel eingeladen 🎓`,
      html: `
        <p>Hallo ${vorname}</p>
        <p>
          <strong>${klasse.lp_vorname} ${klasse.lp_nachname}</strong> hat dich zur Klasse
          <strong>${klasse.bezeichnung}</strong> in der Zeitkapsel-App eingeladen.
        </p>
        <p>
          Die Zeitkapsel begleitet dich durch deine Lehrzeit — du schreibst dir selbst einen Brief,
          der dir zu deinem Lehrabschluss zugestellt wird.
        </p>
        <p style="margin: 24px 0;">
          <a href="${webUrl}/anmelden" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Jetzt anmelden →
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">
          Melde dich mit deiner E-Mail-Adresse <strong>${email}</strong> an —
          du erhältst dann automatisch einen Anmeldelink per E-Mail.
        </p>
      `,
    })
  }

  return NextResponse.json({ ok: true, lernendeId })
}
