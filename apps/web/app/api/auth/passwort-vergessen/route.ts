import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { email } = await req.json() as { email: string }

    // Nur Lehrpersonen können Passwort zurücksetzen
    const { rows } = await pool.query(
      'SELECT id, vorname FROM lehrperson WHERE email = $1',
      [email],
    )

    // Immer gleiche Antwort zurückgeben (verhindert E-Mail-Enumeration)
    if (rows.length === 0) {
      return NextResponse.json({ ok: true })
    }

    const lp = rows[0] as { id: string; vorname: string }

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 Stunde

    await pool.query(
      `INSERT INTO verification_token (identifier, token, expires)
       VALUES ($1, $2, $3)
       ON CONFLICT (identifier, token) DO UPDATE SET expires = $3`,
      [`reset:${email}`, token, expires],
    )

    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
    const resetUrl = `${baseUrl}/anmelden/passwort-reset?token=${token}&email=${encodeURIComponent(email)}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
      to: email,
      subject: 'Passwort zurücksetzen — Zeitkapsel',
      html: `
        <p>Hallo ${lp.vorname}</p>
        <p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p>
        <p><a href="${resetUrl}">Passwort zurücksetzen</a></p>
        <p>Der Link ist 1 Stunde gültig.</p>
        <p>Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PASSWORT-VERGESSEN]', err)
    return NextResponse.json({ fehler: 'Fehler beim Senden der E-Mail' }, { status: 500 })
  }
}
