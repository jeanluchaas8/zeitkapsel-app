import Link from 'next/link'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'

const STATUS_TEXT: Record<string, string> = {
  entwurf: 'Entwurf', versiegelt: 'Versiegelt', zugestellt: 'Zugestellt',
  ausdruck_pendent: 'Ausdruck pendent', zugestellt_ausdruck_pendent: 'Zugestellt',
}
const STATUS_FARBE: Record<string, string> = {
  entwurf: 'bg-yellow-100 text-yellow-800',
  versiegelt: 'bg-blue-100 text-blue-800',
  zugestellt: 'bg-green-100 text-green-800',
  ausdruck_pendent: 'bg-orange-100 text-orange-800',
  zugestellt_ausdruck_pendent: 'bg-green-100 text-green-800',
}

type FbStatus = 'angefragt' | 'geschrieben' | null

function FeedbackBadge({ status, istAbschluss }: { status: FbStatus; istAbschluss: boolean }) {
  if (!status) return <span className="text-stone-300 text-xs">—</span>
  const isGeschrieben = status === 'geschrieben'
  const farbe = isGeschrieben
    ? 'bg-green-100 text-green-700'
    : istAbschluss ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${farbe}`}>
      {isGeschrieben ? '✓ Fertig' : '! Anfrage'}
    </span>
  )
}

export default async function AdminKlasseDetailSeite({ params }: { params: { klasseId: string } }) {
  const { rows: klasseRows } = await pool.query(`
    SELECT k.id, k.bezeichnung, k.beruf, k.lehrstart, k.lehrabschluss,
           ROUND(EXTRACT(EPOCH FROM AGE(k.lehrabschluss, k.lehrstart)) / (365.25 * 86400))::INT AS lehrdauer
    FROM klasse k WHERE k.id = $1
  `, [params.klasseId])
  if (!klasseRows[0]) redirect('/admin/klassen')

  const klasse = klasseRows[0] as {
    id: string; bezeichnung: string; beruf: string
    lehrstart: string; lehrabschluss: string; lehrdauer: number
  }
  const lehrdauer = Math.max(2, Math.min(4, klasse.lehrdauer ?? 3))
  const jahrespalten = Array.from({ length: lehrdauer - 1 }, (_, i) => i + 1)

  // Alle Lernenden + aggregierter Feedback-Status über ALLE LPs (pro Typ: geschrieben > angefragt > null)
  const { rows: lernende } = await pool.query(`
    SELECT l.id, l.vorname, l.nachname, l.email, l.ausgetreten_am,
           b.id AS brief_id, b.status AS brief_status,
           -- Für jeden Typ: 'geschrieben' wenn mind. eine LP geschrieben hat, sonst 'angefragt' wenn angefragt
           (SELECT CASE WHEN bool_or(f.status='geschrieben') THEN 'geschrieben'
                        WHEN bool_or(f.status='angefragt')   THEN 'angefragt'
                        ELSE NULL END
            FROM feedback f WHERE f.lernende_id=l.id AND f.typ='lehrjahr_1') AS fb_lj1,
           (SELECT CASE WHEN bool_or(f.status='geschrieben') THEN 'geschrieben'
                        WHEN bool_or(f.status='angefragt')   THEN 'angefragt'
                        ELSE NULL END
            FROM feedback f WHERE f.lernende_id=l.id AND f.typ='lehrjahr_2') AS fb_lj2,
           (SELECT CASE WHEN bool_or(f.status='geschrieben') THEN 'geschrieben'
                        WHEN bool_or(f.status='angefragt')   THEN 'angefragt'
                        ELSE NULL END
            FROM feedback f WHERE f.lernende_id=l.id AND f.typ='lehrjahr_3') AS fb_lj3,
           (SELECT CASE WHEN bool_or(f.status='geschrieben') THEN 'geschrieben'
                        WHEN bool_or(f.status='angefragt')   THEN 'angefragt'
                        ELSE NULL END
            FROM feedback f WHERE f.lernende_id=l.id AND f.typ='lehrjahr_4') AS fb_lj4,
           (SELECT CASE WHEN bool_or(f.status='geschrieben') THEN 'geschrieben'
                        WHEN bool_or(f.status='angefragt')   THEN 'angefragt'
                        ELSE NULL END
            FROM feedback f WHERE f.lernende_id=l.id AND f.typ='abschluss') AS fb_abschluss
    FROM lernende l
    LEFT JOIN brief b ON b.lernende_id = l.id
    WHERE l.klasse_id = $1
    ORDER BY l.ausgetreten_am NULLS FIRST, l.nachname
  `, [params.klasseId])

  const aktive   = lernende.filter(l => !l.ausgetreten_am)
  const ausgetreten = lernende.filter(l => l.ausgetreten_am)

  // Zugewiesene Lehrpersonen
  const { rows: lehrpersonen } = await pool.query(`
    SELECT lp.id, lp.vorname, lp.nachname, lp.fachbereich
    FROM lehrperson lp
    JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
    WHERE kl.klasse_id = $1 ORDER BY lp.nachname
  `, [params.klasseId])

  function getFbStatus(l: Record<string, unknown>, nr: number): FbStatus {
    return (l[`fb_lj${nr}`] as FbStatus) ?? null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/klassen" className="text-stone-400 hover:text-stone-900 text-sm">← Klassen</Link>
          <h1 className="text-2xl font-bold mt-1">{klasse.bezeichnung}</h1>
          <p className="text-sm text-stone-500">
            {klasse.beruf} · {lehrdauer}-jährige Lehre · Abschluss {new Date(klasse.lehrabschluss).toLocaleDateString('de-CH')}
          </p>
        </div>
        <Link href={`/admin/klassen/${klasse.id}/lehrpersonen`} className="btn-secondary text-sm">
          Lehrpersonen verwalten
        </Link>
      </div>

      {/* Lehrpersonen-Chips */}
      {lehrpersonen.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {lehrpersonen.map(lp => (
            <span key={lp.id as string}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
              {lp.vorname as string} {lp.nachname as string} · {lp.fachbereich as string}
            </span>
          ))}
        </div>
      )}

      {/* Tabelle aktive Lernende */}
      {aktive.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-600 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600 whitespace-nowrap">E-Mail</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600 whitespace-nowrap">Status</th>
                {jahrespalten.map(nr => (
                  <th key={nr} className="px-3 py-3 text-center font-medium text-stone-600 whitespace-nowrap">
                    <span className="text-amber-600">📅</span> {nr}. LJ
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-medium text-stone-600 whitespace-nowrap">
                  <span className="text-indigo-600">🎓</span> Abschluss
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {aktive.map(l => {
                const lr = l as Record<string, unknown>
                return (
                  <tr key={l.id as string} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {l.vorname as string} {l.nachname as string}
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{l.email as string}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_FARBE[l.brief_status as string] ?? 'bg-stone-100 text-stone-500'}`}>
                        {l.brief_status
                          ? STATUS_TEXT[l.brief_status as string] ?? l.brief_status as string
                          : 'Kein Brief'}
                      </span>
                    </td>
                    {jahrespalten.map(nr => (
                      <td key={nr} className="px-3 py-3 text-center">
                        <FeedbackBadge status={getFbStatus(lr, nr)} istAbschluss={false} />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <FeedbackBadge status={(lr.fb_abschluss as FbStatus) ?? null} istAbschluss={true} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/lernende/${l.id as string}`}
                        className="text-xs text-stone-500 hover:text-stone-900 underline">
                        Vorschau
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-stone-400 italic">Keine aktiven Lernenden in dieser Klasse.</p>
      )}

      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex rounded-full px-2 py-0.5 bg-amber-100 text-amber-700 font-medium">! Anfrage</span>
          Jahresfeedback angefragt (mind. 1 LP)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex rounded-full px-2 py-0.5 bg-indigo-100 text-indigo-700 font-medium">! Anfrage</span>
          Abschluss-Feedback angefragt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-medium">✓ Fertig</span>
          Mind. 1 LP hat Feedback geschrieben
        </span>
      </div>

      {/* Ausgetretene */}
      {ausgetreten.length > 0 && (
        <details className="rounded-xl border border-stone-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm text-stone-500 hover:text-stone-900">
            {ausgetreten.length} ausgetretene Lernende
          </summary>
          <table className="w-full text-sm border-t border-stone-100">
            <tbody>
              {ausgetreten.map(l => (
                <tr key={l.id as string} className="border-b border-stone-100 last:border-0 text-stone-400">
                  <td className="px-4 py-3">{l.vorname as string} {l.nachname as string}</td>
                  <td className="px-4 py-3 text-xs">
                    Ausgetreten {new Date(l.ausgetreten_am as string).toLocaleDateString('de-CH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}
