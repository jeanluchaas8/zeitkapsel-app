import Link from 'next/link'
import { getSchuljahresenden } from '@/lib/api'
import { NeueKlasseFormular } from './NeueKlasseFormular'

export default async function NeueKlasseSeite() {
  const schuljahresenden = await getSchuljahresenden()

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-1">Neue Klasse erfassen</h1>
      </div>

      <NeueKlasseFormular schuljahresenden={schuljahresenden} />
    </div>
  )
}
