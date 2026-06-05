import Link from 'next/link'

interface Props {
  schuljahre: string[]
  aktiv: string
  basePath: string
}

export function SchuljahrAuswahl({ schuljahre, aktiv, basePath }: Props) {
  if (schuljahre.length <= 1) return null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium" style={{ color: 'var(--text-4)' }}>Schuljahr:</span>
      <div className="flex gap-1 flex-wrap">
        {schuljahre.map(sj => (
          <Link
            key={sj}
            href={`${basePath}?schuljahr=${encodeURIComponent(sj)}`}
            className="rounded-lg px-3 py-1 text-sm font-medium transition-colors"
            style={sj === aktiv
              ? { backgroundColor: '#4f46e5', color: '#ffffff' }
              : { backgroundColor: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            {sj}
          </Link>
        ))}
      </div>
    </div>
  )
}
