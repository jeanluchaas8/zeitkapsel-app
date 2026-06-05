'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PasswortVergessenSeite() {
  const [email, setEmail] = useState('')
  const [laden, setLaden] = useState(false)
  const [gesendet, setGesendet] = useState(false)
  const [fehler, setFehler] = useState('')

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')

    try {
      await fetch('/api/auth/passwort-vergessen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setGesendet(true)
    } catch {
      setFehler('Fehler beim Senden. Bitte versuche es erneut.')
    } finally {
      setLaden(false)
    }
  }

  if (gesendet) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="card w-full max-w-sm text-center">
          <div className="mb-4 text-4xl">📬</div>
          <h1 className="text-xl font-semibold">E-Mail gesendet</h1>
          <p className="mt-2 text-stone-500 text-sm">
            Falls ein Konto mit dieser E-Mail existiert, erhältst du in Kürze einen Link zum Zurücksetzen des Passworts.
          </p>
          <Link href="/anmelden" className="mt-6 block text-sm text-stone-500 underline hover:text-stone-900">
            Zurück zur Anmeldung
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Passwort vergessen</h1>
          <p className="mt-2 text-stone-500 text-sm">
            Gib deine E-Mail-Adresse ein — du erhältst einen Link zum Zurücksetzen.
          </p>
        </div>

        <div className="card">
          {fehler && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
          )}

          <form onSubmit={absenden} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">E-Mail-Adresse</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.ch"
                className="input"
              />
            </div>

            <button type="submit" disabled={laden} className="btn-primary w-full">
              {laden ? 'Sende Link…' : 'Link senden'}
            </button>
          </form>

          <Link href="/anmelden" className="mt-4 block text-center text-sm text-stone-500 underline hover:text-stone-900">
            Zurück zur Anmeldung
          </Link>
        </div>
      </div>
    </main>
  )
}
