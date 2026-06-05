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

interface Schulkalendereintrag {
  schuljahr: string   // z.B. '2025/26'
  bezeichnung: string // 'Schuljahresbeginn' | 'Sommerferien'
  beginn: string      // 'YYYY-MM-DD'
}

interface Props {
  verfuegbareKlassen: VerfuegbareKlasse[]
  schulkalender: Schulkalendereintrag[]
}

// Lehrjahr aus Klassenbezeichnung erkennen
function erkenneLehrjahr(bezeichnung: string): number {
  const numMatch = bezeichnung.match(/[A-Z]+_?([1-4])[a-z]?$|[A-Z]+([1-4])[a-z]/)
  if (numMatch) return parseInt(numMatch[1] || numMatch[2])
  const yearMatch = bezeichnung.match(/_(\d{2})$/)
  if (yearMatch) return Math.max(1, Math.min(4, 2026 - (2000 + parseInt(yearMatch[1]))))
  return 1
}

// Lehrdauer aus Berufsnamen ableiten
function lehrdauerFuerBeruf(beruf: string): number {
  if (/EBA|Assistent|Praktiker|Angestellte/.test(beruf)) return 2
  if (/4.*Jahr|Informatiker|Elektroniker|Automatiker|Konstrukteur|Schreiner|Zahntechn|Polymechan|Sanitär|Elektroinstall|Zeichner|Automobil-Mechatr/.test(beruf)) return 4
  return 3
}

export function NeueKlasseFormular({ verfuegbareKlassen, schulkalender }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ bezeichnung: '', beruf: '', lehrstart: '', lehrabschluss: '' })
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [gewaehlteKlasseId, setGewaehlteKlasseId] = useState<string | null>(null)

  const [bezeichnungFokus, setBezeichnungFokus] = useState(false)
  const [berufFokus, setBerufFokus] = useState(false)
  const bezeichnungRef = useRef<HTMLDivElement>(null)
  const berufRef = useRef<HTMLDivElement>(null)

  // Schulkalender indizieren
  const sjBeginn = useMemo(() => {
    const m: Record<string, string> = {}
    schulkalender.filter(e => e.bezeichnung === 'Schuljahresbeginn').forEach(e => { m[e.schuljahr] = e.beginn })
    return m
  }, [schulkalender])

  const sommerferien = useMemo(() => {
    const m: Record<string, string> = {}
    schulkalender.filter(e => e.bezeichnung === 'Sommerferien').forEach(e => { m[e.schuljahr] = e.beginn })
    return m
  }, [schulkalender])

  // Schuljahr-String aus Startjahr berechnen (z.B. 2025 → '2025/26')
  function sjString(startJahr: number): string {
    return `${startJahr}/${String(startJahr + 1).slice(-2)}`
  }

  // Daten aus Lehrjahr + Beruf berechnen
  function berechneDaten(bezeichnung: string, beruf: string): { lehrstart: string; lehrabschluss: string } {
    const lj = erkenneLehrjahr(bezeichnung)
    const dauer = lehrdauerFuerBeruf(beruf)
    const aktuellesSJJahr = 2025 // SJ 2025/26
    const startJahr = aktuellesSJJahr - (lj - 1)
    const graduierungsJahr = startJahr + dauer // z.B. 2025+4=2029 → SJ 2028/29
    const graduierungsSJ = sjString(graduierungsJahr - 1) // '2028/29'

    const lehrstart = sjBeginn[sjString(startJahr)] ?? `${startJahr}-08-18`
    const sommerBeginn = sommerferien[graduierungsSJ]
    let lehrabschluss = ''
    if (sommerBeginn) {
      const d = new Date(sommerBeginn)
      d.setDate(d.getDate() - 28)
      lehrabschluss = d.toISOString().slice(0, 10)
    } else {
      lehrabschluss = `${graduierungsJahr}-06-15`
    }
    return { lehrstart, lehrabschluss }
  }

  // Autocomplete-Vorschläge
  const bezeichnungVorschlaege = useMemo(() => {
    if (!form.bezeichnung.trim()) return []
    const q = form.bezeichnung.toLowerCase()
    return verfuegbareKlassen.filter(k => k.bezeichnung.toLowerCase().includes(q)).slice(0, 8)
  }, [form.bezeichnung, verfuegbareKlassen])

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

  // Klasse aus Vorschlag wählen → Felder befüllen
  function klasseWaehlen(k: VerfuegbareKlasse) {
    setBezeichnungFokus(false)
    setBerufFokus(false)
    const daten = berechneDaten(k.bezeichnung, k.beruf)
    setForm({ bezeichnung: k.bezeichnung, beruf: k.beruf, ...daten })
    setGewaehlteKlasseId(k.id)
  }

  function aendern(feld: string, wert: string) {
    setGewaehlteKlasseId(null)
    const neuesForm = { ...form, [feld]: wert }
    // Wenn Bezeichnung oder Beruf geändert und beides vorhanden → Daten neu berechnen
    if ((feld === 'bezeichnung' || feld === 'beruf') && neuesForm.bezeichnung && neuesForm.beruf) {
      const daten = berechneDaten(neuesForm.bezeichnung, neuesForm.beruf)
      neuesForm.lehrstart = daten.lehrstart
      neuesForm.lehrabschluss = daten.lehrabschluss
    }
    setForm(neuesForm)
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    try {
      if (gewaehlteKlasseId) {
        const res = await fetch('/api/lehrperson/klassen/beitreten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ klasse_id: gewaehlteKlasseId }),
        })
        if (!res.ok) throw new Error(((await res.json()) as { fehler?: string }).fehler ?? 'Fehler')
      } else {
        const res = await fetch('/api/admin/klassen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error(((await res.json()) as { fehler?: string }).fehler ?? 'Fehler')
      }
      router.push('/lehrperson/dashboard')
      router.refresh()
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
                <button type="button" onMouseDown={() => klasseWaehlen(k)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-3">
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
          placeholder="z.B. Informatiker/in Applikationsentwicklung EFZ"
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
                <button type="button" onMouseDown={() => klasseWaehlen(k)}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center justify-between gap-3">
                  <span className="text-sm truncate">{k.beruf}</span>
                  <span className="font-mono text-xs text-stone-400 shrink-0">{k.bezeichnung}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lehrstart & Lehrabschluss (auto-befüllt, aber anpassbar) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lehrstart</label>
          <input type="date" className="input" required
            value={form.lehrstart}
            onChange={e => { setGewaehlteKlasseId(null); setForm(f => ({ ...f, lehrstart: e.target.value })) }} />
        </div>
        <div>
          <label className="label">Lehrabschluss</label>
          <input type="date" className="input" required
            value={form.lehrabschluss}
            onChange={e => { setGewaehlteKlasseId(null); setForm(f => ({ ...f, lehrabschluss: e.target.value })) }} />
        </div>
      </div>

      {/* Hinweis bei importierter Klasse */}
      {gewaehlteKlasseId && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          Klasse aus Schulnetz ausgewählt – Daten automatisch vorerfasst. Klicke auf „Klasse erfassen".
        </div>
      )}

      {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}

      <div className="flex justify-between pt-2">
        <Link href="/lehrperson/dashboard" className="btn-secondary">Abbrechen</Link>
        <button type="submit" disabled={laden} className="btn-primary">
          {laden ? 'Speichert…' : 'Klasse erfassen'}
        </button>
      </div>
    </form>
  )
}
