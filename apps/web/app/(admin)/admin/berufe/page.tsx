'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Beruf { id: string; bezeichnung: string; lehrdauer: number; aktiv: boolean }

export default function BerufeSeite() {
  const [berufe, setBerufe] = useState<Beruf[]>([])
  const [neu, setNeu] = useState('')
  const [neuLehrdauer, setNeuLehrdauer] = useState(4)
  const [ladenNeu, setLadenNeu] = useState(false)
  const [fehlerNeu, setFehlerNeu] = useState('')
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null)
  const [bearbeitenText, setBearbeitenText] = useState('')
  const [ladenId, setLadenId] = useState<string | null>(null)

  useEffect(() => { laden() }, [])

  async function laden() {
    const r = await fetch('/api/admin/berufe')
    setBerufe(await r.json() as Beruf[])
  }

  async function hinzufuegen(e: React.FormEvent) {
    e.preventDefault()
    if (!neu.trim()) return
    setLadenNeu(true)
    setFehlerNeu('')
    try {
      const r = await fetch('/api/admin/berufe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bezeichnung: neu.trim(), lehrdauer: Number(neuLehrdauer) }),
      })
      const d = await r.json() as { fehler?: string }
      if (!r.ok) throw new Error(d.fehler ?? 'Fehler')
      setNeu('')
      await laden()
    } catch (err) {
      setFehlerNeu(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLadenNeu(false)
    }
  }

  async function speichern(id: string) {
    if (!bearbeitenText.trim()) return
    setLadenId(id)
    const lehrdauerEl = document.getElementById(`lehrdauer-${id}`) as HTMLSelectElement | null
    const lehrdauer = lehrdauerEl ? parseInt(lehrdauerEl.value) : undefined
    try {
      const r = await fetch('/api/admin/berufe', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, bezeichnung: bearbeitenText.trim(), ...(lehrdauer ? { lehrdauer } : {}) }),
      })
      const d = await r.json() as { fehler?: string }
      if (!r.ok) throw new Error(d.fehler ?? 'Fehler')
      setBearbeitenId(null)
      await laden()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLadenId(null)
    }
  }

  async function aktivToggle(beruf: Beruf) {
    setLadenId(beruf.id)
    await fetch('/api/admin/berufe', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: beruf.id, aktiv: !beruf.aktiv }),
    })
    await laden()
    setLadenId(null)
  }

  function bearbeitenStarten(beruf: Beruf) {
    setBearbeitenId(beruf.id)
    setBearbeitenText(beruf.bezeichnung)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-1">Berufe verwalten</h1>
        <p className="text-sm text-stone-500 mt-1">
          Diese Berufe können Lehrpersonen bei der Registrierung auswählen.
        </p>
      </div>

      {/* Neuen Beruf hinzufügen */}
      <form onSubmit={hinzufuegen} className="card space-y-3">
        <label className="label">Neuen Beruf hinzufügen</label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="z.B. Elektroinstallateur/in EFZ"
            value={neu}
            onChange={(e) => setNeu(e.target.value)}
          />
          <select
            className="input w-36 flex-shrink-0"
            value={neuLehrdauer}
            onChange={e => setNeuLehrdauer(parseInt(e.target.value))}
          >
            <option value={2}>2 Jahre</option>
            <option value={3}>3 Jahre</option>
            <option value={4}>4 Jahre</option>
          </select>
          <button type="submit" disabled={ladenNeu || !neu.trim()} className="btn-primary">
            {ladenNeu ? '…' : 'Hinzufügen'}
          </button>
        </div>
        {fehlerNeu && <p className="text-sm text-red-600">{fehlerNeu}</p>}
      </form>

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Bezeichnung</th>
              <th className="px-4 py-3 text-center font-medium text-stone-600">Lehrdauer</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {berufe.map((b) => (
              <tr key={b.id} className={`border-b border-stone-100 last:border-0 ${!b.aktiv ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  {bearbeitenId === b.id ? (
                    <input
                      className="input py-1"
                      value={bearbeitenText}
                      onChange={(e) => setBearbeitenText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') speichern(b.id)
                        if (e.key === 'Escape') setBearbeitenId(null)
                      }}
                      autoFocus
                    />
                  ) : (
                    <span>{b.bezeichnung}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {bearbeitenId === b.id ? (
                    <select
                      className="input py-1 text-xs w-28"
                      defaultValue={b.lehrdauer}
                      id={`lehrdauer-${b.id}`}
                      onChange={e => {
                        // Wird beim Speichern ausgelesen
                      }}
                    >
                      <option value={2}>2 Jahre</option>
                      <option value={3}>3 Jahre</option>
                      <option value={4}>4 Jahre</option>
                    </select>
                  ) : (
                    <span className="text-stone-600 text-sm">{b.lehrdauer}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${b.aktiv ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                    {b.aktiv ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {ladenId === b.id ? (
                    <span className="text-stone-400 text-xs">…</span>
                  ) : bearbeitenId === b.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => speichern(b.id)}
                        className="text-xs text-green-700 hover:text-green-900 font-medium">
                        Speichern
                      </button>
                      <button onClick={() => setBearbeitenId(null)}
                        className="text-xs text-stone-400 hover:text-stone-700">
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => bearbeitenStarten(b)}
                        className="text-xs text-stone-500 hover:text-stone-900 underline">
                        Bearbeiten
                      </button>
                      <button onClick={() => aktivToggle(b)}
                        className="text-xs text-stone-400 hover:text-stone-700 underline">
                        {b.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {berufe.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
                  Noch keine Berufe erfasst.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
