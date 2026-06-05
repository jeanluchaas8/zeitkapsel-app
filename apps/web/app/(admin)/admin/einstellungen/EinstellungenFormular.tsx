'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Konfiguration {
  zustellart_auswahl_aktiv: string
  zustellart_standard: string
  registrierung_aktiv: string
  brief_anleitung_titel: string
  brief_anleitung_text: string
  brief_placeholder: string
}

export function EinstellungenFormular({ config }: { config: Konfiguration }) {
  const [werte, setWerte] = useState<Konfiguration>(config)
  const [laden, setLaden] = useState(false)
  const [gespeichert, setGespeichert] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  function set(key: keyof Konfiguration, val: string) {
    setWerte(prev => ({ ...prev, [key]: val }))
    setGespeichert(false)
  }

  async function speichern() {
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/admin/einstellungen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(werte),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setGespeichert(true)
      router.refresh()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLaden(false)
    }
  }

  const zustellartAktiv = werte.zustellart_auswahl_aktiv === 'true'
  const registrierungAktiv = werte.registrierung_aktiv === 'true'

  return (
    <div className="space-y-8">

      {/* ── Registrierung ── */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-stone-800">🔐 Registrierung</h2>

        <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Neue Registrierungen erlauben</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Wenn deaktiviert, können sich keine neuen Lernenden registrieren.
            </p>
          </div>
          <button
            onClick={() => set('registrierung_aktiv', registrierungAktiv ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              registrierungAktiv ? 'bg-indigo-600' : 'bg-stone-300'
            }`}
            role="switch"
            aria-checked={registrierungAktiv}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
              registrierungAktiv ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </section>

      {/* ── Zustellung ── */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-stone-800">📬 Zustellungsart</h2>

        <div className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Lernende können Zustellart wählen</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Wenn deaktiviert, gilt die unten gewählte Standard-Zustellart für alle.
            </p>
          </div>
          <button
            onClick={() => set('zustellart_auswahl_aktiv', zustellartAktiv ? 'false' : 'true')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              zustellartAktiv ? 'bg-indigo-600' : 'bg-stone-300'
            }`}
            role="switch"
            aria-checked={zustellartAktiv}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
              zustellartAktiv ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {!zustellartAktiv && (
          <div className="space-y-2 pl-1">
            <p className="text-sm font-medium text-stone-600">Standard-Zustellart</p>
            {[
              { wert: 'mail',  label: '📧 Per E-Mail', desc: 'Lernende erhalten den Brief per E-Mail' },
              { wert: 'print', label: '🖨️ Ausdruck',   desc: 'Lehrperson druckt den Brief aus' },
              { wert: 'both',  label: '📧🖨️ Beides',   desc: 'E-Mail und gedruckter Brief' },
            ].map(o => (
              <label key={o.wert}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-stone-50 ${
                  werte.zustellart_standard === o.wert ? 'border-indigo-400 bg-indigo-50' : 'border-stone-200'
                }`}>
                <input type="radio" name="zustellart_standard" value={o.wert}
                  checked={werte.zustellart_standard === o.wert}
                  onChange={() => set('zustellart_standard', o.wert)}
                  className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{o.label}</p>
                  <p className="text-xs text-stone-500">{o.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* ── Brief-Schreiben Texte ── */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-stone-800">✉️ Brief-Schreiben — Texte</h2>

        <div className="space-y-2">
          <label className="label">Titel der Schreib-Anleitung</label>
          <input
            type="text"
            value={werte.brief_anleitung_titel}
            onChange={e => set('brief_anleitung_titel', e.target.value)}
            className="input"
          />
        </div>

        <div className="space-y-2">
          <label className="label">Anleitungstext (Markdown-Aufzählung mit •)</label>
          <textarea
            rows={8}
            value={werte.brief_anleitung_text}
            onChange={e => set('brief_anleitung_text', e.target.value)}
            className="input resize-y font-mono text-xs"
          />
        </div>

        <div className="space-y-2">
          <label className="label">Platzhaltertext im Schreibfeld</label>
          <textarea
            rows={4}
            value={werte.brief_placeholder}
            onChange={e => set('brief_placeholder', e.target.value)}
            className="input resize-y text-sm"
          />
        </div>
      </section>

      {/* ── Speichern ── */}
      {fehler && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
      )}
      {gespeichert && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">✓ Einstellungen gespeichert</div>
      )}
      <button
        onClick={speichern}
        disabled={laden}
        className="btn-primary w-full"
      >
        {laden ? 'Wird gespeichert…' : 'Einstellungen speichern'}
      </button>
    </div>
  )
}
