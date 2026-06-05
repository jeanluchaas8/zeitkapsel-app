'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  klasseId: string
}

export function LernenderEinladenFormular({ klasseId }: Props) {
  const [offen, setOffen] = useState(false)
  const [form, setForm] = useState({ vorname: '', nachname: '', email: '' })
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [erfolg, setErfolg] = useState('')
  const router = useRouter()

  async function absenden(e: React.FormEvent) {
    e.preventDefault()
    setLaden(true)
    setFehler('')
    setErfolg('')
    try {
      const res = await fetch(`/api/lehrperson/klassen/${klasseId}/einladen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json() as { fehler?: string }
      if (!res.ok) throw new Error(d.fehler ?? 'Fehler')
      setErfolg(`${form.vorname} ${form.nachname} wurde eingeladen und erhält eine E-Mail.`)
      setForm({ vorname: '', nachname: '', email: '' })
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLaden(false)
    }
  }

  if (!offen) {
    return (
      <button
        onClick={() => setOffen(true)}
        className="btn-primary text-sm"
      >
        + Lernende/n einladen
      </button>
    )
  }

  return (
    <div className="card space-y-4 border-indigo-200 bg-indigo-50/30">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Lernende/n einladen</h3>
        <button onClick={() => { setOffen(false); setFehler(''); setErfolg('') }}
          className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
      </div>

      {erfolg && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✓ {erfolg}
        </div>
      )}

      <form onSubmit={absenden} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vorname</label>
            <input className="input" required value={form.vorname}
              onChange={e => setForm(f => ({ ...f, vorname: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nachname</label>
            <input className="input" required value={form.nachname}
              onChange={e => setForm(f => ({ ...f, nachname: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">E-Mail-Adresse</label>
          <input className="input" type="email" required value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="vorname.nachname@schule.ch" />
        </div>

        {fehler && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setOffen(false)} className="btn-secondary text-sm">
            Abbrechen
          </button>
          <button type="submit" disabled={laden} className="btn-primary text-sm">
            {laden ? 'Einladen…' : 'Einladen & E-Mail senden'}
          </button>
        </div>
      </form>

      <p className="text-xs text-stone-400">
        Die lernende Person erhält eine E-Mail und kann sich mit dieser Adresse anmelden.
      </p>
    </div>
  )
}
