'use client'

import { useState } from 'react'
import { VersiegelungsAnimation } from '@/app/(lernende)/brief/versiegeln/VersiegelungsAnimation'

export function AnimationsVorschau() {
  const [laeuft, setLaeuft] = useState(false)

  if (laeuft) {
    return <VersiegelungsAnimation onFertig={() => setLaeuft(false)} autoStart />
  }

  return (
    <button
      onClick={() => setLaeuft(true)}
      className="btn-secondary w-full"
    >
      🎬 Versiegelungs-Animation vorführen
    </button>
  )
}
