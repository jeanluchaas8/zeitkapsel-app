import Link from 'next/link'
import { VorschauKonfigurator } from './VorschauKonfigurator'

export default function LernendeVorschauSeite() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-1">Lernenden-Vorschau</h1>
        <p className="text-sm text-stone-500 mt-1">
          Simuliere verschiedene Szenarien — wähle Lehrjahr, Brief-Status und Feedback-Zustand.
        </p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Admin-Ansicht</strong> — So sehen Lernende die App nach dem Login.
      </div>
      <VorschauKonfigurator />
    </div>
  )
}
