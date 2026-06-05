'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  name: string
}

export function LoeschenButton({ id, name }: Props) {
  const router = useRouter()
  const [bestaetigen, setBestaetigen] = useState(false)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')

  async function loeschen() {
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch(`/api/admin/lehrpersonen/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
      setBestaetigen(false)
    }
  }

  if (fehler) {
    return <span className="text-xs text-red-600">{fehler}</span>
  }

  if (bestaetigen) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-stone-500">Wirklich löschen?</span>
        <button
          onClick={loeschen}
          disabled={laden}
          className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
        >
          {laden ? '…' : 'Ja, löschen'}
        </button>
        <button
          onClick={() => setBestaetigen(false)}
          className="text-xs text-stone-400 hover:text-stone-600"
        >
          Abbrechen
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setBestaetigen(true)}
      title={`${name} löschen`}
      className="text-stone-300 hover:text-red-500 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}
