import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { NavLeiste } from '@/components/NavLeiste'
import type { Rolle } from '@/lib/typen'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/anmelden')
  if ((session.user as { rolle?: Rolle }).rolle !== 'admin') redirect('/')

  return (
    <div className="min-h-screen">
      <NavLeiste name={session.user?.name ?? ''} rolle="admin" />
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  )
}
