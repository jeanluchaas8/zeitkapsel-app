'use client'

import { useState, useEffect } from 'react'

const HILFSTEXTE = [
  'Wie beurteilen Sie meine fachliche Entwicklung im Vergleich zum letzten Jahr?',
  'Was sind meiner Ihrer Meinung nach meine grössten Stärken?',
  'Wo sehen Sie mein grösstes Entwicklungspotenzial?',
  'Wie schätzen Sie mein Verhalten im Team und gegenüber Kunden ein?',
  'Was würden Sie mir für das nächste Lehrjahr mitgeben?',
  'Wie erleben Sie meine Lernbereitschaft und Eigeninitiative?',
]

const TYP_LABEL: Record<string, string> = {
  lehrjahr_1: '1. Lehrjahr', lehrjahr_2: '2. Lehrjahr',
  lehrjahr_3: '3. Lehrjahr', lehrjahr_4: '4. Lehrjahr', abschluss: 'Abschluss',
}

interface LP { id: string; vorname: string; nachname: string; fachbereich: string }
interface Anfrage {
  id: string; lehrperson_id: string; typ: string; status: string
  anfrage_text: string; inhalt: string; lp_vorname: string; lp_nachname: string
}
interface FeedbackDaten {
  lehrpersonen: LP[]; anfragen: Anfrage[]
  aktLehrjahr: number; lehrdauer: number; istLetztesJahr: boolean
  istZugestellt: boolean; lehrabschluss: string
}

export function FeedbackAnfrage() {
  const [daten, setDaten] = useState<FeedbackDaten | null>(null)
  const [modal, setModal] = useState<{ lp: LP; typ: string } | null>(null)
  const [text, setText] = useState('')
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => { laden_() }, [])

  async function laden_() {
    const d = await fetch('/api/brief/feedbacks').then(r => r.json()) as FeedbackDaten
    setDaten(d)
  }

  function anfragenStarten(lp: LP) {
    const typ = `lehrjahr_${daten?.aktLehrjahr}` as string
    setModal({ lp, typ }); setText(''); setFehler('')
  }

  function hilfstext(t: string) {
    setText(prev => prev ? `${prev}\n${t}` : t)
  }

  async function absenden() {
    if (!modal || text.trim().length < 10) return
    setLaden(true); setFehler('')
    try {
      const res = await fetch('/api/brief/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lehrpersonId: modal.lp.id, typ: modal.typ, anfrage_text: text }),
      })
      if (!res.ok) { const d = await res.json() as {fehler?:string}; throw new Error(d.fehler ?? 'Fehler') }
      setModal(null)
      await laden_()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally { setLaden(false) }
  }

  if (!daten) return null
  const { lehrpersonen, anfragen, aktLehrjahr, istLetztesJahr, lehrabschluss } = daten
  const typLabel = `lehrjahr_${aktLehrjahr}`

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">
              {istLetztesJahr ? 'Abschluss-Feedback' : `Jahresfeedback ${aktLehrjahr}. Lehrjahr`}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {istLetztesJahr
                ? 'Im letzten Lehrjahr gibt es kein Jahresfeedback — die Lehrpersonen schreiben ein Abschluss-Feedback.'
                : `Fordere ein persönliches Feedback von deinen Lehrpersonen an.`}
            </p>
          </div>
        </div>

        {/* Lehrpersonen-Liste */}
        {!istLetztesJahr && lehrpersonen.map(lp => {
          const anfrage = anfragen.find(a => a.lehrperson_id === lp.id && a.typ === typLabel)
          return (
            <div key={lp.id} className={`rounded-xl border-2 px-4 py-3 ${
              anfrage?.status === 'geschrieben' ? 'border-green-300 bg-green-50' :
              anfrage ? 'border-blue-200 bg-blue-50' : 'border-stone-200 bg-white'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{lp.vorname} {lp.nachname}</p>
                  <p className="text-xs text-stone-400">{lp.fachbereich}</p>
                </div>
                {!anfrage ? (
                  <button onClick={() => anfragenStarten(lp)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex-shrink-0">
                    Feedback anfragen
                  </button>
                ) : anfrage.status === 'angefragt' ? (
                  <span className="text-xs text-blue-600 font-medium flex-shrink-0">⏳ Angefragt</span>
                ) : (
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">✓ Geschrieben</span>
                )}
              </div>
              {anfrage && (
                <p className="text-xs text-stone-500 mt-2 italic line-clamp-1">
                  «{anfrage.anfrage_text}»
                </p>
              )}
            </div>
          )
        })}

        {istLetztesJahr && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-xs text-indigo-700">
            Deine Lehrpersonen schreiben das Abschluss-Feedback und du erhältst es am{' '}
            <strong>{lehrabschluss}</strong> zusammen mit deinem Brief.
          </div>
        )}

        <p className="text-xs text-stone-400 text-center">
          Alle Feedbacks werden am Lehrabschluss ({lehrabschluss}) zusammen mit deinem Brief zugestellt.
        </p>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold">
                Feedback anfragen — {TYP_LABEL[modal.typ]}
              </h2>
              <p className="text-sm text-stone-500 mt-0.5">
                {modal.lp.vorname} {modal.lp.nachname} · {modal.lp.fachbereich}
              </p>
            </div>

            <div className="space-y-2">
              <label className="label">
                Zu was wünschst du dir Feedback?
              </label>
              <textarea
                className="input min-h-[120px] resize-none"
                placeholder="z.B. Ich wünsche mir Feedback zu meiner technischen Entwicklung und meinem Verhalten im Team…"
                value={text}
                onChange={e => setText(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-stone-400">{text.length} / 1000 · min. 10 Zeichen</p>
            </div>

            {/* Formulierungshilfen */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-stone-500">Formulierungshilfen (klicken zum Einfügen):</p>
              <div className="flex flex-wrap gap-1.5">
                {HILFSTEXTE.map((h, i) => (
                  <button key={i} onClick={() => hilfstext(h)}
                    className="text-xs bg-stone-100 hover:bg-indigo-100 hover:text-indigo-700 text-stone-600 rounded-lg px-2.5 py-1 transition-colors text-left">
                    {h.length > 55 ? h.slice(0, 55) + '…' : h}
                  </button>
                ))}
              </div>
            </div>

            {fehler && <p className="text-sm text-red-600">{fehler}</p>}

            <div className="flex justify-between gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Abbrechen</button>
              <button onClick={absenden} disabled={laden || text.trim().length < 10}
                className="btn-primary flex-1">
                {laden ? 'Sende…' : 'Feedback anfragen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
