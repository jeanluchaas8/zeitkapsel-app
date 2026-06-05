'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Klasse {
  id: string
  bezeichnung: string
  beruf: string
  lehrstart: string
}

export default function RegistrierenSeite() {
  const [klassen, setKlassen] = useState<Klasse[]>([])
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '', klasse_id: '' })
  const [laden, setLaden] = useState(false)
  const [fertig, setFertig] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    fetch('/api/registrieren/klassen')
      .then((r) => r.json())
      .then((data) => setKlassen(data as Klasse[]))
      .catch(() => null)
  }, [])

  function aendern(feld: string, wert: string) {
    setForm((f) => ({ ...f, [feld]: wert }))
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/registrieren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      setFertig(true)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
    }
  }

  if (fertig) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-sm text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-xl font-semibold">Fast fertig!</h1>
          <p className="mt-2 text-stone-500 text-sm">
            Wir haben dir einen Anmeldelink an <strong>{form.email}</strong> gesendet.
            Klicke den Link um dein Konto zu aktivieren.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Zeitkapsel</h1>
          <p className="mt-2 text-stone-500">Erstelle jetzt deinen Brief an dein zukünftiges Ich.</p>
        </div>

        <div className="card">
          <form onSubmit={absenden} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Vorname</label>
                <input className="input" required value={form.vorname}
                  onChange={(e) => aendern('vorname', e.target.value)} />
              </div>
              <div>
                <label className="label">Nachname</label>
                <input className="input" required value={form.nachname}
                  onChange={(e) => aendern('nachname', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">E-Mail-Adresse</label>
              <input type="email" className="input" required value={form.email}
                placeholder="deine@email.ch"
                onChange={(e) => aendern('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Meine Klasse</label>
              <select className="input" required value={form.klasse_id}
                onChange={(e) => aendern('klasse_id', e.target.value)}>
                <option value="">— Klasse wählen —</option>
                {klassen.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.bezeichnung} · {k.beruf} (Start: {new Date(k.lehrstart).toLocaleDateString('de-CH')})
                  </option>
                ))}
              </select>
            </div>

            {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}

            <button type="submit" disabled={laden || !form.klasse_id} className="btn-primary w-full">
              {laden ? 'Registriert…' : 'Jetzt registrieren'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-stone-400">
            Bereits registriert?{' '}
            <Link href="/anmelden" className="underline hover:text-stone-700">Anmelden</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
