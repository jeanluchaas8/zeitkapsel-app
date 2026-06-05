import Link from 'next/link'
import { getLehrpersonId, getKonfiguration } from '@/lib/api'
import { redirect } from 'next/navigation'
import { pool } from '@/lib/db'
import { AnweisungenFormular } from './AnweisungenFormular'

export default async function AnweisungenSeite() {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const { rows } = await pool.query(
    'SELECT schluessel, bezeichnung, wert FROM konfiguration ORDER BY schluessel'
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-1">Anweisungen bearbeiten</h1>
        <p className="mt-1 text-stone-500 text-sm">
          Diese Texte sehen die Lernenden, wenn sie ihren Brief schreiben.{' '}
          <Link href="/lehrperson/vorschau" className="underline hover:text-stone-900">
            Vorschau anzeigen →
          </Link>
        </p>
      </div>

      <AnweisungenFormular konfiguration={rows as Array<{ schluessel: string; bezeichnung: string; wert: string }>} />
    </div>
  )
}
