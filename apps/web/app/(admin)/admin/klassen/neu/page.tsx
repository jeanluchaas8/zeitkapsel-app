'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NeueKlasseSeite() {
  const [form, setForm] = useState({
    bezeichnung: '', beruf: '', lehrstart: '', lehrabschluss: '',
  })
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  function aendern(feld: string, wert: string) {
    setForm((f) => ({ ...f, [feld]: wert }))
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/admin/klassen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.push('/admin/klassen')
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/admin/klassen" className="text-stone-400 hover:text-stone-900 text-sm">← Klassen</Link>
        <h1 className="text-2xl font-bold mt-1">Neue Klasse</h1>
      </div>

      <form onSubmit={absenden} className="card space-y-4">
        <div>
          <label className="label">Bezeichnung</label>
          <input className="input" placeholder="z.B. KV 2025a" required
            value={form.bezeichnung} onChange={(e) => aendern('bezeichnung', e.target.value)} />
        </div>
        <div>
          <label className="label">Beruf</label>
          <input className="input" placeholder="z.B. Kauffrau/Kaufmann EFZ" required
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
          <Link href="/admin/klassen" className="btn-secondary">Abbrechen</Link>
          <button type="submit" disabled={laden} className="btn-primary">
            {laden ? 'Speichert…' : 'Klasse erstellen'}
          </button>
        </div>
      </form>
    </div>
  )
}
