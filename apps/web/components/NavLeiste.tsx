'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Rolle } from '@/lib/typen'

interface Props {
  name: string
  rolle: Rolle
  avatarUrl?: string
}

export function NavLeiste({ name, rolle, avatarUrl }: Props) {
  const pathname = usePathname()
  const istAdmin = rolle === 'admin'

  return (
    <nav style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href={istAdmin || rolle === 'lehrperson' ? '/lehrperson/dashboard' : '/brief'}
          className="text-lg font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Zeitkapsel
        </Link>

        <div className="flex items-center gap-4">
          {/* Umschalter für Admins */}
          {istAdmin && (
            <div className="flex items-center rounded-xl p-0.5 text-sm"
              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
              <Link
                href="/lehrperson/dashboard"
                className="rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                style={pathname.startsWith('/lehrperson')
                  ? { backgroundColor: 'var(--text)', color: 'var(--bg)' }
                  : { color: 'var(--text-3)' }}
              >
                Klassen
              </Link>
              <Link
                href="/admin"
                className="rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                style={pathname.startsWith('/admin') && !pathname.startsWith('/admin/lernende-vorschau') && !pathname.startsWith('/admin/kapsel')
                  ? { backgroundColor: 'var(--text)', color: 'var(--bg)' }
                  : { color: 'var(--text-3)' }}
              >
                Admin
              </Link>
              <Link
                href="/admin/lernende-vorschau"
                className="rounded-lg px-3 py-1 transition-colors text-sm font-medium"
                style={pathname.startsWith('/admin/lernende-vorschau') || pathname.startsWith('/admin/kapsel')
                  ? { backgroundColor: 'var(--text)', color: 'var(--bg)' }
                  : { color: 'var(--text-3)' }}
              >
                Vorschau
              </Link>
            </div>
          )}

          {/* Avatar + Name */}
          <div className="flex items-center gap-2">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                style={{ border: '1px solid var(--border)' }}
                title={name} />
            )}
            <span className="text-sm hidden sm:inline" style={{ color: 'var(--text-3)' }}>{name}</span>
          </div>

          {/* Einstellungen */}
          {rolle === 'lernende' && (
            <Link href="/brief/einstellungen"
              className="transition-colors"
              style={{ color: 'var(--text-4)' }}
              title="Einstellungen">
              ⚙️
            </Link>
          )}
          {(rolle === 'lehrperson' || rolle === 'admin') && (
            <Link href="/lehrperson/einstellungen"
              className="transition-colors"
              style={{ color: 'var(--text-4)' }}
              title="Einstellungen">
              ⚙️
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: '/anmelden' })}
            className="text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--text-3)' }}
          >
            Abmelden
          </button>
        </div>
      </div>
    </nav>
  )
}
