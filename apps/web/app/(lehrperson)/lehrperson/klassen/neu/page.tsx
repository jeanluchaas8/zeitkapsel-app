import Link from 'next/link'
import { pool } from '@/lib/db'
import { auth } from '@/auth'
import { NeueKlasseFormular } from './NeueKlasseFormular'

export default async function NeueKlasseSeite() {
  const session = await auth()
  const lehrpersonId = (session?.user as { id?: string } | undefined)?.id ?? ''

  const [{ rows: alleKlassen }, { rows: meineKlassen }, { rows: schulkalender }] = await Promise.all([
    pool.query<{ id: string; bezeichnung: string; beruf: string; lehrstart: string; lehrabschluss: string }>(
      `SELECT id, bezeichnung, beruf, lehrstart, lehrabschluss FROM klasse ORDER BY bezeichnung`
    ),
    pool.query<{ klasse_id: string }>(
      `SELECT klasse_id FROM klasse_lehrperson WHERE lehrperson_id = $1`,
      [lehrpersonId]
    ),
    pool.query<{ schuljahr: string; bezeichnung: string; beginn: string }>(
      `SELECT schuljahr, bezeichnung, beginn::text AS beginn
       FROM schulferien
       WHERE bezeichnung IN ('Schuljahresbeginn', 'Sommerferien')
       ORDER BY schuljahr, bezeichnung`
    ),
  ])

  const meineIds = new Set(meineKlassen.map(r => r.klasse_id))
  const verfuegbar = alleKlassen.filter(k => !meineIds.has(k.id))

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-1">Neue Klasse erfassen</h1>
      </div>

      <NeueKlasseFormular
        verfuegbareKlassen={verfuegbar}
        schulkalender={schulkalender}
      />
    </div>
  )
}
