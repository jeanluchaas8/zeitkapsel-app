'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StatusFormular({
  lehrpersonId,
  nurBestaetigen = false,
}: {
  lehrpersonId: string
  nurBestaetigen?: boolean
}) {
  const [laden, setLaden] = useState(false)
  const router = useRouter()

  async function setStatus(status: 'aktiv' | 'abgelehnt') {
    setLaden(true)
    await fetch(`/api/admin/lehrpersonen/${lehrpersonId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setLaden(false)
  }

  if (nurBestaetigen) {
    return (
      <button
        onClick={() => setStatus('aktiv')}
        disabled={laden}
        className="text-xs text-green-600 hover:text-green-800 underline"
      >
        Doch bestätigen
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setStatus('aktiv')}
        disabled={laden}
        className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Bestätigen
      </button>
      <button
        onClick={() => setStatus('abgelehnt')}
        disabled={laden}
        className="rounded-lg border border-stone-200 px-3 py-1 text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-50"
      >
        Ablehnen
      </button>
    </div>
  )
}
