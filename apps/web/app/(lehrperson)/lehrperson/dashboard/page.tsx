import Link from 'next/link'
import { getLehrpersonId, quizStichtag } from '@/lib/api'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'
import { QuizPanel } from './QuizPanel'
import { HandlungsbedarfPanel } from './HandlungsbedarfPanel'
import { DashboardTabs } from './DashboardTabs'
import { RanglistePanel } from './RanglistePanel'


export default async function DashboardSeite() {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/admin')

  // Ausstehende Jahresfeedback-Anfragen — NICHT für das letzte Lehrjahr
  const { rows: jahresFeedbacks } = await pool.query(`
    SELECT f.id, f.typ, f.anfrage_text, f.lernende_id,
           l.vorname, l.nachname, k.bezeichnung AS klasse,
           ROUND(EXTRACT(EPOCH FROM AGE(k.lehrabschluss, k.lehrstart)) / (365.25 * 86400))::INT AS lehrdauer
    FROM feedback f
    JOIN lernende l ON l.id = f.lernende_id
    JOIN klasse k ON k.id = l.klasse_id
    JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
    WHERE kl.lehrperson_id = $1 AND f.lehrperson_id = $1
      AND f.status = 'angefragt' AND f.typ LIKE 'lehrjahr_%'
      -- Letztes Lehrjahr ausschliessen (korrekte Epoch-Berechnung)
      AND f.typ != 'lehrjahr_' || ROUND(EXTRACT(EPOCH FROM AGE(k.lehrabschluss, k.lehrstart)) / (365.25 * 86400))::TEXT
    ORDER BY l.nachname, f.typ
  `, [lehrpersonId])

  // Ausstehende Abschluss-Feedbacks (noch nicht geschrieben, Abschluss ≤90 Tage)
  const { rows: abschlussFeedbacks } = await pool.query(`
    SELECT l.id AS lernende_id, l.vorname, l.nachname, k.bezeichnung AS klasse, k.lehrabschluss
    FROM lernende l
    JOIN klasse k ON k.id = l.klasse_id
    JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
    WHERE kl.lehrperson_id = $1
      AND l.ausgetreten_am IS NULL
      AND k.lehrabschluss <= NOW() + INTERVAL '90 days'
      AND NOT EXISTS (
        SELECT 1 FROM feedback f
        WHERE f.lernende_id = l.id AND f.lehrperson_id = $1
          AND f.typ = 'abschluss' AND f.status = 'geschrieben'
      )
    ORDER BY k.lehrabschluss, l.nachname
  `, [lehrpersonId])

  const { rows: klassen } = await pool.query(`
    SELECT k.id, k.bezeichnung, k.beruf, k.lehrabschluss,
           COUNT(l.id)::INT AS anzahl_lernende
    FROM klasse k
    JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
    LEFT JOIN lernende l ON l.klasse_id = k.id AND l.ausgetreten_am IS NULL
    WHERE kl.lehrperson_id = $1
    GROUP BY k.id
    ORDER BY k.lehrabschluss DESC
  `, [lehrpersonId])


  const jetzt = new Date()
  const aktiveKlassen = klassen.filter((k) => new Date(k.lehrabschluss as string) >= jetzt)
  const inaktiveKlassen = klassen.filter((k) => new Date(k.lehrabschluss as string) < jetzt)

  const feedbacksAnzahl = jahresFeedbacks.length + abschlussFeedbacks.length

  // ── Rangliste: aktuelles Schuljahr ────────────────────────────────────
  const { rows: schuljahrRows } = await pool.query(`
    WITH aktuelles_sj AS (
      SELECT schuljahr FROM schulferien
      WHERE bezeichnung = 'Schuljahresbeginn' AND beginn <= $1::date
      ORDER BY beginn DESC LIMIT 1
    )
    SELECT sb.beginn AS sj_beginn, sf.beginn AS sf_beginn, sb.schuljahr
    FROM schulferien sb
    JOIN schulferien sf ON sf.schuljahr = sb.schuljahr AND sf.bezeichnung = 'Sommerferien'
    WHERE sb.bezeichnung = 'Schuljahresbeginn'
      AND sb.schuljahr = (SELECT schuljahr FROM aktuelles_sj)
  `, [jetzt.toISOString().slice(0, 10)])

  const sjBeginn: Date | null = schuljahrRows[0] ? new Date(schuljahrRows[0].sj_beginn as string) : null
  const sfBeginn: Date | null = schuljahrRows[0] ? new Date(schuljahrRows[0].sf_beginn as string) : null
  const stichtag: Date | null = sfBeginn ? quizStichtag(sfBeginn) : null
  const schuljahr = schuljahrRows[0]?.schuljahr as string ?? ''

  const { rows: ranglistePunkte } = await pool.query(`
    SELECT
      k.id AS klasse_id, k.bezeichnung AS klasse,
      l.id AS lernende_id, l.vorname, l.nachname, l.avatar_seed, l.avatar_url,
      COALESCE(SUM(CASE
        WHEN ($2::timestamptz IS NULL OR qe.durchgefuehrt_am >= $2)
         AND ($3::timestamptz IS NULL OR qe.durchgefuehrt_am <= $3)
        THEN qe.punkte ELSE 0
      END), 0)::INT AS quiz_punkte
    FROM klasse k
    JOIN klasse_lehrperson kl ON kl.klasse_id = k.id AND kl.lehrperson_id = $1
    JOIN lernende l ON l.klasse_id = k.id AND l.ausgetreten_am IS NULL
    LEFT JOIN quiz_anmeldung qa ON qa.lernende_id = l.id
    LEFT JOIN quiz_ergebnis qe ON qe.anmeldung_id = qa.id
    GROUP BY k.id, k.bezeichnung, l.id, l.vorname, l.nachname, l.avatar_seed, l.avatar_url
    ORDER BY k.bezeichnung, quiz_punkte DESC
  `, [lehrpersonId, sjBeginn?.toISOString() ?? null, stichtag?.toISOString() ?? null])

  // Nach Klassen gruppieren + ranken
  type RLernender = { lernende_id: string; vorname: string; nachname: string; avatar_seed: string; avatar_url: string; quiz_punkte: number; rang: number }
  type RKlasse = { klasse_id: string; klasse: string; lernende: RLernender[] }
  const rlKlassenMap = new Map<string, RKlasse>()
  for (const row of ranglistePunkte) {
    const kid = row.klasse_id as string
    if (!rlKlassenMap.has(kid)) rlKlassenMap.set(kid, { klasse_id: kid, klasse: row.klasse as string, lernende: [] })
    rlKlassenMap.get(kid)!.lernende.push({ lernende_id: row.lernende_id as string, vorname: row.vorname as string, nachname: row.nachname as string, avatar_seed: row.avatar_seed as string, avatar_url: row.avatar_url as string, quiz_punkte: row.quiz_punkte as number, rang: 0 })
  }
  const rlKlassen = [...rlKlassenMap.values()].map(k => {
    let prevP = -1, prevR = 0
    k.lernende = k.lernende.map(l => { if (l.quiz_punkte !== prevP) { prevR++; prevP = l.quiz_punkte } return { ...l, rang: prevR } })
    return k
  })

  return (
    <div className="space-y-6">
      {/* ── Seitentitel + Aktionen ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/lehrperson/vorschau" className="btn-secondary text-sm">Brief-Vorschau</Link>
          <Link href="/lehrperson/klassen/neu" className="btn-primary">+ Neue Klasse</Link>
        </div>
      </div>

      <DashboardTabs
        feedbacksAnzahl={feedbacksAnzahl}

        rangliste={
          <RanglistePanel klassen={rlKlassen} schuljahr={schuljahr} stichtag={stichtag} />
        }

        klassen={
          klassen.length === 0 ? (
            <div className="card text-center py-10 text-stone-500">
              Noch keine Klassen.{' '}
              <Link href="/lehrperson/klassen/neu" className="underline">Jetzt erstellen</Link>
            </div>
          ) : (
            <div className="space-y-5">
              {aktiveKlassen.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Aktiv ({aktiveKlassen.length})
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {aktiveKlassen.map((k) => {
                      const abschluss = new Date(k.lehrabschluss as string)
                      const tageNoch = Math.ceil((abschluss.getTime() - Date.now()) / 86400000)
                      return (
                        <Link key={k.id as string} href={`/lehrperson/klassen/${k.id as string}`}
                          className="card hover:border-stone-400 transition-colors block">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{k.bezeichnung as string}</p>
                              <p className="text-sm text-stone-500">{k.beruf as string}</p>
                            </div>
                            <span className={`text-xs rounded-full px-2 py-0.5 ${tageNoch <= 28 ? 'bg-orange-100 text-orange-800' : 'bg-stone-100 text-stone-600'}`}>
                              {tageNoch} Tage
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-stone-400">
                            {k.anzahl_lernende as number} Lernende · Abschluss {new Date(k.lehrabschluss as string).toLocaleDateString('de-CH')}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
              {inaktiveKlassen.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Abgeschlossen ({inaktiveKlassen.length})
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {inaktiveKlassen.map((k) => (
                      <Link key={k.id as string} href={`/lehrperson/klassen/${k.id as string}`}
                        className="card hover:border-stone-400 transition-colors block opacity-60">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{k.bezeichnung as string}</p>
                            <p className="text-sm text-stone-500">{k.beruf as string}</p>
                          </div>
                          <span className="text-xs rounded-full px-2 py-0.5 bg-stone-100 text-stone-500">
                            Abgeschlossen
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-400">
                          {k.anzahl_lernende as number} Lernende · {new Date(k.lehrabschluss as string).toLocaleDateString('de-CH')}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        }

        quiz={
          aktiveKlassen.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">Keine aktiven Klassen.</p>
          ) : (
            <div className="space-y-4">
              {aktiveKlassen.map((k) => (
                <QuizPanel key={k.id as string} klasseId={k.id as string} klasseBezeichnung={k.bezeichnung as string} />
              ))}
            </div>
          )
        }

        feedbacks={
          <HandlungsbedarfPanel
            jahresFeedbacks={jahresFeedbacks as Array<{id:string;typ:string;anfrage_text:string;lernende_id:string;vorname:string;nachname:string;klasse:string}>}
            abschlussFeedbacks={abschlussFeedbacks as Array<{lernende_id:string;vorname:string;nachname:string;klasse:string;lehrabschluss:string}>}
          />
        }
      />
    </div>
  )
}
