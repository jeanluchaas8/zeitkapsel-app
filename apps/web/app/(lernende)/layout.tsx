import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { NavLeiste } from '@/components/NavLeiste'
import type { Rolle } from '@/lib/typen'
import { pool } from '@/lib/db'

export default async function LernendeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/anmelden')
  const rolle = (session.user as { rolle?: Rolle }).rolle
  if (rolle === 'admin') redirect('/admin')
  if (rolle !== 'lernende') redirect('/lehrperson/dashboard')

  const lernendeId = (session.user as { id?: string }).id ?? ''
  let avatarUrl: string | undefined
  if (lernendeId) {
    const { rows } = await pool.query('SELECT avatar_seed, avatar_url FROM lernende WHERE id = $1', [lernendeId])
    const uploadUrl = rows[0]?.avatar_url as string ?? ''
    const seed = rows[0]?.avatar_seed as string ?? ''
    if (uploadUrl) {
      avatarUrl = uploadUrl
    } else if (seed && seed.includes(':')) {
      const [stil, s] = seed.split(':')
      avatarUrl = `https://api.dicebear.com/7.x/${stil}/svg?seed=${encodeURIComponent(s)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    } else {
      // Fallback: Auto-Avatar aus Namen
      const name = session.user?.name?.split(' ')[0]?.toLowerCase() ?? 'user'
      avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    }
  }

  return (
    <div className="min-h-screen">
      <NavLeiste name={session.user?.name ?? ''} rolle="lernende" avatarUrl={avatarUrl} />
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  )
}
