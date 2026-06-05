'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QuizFrage {
  frage: string
  antwort_a: string; antwort_b: string; antwort_c: string; antwort_d: string
  richtig: string
  gewaehlte_antwort: string | null
  korrekt: boolean | null
  beantwortet_von: string | null
}

interface QuizDaten {
  angemeldet: boolean
  schonGespielt: boolean
  quizFrage: QuizFrage | null
  woche: number
  jahr: number
  punkte: { gesamt: number; richtig: number; total: number; rang: number }
}

interface Props {
  standortId: string
  hatQuizfrage: boolean
}

export function QuizKarte({ standortId, hatQuizfrage }: Props) {
  const [daten, setDaten] = useState<QuizDaten | null>(null)
  const [laden, setLaden] = useState(true)
  const [aktion, setAktion] = useState(false)

  useEffect(() => {
    fetch(`/api/brief/quiz?standortId=${encodeURIComponent(standortId)}`)
      .then(r => r.json())
      .then((d: QuizDaten) => setDaten(d))
      .catch(() => null)
      .finally(() => setLaden(false))
  }, [standortId])

  async function aktualisieren() {
    const d = await fetch(`/api/brief/quiz?standortId=${encodeURIComponent(standortId)}`).then(r => r.json()) as QuizDaten
    setDaten(d)
  }

  async function anmelden() {
    setAktion(true)
    const res = await fetch('/api/brief/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standortId }),
    })
    if (!res.ok) {
      const err = await res.json() as { fehler?: string }
      alert(err.fehler ?? 'Fehler bei der Anmeldung')
    }
    await aktualisieren()
    setAktion(false)
  }

  async function abmelden() {
    setAktion(true)
    await fetch('/api/brief/quiz', { method: 'DELETE' })
    await aktualisieren()
    setAktion(false)
  }

  if (laden) return null

  const p = daten?.punkte
  const rang = p?.rang ?? 1
  const podest = rang <= 3

  return (
    <div className="space-y-4">
      {/* Punkte-Anzeige */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${podest ? 'border-yellow-300 bg-yellow-50' : 'border-stone-200 bg-white'}`}>
        <div className="text-3xl">
          {rang === 1 ? '🥇' : rang === 2 ? '🥈' : rang === 3 ? '🥉' : '⭐'}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {p?.gesamt ?? 0} Punkte
            {podest && <span className="ml-2 text-yellow-600 text-xs font-medium">Platz {rang} 🎉</span>}
            {!podest && p && p.rang > 3 && <span className="ml-2 text-stone-400 text-xs">Platz {rang}</span>}
          </p>
          <p className="text-xs text-stone-500">
            {p?.total ?? 0} Quiz-Runden · {p?.richtig ?? 0} richtig beantwortet
          </p>
        </div>
        <Link href="/brief/rangliste"
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex-shrink-0 underline underline-offset-2">
          Rangliste →
        </Link>
      </div>

      {/* Quiz-Anmeldung */}
      {hatQuizfrage ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-semibold text-sm text-indigo-900">Quiz-Teilnahme diese Woche</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Melde dich an — deine Lehrperson wählt eine Person aus und stellt ihr die Frage zum aktuellen Standort.
              </p>
            </div>
          </div>

          {daten?.schonGespielt ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-stone-100 px-4 py-3 flex items-center gap-2">
                <span className="text-stone-500">✓</span>
                <span className="text-sm text-stone-600">
                  Bereits gespielt in deiner Klasse — nächste Woche gibt es einen neuen Standort.
                </span>
              </div>
              {daten.quizFrage && (
                <div className="rounded-xl border border-stone-200 p-4 space-y-3 bg-stone-50">
                  <p className="text-sm font-semibold text-stone-700">{daten.quizFrage.frage}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['a','b','c','d'] as const).map(b => {
                      const text = daten.quizFrage![`antwort_${b}` as keyof QuizFrage] as string
                      const istRichtig = daten.quizFrage!.richtig === b
                      const warGewaehlt = daten.quizFrage!.gewaehlte_antwort === b
                      return (
                        <div key={b} className={`rounded-lg border-2 px-3 py-2 text-sm ${
                          istRichtig
                            ? 'border-green-400 bg-green-50 text-green-800 font-medium'
                            : warGewaehlt
                            ? 'border-red-300 bg-red-50 text-red-700 line-through'
                            : 'border-stone-200 bg-white text-stone-500'
                        }`}>
                          <span className="font-bold mr-1.5">{b.toUpperCase()})</span>{text}
                          {istRichtig && <span className="ml-1">✓</span>}
                        </div>
                      )
                    })}
                  </div>
                  {daten.quizFrage.beantwortet_von && (
                    <p className="text-xs text-stone-400 text-right">
                      Beantwortet von {daten.quizFrage.beantwortet_von}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : daten?.angemeldet ? (
            <div className="flex items-center justify-between rounded-lg bg-green-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-green-800">Du bist angemeldet!</span>
              </div>
              <button
                onClick={abmelden}
                disabled={aktion}
                className="text-xs text-stone-400 hover:text-stone-700 underline"
              >
                {aktion ? '…' : 'Abmelden'}
              </button>
            </div>
          ) : (
            <button
              onClick={anmelden}
              disabled={aktion}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {aktion ? 'Anmelden…' : '🙋 Ich möchte mitmachen!'}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
          <p className="text-xs text-stone-400 text-center">
            Für den aktuellen Standort gibt es noch keine Quiz-Frage.
          </p>
        </div>
      )}
    </div>
  )
}
