'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface VerfuegbareKlasse {
  id: string
  bezeichnung: string
  beruf: string
  lehrstart: string
  lehrabschluss: string
}

interface Props {
  schuljahresenden: Array<{ datum: string; schuljahr: string }>
  verfuegbareKlassen: VerfuegbareKlasse[]
}

export function NeueKlasseFormular({ schuljahresenden, verfuegbareKlassen }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ bezeichnung: '', beruf: '', lehrstart: '', lehrabschluss: '', lehrdauer: '3' })
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')

  // Autocomplete-State
  const [bezeichnungFokus, setBezeichnungFokus] = useState(false)
  const [berufFokus, setBerufFokus] = useState(false)
  const bezeichnungRef = useRef<HTMLDivElement>(null)
  const berufRef = useRef<HTMLDivElement>(null)

  // Vorschläge nach Bezeichnung
  const bezeichnungVorschlaege = useMemo(() => {
    if (!form.bezeichnung.trim()) return []
    const q = form.bezeichnung.toLowerCase()
    return verfuegbareKlassen.filter(k => k.bezeichnung.toLowerCase().includes(q)).slice(0, 8)
  }, [form.bezeichnung, verfuegbareKlassen])

  // Vorschläge nach Beruf
  const berufVorschlaege = useMemo(() => {
    if (!form.beruf.trim()) return []
    const q = form.beruf.toLowerCase()
    return verfuegbareKlassen.filter(k => k.beruf.toLowerCase().includes(q)).slice(0, 8)
  }, [form.beruf, verfuegbareKlassen])

  // Klick außerhalb schließt Dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bezeichnungRef.current && !bezeichnungRef.current.contains(e.target as Node)) setBezeichnungFokus(false)
      if (berufRef.current && !berufRef.current.contains(e.target as Node)) setBerufFokus(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function aendern(feld: string, wert: string) {
    const neuesForm = { ...form, [feld]: wert }
    if ((feld === 'lehrstart' || feld === 'lehrdauer') && neuesForm.lehrstart && neuesForm.lehrdauer) {
      const start = new Date(neuesForm.lehrstart)
      const jahre = parseInt(neuesForm.lehrdauer)
      if (!isNaN(start.getTime()) && jahre >= 2 && jahre <= 4) {
        const ziel = new Date(start)
        ziel.setFullYear(ziel.getFullYear() + jahre)
        const kandidaten = schuljahresenden
          .map(s => ({ ...s, d: new Date(s.datum) }))
          .filter(s => { const diff = (s.d.getTime() - ziel.getTime()) / (30.44 * 86400000); return diff >= -6 && diff <= 14 })
          .sort((a, b) => Math.abs(a.d.getTime() - ziel.getTime()) - Math.abs(b.d.getTime() - ziel.getTime()))
        if (kandidaten[0]) neuesForm.lehrabschluss = kandidaten[0].datum
      }
    }
    setForm(neuesForm)
  }

  // Importierte Klasse auswählen → Felder befüllen + direkt beitreten
  async function klasseWaehlen(k: VerfuegbareKlasse) {
    setBezeichnungFokus(false)
    setBerufFokus(false)
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/lehrperson/klassen/beitreten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ klasse_id: k.id }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.push('/lehrperson/dashboard')
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      // Felder trotzdem befüllen für manuelle Weiterbearbeitung
      const start = new Date(k.lehrstart)
      const end = new Date(k.lehrabschluss)
      const lehrdauer = String(end.getFullYear() - start.getFullYear())
      setForm({
        bezeichnung: k.bezeichnung,
        beruf: k.beruf,
        lehrstart: k.lehrstart,
        lehrabschluss: k.lehrabschluss,
        lehrdauer,
      })
      setLaden(false)
    }
  }

  const vorschlaege = schuljahresenden
    .map(s => ({ ...s, d: new Date(s.datum) }))
    .filter(s => form.lehrstart && s.d > new Date(form.lehrstart))
    .slice(0, 4)

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

      {/* Klassenbezeichnung mit Autocomplete */}
      <div ref={bezeichnungRef} className="relative">
        <label className="label">Klassenbezeichnung</label>
        <input
          className="input"
          placeholder="z.B. INFA1a"
          required
          autoComplete="off"
          value={form.bezeichnung}
          onChange={e => aendern('bezeichnung', e.target.value)}
          onFocus={() => setBezeichnungFokus(true)}
        />
        {bezeichnungFokus && bezeichnungVorschlaege.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
            {bezeichnungVorschlaege.map(k => (
              <li key={k.id}>
                <button
                  type="button"
                  onMouseDown={() => klasseWaehlen(k)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-3"
                >
                  <span className="font-mono font-medium text-sm">{k.bezeichnung}</span>
                  <span className="text-xs text-stone-400 truncate">{k.beruf}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Beruf mit Autocomplete */}
      <div ref={berufRef} className="relative">
        <label className="label">Beruf</label>
        <input
          className="input"
          placeholder="z.B. Informatiker/in EFZ"
          required
          autoComplete="off"
          value={form.beruf}
          onChange={e => aendern('beruf', e.target.value)}
          onFocus={() => setBerufFokus(true)}
        />
        {berufFokus && berufVorschlaege.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden">
            {berufVorschlaege.map(k => (
              <li key={k.id}>
                <button
                  type="button"
                  onMouseDown={() => klasseWaehlen(k)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-3"
                >
                  <span className="text-sm truncate">{k.beruf}</span>
                  <span className="font-mono text-xs text-stone-400 shrink-0">{k.bezeichnung}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lehrstart</label>
          <input type="date" className="input" required
            value={form.lehrstart} onChange={e => aendern('lehrstart', e.target.value)} />
        </div>
        <div>
          <label className="label">Lehrdauer</label>
          <select className="input" value={form.lehrdauer} onChange={e => aendern('lehrdauer', e.target.value)}>
            <option value="2">2 Jahre</option>
            <option value="3">3 Jahre</option>
            <option value="4">4 Jahre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Lehrabschluss</label>
        <input type="date" className="input" required
          value={form.lehrabschluss} onChange={e => aendern('lehrabschluss', e.target.value)} />
        {vorschlaege.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vorschlaege.map(v => (
              <button key={v.datum} type="button"
                onClick={() => aendern('lehrabschluss', v.datum)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  form.lehrabschluss === v.datum
                    ? 'bg-indigo-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-indigo-100 hover:text-indigo-700'
                }`}>
                {new Date(v.datum).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })}
                <span className="ml-1 opacity-70">{v.schuljahr}</span>
              </button>
            ))}
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
