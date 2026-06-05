'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MAX_ZEICHEN = 10000

export function BriefEditor({ anleitung, placeholder }: { anleitung: string; placeholder: string }) {
  const [inhalt, setInhalt] = useState('')
  const [gespeichert, setGespeichert] = useState(true)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [anleitungOffen, setAnleitungOffen] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/brief')
      .then((r) => r.json())
      .then((data: { inhalt?: string }) => {
        if (data.inhalt) { setInhalt(data.inhalt); setGespeichert(true); setAnleitungOffen(false) }
      })
      .catch(() => null)
  }, [])

  async function speichern() {
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/brief', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inhalt }),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setGespeichert(true)
    } catch {
      setFehler('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setLaden(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brief schreiben</h1>
          <p className="text-sm text-stone-500 mt-1">
            Dieser Brief wird dir erst zu deinem Lehrabschluss angezeigt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!gespeichert && (
            <span className="text-xs text-stone-400">Ungespeicherte Änderungen</span>
          )}
          <button onClick={speichern} disabled={laden || gespeichert} className="btn-secondary">
            {laden ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Anleitung */}
      {anleitungOffen && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-blue-900">Anleitung</p>
            <button
              onClick={() => setAnleitungOffen(false)}
              className="text-blue-400 hover:text-blue-700 text-xs"
            >
              Schliessen ✕
            </button>
          </div>
          <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">{anleitung}</p>
        </div>
      )}

      {!anleitungOffen && (
        <button
          onClick={() => setAnleitungOffen(true)}
          className="text-xs text-stone-400 hover:text-stone-700 underline"
        >
          Anleitung anzeigen
        </button>
      )}

      {fehler && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <textarea
          value={inhalt}
          onChange={(e) => { setInhalt(e.target.value); setGespeichert(false) }}
          maxLength={MAX_ZEICHEN}
          placeholder={placeholder}
          className="w-full min-h-[500px] resize-none p-6 text-base leading-relaxed focus:outline-none font-serif"
        />
        <div className="flex justify-end border-t border-stone-100 px-4 py-2">
          <span className="text-xs text-stone-400">
            {inhalt.length.toLocaleString('de-CH')} / {MAX_ZEICHEN.toLocaleString('de-CH')} Zeichen
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => router.back()} className="btn-secondary">Zurück</button>
        <button
          onClick={async () => { await speichern(); router.push('/brief/einstellungen') }}
          disabled={!inhalt.trim()}
          className="btn-primary"
        >
          Weiter zu Einstellungen
        </button>
      </div>
    </div>
  )
}
