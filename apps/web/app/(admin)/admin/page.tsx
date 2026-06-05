import Link from 'next/link'
import { pool } from '@/lib/db'

export default async function AdminDashboard() {
  const { rows: stats } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM klasse) AS klassen,
      (SELECT COUNT(*) FROM lehrperson WHERE status = 'aktiv') AS lehrpersonen,
      (SELECT COUNT(*) FROM lehrperson WHERE status = 'pending') AS pending
  `)
  const s = stats[0] as Record<string, string>
  const pendingAnzahl = parseInt(s.pending)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="mt-1 text-stone-500">Lehrpersonen verwalten und Klassen zuordnen.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/einstellungen"
          className="card hover:border-stone-400 transition-colors flex items-center gap-4 sm:col-span-2 border-indigo-200 bg-indigo-50/40">
          <span className="text-3xl">⚙️</span>
          <div>
            <p className="font-semibold">App-Einstellungen</p>
            <p className="text-sm text-stone-500">Zustellart, Registrierung, Texte und mehr steuern</p>
          </div>
          <span className="ml-auto text-stone-300">→</span>
        </Link>
        <Link href="/admin/lehrpersonen"
          className="card hover:border-stone-400 transition-colors flex items-center gap-4">
          <span className="text-3xl">👩‍🏫</span>
          <div>
            <p className="font-semibold">Lehrpersonen</p>
            <p className="text-sm text-stone-500">{s.lehrpersonen} aktiv</p>
          </div>
          {pendingAnzahl > 0 && (
            <span className="ml-auto rounded-full bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5">
              {pendingAnzahl} neu
            </span>
          )}
          {pendingAnzahl === 0 && <span className="ml-auto text-stone-300">→</span>}
        </Link>
        <Link href="/admin/klassen"
          className="card hover:border-stone-400 transition-colors flex items-center gap-4">
          <span className="text-3xl">📚</span>
          <div>
            <p className="font-semibold">Klassen & Zuweisung</p>
            <p className="text-sm text-stone-500">{s.klassen} Klassen</p>
          </div>
          <span className="ml-auto text-stone-300">→</span>
        </Link>
        <Link href="/admin/standorte"
          className="card hover:border-stone-400 transition-colors flex items-center gap-4">
          <span className="text-3xl">🗺️</span>
          <div>
            <p className="font-semibold">Kapsel-Standorte</p>
            <p className="text-sm text-stone-500">Alle Standorte verwalten, filtern und bearbeiten</p>
          </div>
          <span className="ml-auto text-stone-300">→</span>
        </Link>
        <Link href="/admin/berufe"
          className="card hover:border-stone-400 transition-colors flex items-center gap-4">
          <span className="text-3xl">🎓</span>
          <div>
            <p className="font-semibold">Berufe</p>
            <p className="text-sm text-stone-500">Berufe für Registrierung verwalten</p>
          </div>
          <span className="ml-auto text-stone-300">→</span>
        </Link>
      </div>
    </div>
  )
}
