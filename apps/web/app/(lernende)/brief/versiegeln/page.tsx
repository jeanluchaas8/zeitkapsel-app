'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VersiegelungsAnimation } from './VersiegelungsAnimation'

export default function VersiegelnSeite() {
  const [bestaetigt, setBestaetigt] = useState(false)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [animieren, setAnimieren] = useState(false)
  const router = useRouter()

  async function versiegeln() {
    if (!bestaetigt) return
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/brief/versiegeln', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json() as { fehler?: string }
        throw new Error(data.fehler ?? 'Fehler beim Versiegeln')
      }
      setAnimieren(true)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setLaden(false)
    }
  }

  if (animieren) {
    return <VersiegelungsAnimation onFertig={() => router.push('/brief')} autoStart />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brief versiegeln</h1>
        <p className="mt-1 text-stone-500">
          Dieser Schritt ist unwiderruflich.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">⚠️ Achtung</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Nach dem Versiegeln kann der Brief-Inhalt nicht mehr geändert werden.</li>
            <li>Einstellungen (Lehrpersonen, Zustellart) bleiben noch 28 Tage anpassbar.</li>
            <li>Der Brief wird dir am Lehrabschluss zugestellt.</li>
          </ul>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={bestaetigt}
            onChange={(e) => setBestaetigt(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm">
            Ich verstehe, dass mein Brief danach nicht mehr bearbeitet werden kann,
            und möchte ihn jetzt versiegeln.
          </span>
        </label>

        {fehler && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
        )}

        <div className="flex justify-between pt-2">
          <button onClick={() => router.back()} className="btn-secondary">Abbrechen</button>
          <button
            onClick={versiegeln}
            disabled={!bestaetigt || laden}
            className="btn-primary"
          >
            {laden ? 'Versiegle Brief…' : 'Brief versiegeln'}
          </button>
        </div>
      </div>
    </div>
  )
}
