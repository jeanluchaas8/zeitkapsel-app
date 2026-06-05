'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function KlasseBearbeitenSeite() {
  const params = useParams()
  const klasseId = params.klasseId as string
  const router = useRouter()

  const [form, setForm] = useState({ bezeichnung: '', beruf: '', lehrstart: '', lehrabschluss: '' })
  const [laden, setLaden] = useState(true)
  const [speichern, setSpeichern] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    fetch(`/api/admin/klassen/${klasseId}`)
      .then((r) => r.json())
      .then((d: { bezeichnung: string; beruf: string; lehrstart: string; lehrabschluss: string }) => {
        setForm({
          bezeichnung: d.bezeichnung,
          beruf: d.beruf,
          lehrstart: d.lehrstart.slice(0, 10),
          lehrabschluss: d.lehrabschluss.slice(0, 10),
        })
        setLaden(false)
      })
      .catch(() => { setFehler('Klasse konnte nicht geladen werden.'); setLaden(false) })
  }, [klasseId])

  function aendern(feld: string, wert: string) {
    setForm((f) => ({ ...f, [feld]: wert }))
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setSpeichern(true)
    setFehler('')
    try {
      const res = await fetch(`/api/admin/klassen/${klasseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.push(`/lehrperson/klassen/${klasseId}`)
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setSpeichern(false)
    }
  }

  if (laden) return <div className="text-stone-400 text-sm">Lade…</div>

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href={`/lehrperson/klassen/${klasseId}`}
          className="text-stone-400 hover:text-stone-900 text-sm">← Zurück</Link>
        <h1 className="text-2xl font-bold mt-1">Klasse bearbeiten</h1>
      </div>

      <form onSubmit={absenden} className="card space-y-4">
        <div>
          <label className="label">Klassenbezeichnung</label>
          <input className="input" required
            value={form.bezeichnung} onChange={(e) => aendern('bezeichnung', e.target.value)} />
        </div>
        <div>
          <label className="label">Beruf</label>
          <input className="input" required
            value={form.beruf} onChange={(e) => aendern('beruf', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Lehrstart</label>
            <input type="date" className="input" required
              value={form.lehrstart} onChange={(e) => aendern('lehrstart', e.target.value)} />
          </div>
          <div>
            <label className="label">Lehrabschluss</label>
            <input type="date" className="input" required
              value={form.lehrabschluss} onChange={(e) => aendern('lehrabschluss', e.target.value)} />
          </div>
        </div>

        {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}

        <div className="flex justify-between pt-2">
          <Link href={`/lehrperson/klassen/${klasseId}`} className="btn-secondary">Abbrechen</Link>
          <button type="submit" disabled={speichern} className="btn-primary">
            {speichern ? 'Speichert…' : 'Änderungen speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}
