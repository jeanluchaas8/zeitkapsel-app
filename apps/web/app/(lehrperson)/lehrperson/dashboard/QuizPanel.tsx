'use client'

import { useState, useEffect } from 'react'

interface Teilnehmer {
  anmeldung_id: string
  lernende_id: string
  vorname: string
  nachname: string
  ort: string
  emoji: string
  quiz_id: string | null
  frage: string | null
  antwort_a: string | null
  antwort_b: string | null
  antwort_c: string | null
  antwort_d: string | null
  punkte: number
  ergebnis_id: string | null
  korrekt: boolean | null
  erhaltene_punkte: number | null
}

interface AusgeloostesPerson {
  anmeldung_id: string
  lernende_id: string
  vorname: string
  nachname: string
  ort: string
  emoji: string
  quiz_id: string
  frage: string
  antwort_a: string
  antwort_b: string
  antwort_c: string
  antwort_d: string
  punkte: number
}

interface ErgebnisAntwort {
  korrekt: boolean
  punkte: number
  richtigeAntwort: string
}

interface Props { klasseId: string; klasseBezeichnung: string }

export function QuizPanel({ klasseId, klasseBezeichnung }: Props) {
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([])
  const [ausgeloost, setAusgeloost] = useState<AusgeloostesPerson | null>(null)
  const [gewaehlt, setGewaehlt] = useState<string>('')
  const [ergebnis, setErgebnis] = useState<ErgebnisAntwort | null>(null)
  const [laden, setLaden] = useState(false)
  const [geladen, setGeladen] = useState(false)
  const [offen, setOffen] = useState(false)

  async function laden_() {
    setLaden(true)
    const d = await fetch(`/api/lehrperson/quiz?klasseId=${klasseId}`).then(r => r.json()) as Teilnehmer[]
    setTeilnehmer(d)
    setGeladen(true)
    setLaden(false)
  }

  useEffect(() => { if (offen) laden_() }, [offen])

  function manuelleAuswahl(t: Teilnehmer) {
    if (!t.quiz_id) {
      alert(`Für den Standort «${t.ort}» gibt es noch keine Quiz-Frage.`)
      return
    }
    setAusgeloost(t as unknown as AusgeloostesPerson)
    setErgebnis(null)
    setGewaehlt('')
  }

  async function auslosen() {
    setLaden(true)
    setErgebnis(null)
    setGewaehlt('')
    const res = await fetch('/api/lehrperson/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klasseId }),
    })
    if (res.ok) {
      const d = await res.json() as AusgeloostesPerson
      setAusgeloost(d)
    } else {
      const d = await res.json() as { fehler?: string }
      alert(d.fehler ?? 'Fehler')
    }
    setLaden(false)
  }

  async function auswerten() {
    if (!gewaehlt || !ausgeloost) return
    setLaden(true)
    const res = await fetch('/api/lehrperson/quiz', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anmeldungId: ausgeloost.anmeldung_id,
        quizId: ausgeloost.quiz_id,
        gewaehlteAntwort: gewaehlt,
      }),
    })
    const d = await res.json() as ErgebnisAntwort
    setErgebnis(d)
    setAusgeloost(null)
    setGewaehlt('')
    await laden_()
    setLaden(false)
  }

  const offeneTeilnehmer = teilnehmer.filter(t => !t.ergebnis_id)
  const erledigeTeilnehmer = teilnehmer.filter(t => t.ergebnis_id)

  return (
    <div className="rounded-xl border border-indigo-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOffen(o => !o)}
        className="w-full flex items-center justify-between bg-indigo-50 px-5 py-3 hover:bg-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div className="text-left">
            <p className="font-semibold text-sm">Wissens-Quiz — {klasseBezeichnung}</p>
            <p className="text-xs text-stone-500">Diese Woche angemeldet: {geladen ? offeneTeilnehmer.length : '…'}</p>
          </div>
        </div>
        <span className="text-stone-400">{offen ? '▲' : '▼'}</span>
      </button>

      {offen && (
        <div className="p-5 space-y-5 bg-white">
          {/* Ergebnis der letzten Ausloosung */}
          {ergebnis && (
            <div className={`rounded-xl p-4 ${ergebnis.korrekt ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="font-semibold text-sm">
                {ergebnis.korrekt ? '✅ Richtig!' : '❌ Leider falsch'}
              </p>
              <p className="text-sm mt-1">
                {ergebnis.korrekt
                  ? `+${ergebnis.punkte} Punkte vergeben 🎉`
                  : `Richtige Antwort: ${ergebnis.richtigeAntwort.toUpperCase()} · 0 Punkte`}
              </p>
            </div>
          )}

          {/* Aktive Ausloosung */}
          {ausgeloost ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide mb-1">Ausgewählt</p>
                <p className="text-lg font-bold">{ausgeloost.vorname} {ausgeloost.nachname}</p>
                <p className="text-sm text-stone-500">{ausgeloost.emoji} {ausgeloost.ort}</p>
              </div>

              {ausgeloost.quiz_id ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-stone-50 p-4">
                    <p className="text-xs text-stone-400 mb-2">Frage vorlesen:</p>
                    <p className="font-semibold">{ausgeloost.frage}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(['a','b','c','d'] as const).map(buchstabe => {
                      const text = ausgeloost[`antwort_${buchstabe}` as keyof AusgeloostesPerson] as string
                      return (
                        <button
                          key={buchstabe}
                          onClick={() => setGewaehlt(buchstabe)}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            gewaehlt === buchstabe
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-stone-200 hover:border-indigo-300'
                          }`}
                        >
                          <span className="font-bold text-indigo-600 mr-2">{buchstabe.toUpperCase()})</span>
                          <span className="text-sm">{text}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setAusgeloost(null)} className="btn-secondary flex-1">Abbrechen</button>
                    <button
                      onClick={auswerten}
                      disabled={!gewaehlt || laden}
                      className="btn-primary flex-1"
                    >
                      {laden ? 'Werte aus…' : 'Antwort bestätigen'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  ⚠ Für den Standort «{ausgeloost.ort}» gibt es noch keine Quiz-Frage. Bitte im Admin erfassen.
                  <button onClick={() => setAusgeloost(null)} className="ml-3 underline">Abbrechen</button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Angemeldete Teilnehmer */}
              {offeneTeilnehmer.length > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                      Angemeldet ({offeneTeilnehmer.length}) — Person auswählen:
                    </p>
                    <div className="space-y-2">
                      {offeneTeilnehmer.map(t => (
                        <button
                          key={t.anmeldung_id}
                          onClick={() => manuelleAuswahl(t)}
                          disabled={laden}
                          className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-left hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold">{t.vorname} {t.nachname}</span>
                            <span className="text-xs text-indigo-600 font-medium flex-shrink-0">
                              {t.emoji} {t.ort}
                            </span>
                          </div>
                          {!t.frage && (
                            <p className="text-xs text-amber-500 mt-0.5">⚠ Kein Quiz für diesen Standort</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={auslosen}
                    disabled={laden}
                    className="w-full rounded-xl border-2 border-indigo-300 py-2.5 text-indigo-700 font-medium text-sm hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                  >
                    {laden ? '…' : '🎲 Zufällig auswählen'}
                  </button>
                </>
              ) : (
                <p className="text-sm text-stone-400 text-center py-3">
                  {laden ? 'Lade…' : 'Noch niemand für diese Woche angemeldet.'}
                </p>
              )}

              {/* Bereits ausgewertete Runden */}
              {erledigeTeilnehmer.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                    Diese Woche absolviert
                  </p>
                  <div className="space-y-1">
                    {erledigeTeilnehmer.map(t => (
                      <div key={t.anmeldung_id} className="flex items-center justify-between text-sm">
                        <span>{t.vorname} {t.nachname}</span>
                        <span className={`text-xs font-medium ${t.korrekt ? 'text-green-600' : 'text-red-500'}`}>
                          {t.korrekt ? `+${t.erhaltene_punkte} P ✓` : '0 P ✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rangliste-Link */}
          <div className="border-t border-stone-100 pt-3">
            <a href={`/lehrperson/klassen/${klasseId}/rangliste`}
              className="text-xs text-stone-400 hover:text-stone-700 underline">
              Rangliste ansehen →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
