'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Lehrperson {
  id: string
  vorname: string
  nachname: string
  fachbereich: string
}

interface LpAuswahl {
  lehrperson_id: string
  brief_sichtbar: boolean
}

interface Props {
  lehrpersonen: Lehrperson[]
  aktuelleAuswahl: LpAuswahl[]
  briefId: string
  gesperrt: boolean
}

export function EinstellungenFormular({ lehrpersonen, aktuelleAuswahl, gesperrt }: Props) {
  // Zustand: Map<lehrperson_id, { kommentar: boolean, brief_sichtbar: boolean }>
  const [auswahl, setAuswahl] = useState<Map<string, { kommentar: boolean; brief_sichtbar: boolean }>>(
    new Map(aktuelleAuswahl.map((a) => [a.lehrperson_id, { kommentar: true, brief_sichtbar: a.brief_sichtbar }]))
  )
  const [laden, setLaden] = useState(false)
  const [fehler, setFehler] = useState('')
  const [gespeichert, setGespeichert] = useState(false)
  const router = useRouter()

  function kommentarTogglen(id: string) {
    if (gesperrt) return
    const neueAuswahl = new Map(auswahl)
    if (neueAuswahl.has(id)) {
      // Abwählen → auch brief_sichtbar entfernen
      neueAuswahl.delete(id)
    } else {
      neueAuswahl.set(id, { kommentar: true, brief_sichtbar: false })
    }
    setAuswahl(neueAuswahl)
    setGespeichert(false)
  }

  function sichtbarTogglen(id: string) {
    if (gesperrt) return
    const neueAuswahl = new Map(auswahl)
    const aktuell = neueAuswahl.get(id)
    if (!aktuell) {
      // Brief sehen ankreuzen → auch Kommentar automatisch aktivieren
      neueAuswahl.set(id, { kommentar: true, brief_sichtbar: true })
    } else {
      neueAuswahl.set(id, { ...aktuell, brief_sichtbar: !aktuell.brief_sichtbar })
    }
    setAuswahl(neueAuswahl)
    setGespeichert(false)
  }

  async function speichern() {
    setLaden(true)
    setFehler('')

    // Hinzufügungen / Änderungen
    for (const [lpId, werte] of auswahl) {
      await fetch('/api/brief/lehrpersonen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lehrperson_id: lpId, brief_sichtbar: werte.brief_sichtbar }),
      })
    }
    // Entfernungen
    for (const { lehrperson_id } of aktuelleAuswahl) {
      if (!auswahl.has(lehrperson_id)) {
        await fetch('/api/brief/lehrpersonen', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lehrperson_id }),
        })
      }
    }

    setLaden(false)
    setGespeichert(true)
    router.refresh()
  }

  if (lehrpersonen.length === 0) {
    return (
      <div className="card text-center py-8 text-stone-500 text-sm">
        Deiner Klasse sind noch keine Lehrpersonen zugewiesen.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-600">Lehrperson</th>
              <th className="px-4 py-3 text-center font-medium text-stone-600 w-36">
                <span className="block">Kommentar</span>
                <span className="block text-xs font-normal text-stone-400">wünschen</span>
              </th>
              <th className="px-4 py-3 text-center font-medium text-stone-600 w-36">
                <span className="block">Brief</span>
                <span className="block text-xs font-normal text-stone-400">sehen lassen</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lehrpersonen.map((lp) => {
              const eintrag = auswahl.get(lp.id)
              const hatKommentar = !!eintrag
              const briefSichtbar = eintrag?.brief_sichtbar ?? false

              return (
                <tr key={lp.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{lp.vorname} {lp.nachname}</p>
                    <p className="text-xs text-stone-400">{lp.fachbereich}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={hatKommentar}
                      onChange={() => kommentarTogglen(lp.id)}
                      disabled={gesperrt}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={briefSichtbar}
                      onChange={() => sichtbarTogglen(lp.id)}
                      disabled={gesperrt}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-400">
        <strong>Kommentar wünschen:</strong> Die Lehrperson kann dir eine persönliche Nachricht schreiben.<br />
        <strong>Brief sehen lassen:</strong> Die Lehrperson kann deinen Brief lesen, bevor sie kommentiert.
      </p>

      {fehler && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{fehler}</div>
      )}

      {!gesperrt && (
        <div className="flex justify-between">
          <span />
          <button onClick={speichern} disabled={laden || gespeichert} className="btn-primary">
            {gespeichert ? 'Gespeichert ✓' : laden ? 'Speichert…' : 'Speichern'}
          </button>
        </div>
      )}
    </div>
  )
}
