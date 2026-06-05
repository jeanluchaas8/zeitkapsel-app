import { pool } from '@/lib/db'

const TYP_LABEL: Record<string, string> = {
  lehrjahr_1: '1. Lehrjahr',
  lehrjahr_2: '2. Lehrjahr',
  lehrjahr_3: '3. Lehrjahr',
  lehrjahr_4: '4. Lehrjahr',
  abschluss:  'Abschluss-Feedback',
}
const TYP_ORDER: Record<string, number> = {
  lehrjahr_1: 1, lehrjahr_2: 2, lehrjahr_3: 3, lehrjahr_4: 4, abschluss: 5,
}

interface Props {
  lernendeId: string
  /** Wenn true: nur Jahresfeedbacks (während der Lehre). Wenn false/fehlt: alle inkl. Abschluss */
  nurJahresfeedbacks?: boolean
}

export async function FeedbacksAnzeige({ lernendeId, nurJahresfeedbacks = false }: Props) {
  const { rows } = await pool.query(`
    SELECT f.typ, f.inhalt, f.aktualisiert_am,
           lp.vorname AS lp_vorname, lp.nachname AS lp_nachname, lp.fachbereich
    FROM feedback f
    JOIN lehrperson lp ON lp.id = f.lehrperson_id
    WHERE f.lernende_id = $1
      AND f.status = 'geschrieben'
      AND f.inhalt IS NOT NULL AND f.inhalt != ''
      ${nurJahresfeedbacks ? "AND f.typ != 'abschluss'" : ''}
    ORDER BY f.lehrperson_id, f.typ
  `, [lernendeId])

  if (rows.length === 0) return null

  // Gruppieren nach Lehrperson
  const nachLehrperson = new Map<string, {
    name: string; fachbereich: string;
    feedbacks: Array<{ typ: string; inhalt: string; datum: string }>
  }>()

  for (const r of rows) {
    const key = `${r.lp_vorname} ${r.lp_nachname}`
    if (!nachLehrperson.has(key)) {
      nachLehrperson.set(key, { name: key, fachbereich: r.fachbereich as string, feedbacks: [] })
    }
    nachLehrperson.get(key)!.feedbacks.push({
      typ: r.typ as string,
      inhalt: r.inhalt as string,
      datum: new Date(r.aktualisiert_am as string).toLocaleDateString('de-CH'),
    })
  }

  for (const lp of nachLehrperson.values()) {
    lp.feedbacks.sort((a, b) => (TYP_ORDER[a.typ] ?? 9) - (TYP_ORDER[b.typ] ?? 9))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{nurJahresfeedbacks ? '📅' : '💬'}</span>
        <h2 className="font-semibold">
          {nurJahresfeedbacks ? 'Deine Jahresfeedbacks' : 'Feedbacks deiner Lehrpersonen'}
        </h2>
      </div>

      {[...nachLehrperson.values()].map(lp => (
        <div key={lp.name} className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
            <p className="font-medium text-sm">{lp.name}</p>
            <p className="text-xs text-stone-400">{lp.fachbereich}</p>
          </div>
          <div className="divide-y divide-stone-100">
            {lp.feedbacks.map(fb => (
              <div key={fb.typ} className="px-4 py-4 space-y-2">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  fb.typ === 'abschluss'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {fb.typ === 'abschluss' ? '🎓 ' : '📅 '}
                  {TYP_LABEL[fb.typ] ?? fb.typ}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{fb.inhalt}</p>
                <p className="text-xs text-stone-400">Verfasst am {fb.datum}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
