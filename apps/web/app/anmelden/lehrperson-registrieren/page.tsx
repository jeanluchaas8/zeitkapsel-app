'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FACHBEREICHE = ['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']

interface Beruf { id: string; bezeichnung: string }

export default function LehrpersonRegistrierenSeite() {
  const [form, setForm] = useState({
    vorname: '', nachname: '', email: '', passwort: '', passwort2: '',
    fachbereich: 'Berufskunde', beruf_id: '',
  })
  const [berufe, setBerufe] = useState<Beruf[]>([])
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [erfolg, setErfolg] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/registrieren/berufe')
      .then((r) => r.json())
      .then((d: Beruf[]) => setBerufe(d))
      .catch(() => null)
  }, [])

  function aendern(feld: string, wert: string) {
    setForm((f) => ({ ...f, [feld]: wert }))
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setFehler('')

    if (form.passwort !== form.passwort2) {
      setFehler('Die Passwörter stimmen nicht überein.')
      return
    }
    if (form.passwort.length < 8) {
      setFehler('Das Passwort muss mindestens 8 Zeichen haben.')
      return
    }
    if (form.fachbereich === 'Berufskunde' && !form.beruf_id) {
      setFehler('Bitte wähle einen Beruf.')
      return
    }

    setLaden(true)
    try {
      const res = await fetch('/api/registrieren/lehrperson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vorname: form.vorname,
          nachname: form.nachname,
          email: form.email,
          passwort: form.passwort,
          fachbereich: form.fachbereich,
          beruf_id: form.beruf_id,
        }),
      })
      const d = await res.json() as { fehler?: string }
      if (!res.ok) throw new Error(d.fehler ?? 'Fehler bei der Registrierung')
      setErfolg(true)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLaden(false)
    }
  }

  if (erfolg) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-semibold">Registrierung eingereicht</h1>
          <p className="text-stone-500 text-sm">
            Deine Registrierung wurde eingereicht. Die Schulleitung wird dein Konto in Kürze bestätigen —
            du erhältst eine E-Mail sobald du dich anmelden kannst.
          </p>
          <Link href="/anmelden?modus=lehrperson" className="block text-sm text-stone-500 underline hover:text-stone-900">
            Zurück zur Anmeldung
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Als Lehrperson registrieren</h1>
          <p className="mt-2 text-stone-500 text-sm">
            Nach der Registrierung wird dein Konto, so schnell es geht, bestätigt.
          </p>
        </div>

        <div className="card space-y-4">
          {fehler && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
          )}

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
                  <p className="text-sm text-stone-400">Keine Berufe konfiguriert. Bitte Admin kontaktieren.</p>
                ) : (
                  <select className="input" value={form.beruf_id}
                    onChange={(e) => aendern('beruf_id', e.target.value)} required>
                    <option value="">Beruf wählen…</option>
                    {berufe.map((b) => (
                      <option key={b.id} value={b.id}>{b.bezeichnung}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="label">Passwort</label>
              <input type="password" className="input" required minLength={8}
                placeholder="Mindestens 8 Zeichen"
                value={form.passwort}
                onChange={(e) => aendern('passwort', e.target.value)} />
            </div>

            <div>
              <label className="label">Passwort wiederholen</label>
              <input type="password" className="input" required
                value={form.passwort2}
                onChange={(e) => aendern('passwort2', e.target.value)} />
            </div>

            <button type="submit" disabled={laden} className="btn-primary w-full">
              {laden ? 'Wird eingereicht…' : 'Registrieren'}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500">
            Bereits registriert?{' '}
            <Link href="/anmelden?modus=lehrperson" className="underline hover:text-stone-900">Anmelden</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
