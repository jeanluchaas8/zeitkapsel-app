import Link from 'next/link'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { Rolle } from '@/lib/typen'
import { quizStichtag, avatarUrl as avatarUrlFn } from '@/lib/api'

export default async function AdminRanglisteSeite({
  searchParams,
}: {
  searchParams: { schuljahr?: string }
}) {
  const session = await auth()
  if ((session?.user as { rolle?: Rolle })?.rolle !== 'admin') redirect('/anmelden')

  const jetzt = new Date()

  // ── Alle verfügbaren Schuljahre ────────────────────────────────────────
  const { rows: alleJahreRows } = await pool.query(`
    SELECT DISTINCT sb.schuljahr
    FROM schulferien sb
    JOIN schulferien sf ON sf.schuljahr = sb.schuljahr AND sf.bezeichnung = 'Sommerferien'
    WHERE sb.bezeichnung = 'Schuljahresbeginn'
    ORDER BY sb.schuljahr DESC
  `)
  const alleSchuljahre = alleJahreRows.map(r => r.schuljahr as string)

  // Aktuelles Schuljahr
  const { rows: aktuellesRows } = await pool.query(`
    SELECT schuljahr FROM schulferien
    WHERE bezeichnung = 'Schuljahresbeginn' AND beginn <= $1::date
    ORDER BY beginn DESC LIMIT 1
  `, [jetzt.toISOString().slice(0, 10)])
  const aktuellesSchuljahr = (aktuellesRows[0]?.schuljahr as string) ?? alleSchuljahre[0] ?? ''

  const gewaehltes = searchParams.schuljahr && alleSchuljahre.includes(searchParams.schuljahr)
    ? searchParams.schuljahr
    : aktuellesSchuljahr

  // Schuljahr-Fenster
  const { rows: schuljahrRows } = await pool.query(`
    SELECT sb.beginn AS sj_beginn, sf.beginn AS sf_beginn
    FROM schulferien sb
    JOIN schulferien sf ON sf.schuljahr = sb.schuljahr AND sf.bezeichnung = 'Sommerferien'
    WHERE sb.bezeichnung = 'Schuljahresbeginn' AND sb.schuljahr = $1
  `, [gewaehltes])

  const sjBeginn: Date | null = schuljahrRows[0] ? new Date(schuljahrRows[0].sj_beginn as string) : null
  const sfBeginn: Date | null = schuljahrRows[0] ? new Date(schuljahrRows[0].sf_beginn as string) : null
  const stichtag: Date | null = sfBeginn ? quizStichtag(sfBeginn) : null
  const istAbgelaufen = stichtag ? jetzt > stichtag : false

  // ── Alle Klassen mit Lernenden + Quiz-Punkten ─────────────────────────
  const { rows: punkte } = await pool.query(`
    SELECT
      k.id AS klasse_id,
      k.bezeichnung AS klasse,
      k.beruf,
      l.id AS lernende_id,
      l.vorname,
      l.nachname,
      l.avatar_seed,
      l.avatar_url,
      COALESCE(SUM(CASE
        WHEN ($1::timestamptz IS NULL OR qe.durchgefuehrt_am >= $1)
         AND ($2::timestamptz IS NULL OR qe.durchgefuehrt_am <= $2)
        THEN qe.punkte ELSE 0
      END), 0)::INT AS quiz_punkte
    FROM klasse k
    JOIN lernende l ON l.klasse_id = k.id AND l.ausgetreten_am IS NULL
    LEFT JOIN quiz_anmeldung qa ON qa.lernende_id = l.id
    LEFT JOIN quiz_ergebnis qe ON qe.anmeldung_id = qa.id
    GROUP BY k.id, k.bezeichnung, k.beruf, l.id, l.vorname, l.nachname, l.avatar_seed, l.avatar_url
    ORDER BY k.bezeichnung, quiz_punkte DESC
  `, [
    sjBeginn?.toISOString() ?? null,
    stichtag?.toISOString() ?? null,
  ])

  // Nach Klassen gruppieren
  type Lernender = {
    lernende_id: string
    vorname: string
    nachname: string
    avatar_seed: string
    avatar_url: string
    quiz_punkte: number
    rang: number
  }
  type Klasse = {
    klasse_id: string
    klasse: string
    beruf: string
    lernende: Lernender[]
    gesamtPunkte: number
  }

  const klassenMap = new Map<string, Klasse>()
  for (const row of punkte) {
    const kid = row.klasse_id as string
    if (!klassenMap.has(kid)) {
      klassenMap.set(kid, {
        klasse_id: kid,
        klasse: row.klasse as string,
        beruf: row.beruf as string,
        lernende: [],
        gesamtPunkte: 0,
      })
    }
    const k = klassenMap.get(kid)!
    k.lernende.push({
      lernende_id: row.lernende_id as string,
      vorname: row.vorname as string,
      nachname: row.nachname as string,
      avatar_seed: row.avatar_seed as string,
      avatar_url: row.avatar_url as string,
      quiz_punkte: row.quiz_punkte as number,
      rang: 0,
    })
    k.gesamtPunkte += row.quiz_punkte as number
  }

  // Rang pro Klasse berechnen + sortieren
  const klassen = [...klassenMap.values()].map(k => {
    k.lernende.sort((a, b) => b.quiz_punkte - a.quiz_punkte)
    let prevP = -1, prevR = 0
    k.lernende = k.lernende.map(l => {
      if (l.quiz_punkte !== prevP) { prevR++; prevP = l.quiz_punkte }
      return { ...l, rang: prevR }
    })
    return k
  }).sort((a, b) => a.klasse.localeCompare(b.klasse))

  const podestEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}.`

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-1">Quiz-Ranglisten 🏆</h1>
        <p className="text-sm text-stone-500 mt-1">Alle Klassen im Überblick</p>
      </div>

      {/* Schuljahr-Auswahl */}
      {alleSchuljahre.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-400 font-medium">Schuljahr:</span>
          <div className="flex gap-1 flex-wrap">
            {alleSchuljahre.map(sj => (
              <Link
                key={sj}
                href={`/admin/rangliste?schuljahr=${encodeURIComponent(sj)}`}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  sj === gewaehltes
                    ? 'bg-indigo-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {sj}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status-Banner */}
      {stichtag && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 text-sm ${
          istAbgelaufen
            ? 'bg-stone-50 border-stone-200 text-stone-600'
            : 'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          <span className="text-lg">{istAbgelaufen ? '🏁' : '🗓️'}</span>
          <span>
            <strong>Schuljahr {gewaehltes}</strong>
            {istAbgelaufen
              ? ` — Wettbewerb abgeschlossen am ${stichtag.toLocaleDateString('de-CH')}`
              : ` — Stichtag ${stichtag.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })}`
            }
          </span>
        </div>
      )}

      {/* Klassen-Karten */}
      <div className="grid gap-4 sm:grid-cols-2">
        {klassen.map(k => {
          const top3 = k.lernende.slice(0, 3)
          const rest = k.lernende.slice(3)
          const hatPunkte = k.gesamtPunkte > 0

          return (
            <div key={k.klasse_id} className="card space-y-4">
              {/* Klassen-Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-lg">{k.klasse}</h2>
                  <p className="text-xs text-stone-400">{k.beruf}</p>
                </div>
                <Link
                  href={`/admin/klassen/${k.klasse_id}`}
                  className="text-xs text-stone-400 hover:text-indigo-600 transition-colors"
                >
                  Details →
                </Link>
              </div>

              {!hatPunkte ? (
                <p className="text-sm text-stone-400 text-center py-2">Noch keine Quiz-Punkte</p>
              ) : (
                <>
                  {/* Podest Top 3 */}
                  <div className="space-y-2">
                    {top3.map(l => (
                      <div key={l.lernende_id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                        l.rang === 1 ? 'bg-yellow-50 border border-yellow-200' :
                        l.rang === 2 ? 'bg-stone-50 border border-stone-200' :
                        l.rang === 3 ? 'bg-orange-50 border border-orange-100' : ''
                      }`}>
                        <span className="text-base w-6 text-center flex-shrink-0">
                          {podestEmoji(l.rang)}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatarUrlFn(l.avatar_seed, l.avatar_url, l.vorname)}
                          alt=""
                          className="w-7 h-7 rounded-full border border-stone-200 bg-stone-50 object-cover flex-shrink-0"
                        />
                        <span className="flex-1 text-sm font-medium truncate">
                          {l.vorname} {l.nachname}
                        </span>
                        <span className="text-sm font-bold text-indigo-600 flex-shrink-0">
                          {l.quiz_punkte} Pt.
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Rest kompakt */}
                  {rest.length > 0 && (
                    <div className="border-t border-stone-100 pt-2 space-y-1">
                      {rest.map(l => (
                        <div key={l.lernende_id} className="flex items-center gap-2 px-1 py-0.5">
                          <span className="text-xs text-stone-400 w-5 text-right">{l.rang}.</span>
                          <span className="flex-1 text-xs text-stone-600 truncate">
                            {l.vorname} {l.nachname}
                          </span>
                          <span className="text-xs text-stone-500">{l.quiz_punkte} Pt.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Footer: Link zur Detailrangliste */}
              <div className="border-t border-stone-100 pt-3">
                <Link
                  href={`/lehrperson/klassen/${k.klasse_id}/rangliste?schuljahr=${encodeURIComponent(gewaehltes)}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Detailrangliste ansehen →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {klassen.length === 0 && (
        <div className="card text-center py-12 text-stone-400">
          Keine Klassen gefunden.
        </div>
      )}
    </div>
  )
}
