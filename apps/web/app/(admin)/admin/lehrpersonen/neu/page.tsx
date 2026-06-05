'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FACHBEREICHE = ['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']

interface Beruf { id: string; bezeichnung: string }

export default function NeueLehrpersonSeite() {
  const [form, setForm] = useState({
    vorname: '', nachname: '', email: '', fachbereich: 'Berufskunde',
    beruf_id: '', passwort: '', ist_admin: false,
  })
  const [berufe, setBerufe] = useState<Beruf[]>([])
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/registrieren/berufe')
      .then((r) => r.json())
      .then((d: Beruf[]) => setBerufe(d))
      .catch(() => null)
  }, [])

  function aendern(feld: string, wert: string | boolean) {
    setForm((f) => {
      const neu = { ...f, [feld]: wert }
      // Beruf zurücksetzen wenn Fachbereich wechselt
      if (feld === 'fachbereich') neu.beruf_id = ''
      return neu
    })
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    try {
      const res = await fetch('/api/admin/lehrpersonen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          beruf_id: form.beruf_id || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { fehler?: string }
        throw new Error(d.fehler ?? 'Fehler')
      }
      router.push('/admin/lehrpersonen')
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
      setLaden(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/admin/lehrpersonen" className="text-stone-400 hover:text-stone-900 text-sm">← Lehrpersonen</Link>
        <h1 className="text-2xl font-bold mt-1">Neue Lehrperson</h1>
      </div>

      <form onSubmit={absenden} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
          <label className="label">E-Mail</label>
          <input type="email" className="input" required value={form.email}
            onChange={(e) => aendern('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Fachbereich</label>
          <select className="input" value={form.fachbereich}
            onChange={(e) => aendern('fachbereich', e.target.value)}>
            {FACHBEREICHE.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>

        {form.fachbereich === 'Berufskunde' && (
          <div>
            <label className="label">Beruf</label>
            {berufe.length === 0 ? (
              <p className="text-sm text-stone-400">Keine Berufe konfiguriert.{' '}
                <Link href="/admin/berufe" className="underline">Jetzt erfassen</Link>
              </p>
            ) : (
              <select className="input" value={form.beruf_id}
                onChange={(e) => aendern('beruf_id', e.target.value)}>
                <option value="">Beruf wählen…</option>
                {berufe.map((b) => (
                  <option key={b.id} value={b.id}>{b.bezeichnung}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className="label">Passwort (für Login)</label>
          <input type="password" className="input" required minLength={8} value={form.passwort}
            onChange={(e) => aendern('passwort', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.ist_admin}
            onChange={(e) => aendern('ist_admin', e.target.checked)} />
          <span className="text-sm">Administrator-Rechte (kann Admin-Bereich nutzen)</span>
        </label>

        {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}

        <div className="flex justify-between pt-2">
          <Link href="/admin/lehrpersonen" className="btn-secondary">Abbrechen</Link>
          <button type="submit" disabled={laden} className="btn-primary">
            {laden ? 'Speichert…' : 'Lehrperson erstellen'}
          </button>
        </div>
      </form>
    </div>
  )
}
