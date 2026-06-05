'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ALLE_KLASSEN, BERUFSFELDER } from './klassendaten'

interface Beruf { id: string; bezeichnung: string; lehrdauer: number }

interface Props {
  berufe: Beruf[]
  vorhandenSet: string[]
}

// Lehrstart aus Lehrjahr und Schuljahr berechnen
function lehrstartFuer(lehrjahr: number, sjBeginnJahr: number): string {
  const jahr = sjBeginnJahr - (lehrjahr - 1)
  return `${jahr}-08-01`
}

function lehrabschlussFuer(lehrstart: string, lehrdauer: number): string {
  const jahr = parseInt(lehrstart.substring(0, 4)) + lehrdauer
  return `${jahr}-07-31`
}

export default function KlassenImportForm({ berufe, vorhandenSet }: Props) {
  const router = useRouter()
  const vorhanden = useMemo(() => new Set(vorhandenSet), [vorhandenSet])

  const [sjBeginn, setSjBeginn] = useState(2025)
  const [filter, setFilter] = useState<string>('alle')
  const [suche, setSuche] = useState('')
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set())
  const [berufsZuweisung, setBerufsZuweisung] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const k of ALLE_KLASSEN) init[k.bezeichnung] = k.berufsVorschlag
    return init
  })
  const [laden, setLaden] = useState(false)
  const [ergebnis, setErgebnis] = useState<{ importiert: number; uebersprungen: number } | null>(null)
  const [fehler, setFehler] = useState('')

  const gefilterteKlassen = useMemo(() => {
    return ALLE_KLASSEN.filter(k => {
      if (filter !== 'alle' && k.berufsfeld !== filter) return false
      if (suche && !k.bezeichnung.toLowerCase().includes(suche.toLowerCase())) return false
      return true
    })
  }, [filter, suche])

  function alleUmschalten(an: boolean) {
    setAusgewaehlt(prev => {
      const neu = new Set(prev)
      for (const k of gefilterteKlassen) {
        if (an) neu.add(k.bezeichnung)
        else neu.delete(k.bezeichnung)
      }
      return neu
    })
  }

  function einzelnUmschalten(bezeichnung: string) {
    setAusgewaehlt(prev => {
      const neu = new Set(prev)
      if (neu.has(bezeichnung)) neu.delete(bezeichnung)
      else neu.add(bezeichnung)
      return neu
    })
  }

  function berufsZuweisungSetzen(bezeichnung: string, beruf: string) {
    setBerufsZuweisung(prev => ({ ...prev, [bezeichnung]: beruf }))
  }

  async function importieren() {
    const zuImportieren = [...ausgewaehlt]
      .filter(bez => !vorhanden.has(bez))
      .map(bez => {
        const k = ALLE_KLASSEN.find(x => x.bezeichnung === bez)!
        const beruf = berufsZuweisung[bez] ?? ''
        const bDaten = berufe.find(b => b.bezeichnung === beruf)
        const lehrdauer = bDaten?.lehrdauer ?? 3
        const lehrstart = lehrstartFuer(k.lehrjahr, sjBeginn)
        const lehrabschluss = lehrabschlussFuer(lehrstart, lehrdauer)
        return { bezeichnung: bez, beruf, lehrstart, lehrabschluss }
      })

    if (zuImportieren.length === 0) {
      setFehler('Keine neuen Klassen zum Importieren ausgewählt.')
      return
    }

    setLaden(true)
    setFehler('')
    setErgebnis(null)

    try {
      const res = await fetch('/api/admin/klassen/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ klassen: zuImportieren }),
      })
      const data = await res.json() as { importiert?: number; uebersprungen?: number; fehler?: string }
      if (!res.ok) throw new Error(data.fehler ?? 'Unbekannter Fehler')
      setErgebnis({ importiert: data.importiert ?? 0, uebersprungen: data.uebersprungen ?? 0 })
      setAusgewaehlt(new Set())
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler beim Import')
    } finally {
      setLaden(false)
    }
  }

  const alleGefiltert = gefilterteKlassen.every(k => ausgewaehlt.has(k.bezeichnung))
  const anzahlNeu = [...ausgewaehlt].filter(b => !vorhanden.has(b)).length

  return (
    <div className="space-y-4">
      {/* Einstellungen */}
      <div className="card flex flex-wrap gap-6 items-end">
        <div>
          <label className="label">Schuljahr-Beginn</label>
          <select
            className="input w-32"
            value={sjBeginn}
            onChange={e => setSjBeginn(parseInt(e.target.value))}
          >
            {[2022, 2023, 2024, 2025, 2026].map(j => (
              <option key={j} value={j}>{j}/{j + 1}</option>
            ))}
          </select>
          <p className="text-xs text-stone-400 mt-1">Prägt Lehrstart (1. LJ = Aug {sjBeginn})</p>
        </div>
        <div className="flex-1 min-w-48">
          <label className="label">Klasse suchen</label>
          <input
            className="input"
            placeholder="z.B. INFA, SR, ELO…"
            value={suche}
            onChange={e => setSuche(e.target.value)}
          />
        </div>
        <div className="text-sm text-stone-500">
          <span className="font-medium text-stone-900">{ausgewaehlt.size}</span> ausgewählt
          {anzahlNeu < ausgewaehlt.size && (
            <span className="text-amber-600 ml-1">
              ({ausgewaehlt.size - anzahlNeu} bereits vorhanden)
            </span>
          )}
        </div>
      </div>

      {/* Berufsfeld-Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('alle')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'alle' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
        >
          Alle ({ALLE_KLASSEN.length})
        </button>
        {Object.entries(BERUFSFELDER).map(([key, label]) => {
          const anzahl = ALLE_KLASSEN.filter(k => k.berufsfeld === key).length
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === key ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
            >
              {label} ({anzahl})
            </button>
          )
        })}
      </div>

      {/* Tabelle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100 bg-stone-50">
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={gefilterteKlassen.length > 0 && alleGefiltert}
              onChange={e => alleUmschalten(e.target.checked)}
              className="rounded"
            />
            Alle {gefilterteKlassen.length > ALLE_KLASSEN.length ? `(${gefilterteKlassen.length})` : ''} auswählen
          </label>
          <span className="text-xs text-stone-400">{gefilterteKlassen.length} Klassen</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100">
              <tr className="text-xs text-stone-500">
                <th className="w-10 px-4 py-2"></th>
                <th className="px-4 py-2 text-left">Klasse</th>
                <th className="px-4 py-2 text-left">KLP (PDF)</th>
                <th className="px-4 py-2 text-left">LJ</th>
                <th className="px-4 py-2 text-left">Lehrstart</th>
                <th className="px-4 py-2 text-left">Beruf</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {gefilterteKlassen.map(k => {
                const istVorhanden = vorhanden.has(k.bezeichnung)
                const beruf = berufsZuweisung[k.bezeichnung] ?? ''
                const bDaten = berufe.find(b => b.bezeichnung === beruf)
                const lehrdauer = bDaten?.lehrdauer ?? 3
                const lehrstart = lehrstartFuer(k.lehrjahr, sjBeginn)
                const lehrabschluss = lehrabschlussFuer(lehrstart, lehrdauer)

                return (
                  <tr
                    key={k.bezeichnung}
                    className={`border-b border-stone-50 last:border-0 ${istVorhanden ? 'opacity-40' : 'hover:bg-stone-50'}`}
                  >
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={ausgewaehlt.has(k.bezeichnung)}
                        disabled={istVorhanden}
                        onChange={() => einzelnUmschalten(k.bezeichnung)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono font-medium">{k.bezeichnung}</td>
                    <td className="px-4 py-2 text-stone-500 text-xs">{k.klp}</td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-medium">
                        {k.lehrjahr}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-stone-500 text-xs whitespace-nowrap">
                      {new Date(lehrstart).toLocaleDateString('de-CH')}
                      <span className="text-stone-300 mx-1">–</span>
                      {new Date(lehrabschluss).toLocaleDateString('de-CH')}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="text-xs border border-stone-200 rounded px-2 py-1 bg-white max-w-64 disabled:opacity-50"
                        value={beruf}
                        disabled={istVorhanden}
                        onChange={e => berufsZuweisungSetzen(k.bezeichnung, e.target.value)}
                      >
                        <option value="">— kein Beruf —</option>
                        {berufe.map(b => (
                          <option key={b.id} value={b.bezeichnung}>{b.bezeichnung}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {istVorhanden ? (
                        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">bereits importiert</span>
                      ) : beruf === '' ? (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">kein Beruf</span>
                      ) : (
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">bereit</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ergebnis / Fehler */}
      {ergebnis && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ <strong>{ergebnis.importiert}</strong> Klassen importiert
          {ergebnis.uebersprungen > 0 && `, ${ergebnis.uebersprungen} übersprungen`}.
        </div>
      )}
      {fehler && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{fehler}</div>
      )}

      {/* Import-Button */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-stone-400">
          Beruf-Zuweisung bestimmt Lehrdauer und Lehrabschluss. Klassen ohne Beruf werden mit Platzhalter importiert.
        </p>
        <button
          onClick={importieren}
          disabled={laden || ausgewaehlt.size === 0}
          className="btn-primary disabled:opacity-40"
        >
          {laden ? 'Importiert…' : `${anzahlNeu} Klassen importieren`}
        </button>
      </div>
    </div>
  )
}
