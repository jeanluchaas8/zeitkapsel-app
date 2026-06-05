'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface QuizFrage {
  id: string
  frage: string
  antwort_a: string
  antwort_b: string
  antwort_c: string
  antwort_d: string
  richtig: string
  punkte: number
}

const LEER: Omit<QuizFrage, 'id'> = {
  frage: '', antwort_a: '', antwort_b: '', antwort_c: '', antwort_d: '', richtig: 'a', punkte: 3
}

export default function StandortQuizSeite() {
  const { id } = useParams() as { id: string }
  const [ort, setOrt] = useState('')
  const [fragen, setFragen] = useState<QuizFrage[]>([])
  const [form, setForm] = useState(LEER)
  const [bearbeitenId, setBearbeitenId] = useState<string | 'neu' | null>(null)
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    fetch(`/api/admin/standorte?id=${id}`).then(r => r.json()).then((d: {ort?: string}[]) => setOrt(d[0]?.ort ?? ''))
    laden_()
  }, [id])

  async function laden_() {
    const d = await fetch(`/api/admin/quiz?standortId=${id}`).then(r => r.json()) as QuizFrage[]
    setFragen(d)
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true); setFehler('')
    const method = bearbeitenId === 'neu' ? 'POST' : 'PATCH'
    const url = bearbeitenId === 'neu' ? '/api/admin/quiz' : `/api/admin/quiz/${bearbeitenId}`
    const body = bearbeitenId === 'neu' ? { ...form, standortId: id } : form
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json() as {fehler?: string}; setFehler(d.fehler ?? 'Fehler') }
    else { setBearbeitenId(null); await laden_() }
    setLaden(false)
  }

  async function loeschen(fragenId: string) {
    if (!confirm('Frage löschen?')) return
    await fetch(`/api/admin/quiz/${fragenId}`, { method: 'DELETE' })
    await laden_()
  }

  const f = form

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin/standorte" className="text-stone-400 hover:text-stone-900 text-sm">← Standorte</Link>
        <h1 className="text-2xl font-bold mt-1">Quiz-Fragen</h1>
        <p className="text-stone-500 text-sm mt-0.5">{ort}</p>
      </div>

      {/* Bestehende Fragen */}
      {fragen.map(q => (
        <div key={q.id} className="card space-y-2">
          <p className="font-semibold text-sm">{q.frage}</p>
          {(['a','b','c','d'] as const).map(b => (
            <p key={b} className={`text-sm ${q.richtig === b ? 'text-green-700 font-medium' : 'text-stone-500'}`}>
              {q.richtig === b ? '✓' : '○'} {b.toUpperCase()}) {q[`antwort_${b}`]}
            </p>
          ))}
          <p className="text-xs text-stone-400">{q.punkte} Punkte</p>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setForm({ frage: q.frage, antwort_a: q.antwort_a, antwort_b: q.antwort_b, antwort_c: q.antwort_c, antwort_d: q.antwort_d, richtig: q.richtig, punkte: q.punkte }); setBearbeitenId(q.id) }}
              className="text-xs text-stone-500 underline hover:text-stone-900">Bearbeiten</button>
            <button onClick={() => loeschen(q.id)} className="text-xs text-red-400 underline hover:text-red-700">Löschen</button>
          </div>
        </div>
      ))}

      {fragen.length === 0 && (
        <p className="text-stone-400 text-sm text-center py-4">Noch keine Fragen für diesen Standort.</p>
      )}

      {/* Formular */}
      {bearbeitenId !== null ? (
        <form onSubmit={speichern} className="card space-y-4">
          <h2 className="font-semibold">{bearbeitenId === 'neu' ? 'Neue Frage' : 'Frage bearbeiten'}</h2>
          <div>
            <label className="label">Frage *</label>
            <textarea className="input" required value={f.frage} onChange={e => setForm(d => ({...d, frage: e.target.value}))} />
          </div>
          {(['a','b','c','d'] as const).map(b => (
            <div key={b}>
              <label className="label">Antwort {b.toUpperCase()}</label>
              <input className="input" required value={f[`antwort_${b}`]} onChange={e => setForm(d => ({...d, [`antwort_${b}`]: e.target.value}))} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Richtige Antwort</label>
              <select className="input" value={f.richtig} onChange={e => setForm(d => ({...d, richtig: e.target.value}))}>
                <option value="a">A</option><option value="b">B</option>
                <option value="c">C</option><option value="d">D</option>
              </select>
            </div>
            <div>
              <label className="label">Punkte bei richtiger Antwort</label>
              <input type="number" className="input" value={f.punkte} min={1} max={10}
                onChange={e => setForm(d => ({...d, punkte: parseInt(e.target.value) || 3}))} />
            </div>
          </div>
          {fehler && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>}
          <div className="flex justify-between">
            <button type="button" onClick={() => setBearbeitenId(null)} className="btn-secondary">Abbrechen</button>
            <button type="submit" disabled={laden} className="btn-primary">{laden ? 'Speichert…' : 'Speichern'}</button>
          </div>
        </form>
      ) : (
        <button onClick={() => { setForm(LEER); setBearbeitenId('neu') }} className="btn-primary w-full">
          + Neue Frage erfassen
        </button>
      )}
    </div>
  )
}
