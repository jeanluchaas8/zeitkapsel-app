'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

const TYPEN = ['lehrjahr_1','lehrjahr_2','lehrjahr_3','lehrjahr_4','abschluss'] as const
type Typ = typeof TYPEN[number]
type FilterTab = 'alle' | 'jahresfeedback' | 'abschluss'

const TYP_INFO: Record<Typ, { label: string; desc: string; icon: string }> = {
  lehrjahr_1: { label: '1. Lehrjahr',        desc: 'Feedback nach dem 1. Schuljahr',       icon: '1️⃣' },
  lehrjahr_2: { label: '2. Lehrjahr',        desc: 'Feedback nach dem 2. Schuljahr',       icon: '2️⃣' },
  lehrjahr_3: { label: '3. Lehrjahr',        desc: 'Feedback nach dem 3. Schuljahr',       icon: '3️⃣' },
  lehrjahr_4: { label: '4. Lehrjahr',        desc: 'Feedback nach dem 4. Schuljahr',       icon: '4️⃣' },
  abschluss:  { label: 'Abschluss-Feedback', desc: 'Persönliches Wort am Ende der Lehre',  icon: '🎓' },
}

interface FeedbackEintrag {
  id: string; typ: Typ; inhalt: string; aktualisiert_am: string; anfrage_text?: string; status: string
}

interface DatenAntwort {
  lernende: { vorname: string; nachname: string; klasse: string; lehrabschluss: string }
  eigene: FeedbackEintrag[]
  aktuellesLehrjahr: number
  lehrdauer: number
  abschlussSchreibbar: boolean
  brief: { inhalt: string | null; freigegeben: boolean; sichtbar: boolean | null }
  typTexte: Record<string, string>
}

