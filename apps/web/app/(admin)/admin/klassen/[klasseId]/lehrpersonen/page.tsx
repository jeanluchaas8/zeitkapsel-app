import { pool } from '@/lib/db'
import Link from 'next/link'
import { LehrpersonZuweisenFormular } from './LehrpersonZuweisenFormular'

export default async function KlasseLehrpersonenSeite({ params }: { params: { klasseId: string } }) {
  const { rows: klasse } = await pool.query(
    'SELECT id, bezeichnung, beruf FROM klasse WHERE id = $1', [params.klasseId],
  )
  if (!klasse[0]) return <div>Klasse nicht gefunden</div>

  const { rows: zugewiesen } = await pool.query(`
    SELECT lp.id, lp.vorname, lp.nachname, lp.fachbereich, lp.email
    FROM lehrperson lp
    JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
    WHERE kl.klasse_id = $1
    ORDER BY lp.nachname
  `, [params.klasseId])

  const { rows: alle } = await pool.query(`
    SELECT id, vorname, nachname, fachbereich, email FROM lehrperson
    ORDER BY nachname
  `)

  const zugewiesenIds = new Set(zugewiesen.map((l) => l.id as string))
  const verfuegbar = alle.filter((l) => !zugewiesenIds.has(l.id as string))

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/klassen" className="text-stone-400 hover:text-stone-900 text-sm">← Klassen</Link>
        <h1 className="text-2xl font-bold mt-1">
          {klasse[0].bezeichnung as string} — Lehrpersonen
        </h1>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Zugewiesene Lehrpersonen</h2>
        {zugewiesen.length === 0 ? (
          <p className="text-stone-400 text-sm">Noch keine Lehrpersonen zugewiesen.</p>
        ) : (
          <div className="space-y-2">
            {zugewiesen.map((lp) => (
              <div key={lp.id as string} className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{lp.vorname as string} {lp.nachname as string}</p>
                  <p className="text-xs text-stone-400">{lp.fachbereich as string} · {lp.email as string}</p>
                </div>
                <LehrpersonZuweisenFormular
                  klasseId={params.klasseId}
                  lehrpersonId={lp.id as string}
                  aktion="entfernen"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {verfuegbar.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Lehrperson hinzufügen</h2>
          <div className="space-y-2">
            {verfuegbar.map((lp) => (
              <div key={lp.id as string} className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{lp.vorname as string} {lp.nachname as string}</p>
                  <p className="text-xs text-stone-400">{lp.fachbereich as string} · {lp.email as string}</p>
                </div>
                <LehrpersonZuweisenFormular
                  klasseId={params.klasseId}
                  lehrpersonId={lp.id as string}
                  aktion="hinzufuegen"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
