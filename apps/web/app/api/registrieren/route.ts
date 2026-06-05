import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const schema = z.object({
  vorname: z.string().min(1).max(100),
  nachname: z.string().min(1).max(100),
  email: z.string().email(),
  klasse_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { vorname, nachname, email, klasse_id } = eingabe.data

  // Klasse prüfen
  const { rows: klasseRows } = await pool.query(
    'SELECT id, lehrstart FROM klasse WHERE id = $1 AND lehrabschluss >= CURRENT_DATE',
    [klasse_id],
  )
  if (!klasseRows[0]) return NextResponse.json({ fehler: 'Klasse nicht gefunden' }, { status: 404 })

  // Lernende/r bereits registriert?
  const { rows: vorhanden } = await pool.query(
    'SELECT id FROM lernende WHERE email = $1', [email],
  )

  if (!vorhanden[0]) {
    // Neu registrieren
    try {
      await pool.query(
        `INSERT INTO lernende (klasse_id, vorname, nachname, email, beitritt_datum)
         VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
        [klasse_id, vorname, nachname, email],
      )
    } catch {
      return NextResponse.json({ fehler: 'E-Mail bereits vorhanden' }, { status: 409 })
    }
  }

  // Magic Link generieren und senden
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'

    // Verification Token erstellen
    const token = crypto.randomUUID().replace(/-/g, '')
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 Minuten
    await pool.query(
      `INSERT INTO verification_token (identifier, token, expires)
       VALUES ($1, $2, $3) ON CONFLICT (identifier, token) DO UPDATE SET expires = $3`,
      [email, token, expires],
    )

    const url = `${baseUrl}/api/auth/callback/resend?token=${token}&email=${encodeURIComponent(email)}&callbackUrl=/brief`

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
      to: email,
      subject: 'Willkommen bei Zeitkapsel — Jetzt anmelden',
      html: `
        <p>Hallo ${vorname}</p>
        <p>Deine Registrierung bei Zeitkapsel war erfolgreich! Klicke den Link um dich anzumelden und deinen Brief zu schreiben:</p>
        <p><a href="${url}">Jetzt anmelden →</a></p>
        <p>Der Link ist 10 Minuten gültig.</p>
      `,
    })
  } catch (err) {
    console.error('E-Mail-Versand fehlgeschlagen:', err)
    return NextResponse.json({ fehler: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
