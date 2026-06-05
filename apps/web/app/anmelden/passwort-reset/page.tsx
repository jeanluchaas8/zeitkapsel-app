'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function PasswortResetFormular() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const router = useRouter()

  const [passwort, setPasswort] = useState('')
  const [passwort2, setPasswort2] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    if (passwort !== passwort2) {
      setFehler('Die Passwörter stimmen nicht überein.')
      return
    }
    setLaden(true)
    setFehler('')

    try {
      const res = await fetch('/api/auth/passwort-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, passwort }),
      })
      const data = await res.json() as { fehler?: string }
      if (!res.ok) {
        setFehler(data.fehler ?? 'Fehler beim Zurücksetzen.')
        return
      }
      router.push('/anmelden?reset=ok')
    } catch {
      setFehler('Fehler beim Zurücksetzen. Bitte versuche es erneut.')
    } finally {
      setLaden(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="card w-full max-w-sm text-center">
        <p className="text-red-600 text-sm">Ungültiger Link. Bitte fordere einen neuen an.</p>
        <Link href="/anmelden/passwort-vergessen" className="mt-4 block text-sm underline">
          Neuen Link anfordern
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Neues Passwort</h1>
        <p className="mt-2 text-stone-500 text-sm">Wähle ein neues Passwort für dein Konto.</p>
      </div>

      <div className="card">
        {fehler && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
        )}

        <form onSubmit={absenden} className="space-y-4">
          <div>
            <label className="label" htmlFor="passwort">Neues Passwort</label>
            <input
              id="passwort"
              type="password"
              required
              minLength={8}
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="passwort2">Passwort wiederholen</label>
            <input
              id="passwort2"
              type="password"
              required
              value={passwort2}
              onChange={(e) => setPasswort2(e.target.value)}
              className="input"
            />
          </div>

          <button type="submit" disabled={laden} className="btn-primary w-full">
            {laden ? 'Speichern…' : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PasswortResetSeite() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense>
        <PasswortResetFormular />
      </Suspense>
    </main>
  )
}
