import Link from 'next/link'
import { pool } from '@/lib/db'

export default async function KlassenSeite() {
  const { rows: klassen } = await pool.query(`
    SELECT k.id, k.bezeichnung, k.beruf, k.lehrstart, k.lehrabschluss,
           COUNT(l.id)::INT AS anzahl_lernende
    FROM klasse k
    LEFT JOIN lernende l ON l.klasse_id = k.id
    GROUP BY k.id
    ORDER BY k.lehrstart DESC
  `)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold mt-1">Klassen & Zuweisung</h1>
          <p className="text-sm text-stone-500 mt-1">Lehrpersonen den Klassen zuordnen. Klassen werden von Lehrpersonen erstellt.</p>
        </div>
        <Link href="/admin/klassen/import" className="btn-primary whitespace-nowrap">
          Klassen importieren
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Bezeichnung</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Beruf</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Lehrstart</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Abschluss</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Lernende</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {klassen.map((k) => (
              <tr key={k.id as string} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-medium">{k.bezeichnung as string}</td>
                <td className="px-4 py-3 text-stone-600">{k.beruf as string}</td>
                <td className="px-4 py-3 text-stone-500">
                  {new Date(k.lehrstart as string).toLocaleDateString('de-CH')}
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {new Date(k.lehrabschluss as string).toLocaleDateString('de-CH')}
                </td>
                <td className="px-4 py-3 text-center">{k.anzahl_lernende as number}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/klassen/${k.id as string}/lehrpersonen`}
                    className="text-xs text-stone-600 hover:text-stone-900 underline">
                    Lehrpersonen
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {klassen.length === 0 && (
          <div className="py-12 text-center text-stone-400 text-sm">
            Noch keine Klassen erfasst.
          </div>
        )}
      </div>
    </div>
  )
}
