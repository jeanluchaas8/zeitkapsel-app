'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  klasseId: string
  lehrpersonId: string
  aktion: 'hinzufuegen' | 'entfernen'
}

export function LehrpersonZuweisenFormular({ klasseId, lehrpersonId, aktion }: Props) {
  const [laden, setLaden] = useState(false)
  const router = useRouter()

  async function ausfuehren() {
    setLaden(true)
    await fetch('/api/admin/klassen/lehrpersonen', {
      method: aktion === 'hinzufuegen' ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ klasse_id: klasseId, lehrperson_id: lehrpersonId }),
    })
    router.refresh()
    setLaden(false)
  }

  return (
    <button onClick={ausfuehren} disabled={laden}
      className={aktion === 'hinzufuegen' ? 'btn-primary text-xs py-1 px-3' : 'btn-danger text-xs py-1 px-3'}>
      {laden ? '…' : aktion === 'hinzufuegen' ? '+ Hinzufügen' : 'Entfernen'}
    </button>
  )
}
