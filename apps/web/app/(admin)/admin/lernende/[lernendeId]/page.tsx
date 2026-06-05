import { pool } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const STATUS_TEXT: Record<string, string> = {
  entwurf: 'In Bearbeitung',
  versiegelt: 'Versiegelt',
  zugestellt: 'Zugestellt',
  ausdruck_pendent: 'Ausdruck ausstehend',
  zugestellt_ausdruck_pendent: 'Zugestellt, Ausdruck ausstehend',
}

const STATUS_FARBE: Record<string, string> = {
  entwurf: 'bg-yellow-100 text-yellow-800',
  versiegelt: 'bg-blue-100 text-blue-800',
  zugestellt: 'bg-green-100 text-green-800',
  ausdruck_pendent: 'bg-orange-100 text-orange-800',
  zugestellt_ausdruck_pendent: 'bg-green-100 text-green-800',
}

export default async function LernendeVorschauSeite({ params }: { params: { lernendeId: string } }) {
  const { rows } = await pool.query(`
    SELECT l.vorname, l.nachname, l.email, k.bezeichnung AS klasse,
           b.id AS brief_id, b.status, b.inhalt, b.typ, b.zustellart,
           b.einstellungen_gesperrt_ab, b.versiegelt_am,
           COALESCE(json_agg(json_build_object(
             'lehrperson_id', la.lehrperson_id,
             'vorname', lp.vorname,
             'nachname', lp.nachname,
             'fachbereich', lp.fachbereich
           )) FILTER (WHERE la.id IS NOT NULL), '[]') AS lp_auswahl
    FROM lernende l
    JOIN klasse k ON k.id = l.klasse_id
    LEFT JOIN brief b ON b.lernende_id = l.id
    LEFT JOIN lp_auswahl la ON la.brief_id = b.id
    LEFT JOIN lehrperson lp ON lp.id = la.lehrperson_id
    WHERE l.id = $1
    GROUP BY l.vorname, l.nachname, l.email, k.bezeichnung,
             b.id, b.status, b.inhalt, b.typ, b.zustellart,
             b.einstellungen_gesperrt_ab, b.versiegelt_am
  `, [params.lernendeId])

  if (!rows[0]) redirect('/admin/lernende')

  const l = rows[0] as {
    vorname: string; nachname: string; email: string; klasse: string
    brief_id: string | null; status: string | null; inhalt: string | null
    zustellart: string | null; einstellungen_gesperrt_ab: string | null
    versiegelt_am: string | null
    lp_auswahl: Array<{ lehrperson_id: string; vorname: string; nachname: string; fachbereich: string }>
  }

  const lpAuswahl = l.lp_auswahl ?? []
  const einstellungenGesperrt = l.einstellungen_gesperrt_ab
    ? new Date() >= new Date(l.einstellungen_gesperrt_ab)
    : false

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/lernende" className="text-stone-400 hover:text-stone-900 text-sm">← Lernende</Link>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold">{l.vorname} {l.nachname}</h1>
          <span className="text-sm text-stone-400 bg-stone-100 rounded-full px-2 py-0.5">Admin-Vorschau</span>
        </div>
        <p className="text-sm text-stone-500">{l.klasse} · {l.email}</p>
      </div>

      {/* So sieht die Lernende-Startseite aus */}
      {!l.brief_id ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 p-8 text-center space-y-3">
          <p className="text-4xl">✉️</p>
          <h2 className="text-lg font-semibold">Schreibe deinen ersten Brief</h2>
          <p className="text-stone-500 text-sm">
            Halte fest, was dir jetzt wichtig ist — du liest ihn erst zu deinem Lehrabschluss.
          </p>
          <p className="text-xs text-stone-400 mt-4 italic">
            (Diese Lernende hat noch keinen Brief erstellt.)
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between rounded-xl border border-stone-200 bg-white p-5">
            <div>
              <p className="font-semibold">Meine Zeitkapsel</p>
              <p className="text-sm text-stone-500 mt-0.5">Digitaler Brief</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_FARBE[l.status ?? ''] ?? 'bg-stone-100 text-stone-600'}`}>
              {STATUS_TEXT[l.status ?? ''] ?? l.status}
            </span>
          </div>

          {l.status === 'entwurf' && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
              <p className="font-semibold text-sm">Nächste Schritte</p>
              <div className="flex items-center justify-between rounded-lg border border-stone-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Brief schreiben</p>
                  <p className="text-xs text-stone-400">{l.inhalt ? 'Brief bearbeiten' : 'Noch kein Inhalt'}</p>
                </div>
                <span className={`text-lg ${l.inhalt ? 'text-green-500' : 'text-stone-300'}`}>
                  {l.inhalt ? '✓' : '→'}
                </span>
              </div>
            </div>
          )}

          {l.status !== 'entwurf' && (
            <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Brief ist versiegelt und wird zu Lehrabschluss zugestellt.
            </div>
          )}

          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Lehrpersonen</p>
              {!einstellungenGesperrt && (
                <span className="text-xs text-stone-400">Bearbeiten möglich</span>
              )}
            </div>
            {lpAuswahl.length === 0 ? (
              <p className="text-sm text-stone-400">Noch keine Lehrpersonen gewählt.</p>
            ) : (
              <ul className="space-y-1">
                {lpAuswahl.map((lp) => (
                  <li key={lp.lehrperson_id} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>{lp.vorname} {lp.nachname}</span>
                    <span className="text-stone-400 text-xs">({lp.fachbereich})</span>
                  </li>
                ))}
              </ul>
            )}
            {einstellungenGesperrt && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                Einstellungen gesperrt (28 Tage vor Abschluss).
              </p>
            )}
          </div>

          {l.inhalt && (
            <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-2">
              <p className="font-semibold text-sm">Brief-Inhalt (Admin-Sicht)</p>
              <div className="bg-stone-50 rounded-lg p-4">
                <p className="whitespace-pre-wrap leading-relaxed font-serif text-stone-800 text-sm">{l.inhalt}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
