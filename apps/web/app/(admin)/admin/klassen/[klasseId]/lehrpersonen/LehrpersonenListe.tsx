'use client'

import { useState, useMemo } from 'react'
import { LehrpersonZuweisenFormular } from './LehrpersonZuweisenFormular'

interface Lehrperson {
  id: string
  vorname: string
  nachname: string
  fachbereich: string
  email: string
}

interface Props {
  klasseId: string
  verfuegbar: Lehrperson[]
}

export default function LehrpersonenListe({ klasseId, verfuegbar }: Props) {
  const [suche, setSuche] = useState('')

  const gefiltert = useMemo(() => {
    if (!suche) return verfuegbar
    const q = suche.toLowerCase()
    return verfuegbar.filter(lp =>
      lp.nachname.toLowerCase().includes(q) ||
      lp.vorname.toLowerCase().includes(q) ||
      lp.fachbereich.toLowerCase().includes(q) ||
      lp.email.toLowerCase().includes(q)
    )
  }, [verfuegbar, suche])

  if (verfuegbar.length === 0) return null

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Lehrperson hinzufügen</h2>
        <input
          className="input max-w-64 text-sm"
          placeholder="Name oder Fachbereich suchen…"
          value={suche}
          onChange={e => setSuche(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        {gefiltert.map(lp => (
          <div key={lp.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-2">
            <div>
              <p className="text-sm font-medium">{lp.vorname} {lp.nachname}</p>
              <p className="text-xs text-stone-400">{lp.fachbereich} · {lp.email}</p>
            </div>
            <LehrpersonZuweisenFormular
              klasseId={klasseId}
              lehrpersonId={lp.id}
              aktion="hinzufuegen"
            />
          </div>
        ))}
        {gefiltert.length === 0 && (
          <p className="text-sm text-stone-400 py-2">Keine Lehrpersonen gefunden.</p>
        )}
      </div>
    </div>
  )
}
