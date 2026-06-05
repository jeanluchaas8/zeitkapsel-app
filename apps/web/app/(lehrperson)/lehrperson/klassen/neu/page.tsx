import Link from 'next/link'
import { getSchuljahresenden } from '@/lib/api'
import { pool } from '@/lib/db'
import { auth } from '@/auth'
import { NeueKlasseFormular } from './NeueKlasseFormular'
import KlassenAuswahl from './KlassenAuswahl'

export default async function NeueKlasseSeite() {
  const session = await auth()
  const lehrpersonId = (session?.user as { id?: string } | undefined)?.id ?? ''

  const [schuljahresenden, { rows: alleKlassen }, { rows: meineKlassen }] = await Promise.all([
    getSchuljahresenden(),
    pool.query<{ id: string; bezeichnung: string; beruf: string; lehrstart: string; lehrabschluss: string }>(
      `SELECT id, bezeichnung, beruf, lehrstart, lehrabschluss
       FROM klasse
       ORDER BY bezeichnung`
    ),
    pool.query<{ klasse_id: string }>(
      `SELECT klasse_id FROM klasse_lehrperson WHERE lehrperson_id = $1`,
      [lehrpersonId]
    ),
  ])

  const meineIds = new Set(meineKlassen.map(r => r.klasse_id))
  const verfuegbar = alleKlassen.filter(k => !meineIds.has(k.id))

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-1">Klasse hinzufügen</h1>
      </div>

      {/* Bestehende Klassen auswählen */}
      {verfuegbar.length > 0 ? (
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-stone-800">Bestehende Klasse wählen</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Wähle deine Klasse aus der Liste – sie wurde bereits vom Admin importiert.
            </p>
          </div>
          <KlassenAuswahl klassen={verfuegbar} />
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
          Alle verfügbaren Klassen sind bereits deinem Konto zugewiesen.
        </div>
      )}

      {/* Trennlinie */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400 uppercase tracking-wide">oder manuell erfassen</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* Manuelle Erfassung */}
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-stone-800">Neue Klasse manuell erstellen</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Falls deine Klasse nicht in der Liste steht.
          </p>
        </div>
        <NeueKlasseFormular schuljahresenden={schuljahresenden} />
      </div>
    </div>
  )
}
