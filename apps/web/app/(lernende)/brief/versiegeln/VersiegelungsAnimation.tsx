'use client'

import { useState, useEffect } from 'react'

interface Props {
  onFertig?: () => void
  autoStart?: boolean
}

export function VersiegelungsAnimation({ onFertig, autoStart = false }: Props) {
  const [gestartet, setGestartet] = useState(autoStart)
  const [bereit, setBereit] = useState(false)

  // Zeige Button nach 5.5s (wenn Text erschienen)
  useEffect(() => {
    if (!gestartet) return
    const t = setTimeout(() => setBereit(true), 5500)
    return () => clearTimeout(t)
  }, [gestartet])

  if (!gestartet) {
    return (
      <button onClick={() => setGestartet(true)} className="btn-secondary w-full">
        🎬 Versiegelungs-Animation vorführen
      </button>
    )
  }

  return (
    <>
      <style>{`
        /* Hintergrund-Sterne */
        @keyframes sternFunkeln {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50%       { opacity: 1; transform: scale(1); }
        }
        /* Brief fällt ein */
        @keyframes briefEintritt {
          0%   { opacity: 0; transform: translateY(-60px) rotate(-8deg) scale(0.8); }
          60%  { opacity: 1; transform: translateY(10px) rotate(2deg) scale(1.05); }
          80%  { transform: translateY(-4px) rotate(-1deg) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
        }
        /* Brief verschwindet in Kapsel */
        @keyframes briefSchrumpft {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          60%  { opacity: 0.6; transform: translateY(30px) scale(0.5); }
          100% { opacity: 0; transform: translateY(60px) scale(0); }
        }
        /* Kapsel erscheint */
        @keyframes kapselErscheint {
          0%   { opacity: 0; transform: scale(0.3) rotate(-5deg); }
          50%  { transform: scale(1.12) rotate(2deg); }
          75%  { transform: scale(0.96) rotate(-1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        /* Kapsel-Glanz */
        @keyframes glanz {
          0%   { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
          40%  { opacity: 0.8; }
          100% { opacity: 0; transform: translateX(200%) skewX(-20deg); }
        }
        /* Kapsel startet */
        @keyframes kapselStart {
          0%   { transform: translateY(0) scale(1); }
          20%  { transform: translateY(8px) scale(1.02, 0.98); }
          40%  { transform: translateY(-20px) scale(0.98, 1.02); }
          100% { transform: translateY(-180px) scale(0.7); opacity: 0.6; }
        }
        /* Kapsel fliegt weg */
        @keyframes kapselFlug {
          0%   { transform: translateY(-180px) scale(0.7); opacity: 0.6; }
          100% { transform: translateY(-600px) scale(0.2) rotate(5deg); opacity: 0; }
        }
        /* Schub-Flamme */
        @keyframes flamme {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50%       { transform: scaleY(1.4) scaleX(0.8); opacity: 1; }
        }
        /* Rauch-Partikel */
        @keyframes rauch {
          0%   { transform: translateY(0) scale(0.3); opacity: 0.8; }
          100% { transform: translateY(60px) scale(1.5); opacity: 0; }
        }
        /* Text einblenden */
        @keyframes textEin {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        /* Schrift-Glimmer */
        @keyframes schriftGlimmer {
          0%,100% { text-shadow: 0 0 10px rgba(165,180,252,0.3); }
          50%     { text-shadow: 0 0 20px rgba(165,180,252,0.8), 0 0 40px rgba(99,102,241,0.4); }
        }

        .anim-brief-ein   { animation: briefEintritt 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-brief-weg   { animation: briefSchrumpft 0.6s ease-in forwards; }
        .anim-kapsel-ein  { animation: kapselErscheint 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-glanz       { animation: glanz 0.8s ease-in-out 0.4s forwards; }
        .anim-start       { animation: kapselStart 1.0s ease-in forwards; }
        .anim-flug        { animation: kapselFlug 1.2s cubic-bezier(0.4,0,1,1) forwards; }
        .anim-flamme      { animation: flamme 0.15s ease-in-out infinite; }
        .anim-rauch       { animation: rauch 0.8s ease-out infinite; }
        .anim-text        { animation: textEin 0.8s ease-out forwards, schriftGlimmer 2s ease-in-out 0.8s infinite; }
      `}</style>

      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f0f1a 60%, #000 100%)' }}>

        {/* Sterne */}
        <Sterne />

        {/* Hauptinhalt */}
        <div className="relative flex flex-col items-center" style={{ height: 320, width: 200 }}>
          <AnimationsSequenz gestartet={gestartet} />
        </div>

        {/* Text unten */}
        <div className="absolute bottom-12 text-center px-8 space-y-3" style={{ animation: 'textEin 0.8s ease-out 4.8s both' }}>
          <p className="text-white text-lg font-light tracking-widest">
            Deine Zeitkapsel ist auf dem Weg ✨
          </p>
          <p className="text-indigo-200 text-sm leading-relaxed max-w-sm mx-auto opacity-90"
            style={{ animation: 'textEin 0.8s ease-out 5.2s both' }}>
            Du hast etwas Wichtiges festgehalten — wer du heute bist, was dich bewegt
            und wohin du willst. In ein paar Jahren wirst du staunen, wie weit du gekommen bist.
          </p>
          <p className="text-indigo-400 text-xs mt-2 opacity-60"
            style={{ animation: 'textEin 0.6s ease-out 5.6s both' }}>
            ✦ ✦ ✦
          </p>
          {bereit && (
            <button
              onClick={() => onFertig?.()}
              className="mt-6 rounded-xl border-2 border-indigo-400 text-indigo-200 px-6 py-3 text-sm font-medium hover:bg-indigo-900 hover:border-indigo-300 transition-all"
              style={{ animation: 'textEin 0.6s ease-out forwards' }}
            >
              Ich bin ready für die Lehre 🚀
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// Sterne-Hintergrund
function Sterne() {
  const sterne = Array.from({ length: 40 }, (_, i) => ({
    x: Math.sin(i * 2.4) * 50 + 50,
    y: Math.sin(i * 1.7) * 50 + 50,
    delay: (i * 0.13) % 3,
    dauer: 1.5 + (i % 3) * 0.7,
    grösse: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none">
      {sterne.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.grösse, height: s.grösse,
            animation: `sternFunkeln ${s.dauer}s ease-in-out ${s.delay}s infinite`,
          }} />
      ))}
    </div>
  )
}

// Sequenz-Komponente mit timed CSS animations
function AnimationsSequenz({ gestartet }: { gestartet: boolean }) {
  if (!gestartet) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center">

      {/* Brief — erscheint, dann schrumpft weg */}
      <div className="absolute" style={{ top: 80 }}>
        <div className="anim-brief-ein" style={{ animationDelay: '0s' }}>
          <div style={{ animation: 'briefSchrumpft 0.5s ease-in 1.2s forwards' }}>
            {/* Brief-SVG */}
            <svg width="72" height="56" viewBox="0 0 72 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="70" height="54" rx="4" fill="#fffef9" stroke="#e2d9c8" strokeWidth="1.5"/>
              <path d="M1 8 L36 32 L71 8" stroke="#e2d9c8" strokeWidth="1.5" fill="none"/>
              <line x1="16" y1="38" x2="44" y2="38" stroke="#d4cbbf" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="16" y1="44" x2="38" y2="44" stroke="#d4cbbf" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Kapsel — erscheint nachdem Brief weg */}
      <div className="absolute" style={{ top: 60 }}>
        <div style={{ animation: 'kapselErscheint 0.7s cubic-bezier(0.34,1.56,0.64,1) 1.6s both' }}>
          <div style={{ animation: 'kapselStart 1.0s ease-in 3.0s forwards, kapselFlug 1.2s cubic-bezier(0.4,0,1,1) 3.9s forwards' }}>
            <KapselSVG />

            {/* Flamme (erscheint beim Start) */}
            <div className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: -14, animation: 'textEin 0.3s ease-out 3.0s both' }}>
              <div className="anim-flamme">
                <svg width="20" height="24" viewBox="0 0 20 24">
                  <ellipse cx="10" cy="12" rx="6" ry="12" fill="url(#feuerverlauf)" opacity="0.9"/>
                  <ellipse cx="10" cy="16" rx="3" ry="8" fill="url(#feuerverlauf2)" opacity="0.8"/>
                  <defs>
                    <radialGradient id="feuerverlauf" cx="50%" cy="80%">
                      <stop offset="0%" stopColor="#fff"/>
                      <stop offset="30%" stopColor="#fbbf24"/>
                      <stop offset="70%" stopColor="#f97316"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                    <radialGradient id="feuerverlauf2" cx="50%" cy="80%">
                      <stop offset="0%" stopColor="#fff"/>
                      <stop offset="50%" stopColor="#60a5fa"/>
                      <stop offset="100%" stopColor="transparent"/>
                    </radialGradient>
                  </defs>
                </svg>
              </div>
              {/* Rauch-Partikel */}
              {[0,1,2].map(i => (
                <div key={i} className="absolute rounded-full bg-white/20"
                  style={{
                    width: 6 + i * 3, height: 6 + i * 3,
                    left: `${-4 + i * 4}px`, bottom: 0,
                    animation: `rauch ${0.6 + i * 0.2}s ease-out ${i * 0.15}s infinite`,
                  }} />
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// SVG-Kapsel
function KapselSVG() {
  return (
    <div className="relative">
      <svg width="64" height="100" viewBox="0 0 64 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Körper */}
        <rect x="8" y="38" width="48" height="54" rx="4" fill="url(#koerper)"/>
        {/* Obere Halbkugel */}
        <ellipse cx="32" cy="38" rx="24" ry="16" fill="url(#kuppel)"/>
        {/* Trennlinie */}
        <line x1="8" y1="54" x2="56" y2="54" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        {/* Fenster */}
        <circle cx="32" cy="44" r="9" fill="url(#fenster)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        <circle cx="32" cy="44" r="5" fill="rgba(165,243,252,0.4)"/>
        <circle cx="29" cy="41" r="2" fill="rgba(255,255,255,0.4)"/>
        {/* Schraube oben */}
        <circle cx="32" cy="24" r="3" fill="#6366f1" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
        {/* Detail-Streifen */}
        <rect x="18" y="62" width="28" height="4" rx="2" fill="rgba(255,255,255,0.15)"/>
        <rect x="18" y="70" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.1)"/>
        {/* Booster unten */}
        <rect x="14" y="86" width="10" height="6" rx="2" fill="url(#booster)"/>
        <rect x="40" y="86" width="10" height="6" rx="2" fill="url(#booster)"/>

        <defs>
          <linearGradient id="koerper" x1="8" y1="38" x2="56" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8"/>
            <stop offset="100%" stopColor="#4f46e5"/>
          </linearGradient>
          <radialGradient id="kuppel" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#c7d2fe"/>
            <stop offset="60%" stopColor="#818cf8"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </radialGradient>
          <radialGradient id="fenster" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#e0f2fe"/>
            <stop offset="100%" stopColor="#0ea5e9"/>
          </radialGradient>
          <linearGradient id="booster" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#a5b4fc"/>
            <stop offset="100%" stopColor="#4338ca"/>
          </linearGradient>
        </defs>
      </svg>

      {/* Glanz-Effekt */}
      <div className="absolute inset-0 overflow-hidden rounded-full" style={{ borderRadius: 32 }}>
        <div className="anim-glanz absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', width: '60%' }} />
      </div>
    </div>
  )
}
