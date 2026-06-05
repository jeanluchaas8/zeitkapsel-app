'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Klasse {
  id: string
  bezeichnung: string
  beruf: string
  lehrstart: string
  lehrabschluss: string
}

export default function KlassenAuswahl({ klassen }: { klassen: Klasse[] }) {
  const router = useRouter()
  const [suche, setSuche] = useState('')
  const [ladend, setLadend] = useState<string | null>(null)
  const [fehler, setFehler] = useState('')

  const gefiltert = useMemo(() =>
    klassen.filter(k =>
      k.bezeichnung.toLowerCase().includes(suche.toLowerCase()) ||
      k.beruf.toLowerCase().includes(suche.toLowerCase())
    ), [klassen, suche])

  async function beitreten(klasseId: string) {
    setLadend(klasseId)
    setFehler('')
    try {
      const res = await fetch('/api/lehrperson/klassen/beitreten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ klasse_id: klasseId }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.push('/lehrperson/dashboard')
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLadend(null)
    }
  }

  return (
    <div className="space-y-2">
      <input
        className="input"
        placeholder="Klasse suchen (z.B. INFA, SR, ELO…)"
        value={suche}
        onChange={e => setSuche(e.target.value)}
      />

      {fehler && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{fehler}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {gefiltert.length === 0 ? (
          <div className="py-8 text-center text-sm text-stone-400">
            Keine Klasse gefunden für „{suche}"
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
            {gefiltert.map(k => (
              <li key={k.id} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
                <div>
                  <span className="font-medium font-mono">{k.bezeichnung}</span>
                  <span className="ml-3 text-sm text-stone-500">{k.beruf}</span>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {new Date(k.lehrstart).toLocaleDateString('de-CH')} – {new Date(k.lehrabschluss).toLocaleDateString('de-CH')}
                  </div>
                </div>
                <button
                  onClick={() => beitreten(k.id)}
                  disabled={ladend === k.id}
                  className="btn-primary text-sm py-1.5 px-4 ml-4 shrink-0 disabled:opacity-50"
                >
                  {ladend === k.id ? '…' : 'Hinzufügen'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {klassen.length > 10 && (
        <p className="text-xs text-stone-400 text-right">{gefiltert.length} von {klassen.length} Klassen</p>
      )}
    </div>
  )
}
