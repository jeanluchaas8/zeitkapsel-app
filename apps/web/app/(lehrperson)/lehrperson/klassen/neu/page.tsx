import Link from 'next/link'
import { getSchuljahresenden } from '@/lib/api'
import { pool } from '@/lib/db'
import { auth } from '@/auth'
import { NeueKlasseFormular } from './NeueKlasseFormular'

export default async function NeueKlasseSeite() {
  const session = await auth()
  const lehrpersonId = (session?.user as { id?: string } | undefined)?.id ?? ''

  const [schuljahresenden, { rows: alleKlassen }, { rows: meineKlassen }] = await Promise.all([
    getSchuljahresenden(),
    pool.query<{ id: string; bezeichnung: string; beruf: string; lehrstart: string; lehrabschluss: string }>(
      `SELECT id, bezeichnung, beruf, lehrstart, lehrabschluss FROM klasse ORDER BY bezeichnung`
    ),
    pool.query<{ klasse_id: string }>(
      `SELECT klasse_id FROM klasse_lehrperson WHERE lehrperson_id = $1`,
      [lehrpersonId]
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

      <NeueKlasseFormular schuljahresenden={schuljahresenden} verfuegbareKlassen={verfuegbar} />
    </div>
  )
}
