'use client'

import { useState, useEffect, useRef } from 'react'

const STILE = [
  { id: 'pixel-art', name: 'Pixel' },
  { id: 'bottts-neutral', name: 'Roboter' },
  { id: 'lorelei', name: 'Portrait' },
  { id: 'thumbs', name: 'Figur' },
  { id: 'adventurer-neutral', name: 'Abenteuer' },
  { id: 'fun-emoji', name: 'Emoji' },
  { id: 'micah', name: 'Illustriert' },
  { id: 'notionists-neutral', name: 'Sketch' },
]

const BG = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,d1e8d3'

function dicebearUrl(stil: string, seed: string) {
  return `https://api.dicebear.com/7.x/${stil}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${BG}`
}

function zufallsSeed() {
  return Math.random().toString(36).slice(2, 12)
}

interface Props { vorname: string; onAvatarChange?: (url: string) => void }

export function AvatarErsteller({ vorname, onAvatarChange }: Props) {
  const [tab, setTab] = useState<'generieren' | 'hochladen'>('generieren')
  const [seed, setSeed] = useState(vorname.toLowerCase())
  const [stil, setStil] = useState('pixel-art')
  const [uploadUrl, setUploadUrl] = useState('')
  const [vorschau, setVorschau] = useState('')
  const [laden, setLaden] = useState(false)
  const [gespeichert, setGespeichert] = useState(false)
  const [fehler, setFehler] = useState('')
  const dateiRef = useRef<HTMLInputElement>(null)

  // Gespeicherten Avatar laden
  useEffect(() => {
    fetch('/api/brief/avatar')
      .then(r => r.json())
      .then((d: { seed?: string; url?: string }) => {
        if (d.url) {
          setUploadUrl(d.url)
          setTab('hochladen')
          setVorschau(d.url)
        } else if (d.seed && d.seed.includes(':')) {
          const [s, sd] = d.seed.split(':')
          setStil(s); setSeed(sd)
        }
      })
      .catch(() => {})
  }, [])

  const aktuelleUrl = tab === 'hochladen' && (vorschau || uploadUrl)
    ? (vorschau || uploadUrl)
    : dicebearUrl(stil, seed)

  async function speichern() {
    setLaden(true); setFehler('')
    try {
      if (tab === 'hochladen' && vorschau && vorschau.startsWith('blob:')) {
        // Datei hochladen
        const blob = await fetch(vorschau).then(r => r.blob())
        const form = new FormData()
        form.append('file', blob, 'avatar.jpg')
        const res = await fetch('/api/brief/avatar/upload', { method: 'POST', body: form })
        if (!res.ok) { const d = await res.json() as {fehler?:string}; throw new Error(d.fehler ?? 'Fehler') }
        const d = await res.json() as { url: string }
        setUploadUrl(d.url); setVorschau(d.url)
        onAvatarChange?.(d.url)
      } else {
        // DiceBear-Seed speichern
        await fetch('/api/brief/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seed: `${stil}:${seed}` }),
        })
        onAvatarChange?.(dicebearUrl(stil, seed))
      }
      setGespeichert(true)
      setTimeout(() => setGespeichert(false), 2000)
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Fehler')
    } finally { setLaden(false) }
  }

  function dateiGewaehlt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setFehler('Datei zu gross (max. 5 MB)'); return }
    setVorschau(URL.createObjectURL(file))
    setFehler('')
  }

  return (
    <div className="space-y-3">
      {/* Aktuelle Vorschau */}
      <div className="flex items-center gap-3">
        <img src={aktuelleUrl} alt="Avatar-Vorschau"
          className="w-16 h-16 rounded-full border-2 border-stone-200 bg-stone-50 object-cover" />
        <div>
          <p className="text-sm font-medium">Dein Avatar</p>
          <p className="text-xs text-stone-400">Klicke unten auf Speichern um ihn zu übernehmen</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
        {(['generieren', 'hochladen'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>
            {t === 'generieren' ? '✨ Generieren' : '📷 Eigenes Bild'}
          </button>
        ))}
      </div>

      {tab === 'generieren' && (
        <div className="space-y-3">
          {/* Stil-Wahl */}
          <div className="grid grid-cols-4 gap-1.5">
            {STILE.map(s => (
              <button key={s.id} onClick={() => setStil(s.id)}
                className={`rounded-xl border-2 p-1.5 text-center transition-all ${stil === s.id ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                <img src={dicebearUrl(s.id, seed)} alt={s.name}
                  className="w-10 h-10 mx-auto rounded-full" />
                <p className="text-xs mt-0.5 text-stone-600 leading-tight">{s.name}</p>
              </button>
            ))}
          </div>
          {/* Varianten */}
          <div>
            <p className="text-xs text-stone-400 mb-1.5">Varianten</p>
            <div className="flex gap-1.5 flex-wrap">
              {[0,1,2,3,4,5,6,7].map(i => {
                const s = `${vorname.toLowerCase()}-v${i}`
                return (
                  <button key={i} onClick={() => setSeed(s)}
                    className={`rounded-full border-2 transition-all ${seed === s ? 'border-indigo-500 scale-110' : 'border-transparent hover:border-stone-300'}`}>
                    <img src={dicebearUrl(stil, s)} alt="" className="w-10 h-10 rounded-full" />
                  </button>
                )
              })}
            </div>
          </div>
          <button onClick={() => setSeed(zufallsSeed())}
            className="w-full rounded-lg border border-stone-200 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
            🎲 Neuen Zufalls-Avatar generieren
          </button>
        </div>
      )}

      {tab === 'hochladen' && (
        <div className="space-y-3">
          {vorschau || uploadUrl ? (
            <div className="flex items-center gap-3">
              <img src={vorschau || uploadUrl} alt="Vorschau"
                className="w-20 h-20 rounded-full border-2 border-stone-200 object-cover" />
              <button onClick={() => { setVorschau(''); setUploadUrl('') }}
                className="text-xs text-stone-400 hover:text-stone-700 underline">
                Bild entfernen
              </button>
            </div>
          ) : (
            <button onClick={() => dateiRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-6 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <p className="text-2xl mb-1">📷</p>
              <p className="text-sm font-medium text-stone-700">Foto auswählen</p>
              <p className="text-xs text-stone-400 mt-0.5">JPG, PNG, WebP · max. 5 MB</p>
            </button>
          )}
          <input ref={dateiRef} type="file" accept="image/*" className="hidden"
            onChange={dateiGewaehlt} />
          {!(vorschau || uploadUrl) && (
            <button onClick={() => dateiRef.current?.click()}
              className="w-full rounded-lg border border-stone-200 py-2 text-sm text-stone-600 hover:bg-stone-50">
              Datei durchsuchen
            </button>
          )}
        </div>
      )}

      {fehler && <p className="text-xs text-red-600">{fehler}</p>}

      <button onClick={speichern} disabled={laden}
        className="btn-primary w-full">
        {gespeichert ? '✓ Gespeichert!' : laden ? 'Speichert…' : 'Avatar speichern'}
      </button>
    </div>
  )
}
