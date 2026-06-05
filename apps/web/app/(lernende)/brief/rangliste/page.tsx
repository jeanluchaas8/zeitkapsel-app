import Link from 'next/link'
import { getLernendeId, getSchuljahrFenster, getRanglisteEintraege, avatarUrl, KM_BONUS } from '@/lib/api'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getKmProLernende } from '@/app/(lernende)/brief/standorteDB'
import { SchuljahrAuswahl } from '@/components/SchuljahrAuswahl'

export default async function LernendeRanglisteSeite({
  searchParams,
}: {
  searchParams: { schuljahr?: string }
}) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) redirect('/anmelden')

  const { rows: eigenRows } = await pool.query(
    'SELECT klasse_id FROM lernende WHERE id = $1', [lernendeId]
  )
  if (!eigenRows[0]) redirect('/brief')
  const klasseId = eigenRows[0].klasse_id as string

  const { rows: klasseRows } = await pool.query(
    'SELECT bezeichnung FROM klasse WHERE id = $1', [klasseId]
  )
  const klasseBezeichnung = (klasseRows[0]?.bezeichnung as string) ?? ''

  const sj = await getSchuljahrFenster(searchParams.schuljahr)
  const mitRang = await getRanglisteEintraege(klasseId, sj.sjBeginn, sj.stichtag, getKmProLernende)

  const eigenerEintrag = mitRang.find(r => r.id === lernendeId)
  const istAktuellesJahr = sj.gewaehltes === sj.aktuellesSchuljahr
  const podestEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : ''

  return (
    <div className="space-y-6">
      <div>
        <Link href="/brief" className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-4)' }}>
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold mt-1">Rangliste 🏆</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{klasseBezeichnung}</p>
      </div>

      <SchuljahrAuswahl schuljahre={sj.alleSchuljahre} aktiv={sj.gewaehltes} basePath="/brief/rangliste" />

      {/* Eigener Rang */}
      {eigenerEintrag && istAktuellesJahr && (
        <div className={`rounded-xl border-2 px-4 py-4 flex items-center gap-4 ${
          eigenerEintrag.rang <= 3 && eigenerEintrag.gesamt > 0
            ? 'border-yellow-300 bg-yellow-50'
            : 'border-indigo-200 bg-indigo-50'
        }`}>
          <span className="text-3xl">
            {podestEmoji(eigenerEintrag.rang) || `#${eigenerEintrag.rang}`}
          </span>
          <div className="flex-1">
            <p className="font-semibold text-sm">Dein aktueller Rang</p>
            <p className="text-xs text-stone-500 mt-0.5">
              {eigenerEintrag.gesamt} Punkte total
              {eigenerEintrag.km > 0 && ` · ${eigenerEintrag.km.toLocaleString('de-CH')} km`}
            </p>
          </div>
          {eigenerEintrag.rang <= 3 && eigenerEintrag.gesamt > 0 && (
            <span className="text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full px-2 py-1">
              Podest 🎉
            </span>
          )}
        </div>
      )}

      {/* Schuljahr-Info */}
      {sj.schuljahr && sj.stichtag && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 text-sm ${
          sj.istAbgelaufen
            ? 'bg-stone-50 border-stone-200 text-stone-600'
            : sj.tageNoch! <= 14
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          <span className="text-lg mt-0.5">{sj.istAbgelaufen ? '🏁' : '🗓️'}</span>
          <div>
            <p className="font-semibold">Schuljahr {sj.schuljahr}</p>
            <p className="text-xs mt-0.5 opacity-80">
              {sj.istAbgelaufen
                ? `Wettbewerb abgeschlossen am ${sj.stichtag.toLocaleDateString('de-CH')}`
                : `Stichtag ${sj.stichtag.toLocaleDateString('de-CH')} — noch ${sj.tageNoch} Tage`}
            </p>
          </div>
        </div>
      )}

      {/* Tabelle */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
            <tr>
              <th className="px-3 py-3 text-left font-medium w-12" style={{ color: 'var(--text-3)' }}>Rang</th>
              <th className="px-3 py-3 text-left font-medium" style={{ color: 'var(--text-3)' }}>Name</th>
              <th className="px-3 py-3 text-center font-medium" style={{ color: 'var(--text-3)' }}>Quiz</th>
              <th className="px-3 py-3 text-center font-medium hidden sm:table-cell" style={{ color: 'var(--text-3)' }}>Km 🛸</th>
              <th className="px-3 py-3 text-center font-bold" style={{ color: 'var(--text-2)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {mitRang.map((r) => {
              const istEigen = r.id === lernendeId
              const isPodest = r.rang <= 3 && r.gesamt > 0
              return (
                <tr key={r.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  className={istEigen ? 'bg-indigo-50 font-semibold' : isPodest ? 'bg-yellow-50' : ''}>
                  <td className="px-3 py-3 text-center text-lg">
                    {podestEmoji(r.rang) || <span className="text-sm" style={{ color: 'var(--text-4)' }}>{r.rang}</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl(r.avatar_seed, r.avatar_url, r.vorname)}
                        alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        style={{ border: '1px solid var(--border)' }} />
                      <span>
                        {r.vorname} {r.nachname}
                        {istEigen && <span className="ml-1.5 text-xs text-indigo-500 font-normal">(du)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center" style={{ color: 'var(--text-2)' }}>{r.quiz_punkte}</td>
                  <td className="px-3 py-3 text-center text-xs hidden sm:table-cell" style={{ color: 'var(--text-3)' }}>
                    {r.km > 0 ? r.km.toLocaleString('de-CH') + ' km' : '—'}
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-base text-indigo-600">{r.gesamt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {mitRang.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>Noch keine Punkte in dieser Klasse.</p>
        )}
      </div>

      {/* Legende */}
      <div className="rounded-xl px-4 py-3 text-xs space-y-1"
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
        <p><strong>Wie werden Punkte berechnet?</strong></p>
        <p>🎯 Richtige Antwort im Klassen-Quiz → Punkte gemäss Schwierigkeit</p>
        <p>🛸 Km-Bonus am Stichtag: 🥇 +{KM_BONUS[1]} · 🥈 +{KM_BONUS[2]} · 🥉 +{KM_BONUS[3]} für die weiteste Zeitkapsel-Reise</p>
      </div>
    </div>
  )
}