export default function FeedbackSeite() {
  const { lernendeId } = useParams() as { lernendeId: string }
  const router = useRouter()
  const searchParams = useSearchParams()

  const [daten, setDaten] = useState<DatenAntwort | null>(null)
  const [aktiv, setAktiv] = useState<Typ | null>(null)
  const [text, setText] = useState('')
  const [laden, setLaden] = useState(false)
  const [gespeichert, setGespeichert] = useState(false)
  const [fehler, setFehler] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('alle')

  useEffect(() => {
    fetch(`/api/lehrperson/feedback?lernendeId=${lernendeId}`)
      .then(r => r.json())
      .then((d: DatenAntwort) => {
        setDaten(d)
        const oeffne = searchParams.get('oeffne') as Typ | null
        if (oeffne && TYPEN.includes(oeffne)) {
          const vorhandener = d.eigene.find((f: FeedbackEintrag) => f.typ === oeffne)
          setText(vorhandener?.inhalt ?? '')
          setAktiv(oeffne)
          setFilterTab(oeffne === 'abschluss' ? 'abschluss' : 'jahresfeedback')
        }
      })
      .catch(() => router.push('/lehrperson/dashboard'))
  }, [lernendeId, router, searchParams])

  function bearbeitenStarten(typ: Typ) {
    const vorhandener = daten?.eigene.find(f => f.typ === typ)
    setText(vorhandener?.inhalt ?? '')
    setAktiv(typ)
    setGespeichert(false)
    setFehler('')
  }

  async function speichern() {
    if (!aktiv || !text.trim()) return
    setLaden(true); setFehler('')
    try {
      const res = await fetch('/api/lehrperson/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lernendeId, typ: aktiv, inhalt: text }),
      })
      if (!res.ok) { const d = await res.json() as { fehler?: string }; throw new Error(d.fehler ?? 'Fehler') }
      const aktuell = await fetch(`/api/lehrperson/feedback?lernendeId=${lernendeId}`).then(r => r.json()) as DatenAntwort
      setDaten(aktuell)
      setGespeichert(true)
      setAktiv(null)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally { setLaden(false) }
  }

  async function loeschen(typ: Typ) {
    if (!confirm('Feedback löschen?')) return
    await fetch(`/api/lehrperson/feedback?lernendeId=${lernendeId}&typ=${typ}`, { method: 'DELETE' })
    const aktuell = await fetch(`/api/lehrperson/feedback?lernendeId=${lernendeId}`).then(r => r.json()) as DatenAntwort
    setDaten(aktuell)
  }

  if (!daten) return <div className="text-stone-400 p-8 text-center">Lade…</div>

  const { lernende, eigene, aktuellesLehrjahr, brief, abschlussSchreibbar } = daten
  const lehrdauer = Math.max(2, daten.lehrdauer ?? 2)
  const abschluss = new Date(lernende.lehrabschluss)
  const tageZumAbschluss = Math.ceil((abschluss.getTime() - Date.now()) / 86400000)

  // Jahrestypen: aktuelles Jahr + bereits geschriebene vergangene Jahre
  // → kein letztes Lehrjahr (= lehrdauer), keine zukünftigen Jahre
  const jahresTypen = TYPEN.filter(typ => {
    if (typ === 'abschluss') return false
    const nr = parseInt(typ.replace('lehrjahr_', ''))
    if (nr >= lehrdauer) return false      // letztes Jahr ausgeblendet
    if (nr === aktuellesLehrjahr) return true  // aktuelles Jahr immer anzeigen
    return eigene.some(f => f.typ === typ)  // vergangene nur wenn schon geschrieben
  })

  const anzeigeTypen: Typ[] =
    filterTab === 'jahresfeedback' ? jahresTypen :
    filterTab === 'abschluss'      ? ['abschluss'] :
    [...jahresTypen, 'abschluss']

  const jahresGeschrieben = eigene.filter(f => f.typ !== 'abschluss').length
  const abschlussGeschrieben = eigene.some(f => f.typ === 'abschluss')

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold mt-1">Feedback — {lernende.vorname} {lernende.nachname}</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {lernende.klasse} · {lehrdauer}-jährige Lehre · Abschluss {abschluss.toLocaleDateString('de-CH')}
        </p>
      </div>

      {/* Hinweis */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 space-y-1">
        <p className="font-medium">ℹ️ Wie funktioniert das Feedback?</p>
        <p>
          <strong>Jahresfeedbacks</strong> werden den Lernenden sofort nach dem Speichern sichtbar.{' '}
          Das <strong>Abschluss-Feedback</strong> erscheint erst am Lehrabschluss ({abschluss.toLocaleDateString('de-CH')}).
        </p>
        {tageZumAbschluss > 0 && tageZumAbschluss < 90 && (
          <p className="text-orange-700 font-medium">⚠️ Der Lehrabschluss ist in {tageZumAbschluss} Tagen.</p>
        )}
      </div>

      {/* Filter-Tabs */}
      <div className="flex gap-1.5 border-b border-stone-200">
        {([
          { key: 'alle' as FilterTab,           label: 'Alle Feedbacks',     geschrieben: jahresGeschrieben + (abschlussGeschrieben ? 1 : 0), total: jahresTypen.length + 1 },
          { key: 'jahresfeedback' as FilterTab, label: '📅 Jahresfeedback',  geschrieben: jahresGeschrieben, total: jahresTypen.length },
          { key: 'abschluss' as FilterTab,      label: '🎓 Abschluss',       geschrieben: abschlussGeschrieben ? 1 : 0, total: 1 },
        ]).map(tab => (
          <button key={tab.key} onClick={() => { setFilterTab(tab.key); setAktiv(null) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filterTab === tab.key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}>
            {tab.label}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
              filterTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-500'
            }`}>{tab.geschrieben}/{tab.total}</span>
          </button>
        ))}
      </div>

      {/* Feedback-Karten */}
      <div className="space-y-3">
        {anzeigeTypen.map(typ => {
          const info = TYP_INFO[typ]
          const vorhandener = eigene.find(f => f.typ === typ)
          const istAktiv = aktiv === typ
          const lehrjahrNr = parseInt(typ.replace('lehrjahr_', '')) || 99

          // Schreibbarkeit
          const hatAnfrage = vorhandener?.status === 'angefragt' || (vorhandener?.anfrage_text && vorhandener?.anfrage_text.length > 0)
          const istAktuellesJahr = lehrjahrNr === aktuellesLehrjahr
          const bereitsGeschrieben = vorhandener?.status === 'geschrieben'
          const kannSchreiben = typ === 'abschluss'
            ? abschlussSchreibbar
            : bereitsGeschrieben || (hatAnfrage && istAktuellesJahr)

          // Anfrage-Text (nur für Jahresfeedbacks relevant)
          const anfrageText = typ !== 'abschluss' ? vorhandener?.anfrage_text : null

          return (
            <div key={typ} className={`rounded-xl border-2 transition-all ${
              istAktiv        ? 'border-indigo-400 bg-white' :
              vorhandener?.status === 'geschrieben' ? 'border-green-300 bg-green-50' :
              hatAnfrage      ? 'border-amber-200 bg-amber-50/40' :
                                'border-stone-200 bg-white'
            }`}>
              {/* Karten-Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{info.icon}</span>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                      {info.label}
                      {vorhandener?.status === 'geschrieben' && (
                        <span className="rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5">✓ Geschrieben</span>
                      )}
                      {typ !== 'abschluss' && hatAnfrage && vorhandener?.status !== 'geschrieben' && (
                        <span className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5">📩 Anfrage</span>
                      )}
                      {typ === 'abschluss' && !abschlussSchreibbar && (
                        <span className="rounded-full bg-stone-100 text-stone-500 text-xs px-2 py-0.5">
                          🔒 ab {new Date(abschluss.getTime() - 30 * 86400000).toLocaleDateString('de-CH')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400">{info.desc}</p>
                  </div>
                </div>
                {!istAktiv && kannSchreiben && (
                  <button onClick={() => bearbeitenStarten(typ)}
                    className="text-xs text-stone-500 hover:text-stone-900 underline flex-shrink-0">
                    {vorhandener?.status === 'geschrieben' ? 'Bearbeiten' : 'Schreiben'}
                  </button>
                )}
                {!istAktiv && typ !== 'abschluss' && !hatAnfrage && (
                  <span className="text-xs text-stone-400 italic flex-shrink-0">Noch keine Anfrage</span>
                )}
              </div>

              {/* Anfrage-Text anzeigen (wenn vorhanden und nicht im Editor) */}
              {anfrageText && !istAktiv && (
                <div className="px-4 pb-3">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm">
                    <p className="text-xs font-semibold text-amber-700 mb-1">💬 Wunsch von {lernende.vorname}:</p>
                    <p className="text-stone-700 italic">«{anfrageText}»</p>
                  </div>
                </div>
              )}

              {/* Geschriebenes Feedback Vorschau */}
              {vorhandener?.status === 'geschrieben' && !istAktiv && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-stone-600 bg-white rounded-lg p-3 border border-stone-100 line-clamp-2">
                    {vorhandener.inhalt}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-stone-400">Bearbeitet: {new Date(vorhandener.aktualisiert_am).toLocaleDateString('de-CH')}</p>
                    <button onClick={() => loeschen(typ)} className="text-xs text-red-400 hover:text-red-700 underline">Löschen</button>
                  </div>
                </div>
              )}

              {/* Brief beim Abschluss-Feedback */}
              {istAktiv && typ === 'abschluss' && (
                <div className="px-4 pb-2">
                  {!brief.freigegeben ? (
                    <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 text-sm text-stone-500 space-y-1">
                      <p className="font-medium text-stone-700">🔒 Brief noch gesperrt</p>
                      <p>Sichtbar ab {new Date(abschluss.getTime() - 28 * 86400000).toLocaleDateString('de-CH')} (28 Tage vor Abschluss).</p>
                    </div>
                  ) : brief.sichtbar === false ? (
                    <div className="rounded-lg bg-stone-50 border border-stone-100 px-4 py-3 text-sm text-stone-400 italic">
                      {lernende.vorname} hat den Brief-Inhalt nicht für Lehrpersonen freigegeben.
                    </div>
                  ) : brief.inhalt ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Brief von {lernende.vorname}</p>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-serif max-h-64 overflow-y-auto">
                        {brief.inhalt}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Anfrage-Text im Editor sichtbar */}
              {istAktiv && anfrageText && (
                <div className="px-4 pb-2">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm">
                    <p className="text-xs font-semibold text-amber-700 mb-1">💬 Wunsch von {lernende.vorname}:</p>
                    <p className="text-stone-700 italic">«{anfrageText}»</p>
                  </div>
                </div>
              )}

              {/* Editor */}
              {istAktiv && (
                <div className="px-4 pb-4 space-y-3">
                  <textarea
                    className="input min-h-[160px] resize-y"
                    placeholder={`Persönliches Feedback für ${lernende.vorname} zum ${info.label}…`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400">{text.length} / 5.000 Zeichen</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAktiv(null)} className="btn-secondary text-sm">Abbrechen</button>
                      <button onClick={speichern} disabled={laden || text.trim().length < 10} className="btn-primary text-sm">
                        {laden ? 'Speichert…' : bereitsGeschrieben ? 'Aktualisieren' : 'Feedback speichern'}
                      </button>
                    </div>
                  </div>
                  {fehler && <p className="text-sm text-red-600">{fehler}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {gespeichert && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ Feedback gespeichert.{' '}
          {aktiv === 'abschluss' ? 'Wird am Lehrabschluss zugestellt.' : 'Sofort für die/den Lernenden sichtbar.'}
        </div>
      )}

      <p className="text-xs text-stone-400 text-center pb-4">
        Jahresfeedbacks sind sofort sichtbar · Abschluss-Feedback erst am {abschluss.toLocaleDateString('de-CH')}
      </p>
    </div>
  )
}
