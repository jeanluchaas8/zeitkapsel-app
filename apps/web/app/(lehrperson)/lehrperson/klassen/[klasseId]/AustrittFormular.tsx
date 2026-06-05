'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AustrittFormular({ lernendeId, name }: { lernendeId: string; name: string }) {
  const [offen, setOffen] = useState(false)
  const [notiz, setNotiz] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  async function bestaetigen() {
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch(`/api/lehrperson/lernende/${lernendeId}/austritt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abschiedsnotiz: notiz }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
    }
  }

  if (!offen) {
    return (
      <button
        onClick={() => setOffen(true)}
        className="text-xs text-red-500 hover:text-red-700 underline"
      >
        Austritt
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-semibold">Austritt bestätigen</h2>
        <p className="text-sm text-stone-500">
          <strong>{name}</strong> tritt aus der Lehre aus. Der Brief wird sofort zugestellt.
          Du kannst optional eine persönliche Abschiedsnotiz hinzufügen.
        </p>

        <div>
          <label className="label">Abschiedsnotiz (optional)</label>
          <textarea
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Liebe/r ..., auch wenn es anders gekommen ist als geplant..."
            className="input resize-none"
          />
        </div>

        {fehler && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <button
            onClick={() => setOffen(false)}
            className="btn-secondary flex-1"
            disabled={laden}
          >
            Abbrechen
          </button>
          <button
            onClick={bestaetigen}
            disabled={laden}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {laden ? 'Wird verarbeitet…' : 'Austritt bestätigen'}
          </button>
        </div>
      </div>
    </div>
  )
}
