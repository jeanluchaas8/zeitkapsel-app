import Link from 'next/link'
import { pool } from '@/lib/db'
import { StatusFormular } from './StatusFormular'

export default async function LehrpersonenSeite() {
  const { rows } = await pool.query(`
    SELECT lp.id, lp.vorname, lp.nachname, lp.email, lp.fachbereich, lp.ist_admin, lp.status,
           b.bezeichnung AS beruf_bezeichnung,
           COUNT(DISTINCT kl.klasse_id)::INT AS anzahl_klassen
    FROM lehrperson lp
    LEFT JOIN berufe b ON b.id = lp.beruf_id
    LEFT JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
    GROUP BY lp.id, b.bezeichnung
    ORDER BY lp.status DESC, lp.nachname
  `)

  const pending = rows.filter((r) => r.status === 'pending')
  const aktive  = rows.filter((r) => r.status === 'aktiv')
  const abgelehnte = rows.filter((r) => r.status === 'abgelehnt')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold mt-1">Lehrpersonen</h1>
        </div>
        <Link href="/admin/lehrpersonen/neu" className="btn-primary">+ Manuell erfassen</Link>
      </div>

      {/* Ausstehende Registrierungen */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">Ausstehende Bestätigungen</h2>
            <span className="rounded-full bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5">
              {pending.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-orange-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">E-Mail</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">Fachbereich</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-600">Beruf</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((lp) => (
                  <tr key={lp.id as string} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{lp.vorname as string} {lp.nachname as string}</td>
                    <td className="px-4 py-3 text-stone-600">{lp.email as string}</td>
                    <td className="px-4 py-3 text-stone-500">{lp.fachbereich as string}</td>
                    <td className="px-4 py-3 text-stone-500">{(lp.beruf_bezeichnung as string) ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <StatusFormular lehrpersonId={lp.id as string} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Aktive Lehrpersonen */}
      <div className="space-y-3">
        <h2 className="font-semibold">Aktive Lehrpersonen ({aktive.length})</h2>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">E-Mail</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Fachbereich</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Beruf</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Klassen</th>
                <th className="px-4 py-3 text-left font-medium text-stone-600">Rolle</th>
              </tr>
            </thead>
            <tbody>
              {aktive.map((lp) => (
                <tr key={lp.id as string} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium">{lp.vorname as string} {lp.nachname as string}</td>
                  <td className="px-4 py-3 text-stone-600">{lp.email as string}</td>
                  <td className="px-4 py-3 text-stone-500">{lp.fachbereich as string}</td>
                  <td className="px-4 py-3 text-stone-500">{(lp.beruf_bezeichnung as string) ?? '—'}</td>
                  <td className="px-4 py-3 text-center">{lp.anzahl_klassen as number}</td>
                  <td className="px-4 py-3">
                    {lp.ist_admin
                      ? <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs">Admin</span>
                      : <span className="rounded-full bg-stone-100 text-stone-600 px-2 py-0.5 text-xs">Lehrperson</span>}
                  </td>
                </tr>
              ))}
              {aktive.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-stone-400 text-sm">Keine aktiven Lehrpersonen.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Abgelehnte */}
      {abgelehnte.length > 0 && (
        <details className="rounded-xl border border-stone-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm text-stone-500">
            {abgelehnte.length} abgelehnte Registrierungen
          </summary>
          <table className="w-full text-sm border-t border-stone-100">
            <tbody>
              {abgelehnte.map((lp) => (
                <tr key={lp.id as string} className="border-b border-stone-100 last:border-0 text-stone-400">
                  <td className="px-4 py-3">{lp.vorname as string} {lp.nachname as string}</td>
                  <td className="px-4 py-3">{lp.email as string}</td>
                  <td className="px-4 py-3">
                    <StatusFormular lehrpersonId={lp.id as string} nurBestaetigen />
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
