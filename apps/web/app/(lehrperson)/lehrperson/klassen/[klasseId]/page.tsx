import Link from 'next/link'
import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'
import { AustrittFormular } from './AustrittFormular'
import { KlasseWechselnFormular } from './KlasseWechselnFormular'
import { LernenderEinladenFormular } from './LernenderEinladenFormular'

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

function FeedbackZelle({
  status,
  href,
  istAbschluss,
}: {
  status: string | null
  href: string
  istAbschluss: boolean
}) {
  if (!status) {
    return <span className="text-stone-300 text-xs">—</span>
  }
  const isGeschrieben = status === 'geschrieben'
  const label = isGeschrieben ? '✓' : '!'
  const farbe = isGeschrieben
    ? 'bg-green-100 text-green-700 hover:bg-green-200'
    : istAbschluss
      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
  const title = isGeschrieben
    ? 'Geschrieben'
    : `Angefragt${istAbschluss ? ' (Abschluss)' : ''}`

  return (
    <Link href={href} title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${farbe}`}>
      {label} {isGeschrieben ? 'Fertig' : 'Anfrage'}
    </Link>
  )
}

export default async function KlasseDetailSeite({ params }: { params: { klasseId: string } }) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const { rows: klasseRows } = await pool.query(`
    SELECT id, bezeichnung, beruf, lehrstart, lehrabschluss,
           ROUND(EXTRACT(EPOCH FROM AGE(lehrabschluss, lehrstart)) / (365.25 * 86400))::INT AS lehrdauer
    FROM klasse WHERE id = $1
  `, [params.klasseId])
  if (!klasseRows[0]) redirect('/lehrperson/dashboard')

  const klasse = klasseRows[0] as {
    id: string; bezeichnung: string; beruf: string
    lehrstart: string; lehrabschluss: string; lehrdauer: number
  }

  const lehrdauer = Math.max(2, Math.min(4, klasse.lehrdauer ?? 3))

  // Alle Lernenden + Feedback-Status dieser LP pro Typ
  const { rows: lernende } = await pool.query(`
    SELECT l.id, l.vorname, l.nachname, l.ausgetreten_am,
           b.status AS brief_status,
           f1.status AS fb_lj1,
           f2.status AS fb_lj2,
           f3.status AS fb_lj3,
           f4.status AS fb_lj4,
           fa.status AS fb_abschluss
    FROM lernende l
    LEFT JOIN brief b ON b.lernende_id = l.id
    LEFT JOIN feedback f1 ON f1.lernende_id = l.id AND f1.lehrperson_id = $2 AND f1.typ = 'lehrjahr_1'
    LEFT JOIN feedback f2 ON f2.lernende_id = l.id AND f2.lehrperson_id = $2 AND f2.typ = 'lehrjahr_2'
    LEFT JOIN feedback f3 ON f3.lernende_id = l.id AND f3.lehrperson_id = $2 AND f3.typ = 'lehrjahr_3'
    LEFT JOIN feedback f4 ON f4.lernende_id = l.id AND f4.lehrperson_id = $2 AND f4.typ = 'lehrjahr_4'
    LEFT JOIN feedback fa ON fa.lernende_id = l.id AND fa.lehrperson_id = $2 AND fa.typ = 'abschluss'
    WHERE l.klasse_id = $1
    ORDER BY l.ausgetreten_am NULLS FIRST, l.nachname
  `, [params.klasseId, lehrpersonId])

  const aktive = lernende.filter((l) => !l.ausgetreten_am)
  const ausgetreten = lernende.filter((l) => l.ausgetreten_am)

  // Jahresfeedback-Spalten: alle Jahre ausser das letzte (das wird Abschluss)
  // Lehrdauer 2 → Spalten: 1.LJ | Abschluss
  // Lehrdauer 3 → Spalten: 1.LJ | 2.LJ | Abschluss
  // Lehrdauer 4 → Spalten: 1.LJ | 2.LJ | 3.LJ | Abschluss
  const jahrespalten = Array.from({ length: lehrdauer - 1 }, (_, i) => i + 1)

  function getFbStatus(l: Record<string, unknown>, nr: number): string | null {
    const key = `fb_lj${nr}` as 'fb_lj1' | 'fb_lj2' | 'fb_lj3' | 'fb_lj4'
    return (l[key] as string | null) ?? null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
          <h1 className="text-2xl font-bold mt-1">{klasse.bezeichnung}</h1>
          <p className="text-sm text-stone-500">
            {klasse.beruf} · {lehrdauer}-jährige Lehre · Abschluss {new Date(klasse.lehrabschluss).toLocaleDateString('de-CH')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/lehrperson/klassen/${klasse.id}/rangliste`} className="btn-secondary text-sm">
            🏆 Rangliste
          </Link>
          <Link href={`/lehrperson/klassen/${klasse.id}/bearbeiten`} className="btn-secondary text-sm">
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Lernende einladen */}
      <LernenderEinladenFormular klasseId={klasse.id} />

      {/* Aktive Lernende */}
      {aktive.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-600 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600 whitespace-nowrap">Status</th>
                {jahrespalten.map((nr) => (
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
              {aktive.map((l) => {
                const lr = l as Record<string, unknown>
                return (
                  <tr key={l.id as string} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {l.vorname as string} {l.nachname as string}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_FARBE[l.brief_status as string] ?? 'bg-stone-100 text-stone-500'}`}>
                        {l.brief_status ? STATUS_TEXT[l.brief_status as string] ?? l.brief_status as string : 'Kein Brief'}
                      </span>
                    </td>
                    {jahrespalten.map((nr) => (
                      <td key={nr} className="px-3 py-3 text-center">
                        <FeedbackZelle
                          status={getFbStatus(lr, nr)}
                          href={`/lehrperson/lernende/${l.id as string}/feedback?oeffne=lehrjahr_${nr}`}
                          istAbschluss={false}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <FeedbackZelle
                        status={(lr.fb_abschluss as string | null) ?? null}
                        href={`/lehrperson/lernende/${l.id as string}/feedback?oeffne=abschluss`}
                        istAbschluss={true}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <KlasseWechselnFormular
                          lernendeId={l.id as string}
                          name={`${l.vorname as string} ${l.nachname as string}`}
                          aktuelleKlasseId={klasse.id}
                        />
                        <AustrittFormular
                          lernendeId={l.id as string}
                          name={`${l.vorname as string} ${l.nachname as string}`}
                        />
                      </div>
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
          Jahresfeedback angefragt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex rounded-full px-2 py-0.5 bg-indigo-100 text-indigo-700 font-medium">! Anfrage</span>
          Abschluss-Feedback angefragt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-medium">✓ Fertig</span>
          Feedback geschrieben
        </span>
        <span className="flex items-center gap-1.5 text-stone-300">—</span>
        <span>Keine Anfrage</span>
      </div>

      {/* Ausgetretene */}
      {ausgetreten.length > 0 && (
        <details className="rounded-xl border border-stone-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm text-stone-500 hover:text-stone-900">
            {ausgetreten.length} ausgetretene Lernende
          </summary>
          <table className="w-full text-sm border-t border-stone-100">
            <tbody>
              {ausgetreten.map((l) => (
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
