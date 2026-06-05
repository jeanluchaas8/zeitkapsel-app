import { Resend } from 'resend'
import { pool } from '../db/pool.js'
import type { EmailTyp, EmailStatus } from '@zeitkapsel/shared'

// Lazy initialisiert — erst beim ersten Aufruf, damit .env bereits geladen ist
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}
const VON = () => process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch'

interface SendeOptionen {
  an: string
  betreff: string
  html: string
  anhaenge?: Array<{ dateiname: string; inhalt: Buffer }>
  lernendeId?: string
  lehrpersonId?: string
  typ: EmailTyp
}

// Sendet eine E-Mail und protokolliert das Ergebnis in email_log
export async function emailSenden(optionen: SendeOptionen): Promise<void> {
  let status: EmailStatus = 'gesendet'

  try {
    await getResend().emails.send({
      from: VON(),
      to: optionen.an,
      subject: optionen.betreff,
      html: optionen.html,
      attachments: optionen.anhaenge?.map((a) => ({
        filename: a.dateiname,
        content: a.inhalt,
      })),
    })
  } catch (err) {
    status = 'fehlgeschlagen'
    console.error(`E-Mail fehlgeschlagen (${optionen.typ} → ${optionen.an}):`, err)
  }

  await pool.query(
    `INSERT INTO email_log (lernende_id, lehrperson_id, typ, empfaenger, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [optionen.lernendeId ?? null, optionen.lehrpersonId ?? null, optionen.typ, optionen.an, status],
  )

  if (status === 'fehlgeschlagen') {
    throw new Error(`E-Mail-Versand fehlgeschlagen: ${optionen.an}`)
  }
}
