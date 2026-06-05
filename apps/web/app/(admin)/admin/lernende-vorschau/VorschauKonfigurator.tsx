'use client'

import { useState } from 'react'
import { AnimationsVorschau } from '../kapsel-vorschau/AnimationsVorschau'

type BriefStatus = 'entwurf' | 'versiegelt' | 'zugestellt'

interface Einstellungen {
  lehrjahr: 1 | 2 | 3 | 4
  lehrdauer: 2 | 3 | 4
  briefStatus: BriefStatus
  hatJahresfeedback: boolean
  hatAbschlussfeedback: boolean
  briefSichtbar: boolean
}

const STATUS_FARBE: Record<BriefStatus, string> = {
  entwurf:    'bg-yellow-100 text-yellow-800',
  versiegelt: 'bg-blue-100 text-blue-800',
  zugestellt: 'bg-green-100 text-green-800',
}
const STATUS_TEXT: Record<BriefStatus, string> = {
  entwurf: 'In Bearbeitung', versiegelt: 'Versiegelt', zugestellt: 'Zugestellt',
}

export function VorschauKonfigurator() {
  const [e, setE] = useState<Einstellungen>({
    lehrjahr: 2, lehrdauer: 3, briefStatus: 'versiegelt',
    hatJahresfeedback: false, hatAbschlussfeedback: false, briefSichtbar: true,
  })
  const [zeigAnimation, setZeigAnimation] = useState(false)

  const istEntwurf    = e.briefStatus === 'entwurf'
  const istVersiegelt = e.briefStatus === 'versiegelt'
  const istZugestellt = e.briefStatus === 'zugestellt'
  const istLetztesJahr = e.lehrjahr >= e.lehrdauer

  const abschlussJahr = new Date().getFullYear() + (e.lehrdauer - e.lehrjahr)
  const abschlussDate = `31. Juli ${abschlussJahr}`

  const demoLehrpersonen = [
    { id: '1', vorname: 'Jean-Luc', nachname: 'Haas',     fachbereich: 'Berufskunde' },
    { id: '2', vorname: 'Anna',     nachname: 'Schneider', fachbereich: 'Allgemeinbildung' },
  ]

  function set<K extends keyof Einstellungen>(key: K, val: Einstellungen[K]) {
    setE(prev => ({ ...prev, [key]: val }))
  }

  return (
    <div className="space-y-6">
      {/* ── Einstellungs-Panel ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-5">
        <h2 className="font-semibold text-stone-700 flex items-center gap-2">
          ⚙️ Vorschau konfigurieren
        </h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Lehrjahr */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">Aktuelles Lehrjahr</label>
            <div className="flex gap-1">
              {([1,2,3,4] as const).map(j => (
                <button key={j} onClick={() => set('lehrjahr', j)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    e.lehrjahr === j ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}>{j}</button>
              ))}
            </div>
          </div>

          {/* Lehrdauer */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">Lehrdauer</label>
            <div className="flex gap-1">
              {([2,3,4] as const).map(d => (
                <button key={d} onClick={() => set('lehrdauer', d)}
                  className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                    e.lehrdauer === d ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}>{d}J</button>
              ))}
            </div>
          </div>

          {/* Brief-Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-stone-600">Brief-Status</label>
            <div className="flex gap-1">
              {(['entwurf','versiegelt','zugestellt'] as const).map(s => (
                <button key={s} onClick={() => set('briefStatus', s)}
                  className={`flex-1 rounded-lg py-1 text-xs font-medium transition-colors capitalize ${
                    e.briefStatus === s ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}>{STATUS_TEXT[s]}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={e.hatJahresfeedback}
              onChange={v => set('hatJahresfeedback', v.target.checked)}
              className="rounded" />
            📅 Hat Jahresfeedback erhalten
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={e.hatAbschlussfeedback}
              onChange={v => set('hatAbschlussfeedback', v.target.checked)}
              className="rounded" />
            🎓 Hat Abschluss-Feedback (nur bei Zugestellt relevant)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={e.briefSichtbar}
              onChange={v => set('briefSichtbar', v.target.checked)}
              className="rounded" />
            Brief für LP sichtbar
          </label>
        </div>

        {e.lehrjahr > e.lehrdauer && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            ⚠️ Lehrjahr {e.lehrjahr} ist grösser als Lehrdauer {e.lehrdauer} — das ist kein gültiger Zustand.
          </p>
        )}
      </div>

      {/* ── Vorschau ── */}
      <div className="rounded-xl border-2 border-dashed border-stone-200 p-4 space-y-4 bg-stone-50/50">

        {/* Header-Mock */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center text-2xl">😊</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xl">Hallo Anna 👋</span>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_FARBE[e.briefStatus]}`}>
                {STATUS_TEXT[e.briefStatus]}
              </span>
            </div>
            <p className="text-stone-500 text-sm">Informatiker/in EFZ · {e.lehrjahr}. Lehrjahr von {e.lehrdauer}</p>
            <p className="text-xs text-stone-400">Brief kommt am {abschlussDate}</p>
          </div>
          <span className="text-stone-300">⚙️</span>
        </div>

        {/* Brief schreiben (Entwurf) */}
        {istEntwurf && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <h2 className="font-semibold text-sm">Dein Brief ✉️</h2>
            <div className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Brief schreiben</p>
                <p className="text-xs text-stone-400">Noch kein Inhalt</p>
              </div>
              <span className="text-stone-300">→</span>
            </div>
          </div>
        )}

        {/* Versiegelt-Hinweis */}
        {istVersiegelt && (
          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Dein Brief ist sicher versiegelt und wird dir zu deinem Lehrabschluss zugestellt.
          </div>
        )}

        {/* Kapsel-Standort Mock */}
        {!istEntwurf && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <h2 className="font-semibold text-sm">Deine Kapsel ist gerade in…</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🗼</span>
              <div>
                <p className="font-semibold">Paris, Frankreich</p>
                <p className="text-xs text-stone-500">Der Eiffelturm wurde 1889 für die Weltausstellung gebaut.</p>
              </div>
            </div>
          </div>
        )}

        {/* Quiz-Mock */}
        {!istEntwurf && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
            <h2 className="font-semibold text-sm">Wissens-Quiz 🎯</h2>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-indigo-900">Quiz-Teilnahme diese Woche</p>
              <div className="bg-indigo-600 text-white text-xs rounded-xl px-4 py-2 text-center w-fit">
                🙋 Ich möchte mitmachen!
              </div>
            </div>
          </div>
        )}

        {/* Feedbacks */}
        {!istEntwurf && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <h2 className="font-semibold text-sm">Feedbacks 💬</h2>

            {/* Jahresfeedback anfragen */}
            {!istLetztesJahr && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-stone-600">
                  📅 Jahresfeedback — {e.lehrjahr}. Lehrjahr
                </p>
                <p className="text-xs text-stone-400">
                  Du kannst Lehrpersonen aktiv um ein Feedback bitten. Sie schreiben es und du kannst es sofort lesen.
                </p>
                <div className="space-y-1.5">
                  {demoLehrpersonen.map(lp => (
                    <div key={lp.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium">{lp.vorname} {lp.nachname}</p>
                        <p className="text-xs text-stone-400">{lp.fachbereich}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white">Anfragen</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jahresfeedback erhalten */}
            {e.hatJahresfeedback && (
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-4 py-2 border-b border-stone-100">
                  <p className="text-xs font-medium">Jean-Luc Haas · Berufskunde</p>
                </div>
                <div className="px-4 py-3 space-y-1">
                  <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                    📅 {e.lehrjahr}. Lehrjahr
                  </span>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    Anna zeigt grosses Engagement und entwickelt sich fachlich sehr gut. Die Zusammenarbeit im Team ist vorbildlich.
                  </p>
                </div>
              </div>
            )}

            {/* Abschluss-Feedback (nur nach Zustellung) */}
            {istZugestellt && e.hatAbschlussfeedback && (
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-4 py-2 border-b border-stone-100">
                  <p className="text-xs font-medium">Anna Schneider · Allgemeinbildung</p>
                </div>
                <div className="px-4 py-3 space-y-1">
                  <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700">
                    🎓 Abschluss-Feedback
                  </span>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    Es war eine Freude, dich auf diesem Weg begleiten zu dürfen. Du hast dich toll entwickelt!
                  </p>
                </div>
              </div>
            )}

            {istZugestellt && !e.hatAbschlussfeedback && (
              <p className="text-xs text-stone-400 italic">Kein Abschluss-Feedback vorhanden.</p>
            )}

            {istLetztesJahr && !e.hatJahresfeedback && (
              <p className="text-xs text-stone-400 italic">
                Im letzten Lehrjahr gibt es keine Jahresfeedbacks mehr — du erhältst das Abschluss-Feedback mit deinem Brief.
              </p>
            )}
          </div>
        )}

        {/* Animation */}
        {istVersiegelt && (
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
            <h2 className="font-semibold text-sm">Versiegelungs-Animation</h2>
            <p className="text-xs text-stone-400">Erscheint einmalig beim Versiegeln des Briefes.</p>
            {zeigAnimation
              ? <AnimationsVorschau />
              : <button onClick={() => setZeigAnimation(true)} className="btn-secondary w-full text-sm">
                  🎬 Animation vorführen
                </button>
            }
          </div>
        )}
      </div>
    </div>
  )
}
