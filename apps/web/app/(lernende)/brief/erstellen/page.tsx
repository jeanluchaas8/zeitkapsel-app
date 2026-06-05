'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Zustellart } from '@zeitkapsel/shared'

export default function BriefErstellenSeite() {
  const [zustellart, setZustellart] = useState<Zustellart>('mail')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typ: 'digital', zustellart }),
      })
      if (!res.ok) {
        const data = await res.json() as { fehler?: string }
        throw new Error(data.fehler ?? 'Fehler beim Erstellen')
      }
      router.push('/brief/schreiben')
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setLaden(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brief erstellen</h1>
        <p className="mt-1 text-stone-500">
          Wähle, wie dein Brief zugestellt werden soll.
        </p>
      </div>

      <form onSubmit={absenden} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Zustellung</h2>
          <div className="space-y-2">
            {[
              { wert: 'mail', label: 'Per E-Mail', beschreibung: 'Du erhältst deinen Brief per E-Mail' },
              { wert: 'print', label: 'Ausdruck', beschreibung: 'Deine Lehrperson druckt den Brief aus' },
              { wert: 'both', label: 'Beides', beschreibung: 'E-Mail und gedruckter Brief' },
            ].map((o) => (
              <label key={o.wert} className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-3 hover:bg-stone-50">
                <input
                  type="radio"
                  name="zustellart"
                  value={o.wert}
                  checked={zustellart === o.wert}
                  onChange={() => setZustellart(o.wert as Zustellart)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-stone-500">{o.beschreibung}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {fehler && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
        )}

        <button type="submit" disabled={laden} className="btn-primary w-full">
          {laden ? 'Erstelle Brief…' : 'Weiter zum Schreiben'}
        </button>
      </form>
    </div>
  )
}
