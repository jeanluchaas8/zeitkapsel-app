'use client'

import { useEffect, useState } from 'react'

/* ─ Typen ─────────────────────────────────────────────────────────────── */
type BgKategorie = 'mesh' | 'muster' | 'einfarbig'

interface BgOption {
  id: string
  name: string
  kategorie: BgKategorie
  farben?: string[]          // Mesh: Farbpunkte-Vorschau
  musterCss?: string         // Muster: Inline-CSS für die Vorschau
  bgColor?: string           // Einfarbig: Hintergrundfarbe
}

const HINTERGRUENDE: BgOption[] = [
  /* ── Mesh ── */
  {
    id: 'indigo', name: 'Indigo', kategorie: 'mesh',
    farben: ['#6366f1', '#a855f7', '#14b8a6'],
  },
  {
    id: 'ozean', name: 'Ozean', kategorie: 'mesh',
    farben: ['#0ea5e9', '#6366f1', '#06b6d4'],
  },
  {
    id: 'natur', name: 'Natur', kategorie: 'mesh',
    farben: ['#22c55e', '#14b8a6', '#65a30d'],
  },
  {
    id: 'sonnenuntergang', name: 'Sonnenuntergang', kategorie: 'mesh',
    farben: ['#fb923c', '#f43f5e', '#fbbf24'],
  },
  {
    id: 'rose', name: 'Rose', kategorie: 'mesh',
    farben: ['#f43f5e', '#d946ef', '#a855f7'],
  },
  {
    id: 'amber', name: 'Amber', kategorie: 'mesh',
    farben: ['#f59e0b', '#ea580c', '#fbbf24'],
  },

  /* ── Muster ── */
  {
    id: 'punkte', name: 'Punkte (klein)', kategorie: 'muster',
    musterCss: 'radial-gradient(circle, rgba(0,0,0,.15) 1px, transparent 1px)',
  },
  {
    id: 'punkte-gross', name: 'Punkte (groß)', kategorie: 'muster',
    musterCss: 'radial-gradient(circle, rgba(0,0,0,.12) 1.5px, transparent 1.5px)',
  },
  {
    id: 'linien', name: 'Gitter', kategorie: 'muster',
    musterCss:
      'linear-gradient(rgba(0,0,0,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.10) 1px, transparent 1px)',
  },
  {
    id: 'diagonal', name: 'Diagonal', kategorie: 'muster',
    musterCss:
      'repeating-linear-gradient(45deg, transparent 0px, transparent 9px, rgba(0,0,0,.10) 9px, rgba(0,0,0,.10) 10px)',
  },
  {
    id: 'wellen', name: 'Wellen', kategorie: 'muster',
    musterCss:
      'repeating-radial-gradient(circle at 0 0, transparent 0, transparent 20px, rgba(0,0,0,.06) 20px, rgba(0,0,0,.06) 21px)',
  },

  /* ── Einfarbig ── */
  { id: 'klar',     name: 'Standard',  kategorie: 'einfarbig', bgColor: '#fafaf9' },
  { id: 'slate',    name: 'Slate',     kategorie: 'einfarbig', bgColor: '#f1f5f9' },
  { id: 'warm',     name: 'Warm',      kategorie: 'einfarbig', bgColor: '#fdf8f0' },
  { id: 'mint',     name: 'Mint',      kategorie: 'einfarbig', bgColor: '#f0fdf4' },
  { id: 'lavendel', name: 'Lavendel',  kategorie: 'einfarbig', bgColor: '#faf5ff' },
]

const KATEGORIEN: { id: BgKategorie; label: string }[] = [
  { id: 'mesh',      label: 'Mesh' },
  { id: 'muster',    label: 'Muster' },
  { id: 'einfarbig', label: 'Einfarbig' },
]

const ALLE_IDS = HINTERGRUENDE.map(h => h.id)
type BgId = string

export function HintergrundPicker() {
  const [aktiv, setAktiv] = useState<BgId>('indigo')
  const [kategorie, setKategorie] = useState<BgKategorie>('mesh')

  useEffect(() => {
    try {
      const gespeichert = localStorage.getItem('zk-bg') as BgId | null
      if (gespeichert && ALLE_IDS.includes(gespeichert)) {
        setAktiv(gespeichert)
        const bg = HINTERGRUENDE.find(h => h.id === gespeichert)
        if (bg) setKategorie(bg.kategorie)
      }
    } catch { /* ignore */ }
  }, [])

  function waehlen(id: BgId) {
    setAktiv(id)
    try {
      localStorage.setItem('zk-bg', id)
      document.documentElement.setAttribute('data-bg', id)
    } catch { /* ignore */ }
  }

  const sichtbar = HINTERGRUENDE.filter(h => h.kategorie === kategorie)

  return (
    <div className="space-y-4">
      {/* Kategorie-Tabs */}
      <div className="flex rounded-xl p-0.5 gap-0.5"
        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {KATEGORIEN.map(k => (
          <button
            key={k.id}
            onClick={() => setKategorie(k.id)}
            className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={kategorie === k.id
              ? { backgroundColor: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }
              : { color: 'var(--text-3)' }}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Optionen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sichtbar.map(bg => {
          const istAktiv = aktiv === bg.id
          return (
            <button
              key={bg.id}
              onClick={() => waehlen(bg.id)}
              className={`relative rounded-2xl overflow-hidden transition-all text-left ${
                istAktiv
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-[1.02]'
                  : 'hover:scale-[1.01]'
              }`}
              style={{ border: '1px solid var(--border)' }}
            >
              {/* Vorschau */}
              <div className="h-20 relative"
                style={{ backgroundColor: bg.bgColor ?? 'var(--bg)' }}>

                {/* Mesh-Vorschau */}
                {bg.kategorie === 'mesh' && bg.farben && bg.farben.length > 0 && (
                  <>
                    <div className="absolute inset-0" style={{
                      background: `radial-gradient(ellipse 100% 80% at 10% 0%, ${bg.farben[0]}40 0%, transparent 70%)`,
                    }} />
                    <div className="absolute inset-0" style={{
                      background: `radial-gradient(ellipse 70% 60% at 90% 20%, ${bg.farben[1]}30 0%, transparent 65%)`,
                    }} />
                    <div className="absolute inset-0" style={{
                      background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${bg.farben[2]}25 0%, transparent 70%)`,
                    }} />
                    {/* Farbpunkte */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {bg.farben.map((f, i) => (
                        <div key={i} className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: f }} />
                      ))}
                    </div>
                  </>
                )}

                {/* Muster-Vorschau */}
                {bg.kategorie === 'muster' && bg.musterCss && (
                  <div className="absolute inset-0" style={{
                    backgroundImage: bg.musterCss,
                    backgroundSize: bg.id.startsWith('punkte') ? '14px 14px'
                      : bg.id === 'linien' ? '18px 18px' : 'auto',
                  }} />
                )}

                {/* Einfarbig: Leer-Symbol */}
                {bg.kategorie === 'einfarbig' && bg.id === 'klar' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl opacity-20">◻</span>
                  </div>
                )}

                {/* Aktiv-Checkmark */}
                {istAktiv && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="px-3 py-2 text-xs font-medium"
                style={{ color: 'var(--text-2)', backgroundColor: 'var(--surface)' }}>
                {bg.name}
                {istAktiv && <span className="ml-1.5 text-indigo-500">· Aktiv</span>}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-4)' }}>
        Die Auswahl wird nur in diesem Browser gespeichert.
      </p>
    </div>
  )
}
