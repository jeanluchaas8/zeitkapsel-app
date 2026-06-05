'use client'

import { useState, useEffect } from 'react'
import type { Standort } from './KapselStandort'
import { getGesamtKilometer } from './KapselStandort'
import { WeltkarteSVG } from './WeltkarteSVG'

interface Lehrperson { id: string; vorname: string; nachname: string; fachbereich: string }

interface Props {
  standort: Standort
  verlauf: Standort[]
  lehrpersonen: Lehrperson[]
  gibzAnzahl: number
}

// ---- GIBZ-Überraschungs-Komponente ----
function GIBZUeberraschung({ lehrpersonen }: { lehrpersonen: Lehrperson[] }) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const [erfolg, setErfolg] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)

  async function waehlen(lp: Lehrperson) {
    setGewaehlt(lp.id)
    setLaden(true)
    try {
      const res = await fetch('/api/brief/znueni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lehrperson_id: lp.id }),
      })
      const d = await res.json() as { lehrpersonName?: string }
      setErfolg(d.lehrpersonName ?? `${lp.vorname} ${lp.nachname}`)
    } catch {
      setGewaehlt(null)
    } finally {
      setLaden(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes konfetti {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) rotate(720deg); opacity: 0; }
        }
        @keyframes pulsieren {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
        .konfetti-stk { animation: konfetti 1.5s ease-in infinite; }
        .puls         { animation: pulsieren 1.5s ease-in-out infinite; }
      `}</style>

      <div className="rounded-xl overflow-hidden border-2 border-yellow-300 shadow-lg">
        {/* Festlicher Header */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 px-4 py-4 text-center overflow-hidden">
          {/* Konfetti */}
          {['🎊','🎉','✨','🎈','⭐','🎊','✨'].map((e, i) => (
            <span key={i} className="konfetti-stk absolute text-lg pointer-events-none select-none"
              style={{ left: `${10 + i * 13}%`, top: '-4px', animationDelay: `${i * 0.2}s` }}>
              {e}
            </span>
          ))}
          <div className="puls text-5xl mb-2">🎉</div>
          <p className="font-bold text-white text-lg drop-shadow">Überraschung!</p>
          <p className="text-yellow-100 text-sm font-medium">Deine Zeitkapsel ist zu Besuch!</p>
        </div>

        {/* GIBZ-Bild und Info */}
        <div className="bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://commons.wikimedia.org/wiki/Special:FilePath/Zug_-_Bundesstrasse_38.jpg?width=800"
            alt="Zug, Schweiz"
            className="w-full h-36 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="px-4 pt-3 pb-2">
            <p className="font-bold text-sm">Gewerblich-industrielles Bildungszentrum Zug</p>
            <p className="text-xs text-stone-500">Zug, Schweiz · Deine Schule 🏫</p>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Deine Zeitkapsel macht heute eine Ausnahme und besucht dich in deiner Schule!
              Als kleines Zeichen der Freude darf du dir jetzt eine Lehrperson aussuchen,
              die dir ein Znüni offeriert. 🥐
            </p>
          </div>
        </div>

        {/* Lehrpersonen-Auswahl */}
        <div className="bg-yellow-50 px-4 py-3 space-y-2">
          {erfolg ? (
            <div className="text-center py-3 space-y-2">
              <p className="text-3xl">🥐</p>
              <p className="font-semibold text-stone-800">
                {erfolg} wurde benachrichtigt!
              </p>
              <p className="text-sm text-stone-500">
                Freu dich auf dein Znüni beim nächsten Treffen. 😊
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-stone-700">
                Wähle deine Znüni-Patron/in:
              </p>
              {lehrpersonen.length === 0 ? (
                <p className="text-sm text-stone-400 italic">Noch keine Lehrpersonen ausgewählt.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {lehrpersonen.map(lp => (
                    <button
                      key={lp.id}
                      onClick={() => waehlen(lp)}
                      disabled={laden || !!gewaehlt}
                      className={`rounded-xl border-2 px-3 py-2 text-left transition-all ${
                        gewaehlt === lp.id
                          ? 'border-yellow-400 bg-yellow-100'
                          : 'border-stone-200 bg-white hover:border-yellow-300 hover:bg-yellow-50'
                      } disabled:opacity-50`}
                    >
                      <p className="text-sm font-medium leading-tight">{lp.vorname} {lp.nachname}</p>
                      <p className="text-xs text-stone-400">{lp.fachbereich}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ---- Foto mit Fallback ----
function FotoMitFallback({ standort }: { standort: Standort }) {
  const [fehler, setFehler] = useState(!standort.foto)
  return fehler ? (
    <div className="w-full h-full bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-900 flex flex-col items-center justify-center gap-2 p-4">
      <p className="text-4xl">{standort.emoji}</p>
      <p className="text-white/80 text-sm font-medium text-center">{standort.ort}</p>
      <p className="text-white/50 text-xs text-center">{standort.land}</p>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={standort.foto} alt={standort.fotoAlt}
      className="w-full h-full object-cover" onError={() => setFehler(true)} />
  )
}

// ---- Haupt-Komponente ----
export function KapselLandung({ standort, verlauf, lehrpersonen, gibzAnzahl }: Props) {
  const [ausgewaehlt, setAusgewaehlt] = useState<Standort | null>(null)
  const [zeigeGIBZ, setZeigeGIBZ] = useState<boolean | null>(null)
  const angezeigt = ausgewaehlt ?? standort
  const istAlt = ausgewaehlt !== null
  const gesamtKm = getGesamtKilometer(verlauf)

  // GIBZ-Überraschung: 10% Wahrscheinlichkeit, max 2× pro Lehre
  useEffect(() => {
    if (gibzAnzahl >= 2) { setZeigeGIBZ(false); return }
    const key = 'gibz-gezeigt-' + new Date().toDateString()
    if (sessionStorage.getItem(key)) { setZeigeGIBZ(false); return }
    const gibz = Math.random() < 0.10
    if (gibz) sessionStorage.setItem(key, '1')
    setZeigeGIBZ(gibz)
  }, [gibzAnzahl])

  // GIBZ-Überraschung anzeigen
  if (zeigeGIBZ === true) {
    return <GIBZUeberraschung lehrpersonen={lehrpersonen} />
  }

  // Normale Kapsel-Ansicht
  return (
    <div className="rounded-xl overflow-hidden border border-indigo-200 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 to-slate-900 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">🛸</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {istAlt ? `📍 ${angezeigt.ort}` : 'Deine Zeitkapsel ist gerade hier'}
          </p>
          <p className="text-indigo-300 text-xs truncate">{angezeigt.land} · {angezeigt.temp}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-indigo-200 text-xs font-semibold">
            {gesamtKm.toLocaleString('de-CH')} km
          </p>
          <p className="text-indigo-400 text-xs">zurückgelegt</p>
        </div>
      </div>

      {/* Foto + Karte */}
      <div className="grid sm:grid-cols-2">
        <div className="relative h-48">
          <FotoMitFallback key={angezeigt.ort} standort={angezeigt} />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white text-sm font-semibold leading-tight">{angezeigt.ort}</p>
            {istAlt && <p className="text-indigo-300 text-xs">Früherer Standort</p>}
          </div>
        </div>

        <div className="relative h-48 bg-[#0d1b2a] overflow-hidden">
          <WeltkarteSVG standort={standort} verlauf={verlauf}
            onKlick={s => setAusgewaehlt(s.ort === standort.ort ? null : s)}
            ausgewaehlt={ausgewaehlt} />
          <p className="absolute top-2 left-0 right-0 text-center pointer-events-none">
            <span className="bg-black/40 text-white/60 text-xs px-2 py-0.5 rounded-full">
              Punkte anklicken
            </span>
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3 bg-gradient-to-b from-indigo-50 to-white">
        {istAlt && (
          <button onClick={() => setAusgewaehlt(null)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
            ← Zurück zum aktuellen Standort ({standort.ort})
          </button>
        )}
        <p className="text-sm text-stone-600 leading-relaxed">{angezeigt.info}</p>
        <div className="flex items-center justify-between">
          <a href={angezeigt.link} target="_blank" rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
            {angezeigt.linkText} →
          </a>
          {!istAlt && <p className="text-xs text-stone-300 italic">Standort wechselt wöchentlich</p>}
        </div>
      </div>
    </div>
  )
}
