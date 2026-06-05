'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AnmeldenFormular() {
  const suchParams = useSearchParams()
  const urlModus = suchParams.get('modus')
  const [modus, setModus] = useState<'lernende' | 'lehrperson'>(
    urlModus === 'lehrperson' ? 'lehrperson' : 'lernende'
  )
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const urlFehler = suchParams.get('error')
  const passwortGesetzt = suchParams.get('reset') === 'ok'

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')

    if (modus === 'lernende') {
      await signIn('resend', { email, callbackUrl: '/brief', redirect: true })
    } else {
      const result = await signIn('credentials', {
        email,
        passwort,
        callbackUrl: '/lehrperson/dashboard',
        redirect: false,
      })
      if (result?.error) {
        setFehler('E-Mail oder Passwort ungültig.')
        setLaden(false)
      } else {
        window.location.href = '/lehrperson/dashboard'
      }
    }
  }

  return (
    <div className="card">
      {/* Modus-Umschalter */}
      <div className="mb-6 flex rounded-lg border border-stone-200 p-1">
        {(['lernende', 'lehrperson'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setModus(m); setFehler('') }}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              modus === m
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {m === 'lernende' ? 'Lernende/r' : 'Lehrperson'}
          </button>
        ))}
      </div>

      {passwortGesetzt && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Passwort erfolgreich gesetzt. Du kannst dich jetzt anmelden.
        </div>
      )}

      {(fehler || urlFehler) && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {fehler || 'Anmeldung fehlgeschlagen. Falls du dich gerade registriert hast, warte auf die Bestätigung durch die Schulleitung.'}
        </div>
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

        {modus === 'lehrperson' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label" htmlFor="passwort">Passwort</label>
              <Link href="/anmelden/passwort-vergessen" className="text-xs text-stone-500 underline hover:text-stone-900">
                Passwort vergessen?
              </Link>
            </div>
            <input
              id="passwort"
              type="password"
              required
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              className="input"
            />
          </div>
        )}

        <button type="submit" disabled={laden} className="btn-primary w-full">
          {laden
            ? 'Bitte warten…'
            : modus === 'lernende'
              ? 'Anmeldelink senden'
              : 'Anmelden'}
        </button>
      </form>

      {modus === 'lernende' && (
        <p className="mt-4 text-center text-xs text-stone-400">
          Du erhältst einen Link per E-Mail — kein Passwort nötig.
        </p>
      )}

      {modus === 'lehrperson' && (
        <p className="mt-4 text-center text-xs text-stone-400">
          Noch kein Konto?{' '}
          <Link href="/anmelden/lehrperson-registrieren" className="underline hover:text-stone-700">
            Als Lehrperson registrieren
          </Link>
        </p>
      )}
    </div>
  )
}

export default function AnmeldenSeite() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Zeitkapsel</h1>
          <p className="mt-2 text-stone-500">Melde dich an, um fortzufahren.</p>
        </div>
        <Suspense fallback={<div className="card text-center text-stone-400 py-8">Laden…</div>}>
          <AnmeldenFormular />
        </Suspense>
      </div>
    </main>
  )
}
