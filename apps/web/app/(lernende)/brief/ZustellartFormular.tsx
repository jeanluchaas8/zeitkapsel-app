'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OPTIONEN = [
  { wert: 'mail', label: 'Per E-Mail', beschreibung: 'Du erhältst deinen Brief per E-Mail' },
  { wert: 'print', label: 'Ausdruck', beschreibung: 'Deine Lehrperson druckt den Brief aus' },
  { wert: 'both', label: 'Beides', beschreibung: 'E-Mail und gedruckter Brief' },
]

export function ZustellartFormular({
  aktuelleZustellart,
  gesperrt,
}: {
  aktuelleZustellart: string
  gesperrt: boolean
}) {
  const [auswahl, setAuswahl] = useState(aktuelleZustellart)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [gespeichert, setGespeichert] = useState(false)
  const router = useRouter()

  const hatGeaendert = auswahl !== aktuelleZustellart

  async function speichern() {
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/brief', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zustellart: auswahl }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      setGespeichert(true)
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLaden(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {OPTIONEN.map((o) => (
          <label
            key={o.wert}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
              gesperrt ? 'cursor-default opacity-60' : 'hover:bg-stone-50'
            } ${auswahl === o.wert ? 'border-stone-400 bg-stone-50' : 'border-stone-200'}`}
          >
            <input
              type="radio"
              name="zustellart"
              value={o.wert}
              checked={auswahl === o.wert}
              onChange={() => { if (!gesperrt) { setAuswahl(o.wert); setGespeichert(false) } }}
              disabled={gesperrt}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">{o.label}</p>
              <p className="text-xs text-stone-500">{o.beschreibung}</p>
            </div>
          </label>
        ))}
      </div>

      {fehler && (
        <p className="text-xs text-red-600">{fehler}</p>
      )}

      {!gesperrt && hatGeaendert && (
        <button
          onClick={speichern}
          disabled={laden}
          className="btn-primary w-full"
        >
          {laden ? 'Speichert…' : 'Zustellung speichern'}
        </button>
      )}

      {gespeichert && !hatGeaendert && (
        <p className="text-xs text-green-600 text-center">Gespeichert ✓</p>
      )}
    </div>
  )
}
