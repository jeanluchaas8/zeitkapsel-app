import { NextResponse } from 'next/server'
import { getLernendeId } from '@/lib/api'
import { pool } from '@/lib/db'
import { z } from 'zod'
import { Resend } from 'resend'

const schema = z.object({ lehrperson_id: z.string().uuid() })

export async function POST(req: Request) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  // Lernende/r und Lehrperson laden
  const { rows: lernRows } = await pool.query(
    'SELECT vorname, nachname FROM lernende WHERE id = $1', [lernendeId]
  )
  const { rows: lpRows } = await pool.query(
    'SELECT vorname, nachname, email FROM lehrperson WHERE id = $1 AND status = $2',
    [eingabe.data.lehrperson_id, 'aktiv']
  )
  if (!lernRows[0] || !lpRows[0]) {
    return NextResponse.json({ fehler: 'Person nicht gefunden' }, { status: 404 })
  }

  const lernende = lernRows[0] as { vorname: string; nachname: string }
  const lp = lpRows[0] as { vorname: string; nachname: string; email: string }

  // GIBZ-Zähler prüfen und erhöhen
  const { rows: briefRows } = await pool.query(
    'SELECT id, gibz_anzahl FROM brief WHERE lernende_id = $1', [lernendeId]
  )
  if (!briefRows[0]) return NextResponse.json({ fehler: 'Kein Brief gefunden' }, { status: 404 })
  const brief = briefRows[0] as { id: string; gibz_anzahl: number }
  if (brief.gibz_anzahl >= 2) {
    return NextResponse.json({ fehler: 'Limit erreicht' }, { status: 429 })
  }
  await pool.query('UPDATE brief SET gibz_anzahl = gibz_anzahl + 1 WHERE id = $1', [brief.id])

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
      to: lp.email,
      subject: `🎉 ${lernende.vorname} hat dich für ein Znüni ausgewählt!`,
      html: `
        <p>Hallo ${lp.vorname}</p>
        <p>
          Im Rahmen der Zeitkapsel-Überraschung hat <strong>${lernende.vorname} ${lernende.nachname}</strong>
          dich als Znüni-Patron/in ausgewählt! 🎉
        </p>
        <p>
          Gönn ${lernende.vorname} beim nächsten Treffen ein kleines Znüni —
          als Anerkennung dafür, dass er/sie seinen/ihren Brief an die Zukunft verfasst hat.
        </p>
        <p style="color:#888;font-size:12px;margin-top:16px">
          Diese Benachrichtigung wurde automatisch von Zeitkapsel gesendet.
        </p>
      `,
    })
  } catch (err) {
    console.error('[ZNUENI] Mail-Fehler:', err)
  }

  return NextResponse.json({
    ok: true,
    lehrpersonName: `${lp.vorname} ${lp.nachname}`,
  })
}
