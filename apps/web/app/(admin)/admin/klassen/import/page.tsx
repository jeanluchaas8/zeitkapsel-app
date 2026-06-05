import Link from 'next/link'
import { pool } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { Rolle } from '@/lib/typen'
import KlassenImportForm from './KlassenImportForm'

export default async function KlassenImportSeite() {
  const session = await auth()
  const rolle = (session?.user as { rolle?: Rolle } | undefined)?.rolle
  if (rolle !== 'admin') redirect('/admin')

  const { rows: berufe } = await pool.query<{ id: string; bezeichnung: string; lehrdauer: number }>(
    'SELECT id, bezeichnung, lehrdauer FROM berufe ORDER BY bezeichnung'
  )

  // Bereits importierte Klassen (um Duplikate zu markieren)
  const { rows: vorhanden } = await pool.query<{ bezeichnung: string }>(
    "SELECT bezeichnung FROM klasse"
  )
  const vorhandenSet = new Set(vorhanden.map(r => r.bezeichnung))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/klassen" className="text-stone-400 hover:text-stone-900 text-sm">← Klassen</Link>
        <h1 className="text-2xl font-bold mt-1">Klassen importieren</h1>
        <p className="text-sm text-stone-500 mt-1">
          Klassen aus dem Schulnetz-Klassenplan SJ 2025/2026 auswählen und importieren.
        </p>
      </div>

      <KlassenImportForm berufe={berufe} vorhandenSet={[...vorhandenSet]} />
    </div>
  )
}
