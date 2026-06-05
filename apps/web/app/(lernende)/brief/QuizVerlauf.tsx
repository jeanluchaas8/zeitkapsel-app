import { pool } from '@/lib/db'

interface Props {
  lernendeId: string
}

export async function QuizVerlauf({ lernendeId }: Props) {
  const { rows } = await pool.query(`
    SELECT
      qe.korrekt,
      qe.punkte,
      qe.durchgefuehrt_am,
      qa.woche,
      qa.jahr,
      ks.ort,
      ks.land,
      ks.emoji,
      kq.frage,
      kq.richtig          AS richtige_antwort,
      qe.gewaehlte_antwort,
      CASE kq.richtig
        WHEN 'a' THEN kq.antwort_a
        WHEN 'b' THEN kq.antwort_b
        WHEN 'c' THEN kq.antwort_c
        WHEN 'd' THEN kq.antwort_d
      END AS richtige_antwort_text
    FROM quiz_ergebnis qe
    JOIN quiz_anmeldung qa  ON qa.id = qe.anmeldung_id
    JOIN kapsel_standorte ks ON ks.id = qa.standort_id
    LEFT JOIN kapsel_quiz kq ON kq.standort_id = qa.standort_id
    WHERE qa.lernende_id = $1
    ORDER BY qe.durchgefuehrt_am DESC
  `, [lernendeId])

  if (rows.length === 0) return null

  const gesamtPunkte = rows.reduce((s, r) => s + (r.punkte as number), 0)
  const richtigAnzahl = rows.filter(r => r.korrekt).length

  return (
    <div className="space-y-3">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Deine Quiz-Runden</h3>
        <span className="text-xs text-stone-400">
          {rows.length} Runden · {richtigAnzahl} richtig · {gesamtPunkte} Punkte total
        </span>
      </div>

      {/* Verlauf */}
      <div className="space-y-2">
        {rows.map((r, i) => {
          const datum = new Date(r.durchgefuehrt_am as string)
          const datumStr = datum.toLocaleDateString('de-CH', {
            day: 'numeric', month: 'short', year: 'numeric',
          })

          return (
            <div key={i} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
              r.korrekt
                ? 'border-green-200 bg-green-50'
                : 'border-red-100 bg-red-50'
            }`}>
              {/* Ergebnis-Icon */}
              <div className="text-xl flex-shrink-0 mt-0.5">
                {r.korrekt ? '✅' : '❌'}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                {/* Standort + Datum */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {r.emoji as string} {r.ort as string}
                    <span className="text-stone-400 font-normal ml-1 text-xs">{r.land as string}</span>
                  </span>
                  <span className="text-xs text-stone-400 flex-shrink-0">{datumStr}</span>
                </div>

                {/* Frage (eingeklappt) */}
                {r.frage && (
                  <p className="text-xs text-stone-500 line-clamp-1 italic">
                    «{r.frage as string}»
                  </p>
                )}

                {/* Ergebnis-Zeile */}
                <div className="flex items-center gap-2 flex-wrap">
                  {r.korrekt ? (
                    <span className="text-xs font-medium text-green-700">
                      Richtig — +{r.punkte as number} {(r.punkte as number) === 1 ? 'Punkt' : 'Punkte'}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-red-600">Falsch — 0 Punkte</span>
                      {r.richtige_antwort_text && (
                        <span className="text-xs text-stone-500">
                          Richtig wäre: <em>{r.richtige_antwort_text as string}</em>
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
