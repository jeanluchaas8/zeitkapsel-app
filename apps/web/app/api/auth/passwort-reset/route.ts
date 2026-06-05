import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { createHmac } from 'crypto'

export async function POST(req: Request) {
  try {
    const { email, token, passwort } = await req.json() as {
      email: string; token: string; passwort: string
    }

    if (!passwort || passwort.length < 8) {
      return NextResponse.json({ fehler: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
    }

    const { rows } = await pool.query(
      'DELETE FROM verification_token WHERE identifier = $1 AND token = $2 AND expires > NOW() RETURNING *',
      [`reset:${email}`, token],
    )

    if (rows.length === 0) {
      return NextResponse.json({ fehler: 'Link ungültig oder abgelaufen' }, { status: 400 })
    }

    const hash = createHmac('sha256', process.env.AUTH_SECRET ?? '')
      .update(passwort)
      .digest('hex')

    await pool.query(
      'UPDATE lehrperson SET passwort_hash = $1 WHERE email = $2',
      [hash, email],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PASSWORT-RESET]', err)
    return NextResponse.json({ fehler: 'Interner Fehler' }, { status: 500 })
  }
}
