interface Props {
  lehrstart: string
  lehrabschluss: string
  lehrdauer: number
}

export function LehrfortschrittAnzeige({ lehrstart, lehrabschluss, lehrdauer }: Props) {
  const start    = new Date(lehrstart)
  const ende     = new Date(lehrabschluss)
  const jetzt    = new Date()

  const gesamtMs = ende.getTime() - start.getTime()
  const abgelaufen = Math.max(0, jetzt.getTime() - start.getTime())
  const prozent  = Math.min(100, Math.round((abgelaufen / gesamtMs) * 100))

  const tageGesamt = Math.round(gesamtMs / 86400000)
  const tageNoch   = Math.max(0, Math.ceil((ende.getTime() - jetzt.getTime()) / 86400000))

  // Aktuelles Lehrjahr (1-basiert)
  const jahreFlt  = abgelaufen / (365.25 * 86400000)
  const aktLehrjahr = Math.min(lehrdauer, Math.max(1, Math.ceil(jahreFlt)))

  // Meilenstein-Positionen (Jahresübergänge)
  const meilensteine = Array.from({ length: lehrdauer - 1 }, (_, i) => {
    const pos = Math.round(((i + 1) / lehrdauer) * 100)
    return { nr: i + 1, pos }
  })

  const istAbgeschlossen = jetzt >= ende

  return (
    <div className="card space-y-3">
      {/* Kopfzeile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">
            {istAbgeschlossen
              ? '🎓 Lehre abgeschlossen'
              : `${aktLehrjahr}. Lehrjahr von ${lehrdauer}`}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {istAbgeschlossen
              ? `Abschluss ${ende.toLocaleDateString('de-CH')}`
              : `Noch ${tageNoch} Tage · Abschluss ${ende.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <span className={`text-sm font-bold tabular-nums ${
          istAbgeschlossen ? 'text-green-600' : 'text-indigo-600'
        }`}>
          {prozent}%
        </span>
      </div>

      {/* Fortschrittsbalken */}
      <div className="relative">
        <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              istAbgeschlossen
                ? 'bg-green-400'
                : prozent >= 75
                  ? 'bg-indigo-500'
                  : 'bg-indigo-400'
            }`}
            style={{ width: `${prozent}%` }}
          />
        </div>

        {/* Jahres-Meilensteine */}
        {meilensteine.map(m => (
          <div
            key={m.nr}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${m.pos}%` }}
          >
            <div className={`w-0.5 h-3 ${
              prozent >= m.pos ? 'bg-indigo-300' : 'bg-stone-300'
            }`} />
          </div>
        ))}
      </div>

      {/* Lehrjahr-Beschriftungen */}
      {lehrdauer > 1 && (
        <div className="relative h-4">
          {/* Start */}
          <span className="absolute left-0 text-[10px] text-stone-400 -translate-x-0">
            {start.getFullYear()}
          </span>
          {/* Jahresübergänge */}
          {meilensteine.map(m => (
            <span
              key={m.nr}
              className="absolute text-[10px] text-stone-400 -translate-x-1/2"
              style={{ left: `${m.pos}%` }}
            >
              LJ {m.nr + 1}
            </span>
          ))}
          {/* Ende */}
          <span className="absolute right-0 text-[10px] text-stone-400 translate-x-0">
            {ende.getFullYear()}
          </span>
        </div>
      )}
    </div>
  )
}
