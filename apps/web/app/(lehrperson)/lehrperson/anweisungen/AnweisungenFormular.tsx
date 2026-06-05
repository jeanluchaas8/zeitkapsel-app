'use client'

import { useState } from 'react'

interface Konfiguration {
  schluessel: string
  bezeichnung: string
  wert: string
}

export function AnweisungenFormular({ konfiguration }: { konfiguration: Konfiguration[] }) {
  const [werte, setWerte] = useState<Record<string, string>>(
    Object.fromEntries(konfiguration.map((k) => [k.schluessel, k.wert]))
  )
  const [laden, setLaden] = useState(false)
  const [gespeichert, setGespeichert] = useState(false)
  const [fehler, setFehler] = useState('')

  function aendern(schluessel: string, wert: string) {
    setWerte((v) => ({ ...v, [schluessel]: wert }))
    setGespeichert(false)
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/konfiguration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(werte),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setGespeichert(true)
    } catch {
      setFehler('Speichern fehlgeschlagen.')
    } finally {
      setLaden(false)
    }
  }

  return (
    <form onSubmit={speichern} className="space-y-6">
      {konfiguration.map((k) => (
        <div key={k.schluessel} className="card space-y-2">
          <label className="label">{k.bezeichnung}</label>
          {k.schluessel === 'brief_placeholder' ? (
            <textarea
              className="input min-h-[100px] font-serif resize-none"
              value={werte[k.schluessel] ?? ''}
              onChange={(e) => aendern(k.schluessel, e.target.value)}
            />
          ) : (
            <textarea
              className="input min-h-[180px] resize-y"
              value={werte[k.schluessel] ?? ''}
              onChange={(e) => aendern(k.schluessel, e.target.value)}
            />
          )}
          <p className="text-xs text-stone-400">
            {k.schluessel === 'brief_anleitung_titel' && 'Wird als Titel über der Anleitung angezeigt.'}
            {k.schluessel === 'brief_anleitung_text' && 'Wird den Lernenden auf der Schreib-Seite angezeigt. Neue Zeilen und Aufzählungen mit • sind möglich.'}
            {k.schluessel === 'brief_placeholder' && 'Wird als Vorlage im leeren Textfeld angezeigt.'}
          </p>
        </div>
      ))}

      {fehler && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
      )}

      <button type="submit" disabled={laden} className="btn-primary">
        {laden ? 'Speichert…' : gespeichert ? 'Gespeichert ✓' : 'Änderungen speichern'}
      </button>
    </form>
  )
}
