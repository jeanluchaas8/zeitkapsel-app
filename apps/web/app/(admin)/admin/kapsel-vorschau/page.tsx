import Link from 'next/link'
import { getStandort, getVerlauf } from '@/app/(lernende)/brief/standorteDB'
import { KapselLandung } from '@/app/(lernende)/brief/KapselLandung'
import { AnimationsVorschau } from './AnimationsVorschau'

export default async function KapselVorschauSeite() {
  const demoId = 'demo-admin-preview-12345'
  const versiegeltAm = new Date()
  versiegeltAm.setMonth(versiegeltAm.getMonth() - 3)

  const [standort, verlauf] = await Promise.all([
    getStandort(demoId),
    getVerlauf(demoId, versiegeltAm),
  ])

  const demoLehrpersonen = [
    { id: 'demo-1', vorname: 'Jean-Luc', nachname: 'Haas', fachbereich: 'Allgemeinbildung' },
    { id: 'demo-2', vorname: 'Anna', nachname: 'Muster', fachbereich: 'Berufskunde' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-1">Kapsel-Vorschau</h1>
        <p className="text-sm text-stone-500 mt-1">
          Demo: Brief vor 3 Monaten versiegelt · {verlauf.length} besuchte Orte
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Admin-Ansicht</strong> — diese Elemente sehen Lernende nach dem Versiegeln ihres Briefes.
      </div>

      {/* Versiegelungs-Animation */}
      <div className="space-y-2">
        <h2 className="font-semibold">Versiegelungs-Animation</h2>
        <p className="text-sm text-stone-500">So sieht es aus wenn ein Brief versiegelt wird.</p>
        <AnimationsVorschau />
      </div>

      {/* Kapsel-Standort */}
      <div className="space-y-2">
        <h2 className="font-semibold">Kapsel-Standort (Lernenden-Ansicht)</h2>
        <p className="text-sm text-stone-500">
          Standort wechselt wöchentlich · bei ~15% Wahrscheinlichkeit erscheint die GIBZ-Überraschung.
        </p>
        <KapselLandung standort={standort} verlauf={verlauf} lehrpersonen={demoLehrpersonen} gibzAnzahl={0} />
      </div>
    </div>
  )
}
