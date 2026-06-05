import Link from 'next/link'
import { getLehrpersonId, getSchuljahrFenster, getRanglisteEintraege, avatarUrl, KM_BONUS } from '@/lib/api'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getKmProLernende } from '@/app/(lernende)/brief/standorteDB'
import { SchuljahrAuswahl } from '@/components/SchuljahrAuswahl'

export default async function RanglisteSeite({
  params,
  searchParams,
}: {
  params: { klasseId: string }
  searchParams: { schuljahr?: string }
}) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const { rows: klasseRows } = await pool.query(
    'SELECT bezeichnung FROM klasse WHERE id = $1', [params.klasseId]
  )
  if (!klasseRows[0]) redirect('/lehrperson/dashboard')
  const klasse = klasseRows[0] as { bezeichnung: string }

  const sj = await getSchuljahrFenster(searchParams.schuljahr)
  const mitRang = await getRanglisteEintraege(params.klasseId, sj.sjBeginn, sj.stichtag, getKmProLernende)

  const podestEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : ''
  const basePath = `/lehrperson/klassen/${params.klasseId}/rangliste`

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/lehrperson/klassen/${params.klasseId}`}
          className="text-sm transition-opacity hover:opacity-70" style={{ color: 'var(--text-4)' }}>
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold mt-1">Rangliste — {klasse.bezeichnung}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Wissens-Quiz + Km-Bonus für die meisten Reisekilometer
        </p>
      </div>

      <SchuljahrAuswahl schuljahre={sj.alleSchuljahre} aktiv={sj.gewaehltes} basePath={basePath} />

      {/* Schuljahr-Banner */}
      {sj.schuljahr && sj.stichtag && (
        <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
          sj.istAbgelaufen
            ? 'bg-stone-50 border-stone-200 text-stone-600'
            : sj.tageNoch! <= 14
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          <span className="text-xl mt-0.5">{sj.istAbgelaufen ? '🏁' : '🗓️'}</span>
          <div className="space-y-0.5 text-sm">
            <p className="font-semibold">Schuljahr {sj.schuljahr}</p>
            <p>
              {sj.istAbgelaufen
                ? `Wettbewerb abgeschlossen am ${sj.stichtag.toLocaleDateString('de-CH')}`
                : `Stichtag: ${sj.stichtag.toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
              }
              {!sj.istAbgelaufen && sj.tageNoch !== null && (
                <span className={`ml-2 font-medium ${sj.tageNoch <= 14 ? 'text-orange-700' : ''}`}>
                  — noch {sj.tageNoch} Tage
                </span>
              )}
            </p>
            <p className="text-xs opacity-70">
              Stichtag = zweitletzte Schulwoche vor den Sommerferien
            </p>
          </div>
        </div>
      )}

      {/* Legende */}
      <div className="rounded-xl px-4 py-3 text-xs space-y-1"
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
        <p><strong>Km-Bonuspunkte</strong> (Stichtag):</p>
        <p>🥇 Meiste Kilometer → +{KM_BONUS[1]} Punkte &nbsp;·&nbsp; 🥈 Zweite → +{KM_BONUS[2]} &nbsp;·&nbsp; 🥉 Dritte → +{KM_BONUS[3]}</p>
      </div>

      {/* Tabelle */}
      <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium w-12" style={{ color: 'var(--text-3)' }}>Rang</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-3)' }}>Name</th>
              <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-3)' }}>Quiz</th>
              <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-3)' }}>Km 🛸</th>
              <th className="px-4 py-3 text-center font-medium" style={{ color: 'var(--text-3)' }}>Km-Bonus</th>
              <th className="px-4 py-3 text-center font-bold" style={{ color: 'var(--text-2)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {mitRang.map((r) => {
              const isPodest = r.rang <= 3 && r.gesamt > 0
              return (
                <tr key={r.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  className={isPodest ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                  <td className="px-4 py-3 text-center text-lg">
                    {podestEmoji(r.rang) || <span className="text-sm" style={{ color: 'var(--text-4)' }}>{r.rang}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl(r.avatar_seed, r.avatar_url, r.vorname)}
                        alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        style={{ border: '1px solid var(--border)' }} />
                      <span className="font-medium">{r.vorname} {r.nachname}</span>
                      {r.kmRang <= 3 && r.km > 0 && (
                        <span className="text-xs text-indigo-500">
                          {r.kmRang === 1 ? '🛸 Weiteste Reise' : r.kmRang === 2 ? '🛸 2.' : '🛸 3.'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: 'var(--text-2)' }}>{r.quiz_punkte}</td>
                  <td className="px-4 py-3 text-center text-xs" style={{ color: 'var(--text-3)' }}>
                    {r.km > 0 ? r.km.toLocaleString('de-CH') + ' km' : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.kmBonus > 0 ? (
                      <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5">
                        +{r.kmBonus}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-base text-indigo-600">{r.gesamt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {mitRang.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>Noch keine Daten vorhanden.</p>
        )}
      </div>

      {mitRang[0]?.gesamt > 0 && !sj.istAbgelaufen && sj.stichtag && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            🎁 <strong>Am Stichtag {sj.stichtag.toLocaleDateString('de-CH')}</strong> erhalten die Lernenden auf dem Podest eine Überraschung!
          </p>
        </div>
      )}
      {mitRang[0]?.gesamt > 0 && sj.istAbgelaufen && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">
            🏆 Der Wettbewerb Schuljahr {sj.schuljahr} ist abgeschlossen. Das ist das Endergebnis.
          </p>
        </div>
      )}
    </div>
  )
}
