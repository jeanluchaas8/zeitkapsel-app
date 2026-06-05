import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

const schema = z.object({ status: z.enum(['aktiv', 'abgelehnt']) })

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const eingabe = schema.safeParse(await req.json())
  if (!eingabe.success) return NextResponse.json({ fehler: 'Ungültige Eingabe' }, { status: 400 })

  const { rows } = await pool.query(
    'UPDATE lehrperson SET status = $1 WHERE id = $2 RETURNING id, vorname, nachname, email, status',
    [eingabe.data.status, params.id]
  )
  if (!rows[0]) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })

  const lp = rows[0] as { vorname: string; nachname: string; email: string; status: string }

  // Benachrichtigung an die Lehrperson
  if (eingabe.data.status === 'aktiv') {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
        to: lp.email,
        subject: 'Dein Zeitkapsel-Konto wurde bestätigt',
        html: `
          <p>Hallo ${lp.vorname}</p>
          <p>Dein Konto bei Zeitkapsel wurde bestätigt. Du kannst dich jetzt anmelden.</p>
          <p>
            <a href="${process.env.AUTH_URL ?? 'http://localhost:3000'}/anmelden"
               style="display:inline-block;background:#1c1917;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:500">
              Jetzt anmelden
            </a>
          </p>
        `,
      })
    } catch (err) {
      console.error('[BESTAETIGUNG] Mail-Fehler:', err)
    }
  }

  return NextResponse.json(rows[0])
}
