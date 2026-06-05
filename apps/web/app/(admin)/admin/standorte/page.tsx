import Link from 'next/link'
import { pool } from '@/lib/db'
import { StandorteTabelle } from './StandorteTabelle'

export default async function StandorteSeite({
  searchParams,
}: {
  searchParams: { kategorie?: string; kontinent?: string; suche?: string }
}) {
  const { kategorie, kontinent, suche } = searchParams

  // Filter-Optionen aus DB
  const [kategorienRes, kontinenteRes] = await Promise.all([
    pool.query('SELECT DISTINCT kategorie FROM kapsel_standorte WHERE kategorie != \'\' ORDER BY kategorie'),
    pool.query('SELECT DISTINCT kontinent FROM kapsel_standorte WHERE kontinent != \'\' ORDER BY kontinent'),
  ])

  // Gefilterte Standorte
  let query = 'SELECT * FROM kapsel_standorte WHERE 1=1'
  const params: unknown[] = []
  let i = 1
  if (kategorie) { query += ` AND kategorie = $${i++}`; params.push(kategorie) }
  if (kontinent) { query += ` AND kontinent = $${i++}`; params.push(kontinent) }
  if (suche) { query += ` AND (ort ILIKE $${i} OR info ILIKE $${i} OR land ILIKE $${i++})`; params.push(`%${suche}%`) }
  query += ' ORDER BY ort ASC'

  const { rows: standorte } = await pool.query(query, params)

  const kategorien = kategorienRes.rows.map((r) => r.kategorie as string)
  const kontinente = kontinenteRes.rows.map((r) => r.kontinent as string)

  // Länder-Liste für Filter
  const { rows: laenderRows } = await pool.query(
    'SELECT DISTINCT land FROM kapsel_standorte ORDER BY land'
  )
  const laender = laenderRows.map((r) => r.land as string)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
          <h1 className="text-2xl font-bold mt-1">Kapsel-Standorte</h1>
          <p className="text-sm text-stone-500 mt-0.5">{standorte.length} Standorte</p>
        </div>
      </div>

      <StandorteTabelle
        standorte={standorte as StandortRow[]}
        kategorien={kategorien}
        kontinente={kontinente}
        laender={laender}
        filterKategorie={kategorie ?? ''}
        filterKontinent={kontinent ?? ''}
        filterSuche={suche ?? ''}
      />
    </div>
  )
}

export interface StandortRow {
  id: string
  ort: string
  land: string
  kontinent: string
  kategorie: string
  emoji: string
  info: string
  temp: string
  lat: number
  lng: number
  foto: string
  foto_alt: string
  wiki_titel: string
  link: string
  link_text: string
  aktiv: boolean
  erstellt_am: string
}
