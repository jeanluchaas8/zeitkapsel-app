import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  vorname:    z.string().min(1),
  nachname:   z.string().min(1),
  email:      z.string().email(),
  passwort:   z.string().min(8),
  fachbereich: z.enum(['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']),
  beruf_id:   z.string().uuid().optional().or(z.literal('')),
})

export async function POST(req: Request) {
  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) {
    return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })
  }

  const d = eingabe.data

  // Beruf nur prüfen wenn Berufskunde gewählt
  let berufBezeichnung = ''
  if (d.fachbereich === 'Berufskunde') {
    if (!d.beruf_id) return NextResponse.json({ fehler: 'Bitte wähle einen Beruf.' }, { status: 400 })
    const { rows: berufRows } = await pool.query(
      'SELECT bezeichnung FROM berufe WHERE id = $1 AND aktiv = TRUE',
      [d.beruf_id]
    )
    if (!berufRows[0]) return NextResponse.json({ fehler: 'Ungültiger Beruf' }, { status: 400 })
    berufBezeichnung = (berufRows[0] as { bezeichnung: string }).bezeichnung
  }

  const { rows: schulen } = await pool.query('SELECT id FROM schule LIMIT 1')
  if (!schulen[0]) return NextResponse.json({ fehler: 'Keine Schule konfiguriert' }, { status: 400 })

  try {
    await pool.query(
      `INSERT INTO lehrperson (schule_id, vorname, nachname, email, fachbereich, beruf_id, passwort_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, crypt($7, gen_salt('bf')), 'pending')`,
      [schulen[0].id, d.vorname, d.nachname, d.email, d.fachbereich, d.beruf_id || null, d.passwort]
    )
  } catch {
    return NextResponse.json({ fehler: 'Diese E-Mail-Adresse ist bereits registriert.' }, { status: 409 })
  }

  // Admin-Benachrichtigung senden
  try {
    const { rows: admins } = await pool.query(
      'SELECT email, vorname FROM lehrperson WHERE ist_admin = TRUE AND status = $1',
      ['aktiv']
    )
    if (admins.length > 0) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'

      for (const admin of admins as Array<{ email: string; vorname: string }>) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
          to: admin.email,
          subject: 'Neue Lehrperson wartet auf Bestätigung',
          html: `
            <p>Hallo ${admin.vorname}</p>
            <p><strong>${d.vorname} ${d.nachname}</strong> (${d.email}) hat sich als Lehrperson registriert und wartet auf Bestätigung.</p>
            <p>Fachbereich: ${d.fachbereich}${berufBezeichnung ? ` · Beruf: ${berufBezeichnung}` : ''}</p>
            <p>
              <a href="${baseUrl}/admin/lehrpersonen"
                 style="display:inline-block;background:#1c1917;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:500">
                Jetzt bestätigen
              </a>
            </p>
          `,
        })
      }
    }
  } catch (err) {
    console.error('[REGISTRIERUNG] Admin-Mail Fehler:', err)
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
