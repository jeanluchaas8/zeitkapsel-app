import Link from 'next/link'
import { pool } from '@/lib/db'

export default async function LernendeSeite() {
  const { rows } = await pool.query(`
    SELECT l.id, l.vorname, l.nachname, l.email,
           k.bezeichnung AS klasse_name,
           b.status AS brief_status, b.inhalt IS NOT NULL AS hat_inhalt
    FROM lernende l
    JOIN klasse k ON k.id = l.klasse_id
    LEFT JOIN brief b ON b.lernende_id = l.id
    WHERE l.ausgetreten_am IS NULL
    ORDER BY k.bezeichnung, l.nachname
  `)

  const STATUS_FARBE: Record<string, string> = {
    entwurf: 'bg-yellow-100 text-yellow-800',
    versiegelt: 'bg-blue-100 text-blue-800',
    zugestellt: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-1">Lernende — Vorschau</h1>
        <p className="text-sm text-stone-500 mt-1">Klick auf einen Namen um die Lernenden-Ansicht zu sehen.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">E-Mail</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Klasse</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Brief</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id as string} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{l.vorname as string} {l.nachname as string}</td>
                <td className="px-4 py-3 text-stone-600">{l.email as string}</td>
                <td className="px-4 py-3 text-stone-500">{l.klasse_name as string}</td>
                <td className="px-4 py-3">
                  {l.brief_status ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_FARBE[l.brief_status as string] ?? 'bg-stone-100 text-stone-600'}`}>
                      {l.brief_status === 'entwurf'
                        ? (l.hat_inhalt ? 'Entwurf (mit Inhalt)' : 'Entwurf (leer)')
                        : l.brief_status as string}
                    </span>
                  ) : (
                    <span className="text-stone-300 text-xs">kein Brief</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/lernende/${l.id as string}`}
                    className="text-xs text-stone-500 hover:text-stone-900 underline">
                    Vorschau
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="py-12 text-center text-stone-400 text-sm">Noch keine Lernenden registriert.</div>
        )}
      </div>
    </div>
  )
}
