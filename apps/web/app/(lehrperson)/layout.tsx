import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { NavLeiste } from '@/components/NavLeiste'
import type { Rolle } from '@/lib/typen'

export default async function LehrpersonLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/anmelden')
  const rolle = (session.user as { rolle?: Rolle }).rolle
  if (rolle !== 'lehrperson' && rolle !== 'admin') redirect('/brief')

  return (
    <div className="min-h-screen">
      <NavLeiste name={session.user?.name ?? ''} rolle={rolle ?? 'lehrperson'} />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  )
}
