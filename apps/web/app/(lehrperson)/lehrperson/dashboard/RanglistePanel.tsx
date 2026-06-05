import Link from 'next/link'
import { avatarUrl } from '@/lib/api'

interface Lernender {
  lernende_id: string
  vorname: string
  nachname: string
  avatar_seed: string
  avatar_url: string
  quiz_punkte: number
  rang: number
}

interface Klasse {
  klasse_id: string
  klasse: string
  lernende: Lernender[]
}

interface Props {
  klassen: Klasse[]
  schuljahr: string
  stichtag: Date | null
}

const podestEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}.`

export function RanglistePanel({ klassen, schuljahr, stichtag }: Props) {
  if (klassen.length === 0) {
    return <p className="text-sm text-center py-8" style={{ color: 'var(--text-4)' }}>Keine Klassen vorhanden.</p>
  }

  return (
    <div className="space-y-4">
      {schuljahr && stichtag && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-indigo-800 flex items-center gap-2">
          <span>🗓️</span>
          <span><strong>Schuljahr {schuljahr}</strong> · Stichtag {stichtag.toLocaleDateString('de-CH')}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {klassen.map(k => {
          const top3 = k.lernende.slice(0, 3)
          const rest = k.lernende.slice(3)
          const hatPunkte = k.lernende[0]?.quiz_punkte > 0

          return (
            <div key={k.klasse_id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{k.klasse}</h3>
                <Link href={`/lehrperson/klassen/${k.klasse_id}/rangliste`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  Details →
                </Link>
              </div>

              {!hatPunkte ? (
                <p className="text-xs text-center py-1" style={{ color: 'var(--text-4)' }}>Noch keine Punkte</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {top3.map(l => (
                      <div key={l.lernende_id}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                          l.rang === 1 ? 'bg-yellow-50 border border-yellow-200'
                          : l.rang === 2 ? 'bg-stone-50 border border-stone-200'
                          : 'bg-orange-50 border border-orange-100'
                        }`}>
                        <span className="text-sm w-5 text-center">{podestEmoji(l.rang)}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl(l.avatar_seed, l.avatar_url, l.vorname)}
                          alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          style={{ border: '1px solid var(--border)' }} />
                        <span className="flex-1 text-sm truncate">{l.vorname} {l.nachname}</span>
                        <span className="text-sm font-bold text-indigo-600">{l.quiz_punkte} Pt.</span>
                      </div>
                    ))}
                  </div>

                  {rest.length > 0 && (
                    <div className="space-y-0.5 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      {rest.map(l => (
                        <div key={l.lernende_id} className="flex items-center gap-2 px-1">
                          <span className="text-xs w-5 text-right" style={{ color: 'var(--text-4)' }}>{l.rang}.</span>
                          <span className="flex-1 text-xs truncate" style={{ color: 'var(--text-3)' }}>{l.vorname} {l.nachname}</span>
                          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{l.quiz_punkte} Pt.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
