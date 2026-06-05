import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { Rolle } from '@/lib/typen'

// Startseite leitet je nach Rolle weiter
export default async function Startseite() {
  const session = await auth()
  if (!session) redirect('/anmelden')

  const rolle = (session.user as { rolle?: Rolle }).rolle
  if (rolle === 'admin') redirect('/admin')
  if (rolle === 'lehrperson') redirect('/lehrperson/dashboard')
  redirect('/brief')
}
