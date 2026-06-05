'use client'

import { useState } from 'react'
import Link from 'next/link'

type Filter = 'alle' | 'jahresfeedback' | 'abschluss'

interface JahresFeedbackItem {
  art: 'jahresfeedback'
  id: string
  typ: string
  anfrage_text: string
  lernende_id: string
  vorname: string
  nachname: string
  klasse: string
}

interface AbschlussItem {
  art: 'abschluss'
  lernende_id: string
  vorname: string
  nachname: string
  klasse: string
  lehrabschluss: string
}

interface Props {
  jahresFeedbacks: Omit<JahresFeedbackItem, 'art'>[]
  abschlussFeedbacks: Omit<AbschlussItem, 'art'>[]
}

export function HandlungsbedarfPanel({ jahresFeedbacks, abschlussFeedbacks }: Props) {
  const [filter, setFilter] = useState<Filter>('alle')

  const anzahlJahres = jahresFeedbacks.length
  const anzahlAbschluss = abschlussFeedbacks.length
  const total = anzahlJahres + anzahlAbschluss

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle', count: total },
    { key: 'jahresfeedback', label: 'Jahresfeedback', count: anzahlJahres },
    { key: 'abschluss', label: 'Abschluss-Feedback', count: anzahlAbschluss },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">Feedbacks</h2>
        {total > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5">
            {total} ausstehend
          </span>
        )}
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-8 text-center text-stone-400 text-sm">
          Keine ausstehenden Feedbacks — alles erledigt. ✓
        </div>
      ) : (
        <>
          {/* Filter-Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.filter(t => t.key === 'alle' || t.count > 0).map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === t.key
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {t.key === 'jahresfeedback' && '📅 '}
                {t.key === 'abschluss' && '🎓 '}
                {t.label}
                {t.count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    filter === t.key ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Jahresfeedbacks */}
          {(filter === 'alle' || filter === 'jahresfeedback') && jahresFeedbacks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                📅 Jahresfeedback
                <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 normal-case font-medium">
                  {jahresFeedbacks.length}
                </span>
              </p>
              <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-amber-100 bg-amber-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-amber-800 text-xs">Lernende/r</th>
                      <th className="px-4 py-2.5 text-left font-medium text-amber-800 text-xs">Lehrjahr</th>
                      <th className="px-4 py-2.5 text-left font-medium text-amber-800 text-xs">Anfrage</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(jahresFeedbacks as JahresFeedbackItem[]).map(f => (
                      <tr key={f.id} className="border-b border-stone-100 last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {f.vorname} {f.nachname}
                          <span className="ml-1 text-xs text-stone-400">{f.klasse}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5">
                            {f.typ.replace('lehrjahr_', '')}. Lehrjahr
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-xs max-w-xs">
                          <span className="line-clamp-1 italic">«{f.anfrage_text}»</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/lehrperson/lernende/${f.lernende_id}/feedback?oeffne=${f.typ}`}
                            className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 whitespace-nowrap">
                            Schreiben
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Abschluss-Feedbacks */}
          {(filter === 'alle' || filter === 'abschluss') && abschlussFeedbacks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                🎓 Abschluss-Feedback
                <span className="rounded-full bg-indigo-100 text-indigo-700 px-1.5 py-0.5 normal-case font-medium">
                  {abschlussFeedbacks.length}
                </span>
              </p>
              <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="border-b border-indigo-100 bg-indigo-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-indigo-800 text-xs">Lernende/r</th>
                      <th className="px-4 py-2.5 text-left font-medium text-indigo-800 text-xs">Abschluss am</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(abschlussFeedbacks as AbschlussItem[]).map(f => {
                      const tage = Math.ceil((new Date(f.lehrabschluss).getTime() - Date.now()) / 86400000)
                      return (
                        <tr key={f.lernende_id} className="border-b border-stone-100 last:border-0">
                          <td className="px-4 py-3 font-medium">
                            {f.vorname} {f.nachname}
                            <span className="ml-1 text-xs text-stone-400">{f.klasse}</span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className={tage <= 28 ? 'text-red-600 font-medium' : 'text-stone-500'}>
                              {new Date(f.lehrabschluss).toLocaleDateString('de-CH')}
                              {tage <= 28 && ` · noch ${tage} Tage`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/lehrperson/lernende/${f.lernende_id}/feedback?oeffne=abschluss`}
                              className="text-xs bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 whitespace-nowrap">
                              Schreiben
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
