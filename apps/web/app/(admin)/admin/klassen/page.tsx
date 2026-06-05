import Link from 'next/link'
import { pool } from '@/lib/db'
import KlassenTabelle from './KlassenTabelle'

export default async function KlassenSeite() {
  const { rows: klassen } = await pool.query(`
    SELECT k.id, k.bezeichnung, k.beruf, k.lehrstart, k.lehrabschluss,
           COUNT(DISTINCT l.id)::INT AS anzahl_lernende,
           COALESCE(
             STRING_AGG(DISTINCT lp.nachname || ' ' || lp.vorname, ', ' ORDER BY lp.nachname || ' ' || lp.vorname),
             ''
           ) AS lehrpersonen
    FROM klasse k
    LEFT JOIN lernende l ON l.klasse_id = k.id
    LEFT JOIN klasse_lehrperson kl ON kl.klasse_id = k.id
    LEFT JOIN lehrperson lp ON lp.id = kl.lehrperson_id
    GROUP BY k.id
    ORDER BY k.bezeichnung
  `)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold mt-1">Klassen & Zuweisung</h1>
          <p className="text-sm text-stone-500 mt-1">Lehrpersonen den Klassen zuordnen.</p>
        </div>
        <Link href="/admin/klassen/import" className="btn-primary whitespace-nowrap">
          Klassen importieren
        </Link>
      </div>

      <KlassenTabelle klassen={klassen as Parameters<typeof KlassenTabelle>[0]['klassen']} />
    </div>
  )
}
