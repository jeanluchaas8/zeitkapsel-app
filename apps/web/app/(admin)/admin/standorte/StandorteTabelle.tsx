'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { StandortRow } from './page'

// Foto-Thumbnail mit Fallback
function FotoThumb({ foto, alt, emoji }: { foto: string; alt: string; emoji: string }) {
  const [fehler, setFehler] = useState(!foto)
  if (fehler) {
    return (
      <div className="w-14 h-10 rounded bg-gradient-to-br from-indigo-900 to-slate-700 flex items-center justify-center text-lg flex-shrink-0">
        {emoji}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt={alt} onError={() => setFehler(true)}
      className="w-14 h-10 rounded object-cover flex-shrink-0 border border-stone-200" />
  )
}

// Vorschau-Modal (zeigt die Karte wie Lernende sie sehen)
function VorschauModal({ s, onClose }: { s: StandortRow; onClose: () => void }) {
  const [fotoFehler, setFotoFehler] = useState(!s.foto)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-slate-900 px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🛸</span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{s.ort}</p>
            <p className="text-indigo-300 text-xs">{s.land} · {s.temp}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg">✕</button>
        </div>

        {/* Foto */}
        {!fotoFehler ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.foto} alt={s.foto_alt} className="w-full h-52 object-cover"
            onError={() => setFotoFehler(true)} />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 flex flex-col items-center justify-center gap-2">
            <span className="text-5xl">{s.emoji}</span>
            <p className="text-white/60 text-sm">{s.ort}</p>
            <p className="text-red-400 text-xs">⚠ Kein Bild verfügbar</p>
          </div>
        )}

        {/* Info */}
        <div className="p-4 space-y-3 bg-gradient-to-b from-indigo-50 to-white">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KAT_FARBE[s.kategorie] ?? 'bg-stone-100 text-stone-600'}`}>{s.kategorie}</span>
            <span className="text-xs text-stone-400">{s.kontinent}</span>
            <span className="text-xs text-stone-400">· {s.lat.toFixed(2)}°, {s.lng.toFixed(2)}°</span>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">{s.info}</p>
          {s.link && (
            <a href={s.link} target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 underline">
              {s.link_text || s.link} →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

const KATEGORIEN = ['Alle', 'Kultur', 'Wissenschaft', 'Sport', 'Politik & Geschichte', 'Wirtschaft', 'Natur', 'Architektur', 'Sonstiges']
const LEER_EINTRAG: Omit<StandortRow, 'id' | 'erstellt_am' | 'aktiv'> = {
  ort: '', land: '', kontinent: '', kategorie: 'Kultur', emoji: '📍',
  info: '', temp: '', lat: 0, lng: 0, foto: '', foto_alt: '', wiki_titel: '', link: '', link_text: '',
}

const KAT_FARBE: Record<string, string> = {
  'Kultur': 'bg-purple-100 text-purple-700',
  'Wissenschaft': 'bg-blue-100 text-blue-700',
  'Sport': 'bg-green-100 text-green-700',
  'Politik & Geschichte': 'bg-red-100 text-red-700',
  'Wirtschaft': 'bg-yellow-100 text-yellow-700',
  'Natur': 'bg-emerald-100 text-emerald-700',
  'Architektur': 'bg-orange-100 text-orange-700',
  'Sonstiges': 'bg-stone-100 text-stone-600',
}

interface Props {
  standorte: StandortRow[]
  kategorien: string[]
  kontinente: string[]
  laender: string[]
  filterKategorie: string
  filterKontinent: string
  filterSuche: string
}

export function StandorteTabelle({ standorte, kategorien, kontinente, laender, filterKategorie, filterKontinent, filterSuche }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const [vorschauId, setVorschauId] = useState<string | null>(null)
  const vorschauStandort = standorte.find(s => s.id === vorschauId)
  const [bearbeitenId, setBearbeitenId] = useState<string | 'neu' | null>(null)
  const [formData, setFormData] = useState<Omit<StandortRow, 'id' | 'erstellt_am' | 'aktiv'>>(LEER_EINTRAG)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [loeschenId, setLoeschenId] = useState<string | null>(null)
  const [bildLadenId, setBildLadenId] = useState<string | null>(null)
  const [bulkLaeden, setBulkLaden] = useState(false)
  const [bulkMeldung, setBulkMeldung] = useState('')

  // Quiz-Felder (immer 1 Punkt)
  const LEER_QUIZ = { frage: '', antwort_a: '', antwort_b: '', antwort_c: '', antwort_d: '', richtig: 'a' }
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quiz, setQuiz] = useState(LEER_QUIZ)
  const [hatQuiz, setHatQuiz] = useState(false)
  const [wikiText, setWikiText] = useState('')
  const [wikiLaden, setWikiLaden] = useState(false)

  async function bildLaden(id: string) {
    setBildLadenId(id)
    try {
      const res = await fetch(`/api/admin/standorte/${id}/bild-laden`, { method: 'POST' })
      const d = await res.json() as { foto?: string; fehler?: string }
      if (!res.ok) alert(d.fehler ?? 'Kein Bild gefunden')
      else router.refresh()
    } finally { setBildLadenId(null) }
  }

  async function alleReparieren() {
    setBulkLaden(true)
    setBulkMeldung('Lade Bilder… (dauert ca. 1-2 Minuten)')
    try {
      const res = await fetch('/api/admin/standorte/bulk/bild-laden', { method: 'PATCH' })
      const d = await res.json() as { repariert?: number; gesamt?: number }
      setBulkMeldung(`✓ ${d.repariert} von ${d.gesamt} Einträgen repariert`)
      router.refresh()
    } catch { setBulkMeldung('Fehler beim Laden') }
    finally { setBulkLaden(false) }
  }

  // Filter ändern
  function filterSetzen(key: string, value: string) {
    const params = new URLSearchParams()
    if (key !== 'kategorie' && filterKategorie) params.set('kategorie', filterKategorie)
    if (key !== 'kontinent' && filterKontinent) params.set('kontinent', filterKontinent)
    if (key !== 'suche' && filterSuche) params.set('suche', filterSuche)
    if (value) params.set(key, value)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function bearbeitenStarten(s: StandortRow) {
    setFormData({ ort: s.ort, land: s.land, kontinent: s.kontinent, kategorie: s.kategorie,
      emoji: s.emoji, info: s.info, temp: s.temp, lat: s.lat, lng: s.lng,
      foto: s.foto, foto_alt: s.foto_alt, wiki_titel: s.wiki_titel, link: s.link, link_text: s.link_text })
    setBearbeitenId(s.id)
    setFehler('')
    // Quiz laden
    setQuiz(LEER_QUIZ); setQuizId(null); setHatQuiz(false); setWikiText('')
    try {
      const d = await fetch(`/api/admin/quiz?standortId=${s.id}`).then(r => r.json()) as Array<{id:string;frage:string;antwort_a:string;antwort_b:string;antwort_c:string;antwort_d:string;richtig:string}>
      if (d[0]) {
        setQuizId(d[0].id)
        setQuiz({ frage: d[0].frage, antwort_a: d[0].antwort_a, antwort_b: d[0].antwort_b, antwort_c: d[0].antwort_c, antwort_d: d[0].antwort_d, richtig: d[0].richtig })
        setHatQuiz(true)
      }
    } catch { /* kein Quiz */ }
  }

  async function wikiTextLaden(wikiTitel: string) {
    if (!wikiTitel) return
    setWikiLaden(true); setWikiText('')
    try {
      const d = await fetch(`/api/admin/wiki-extract?titel=${encodeURIComponent(wikiTitel)}`).then(r => r.json()) as { extract?: string; title?: string; deUrl?: string }
      setWikiText(d.extract ?? 'Kein Text gefunden.')
    } catch { setWikiText('Fehler beim Laden.') }
    finally { setWikiLaden(false) }
  }

  function neuStarten() {
    setFormData({ ...LEER_EINTRAG })
    setBearbeitenId('neu')
    setFehler('')
    setQuiz(LEER_QUIZ); setQuizId(null); setHatQuiz(false); setWikiText('')
  }

  async function speichern() {
    setLaden(true)
    setFehler('')
    try {
      const body = { ...formData, lat: Number(formData.lat), lng: Number(formData.lng) }
      let standortId = bearbeitenId === 'neu' ? '' : bearbeitenId!
      const res = bearbeitenId === 'neu'
        ? await fetch('/api/admin/standorte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, aktiv: true }) })
        : await fetch(`/api/admin/standorte/${bearbeitenId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json() as { fehler?: string }; throw new Error(d.fehler ?? 'Fehler') }
      if (bearbeitenId === 'neu') { const d = await res.json() as { id: string }; standortId = d.id }

      // Quiz speichern wenn ausgefüllt
      if (hatQuiz && quiz.frage.trim()) {
        const quizBody = { ...quiz, punkte: 1, standortId }
        if (quizId) {
          await fetch(`/api/admin/quiz/${quizId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quiz) })
        } else {
          await fetch('/api/admin/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(quizBody) })
        }
      } else if (!hatQuiz && quizId) {
        // Quiz entfernen wenn Checkbox deaktiviert
        await fetch(`/api/admin/quiz/${quizId}`, { method: 'DELETE' })
      }

      setBearbeitenId(null)
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLaden(false)
    }
  }

  async function loeschen(id: string) {
    setLaden(true)
    await fetch(`/api/admin/standorte/${id}`, { method: 'DELETE' })
    setLoeschenId(null)
    setLaden(false)
    router.refresh()
  }

  const f = formData

  return (
    <>
      {/* Filter + Neu-Button */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="label">Suche</label>
          <input className="input" placeholder="Ort, Info, Land…" defaultValue={filterSuche}
            onChange={(e) => filterSetzen('suche', e.target.value)} />
        </div>
        <div>
          <label className="label">Kategorie</label>
          <select className="input" value={filterKategorie} onChange={(e) => filterSetzen('kategorie', e.target.value)}>
            <option value="">Alle Kategorien</option>
            {kategorien.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Kontinent</label>
          <select className="input" value={filterKontinent} onChange={(e) => filterSetzen('kontinent', e.target.value)}>
            <option value="">Alle Kontinente</option>
            {kontinente.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <button onClick={neuStarten} className="btn-primary self-end">+ Neuer Standort</button>
        <button onClick={alleReparieren} disabled={bulkLaeden}
          className="btn-secondary self-end text-sm" title="Alle Einträge ohne Bild automatisch von Wikipedia laden">
          {bulkLaeden ? '⏳ Lade…' : '🔄 Alle Bilder von Wikipedia laden'}
        </button>
      </div>
      {bulkMeldung && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">{bulkMeldung}</div>
      )}

      {/* Tabelle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-stone-600">Foto</th>
              <th className="px-3 py-2 text-left font-medium text-stone-600">Ort</th>
              <th className="px-3 py-2 text-left font-medium text-stone-600">Land</th>
              <th className="px-3 py-2 text-left font-medium text-stone-600">Kontinent</th>
              <th className="px-3 py-2 text-left font-medium text-stone-600">Kategorie</th>
              <th className="px-3 py-2 text-left font-medium text-stone-600 max-w-xs">Info (Ausschnitt)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {standorte.map((s) => (
              <tr key={s.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-3 py-2">
                  <FotoThumb foto={s.foto} alt={s.foto_alt} emoji={s.emoji} />
                </td>
                <td className="px-3 py-2 font-medium">{s.ort}</td>
                <td className="px-3 py-2 text-stone-500 text-xs">{s.land}</td>
                <td className="px-3 py-2 text-stone-500 text-xs">{s.kontinent}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KAT_FARBE[s.kategorie] ?? 'bg-stone-100 text-stone-600'}`}>
                    {s.kategorie}
                  </span>
                </td>
                <td className="px-3 py-2 text-stone-500 text-xs max-w-xs">
                  <span className="line-clamp-2">{s.info.slice(0, 100)}…</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setVorschauId(s.id)}
                      className="text-xs text-indigo-500 hover:text-indigo-800 underline">Vorschau</button>
                    <button onClick={() => bildLaden(s.id)} disabled={bildLadenId === s.id}
                      className="text-xs text-emerald-600 hover:text-emerald-800 underline"
                      title="Bild automatisch von Wikipedia laden">
                      {bildLadenId === s.id ? '⏳' : '🖼'}
                    </button>
                    <button onClick={() => bearbeitenStarten(s)}
                      className="text-xs text-stone-500 hover:text-stone-900 underline">Bearbeiten</button>
                    <button onClick={() => setLoeschenId(s.id)}
                      className="text-xs text-red-400 hover:text-red-700 underline">Löschen</button>
                  </div>
                </td>
              </tr>
            ))}
            {standorte.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-stone-400">Keine Standorte gefunden.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vorschau-Modal */}
      {vorschauId && vorschauStandort && (
        <VorschauModal s={vorschauStandort} onClose={() => setVorschauId(null)} />
      )}

      {/* Bearbeiten/Neu Modal */}
      {bearbeitenId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl my-4">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-100">
              <h2 className="text-lg font-semibold">{bearbeitenId === 'neu' ? 'Neuer Standort' : 'Standort bearbeiten'}</h2>
              <button onClick={() => setBearbeitenId(null)} className="text-stone-400 hover:text-stone-900 text-xl">✕</button>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ort *</label>
                  <input className="input" value={f.ort} onChange={(e) => setFormData(d => ({ ...d, ort: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Emoji</label>
                  <input className="input" value={f.emoji} onChange={(e) => setFormData(d => ({ ...d, emoji: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Land *</label>
                  <input className="input" value={f.land} onChange={(e) => setFormData(d => ({ ...d, land: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Kontinent</label>
                  <select className="input" value={f.kontinent} onChange={(e) => setFormData(d => ({ ...d, kontinent: e.target.value }))}>
                    <option value="">Wählen…</option>
                    {['Europa','Asien','Afrika','Nordamerika','Südamerika','Ozeanien','Antarktis','Weltraum'].map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Kategorie</label>
                  <select className="input" value={f.kategorie} onChange={(e) => setFormData(d => ({ ...d, kategorie: e.target.value }))}>
                    {KATEGORIEN.filter(k => k !== 'Alle').map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Temperatur</label>
                  <input className="input" placeholder="z.B. +12 °C" value={f.temp} onChange={(e) => setFormData(d => ({ ...d, temp: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Breitengrad (lat)</label>
                  <input type="number" step="0.001" className="input" value={f.lat} onChange={(e) => setFormData(d => ({ ...d, lat: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="label">Längengrad (lng)</label>
                  <input type="number" step="0.001" className="input" value={f.lng} onChange={(e) => setFormData(d => ({ ...d, lng: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div>
                <label className="label">Info-Text *</label>
                <textarea className="input min-h-[100px] resize-y" value={f.info} onChange={(e) => setFormData(d => ({ ...d, info: e.target.value }))} />
              </div>
              <div>
                <label className="label">Foto-URL (Wikimedia Commons)</label>
                <input className="input text-xs" placeholder="https://commons.wikimedia.org/…" value={f.foto} onChange={(e) => setFormData(d => ({ ...d, foto: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Foto Alt-Text</label>
                  <input className="input" value={f.foto_alt} onChange={(e) => setFormData(d => ({ ...d, foto_alt: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Wikipedia-Artikeltitel (EN)</label>
                  <input className="input" placeholder="z.B. Eiffel_Tower" value={f.wiki_titel} onChange={(e) => setFormData(d => ({ ...d, wiki_titel: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Link (Wikipedia DE)</label>
                  <input className="input text-xs" value={f.link} onChange={(e) => setFormData(d => ({ ...d, link: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Link-Text</label>
                  <input className="input" value={f.link_text} onChange={(e) => setFormData(d => ({ ...d, link_text: e.target.value }))} />
                </div>
              </div>
              {/* ── Quiz ───────────────────────────────────────────────── */}
              <div className="border-t border-stone-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={hatQuiz}
                      onChange={e => setHatQuiz(e.target.checked)}
                      className="w-4 h-4" />
                    <span className="font-semibold text-sm">🎯 Quiz-Frage (1 Punkt)</span>
                  </label>
                  {f.wiki_titel && (
                    <button type="button" onClick={() => wikiTextLaden(f.wiki_titel)}
                      disabled={wikiLaden}
                      className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                      {wikiLaden ? '⏳ Lade…' : '📖 Wikipedia-Artikel anzeigen'}
                    </button>
                  )}
                </div>

                {/* Wikipedia-Artikel als Referenz */}
                {wikiText && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-1">
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Wikipedia-Einleitung (Grundlage für die Frage)</p>
                    <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">{wikiText}</p>
                    <button type="button" onClick={() => setWikiText('')}
                      className="text-xs text-stone-400 hover:text-stone-600">Ausblenden</button>
                  </div>
                )}

                {hatQuiz && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                    <div>
                      <label className="label">Frage (basierend auf dem Wikipedia-Artikel)</label>
                      <textarea className="input bg-white" rows={2}
                        placeholder="z.B. Wie viele Saatgutproben lagern im Svalbard Global Seed Vault?"
                        value={quiz.frage}
                        onChange={e => setQuiz(q => ({...q, frage: e.target.value}))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['a','b','c','d'] as const).map(b => (
                        <div key={b} className={`rounded-lg border-2 p-2 transition-colors ${quiz.richtig === b ? 'border-green-400 bg-green-50' : 'border-stone-200 bg-white'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-xs font-bold ${quiz.richtig === b ? 'text-green-600' : 'text-stone-400'}`}>
                              {b.toUpperCase()})
                            </span>
                            <button type="button"
                              onClick={() => setQuiz(q => ({...q, richtig: b}))}
                              className={`text-xs rounded px-1.5 py-0.5 transition-colors ${quiz.richtig === b ? 'bg-green-200 text-green-700 font-medium' : 'bg-stone-100 text-stone-500 hover:bg-green-100'}`}>
                              {quiz.richtig === b ? '✓ Richtig' : 'Richtig?'}
                            </button>
                          </div>
                          <input className="w-full text-sm border-0 bg-transparent focus:outline-none p-0"
                            placeholder={`Antwort ${b.toUpperCase()}…`}
                            value={quiz[`antwort_${b}` as keyof typeof quiz] as string}
                            onChange={e => setQuiz(q => ({...q, [`antwort_${b}`]: e.target.value}))} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}
            </div>
            <div className="flex justify-between px-6 pb-5 pt-3 border-t border-stone-100">
              <button onClick={() => setBearbeitenId(null)} className="btn-secondary">Abbrechen</button>
              <button onClick={speichern} disabled={laden} className="btn-primary">
                {laden ? 'Speichert…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Löschen-Bestätigung */}
      {loeschenId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold">Standort löschen?</h2>
            <p className="text-sm text-stone-500">
              Dieser Standort wird dauerhaft gelöscht und erscheint nicht mehr in der Zeitkapsel-Karte.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setLoeschenId(null)} className="btn-secondary flex-1">Abbrechen</button>
              <button onClick={() => loeschen(loeschenId)} disabled={laden}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {laden ? 'Löscht…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
