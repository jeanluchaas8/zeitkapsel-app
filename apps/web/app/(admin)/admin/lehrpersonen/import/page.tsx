import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { pool } from '@/lib/db'
import type { Rolle } from '@/lib/typen'
import LehrpersonenImportForm from './LehrpersonenImportForm'

export default async function LehrpersonenImportSeite() {
  const session = await auth()
  if ((session?.user as { rolle?: Rolle } | undefined)?.rolle !== 'admin') redirect('/admin')

  const { rows: vorhanden } = await pool.query<{ email: string }>(
    'SELECT email FROM lehrperson'
  )
  const { rows: berufe } = await pool.query<{ id: string; bezeichnung: string }>(
    'SELECT id, bezeichnung FROM berufe ORDER BY bezeichnung'
  )

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/lehrpersonen" className="text-stone-400 hover:text-stone-900 text-sm">← Lehrpersonen</Link>
        <h1 className="text-2xl font-bold mt-1">Lehrpersonen importieren</h1>
        <p className="text-sm text-stone-500 mt-1">
          Lehrpersonen aus dem Schulnetz-Lehrpersonenplan SJ 2025/2026 auswählen und importieren.
        </p>
      </div>

      <LehrpersonenImportForm
        berufe={berufe}
        vorhandeneEmails={vorhanden.map(r => r.email)}
      />
    </div>
  )
}
