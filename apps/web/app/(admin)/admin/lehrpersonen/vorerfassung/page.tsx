'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

const FACHBEREICHE = ['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']

interface Eintrag {
  id: string
  vorname: string
  nachname: string
  fachbereich: string
  beruf: string
}

const LEER = { vorname: '', nachname: '', fachbereich: 'Berufskunde', beruf: '' }

export default function VorerfassungSeite() {
  const [liste, setListe] = useState<Eintrag[]>([])
  const [form, setForm] = useState(LEER)
  const [suche, setSuche] = useState('')
  const [filterFb, setFilterFb] = useState('alle')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)

  async function laden_() {
    const d = await fetch('/api/admin/lehrpersonen/vorerfassung').then(r => r.json()) as Eintrag[]
    setListe(d)
  }
  useEffect(() => { laden_() }, [])

  const gefiltert = useMemo(() => liste.filter(e => {
    if (filterFb !== 'alle' && e.fachbereich !== filterFb) return false
    if (suche) {
      const q = suche.toLowerCase()
      return (e.vorname + ' ' + e.nachname).toLowerCase().includes(q)
    }
    return true
  }), [liste, suche, filterFb])

  async function hinzufuegen(ev: React.FormEvent) {
    ev.preventDefault()
    setLaden(true); setFehler('')
    const res = await fetch('/api/admin/lehrpersonen/vorerfassung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json() as { fehler?: string }
      setFehler(d.fehler ?? 'Fehler')
    } else {
      setForm(LEER)
      await laden_()
    }
    setLaden(false)
  }

  async function speichern(id: string) {
    const e = liste.find(x => x.id === id)
    if (!e) return
    await fetch(`/api/admin/lehrpersonen/vorerfassung/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vorname: e.vorname, nachname: e.nachname, fachbereich: e.fachbereich, beruf: e.beruf }),
    })
    setBearbeitenId(null)
    await laden_()
  }

  async function loeschen(id: string, name: string) {
    if (!confirm(`«${name}» aus der Vorerfassungsliste entfernen?`)) return
    await fetch(`/api/admin/lehrpersonen/vorerfassung/${id}`, { method: 'DELETE' })
    await laden_()
  }

  function zeileAendern(id: string, feld: keyof Eintrag, wert: string) {
    setListe(prev => prev.map(e => e.id === id ? { ...e, [feld]: wert } : e))
  }

  const fbZahlen = FACHBEREICHE.reduce((acc, fb) => {
    acc[fb] = liste.filter(e => e.fachbereich === fb).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/lehrpersonen" className="text-stone-400 hover:text-stone-900 text-sm">← Lehrpersonen</Link>
        <h1 className="text-2xl font-bold mt-1">Vorerfassungsliste</h1>
        <p className="text-sm text-stone-500 mt-1">
          Namen, Fachbereiche und Berufe für die Autocomplete-Hilfe bei der Registrierung.
        </p>
      </div>

      {/* Neue Lehrperson vorerfassen */}
      <form onSubmit={hinzufuegen} className="card space-y-3">
        <h2 className="font-semibold text-sm">Neue Vorerfassung</h2>
        <div className="flex flex-wrap gap-3">
          <input className="input flex-1 min-w-28" placeholder="Vorname" required
            value={form.vorname} onChange={e => setForm(f => ({ ...f, vorname: e.target.value }))} />
          <input className="input flex-1 min-w-28" placeholder="Nachname" required
            value={form.nachname} onChange={e => setForm(f => ({ ...f, nachname: e.target.value }))} />
          <select className="input w-48"
            value={form.fachbereich} onChange={e => setForm(f => ({ ...f, fachbereich: e.target.value, beruf: '' }))}>
            {FACHBEREICHE.map(fb => <option key={fb}>{fb}</option>)}
          </select>
          {form.fachbereich === 'Berufskunde' && (
            <input className="input flex-1 min-w-40" placeholder="Beruf (optional)"
              value={form.beruf} onChange={e => setForm(f => ({ ...f, beruf: e.target.value }))} />
          )}
          <button type="submit" disabled={laden} className="btn-primary whitespace-nowrap">
            {laden ? '…' : '+ Hinzufügen'}
          </button>
        </div>
        {fehler && <p className="text-sm text-red-600">{fehler}</p>}
      </form>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <input className="input max-w-56 text-sm" placeholder="Name suchen…"
          value={suche} onChange={e => setSuche(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {['alle', ...FACHBEREICHE].map(fb => (
            <button key={fb} onClick={() => setFilterFb(fb)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterFb === fb ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}>
              {fb === 'alle' ? `Alle (${liste.length})` : `${fb} (${fbZahlen[fb] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tabelle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-stone-600">Name</th>
              <th className="px-4 py-2.5 text-left font-medium text-stone-600">Fachbereich</th>
              <th className="px-4 py-2.5 text-left font-medium text-stone-600">Beruf</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map(e => (
              <tr key={e.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                {bearbeitenId === e.id ? (
                  <>
                    <td className="px-3 py-1.5">
                      <div className="flex gap-2">
                        <input className="input text-sm py-1 w-24" value={e.vorname}
                          onChange={ev => zeileAendern(e.id, 'vorname', ev.target.value)} />
                        <input className="input text-sm py-1 w-28" value={e.nachname}
                          onChange={ev => zeileAendern(e.id, 'nachname', ev.target.value)} />
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <select className="input text-sm py-1" value={e.fachbereich}
                        onChange={ev => zeileAendern(e.id, 'fachbereich', ev.target.value)}>
                        {FACHBEREICHE.map(fb => <option key={fb}>{fb}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      {e.fachbereich === 'Berufskunde'
                        ? <input className="input text-sm py-1 w-48" value={e.beruf}
                            onChange={ev => zeileAendern(e.id, 'beruf', ev.target.value)} />
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => speichern(e.id)} className="text-xs text-green-700 underline">Speichern</button>
                        <button onClick={() => { setBearbeitenId(null); laden_() }} className="text-xs text-stone-400 underline">Abbrechen</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-medium">{e.vorname} {e.nachname}</td>
                    <td className="px-4 py-2.5 text-stone-500">{e.fachbereich}</td>
                    <td className="px-4 py-2.5 text-stone-400 text-xs">{e.beruf || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => setBearbeitenId(e.id)} className="text-xs text-stone-500 underline">Bearbeiten</button>
                        <button onClick={() => loeschen(e.id, `${e.vorname} ${e.nachname}`)} className="text-xs text-red-400 underline">Löschen</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {gefiltert.length === 0 && (
          <div className="py-10 text-center text-stone-400 text-sm">
            {liste.length === 0 ? 'Noch keine Vorerfassungen.' : 'Keine Einträge entsprechen dem Filter.'}
          </div>
        )}
      </div>
      {gefiltert.length > 0 && (
        <p className="text-xs text-stone-400 text-right">{gefiltert.length} von {liste.length} Einträgen</p>
      )}
    </div>
  )
}
