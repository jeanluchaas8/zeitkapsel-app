import type { Standort } from './KapselStandort'
import { svgKoord } from './KapselStandort'

// ViewBox: 0 0 360 180  →  svgX = lng + 180,  svgY = 90 - lat
const c = (s: Standort) => {
  const k = svgKoord(s)
  return { x: k.x / 100 * 360, y: k.y / 100 * 180 }
}

// Vereinfachte Kontinentumrisse als SVG-Polygone (Längengrad, Breitengrad → x,y)
const p = (...pts: [number, number][]) =>
  pts.map(([lng, lat]) => `${lng + 180},${90 - lat}`).join(' ')

const KONTINENTE = [
  // Nordamerika
  p([-170,72],[-140,72],[-130,60],[-100,50],[-80,49],[-70,46],[-52,47],[-52,60],[-66,75],[-85,83],[-130,83],[-170,72]),
  // Grönland
  p([-55,60],[-20,77],[-40,84],[-60,84],[-75,72],[-55,60]),
  // Zentralamerika/Karibik (vereinfacht)
  p([-90,18],[-78,16],[-75,10],[-85,10],[-90,18]),
  // Südamerika
  p([-80,12],[-65,0],[-50,-10],[-38,-20],[-40,-35],[-55,-55],[-68,-54],[-75,-45],[-80,-35],[-80,-5],[-76,3],[-72,12],[-80,12]),
  // Europa
  p([-10,36],[5,36],[15,38],[30,38],[38,48],[30,60],[20,70],[10,71],[5,60],[-8,52],[-10,44],[-10,36]),
  // Skandinavien
  p([5,58],[8,58],[15,57],[18,60],[30,70],[28,71],[15,70],[5,62],[5,58]),
  // Afrika
  p([-18,15],[-5,35],[10,37],[30,37],[43,12],[51,12],[50,-25],[35,-34],[18,-35],[15,-35],[-5,-30],[-18,0],[-18,15]),
  // Madagaskar
  p([44,-12],[48,-14],[50,-24],[44,-25],[44,-12]),
  // Asien (Hauptmasse)
  p([26,42],[40,38],[55,12],[70,25],[80,28],[100,1],[120,10],[130,32],[145,45],[160,55],[170,68],[140,72],[100,72],[60,72],[30,72],[28,60],[26,42]),
  // Sibirien/Russland (oberer Teil)
  p([30,72],[60,72],[100,72],[140,72],[170,68],[180,68],[180,72],[150,75],[100,75],[60,75],[30,75],[30,72]),
  // Japan
  p([130,31],[135,34],[140,38],[142,44],[140,44],[132,34],[130,31]),
  // Indonesien (vereinfacht)
  p([96,5],[108,5],[115,-5],[120,-8],[115,-9],[105,-8],[96,5]),
  // Australien
  p([115,-20],[130,-15],[145,-10],[155,-25],[150,-38],[135,-38],[117,-30],[115,-20]),
  // Neuseeland
  p([168,-44],[173,-40],[175,-37],[173,-36],[170,-43],[168,-44]),
  // Antarktis
  p([-180,-65],[180,-65],[180,-90],[-180,-90]),
]

interface Props {
  standort: Standort
  verlauf: Standort[]
  onKlick?: (s: Standort) => void
  ausgewaehlt?: Standort | null
}

export function WeltkarteSVG({ standort, verlauf, onKlick, ausgewaehlt }: Props) {
  return (
    <svg
      viewBox="0 0 360 180"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ background: '#0d1b2a' }}
    >
      {/* Gitterlinien */}
      <g stroke="rgba(255,255,255,0.06)" strokeWidth="0.4">
        {[30, 60, 90, 120, 150].map(y => <line key={y} x1="0" y1={y} x2="360" y2={y} />)}
        {[60, 120, 180, 240, 300].map(x => <line key={x} x1={x} y1="0" x2={x} y2="180" />)}
        <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
      </g>

      {/* Kontinente */}
      {KONTINENTE.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="#1e3a5f"
          stroke="#2d5a8f"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      ))}

      {/* Verbindungslinien */}
      {verlauf.length > 1 && verlauf.map((s, i) => {
        if (i === 0) return null
        const prev = verlauf[i - 1]
        const a = c(prev), b = c(s)
        return (
          <line key={`l-${i}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(165,180,252,0.25)" strokeWidth="0.5" strokeDasharray="1.5,1.5"
          />
        )
      })}

      {/* Besuchte Orte */}
      {verlauf.filter(s => s.ort !== standort.ort).map(s => {
        const { x, y } = c(s)
        const istAusgewaehlt = ausgewaehlt?.ort === s.ort
        return (
          <g key={s.ort}
            onClick={() => onKlick?.(s)}
            style={{ cursor: onKlick ? 'pointer' : 'default' }}
          >
            {istAusgewaehlt && (
              <circle cx={x} cy={y} r="4" fill="rgba(251,191,36,0.25)" stroke="none" />
            )}
            <circle cx={x} cy={y} r="1.8"
              fill={istAusgewaehlt ? '#f59e0b' : 'rgba(148,163,184,0.75)'}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.4"
            />
          </g>
        )
      })}

      {/* Aktueller Standort */}
      {(() => {
        const { x, y } = c(standort)
        return (
          <g>
            <circle cx={x} cy={y} r="4" fill="rgba(99,102,241,0.2)" stroke="none" />
            <circle cx={x} cy={y} r="2.2" fill="#6366f1" stroke="white" strokeWidth="0.6" />
          </g>
        )
      })()}

      {/* Legende */}
      <g transform="translate(4,170)">
        <circle cx="3" cy="3" r="2.2" fill="#6366f1" stroke="white" strokeWidth="0.5" />
        <text x="7" y="5.5" fill="rgba(255,255,255,0.7)" fontSize="5" fontFamily="sans-serif">Aktuell</text>
        <circle cx="37" cy="3" r="1.8" fill="rgba(148,163,184,0.75)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.4" />
        <text x="41" y="5.5" fill="rgba(255,255,255,0.5)" fontSize="5" fontFamily="sans-serif">{verlauf.length - 1} besucht</text>
      </g>
    </svg>
  )
}
