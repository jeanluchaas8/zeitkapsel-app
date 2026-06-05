'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { LEHRPERSONEN_PDF } from './lehrpersonendaten'

interface Beruf { id: string; bezeichnung: string }
interface Props { berufe: Beruf[]; vorhandeneEmails: string[] }

const FACHBEREICHE = ['Berufskunde', 'Sport', 'Allgemeinbildung', 'Berufsmatura', 'Englisch', 'Mathematik']

type ZeileState = {
  ausgewaehlt: boolean
  vorname: string
  nachname: string
  email: string
  fachbereich: string
  beruf: string
}

export default function LehrpersonenImportForm({ berufe, vorhandeneEmails }: Props) {
  const router = useRouter()
  const [filter, setFilter] = useState('alle')
  const [suche, setSuche] = useState('')
  const [tempPasswort, setTempPasswort] = useState('Gibz2025!')
  const [laden, setLaden] = useState(false)
  const [ergebnis, setErgebnis] = useState<{ importiert: number; uebersprungen: number } | null>(null)
  const [fehler, setFehler] = useState('')

  const [zeilen, setZeilen] = useState<ZeileState[]>(() =>
    LEHRPERSONEN_PDF.map(lp => ({
      ausgewaehlt: false,
      vorname: lp.vorname,
      nachname: lp.nachname,
      email: '',
      fachbereich: lp.fachbereich,
      beruf: lp.beruf,
    }))
  )

  const gefiltert = useMemo(() => {
    return zeilen.map((z, i) => ({ ...z, idx: i })).filter(z => {
      if (filter !== 'alle' && z.fachbereich !== filter) return false
      if (suche) {
        const q = suche.toLowerCase()
        if (!z.nachname.toLowerCase().includes(q) && !z.vorname.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [zeilen, filter, suche])

  function zeileAendern(idx: number, feld: keyof ZeileState, wert: string | boolean) {
    setZeilen(prev => prev.map((z, i) => i === idx ? { ...z, [feld]: wert } : z))
  }

  function alleUmschalten(an: boolean) {
    const idxSet = new Set(gefiltert.map(g => g.idx))
    setZeilen(prev => prev.map((z, i) => idxSet.has(i) ? { ...z, ausgewaehlt: an } : z))
  }

  const ausgewaehlt = zeilen.filter(z => z.ausgewaehlt)
  const mitEmail = ausgewaehlt.filter(z => z.email.trim())
  const alleGefiltert = gefiltert.length > 0 && gefiltert.every(g => g.ausgewaehlt)

  async function importieren() {
    if (mitEmail.length === 0) { setFehler('Keine Lehrpersonen mit E-Mail ausgewählt.'); return }
    setLaden(true); setFehler(''); setErgebnis(null)
    try {
      const res = await fetch('/api/admin/lehrpersonen/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lehrpersonen: mitEmail.map(z => ({
            vorname: z.vorname, nachname: z.nachname, email: z.email.trim(),
            fachbereich: z.fachbereich, beruf: z.beruf, passwort: tempPasswort,
          })),
        }),
      })
      const data = await res.json() as { importiert?: number; uebersprungen?: number; fehler?: string }
      if (!res.ok) throw new Error(data.fehler ?? 'Fehler')
      setErgebnis({ importiert: data.importiert ?? 0, uebersprungen: data.uebersprungen ?? 0 })
      setZeilen(prev => prev.map(z => z.ausgewaehlt && z.email ? { ...z, ausgewaehlt: false } : z))
      router.refresh()
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally { setLaden(false) }
  }

  return (
    <div className="space-y-4">
      {/* Einstellungen */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <label className="label">Suche</label>
          <input className="input" placeholder="Name suchen…" value={suche} onChange={e => setSuche(e.target.value)} />
        </div>
        <div>
          <label className="label">Temporäres Passwort</label>
          <input className="input w-40" value={tempPasswort} onChange={e => setTempPasswort(e.target.value)} />
          <p className="text-xs text-stone-400 mt-1">Gilt für alle importierten Konten</p>
        </div>
        <div className="text-sm text-stone-500">
          <span className="font-medium text-stone-900">{ausgewaehlt.length}</span> ausgewählt,{' '}
          <span className="font-medium text-stone-900">{mitEmail.length}</span> mit E-Mail
        </div>
      </div>

      {/* Fachbereich-Filter */}
      <div className="flex flex-wrap gap-2">
        {['alle', ...FACHBEREICHE].map(fb => {
          const anzahl = fb === 'alle' ? zeilen.length : zeilen.filter(z => z.fachbereich === fb).length
          return (
            <button key={fb} onClick={() => setFilter(fb)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === fb ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}>
              {fb === 'alle' ? 'Alle' : fb} ({anzahl})
            </button>
          )
        })}
      </div>

      {/* Tabelle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100 bg-stone-50">
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input type="checkbox" checked={alleGefiltert} onChange={e => alleUmschalten(e.target.checked)} className="rounded" />
            Alle auswählen
          </label>
          <span className="text-xs text-stone-400">{gefiltert.length} Lehrpersonen</span>
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-100 sticky top-0 bg-white">
              <tr className="text-xs text-stone-500">
                <th className="w-10 px-3 py-2"></th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Fachbereich</th>
                <th className="px-3 py-2 text-left">Beruf</th>
                <th className="px-3 py-2 text-left">E-Mail <span className="text-red-400">*</span></th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map(z => (
                <tr key={z.idx} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={z.ausgewaehlt}
                      onChange={e => zeileAendern(z.idx, 'ausgewaehlt', e.target.checked)} className="rounded" />
                  </td>
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {z.vorname} {z.nachname}
                  </td>
                  <td className="px-3 py-2">
                    <select className="text-xs border border-stone-200 rounded px-2 py-1 bg-white"
                      value={z.fachbereich}
                      onChange={e => zeileAendern(z.idx, 'fachbereich', e.target.value)}>
                      {FACHBEREICHE.map(fb => <option key={fb}>{fb}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {z.fachbereich === 'Berufskunde' ? (
                      <select className="text-xs border border-stone-200 rounded px-2 py-1 bg-white max-w-48"
                        value={z.beruf}
                        onChange={e => zeileAendern(z.idx, 'beruf', e.target.value)}>
                        <option value="">— kein Beruf —</option>
                        {berufe.map(b => <option key={b.id} value={b.bezeichnung}>{b.bezeichnung}</option>)}
                      </select>
                    ) : <span className="text-stone-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="email"
                      className="text-xs border border-stone-200 rounded px-2 py-1.5 w-52 focus:border-indigo-400 focus:outline-none"
                      placeholder={`${z.vorname.toLowerCase().replace(/[\s.]/g,'')}.${z.nachname.toLowerCase()}@gibz.ch`}
                      value={z.email}
                      onChange={e => zeileAendern(z.idx, 'email', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ergebnis && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ <strong>{ergebnis.importiert}</strong> Lehrpersonen importiert
          {ergebnis.uebersprungen > 0 && `, ${ergebnis.uebersprungen} übersprungen`}.
        </div>
      )}
      {fehler && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{fehler}</div>}

      <div className="flex justify-between items-center">
        <p className="text-xs text-stone-400">
          Nur Lehrpersonen mit eingetragener E-Mail werden importiert. Status: <em>aktiv</em>.
        </p>
        <button onClick={importieren} disabled={laden || mitEmail.length === 0} className="btn-primary disabled:opacity-40">
          {laden ? 'Importiert…' : `${mitEmail.length} Lehrpersonen importieren`}
        </button>
      </div>
    </div>
  )
}
