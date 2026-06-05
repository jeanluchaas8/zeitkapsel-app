'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Klasse {
  id: string
  bezeichnung: string
  beruf: string
  lehrstart: string
  lehrabschluss: string
  anzahl_lernende: number
  lehrpersonen: string
}

export default function KlassenTabelle({ klassen }: { klassen: Klasse[] }) {
  const [sucheKlasse, setSucheKlasse] = useState('')
  const [sucheLehrperson, setSucheLehrperson] = useState('')

  const gefiltert = useMemo(() => {
    return klassen.filter(k => {
      if (sucheKlasse) {
        const q = sucheKlasse.toLowerCase()
        if (
          !k.bezeichnung.toLowerCase().includes(q) &&
          !k.beruf.toLowerCase().includes(q)
        ) return false
      }
      if (sucheLehrperson) {
        const q = sucheLehrperson.toLowerCase()
        if (!k.lehrpersonen.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [klassen, sucheKlasse, sucheLehrperson])

  return (
    <div className="space-y-4">
      {/* Filterzeile */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <label className="label">Klasse / Beruf</label>
          <input
            className="input"
            placeholder="z.B. INFA oder Informatik…"
            value={sucheKlasse}
            onChange={e => setSucheKlasse(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-48">
          <label className="label">Lehrperson</label>
          <input
            className="input"
            placeholder="Name der Lehrperson…"
            value={sucheLehrperson}
            onChange={e => setSucheLehrperson(e.target.value)}
          />
        </div>
        {(sucheKlasse || sucheLehrperson) && (
          <div className="flex items-end">
            <button
              className="btn-secondary text-sm"
              onClick={() => { setSucheKlasse(''); setSucheLehrperson('') }}
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Tabelle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Bezeichnung</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Beruf</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Lehrpersonen</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Lehrstart</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Abschluss</th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Lernende</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {gefiltert.map(k => (
              <tr key={k.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium">{k.bezeichnung}</td>
                <td className="px-4 py-3 text-stone-600 max-w-48 truncate" title={k.beruf}>{k.beruf}</td>
                <td className="px-4 py-3 text-stone-500 text-xs">
                  {k.lehrpersonen
                    ? k.lehrpersonen.split(', ').map((lp, i) => (
                        <span key={i} className="inline-block bg-stone-100 rounded px-1.5 py-0.5 mr-1 mb-0.5">{lp}</span>
                      ))
                    : <span className="text-stone-300">—</span>
                  }
                </td>
                <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                  {new Date(k.lehrstart).toLocaleDateString('de-CH')}
                </td>
                <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                  {new Date(k.lehrabschluss).toLocaleDateString('de-CH')}
                </td>
                <td className="px-4 py-3 text-center">{k.anzahl_lernende}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/klassen/${k.id}/lehrpersonen`}
                    className="text-xs text-stone-600 hover:text-stone-900 underline whitespace-nowrap"
                  >
                    Zuweisen
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {gefiltert.length === 0 && (
          <div className="py-12 text-center text-stone-400 text-sm">
            {klassen.length === 0 ? 'Noch keine Klassen erfasst.' : 'Keine Klassen entsprechen dem Filter.'}
          </div>
        )}
      </div>
      {gefiltert.length > 0 && klassen.length > 0 && (
        <p className="text-xs text-stone-400 text-right">
          {gefiltert.length} von {klassen.length} Klassen
        </p>
      )}
    </div>
  )
}
