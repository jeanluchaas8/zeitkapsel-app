'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  /** Schuljahresenden aus DB: { datum: 'YYYY-MM-DD', schuljahr: '2025/26' }[] */
  schuljahresenden: Array<{ datum: string; schuljahr: string }>
}

export function NeueKlasseFormular({ schuljahresenden }: Props) {
  const [form, setForm] = useState({ bezeichnung: '', beruf: '', lehrstart: '', lehrabschluss: '', lehrdauer: '3' })
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  function aendern(feld: string, wert: string) {
    const neuesForm = { ...form, [feld]: wert }

    // Wenn Lehrstart oder Lehrdauer geändert → Vorschlag berechnen
    if ((feld === 'lehrstart' || feld === 'lehrdauer') && neuesForm.lehrstart && neuesForm.lehrdauer) {
      const start = new Date(neuesForm.lehrstart)
      const jahre = parseInt(neuesForm.lehrdauer)
      if (!isNaN(start.getTime()) && jahre >= 2 && jahre <= 4) {
        // Zieldatum: start + lehrdauer Jahre
        const ziel = new Date(start)
        ziel.setFullYear(ziel.getFullYear() + jahre)

        // Nächstes Schuljahresende nach oder nahe dem Zieldatum finden
        const kandidaten = schuljahresenden
          .map(s => ({ ...s, d: new Date(s.datum) }))
          .filter(s => {
            const diffMonate = (s.d.getTime() - ziel.getTime()) / (30.44 * 86400000)
            return diffMonate >= -6 && diffMonate <= 14  // ±6 Monate Toleranz
          })
          .sort((a, b) => Math.abs(a.d.getTime() - ziel.getTime()) - Math.abs(b.d.getTime() - ziel.getTime()))

        if (kandidaten[0]) {
          neuesForm.lehrabschluss = kandidaten[0].datum
        }
      }
    }

    setForm(neuesForm)
  }

  // Vorschläge für aktuellen Lehrstart (alle passenden Schuljahresenden)
  const vorschlaege = form.lehrstart
    ? schuljahresenden
        .map(s => ({ ...s, d: new Date(s.datum) }))
        .filter(s => s.d > new Date(form.lehrstart))
        .slice(0, 4)
    : []

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/admin/klassen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bezeichnung: form.bezeichnung,
          beruf: form.beruf,
          lehrstart: form.lehrstart,
          lehrabschluss: form.lehrabschluss,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.push('/lehrperson/dashboard')
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
    }
  }

  return (
    <form onSubmit={absenden} className="card space-y-4">
      <div>
        <label className="label">Klassenbezeichnung</label>
        <input className="input" placeholder="z.B. INFA2025a" required
          value={form.bezeichnung} onChange={(e) => aendern('bezeichnung', e.target.value)} />
      </div>

      <div>
        <label className="label">Beruf</label>
        <input className="input" placeholder="z.B. Informatiker/in EFZ" required
          value={form.beruf} onChange={(e) => aendern('beruf', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lehrstart</label>
          <input type="date" className="input" required
            value={form.lehrstart} onChange={(e) => aendern('lehrstart', e.target.value)} />
        </div>
        <div>
          <label className="label">Lehrdauer</label>
          <select className="input" value={form.lehrdauer} onChange={(e) => aendern('lehrdauer', e.target.value)}>
            <option value="2">2 Jahre</option>
            <option value="3">3 Jahre</option>
            <option value="4">4 Jahre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Lehrabschluss</label>
        <input type="date" className="input" required
          value={form.lehrabschluss} onChange={(e) => aendern('lehrabschluss', e.target.value)} />

        {/* Schuljahresabschluss-Vorschläge */}
        {vorschlaege.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-stone-400">Vorschläge (Ende Schuljahr):</p>
            <div className="flex flex-wrap gap-1.5">
              {vorschlaege.map(v => {
                const istAktiv = form.lehrabschluss === v.datum
                return (
                  <button
                    key={v.datum}
                    type="button"
                    onClick={() => aendern('lehrabschluss', v.datum)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                      istAktiv
                        ? 'bg-indigo-600 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-indigo-100 hover:text-indigo-700'
                    }`}
                  >
                    {new Date(v.datum).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span className="ml-1 opacity-70">{v.schuljahr}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}

      <div className="flex justify-between pt-2">
        <Link href="/lehrperson/dashboard" className="btn-secondary">Abbrechen</Link>
        <button type="submit" disabled={laden} className="btn-primary">
          {laden ? 'Speichert…' : 'Klasse erstellen'}
        </button>
      </div>
    </form>
  )
}
