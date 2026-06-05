import Link from 'next/link'
import { getLehrpersonId } from '@/lib/api'
import { pool } from '@/lib/db'
import { redirect } from 'next/navigation'
import { HintergrundPicker } from './HintergrundPicker'

export default async function LehrpersonEinstellungenSeite() {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const { rows } = await pool.query(
    'SELECT vorname, nachname, email FROM lehrperson WHERE id = $1',
    [lehrpersonId]
  )
  const lp = rows[0] as { vorname: string; nachname: string; email: string }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/lehrperson/dashboard"
          className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-4)' }}>
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold mt-1">Einstellungen</h1>
      </div>

      {/* Profil */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Mein Profil</h2>
        <div className="space-y-0 text-sm divide-y" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between py-3">
            <span style={{ color: 'var(--text-3)' }}>Name</span>
            <span className="font-medium">{lp.vorname} {lp.nachname}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span style={{ color: 'var(--text-3)' }}>E-Mail</span>
            <span className="font-medium">{lp.email}</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-4)' }}>
          Name und E-Mail können durch den Admin geändert werden.
        </p>
      </div>

      {/* Hintergrund */}
      <div className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Hintergrund</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Wähle einen Hintergrund für deine Ansicht — Mesh, Muster oder Einfarbig.
          </p>
        </div>
        <HintergrundPicker />
      </div>
    </div>
  )
}
