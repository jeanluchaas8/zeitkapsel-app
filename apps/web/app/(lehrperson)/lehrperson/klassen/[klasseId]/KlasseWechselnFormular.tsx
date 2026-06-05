'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Klasse { id: string; bezeichnung: string; beruf: string }

export function KlasseWechselnFormular({
  lernendeId,
  name,
  aktuelleKlasseId,
}: {
  lernendeId: string
  name: string
  aktuelleKlasseId: string
}) {
  const [offen, setOffen] = useState(false)
  const [klassen, setKlassen] = useState<Klasse[]>([])
  const [gewaehlt, setGewaehlt] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!offen) return
    fetch('/api/registrieren/klassen')
      .then((r) => r.json())
      .then((data: Klasse[]) => setKlassen(data.filter((k) => k.id !== aktuelleKlasseId)))
      .catch(() => setFehler('Klassen konnten nicht geladen werden.'))
  }, [offen, aktuelleKlasseId])

  async function bestaetigen() {
    if (!gewaehlt) return
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch(`/api/lehrperson/lernende/${lernendeId}/klasse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ klasseId: gewaehlt }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.refresh()
      setOffen(false)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
    }
  }

  if (!offen) {
    return (
      <button onClick={() => setOffen(true)} className="text-xs text-stone-400 hover:text-stone-700 underline">
        Klasse wechseln
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Klasse wechseln</h2>
        <p className="text-sm text-stone-500">
          <strong>{name}</strong> in eine andere aktive Klasse verschieben.
        </p>

        <div>
          <label className="label">Neue Klasse</label>
          <select
            className="input"
            value={gewaehlt}
            onChange={(e) => setGewaehlt(e.target.value)}
          >
            <option value="">Klasse wählen…</option>
            {klassen.map((k) => (
              <option key={k.id} value={k.id}>
                {k.bezeichnung} — {k.beruf}
              </option>
            ))}
          </select>
          {klassen.length === 0 && !fehler && (
            <p className="text-xs text-stone-400 mt-1">Keine anderen aktiven Klassen vorhanden.</p>
          )}
        </div>

        {fehler && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => setOffen(false)} className="btn-secondary flex-1" disabled={laden}>
            Abbrechen
          </button>
          <button
            onClick={bestaetigen}
            disabled={!gewaehlt || laden}
            className="btn-primary flex-1"
          >
            {laden ? 'Speichert…' : 'Verschieben'}
          </button>
        </div>
      </div>
    </div>
  )
}
