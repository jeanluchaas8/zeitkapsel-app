'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  quiz: ReactNode
  feedback: ReactNode
}

export function TabBereich({ quiz, feedback }: Props) {
  const [aktiv, setAktiv] = useState<'quiz' | 'feedback'>('quiz')

  return (
    <div className="space-y-4">
      {/* ── Tab-Leiste ── */}
      <div className="flex rounded-xl bg-stone-100 p-1 gap-1">
        <button
          onClick={() => setAktiv('quiz')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            aktiv === 'quiz'
              ? 'bg-white shadow-sm text-stone-900'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Quiz 🎯
        </button>
        <button
          onClick={() => setAktiv('feedback')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            aktiv === 'feedback'
              ? 'bg-white shadow-sm text-stone-900'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Feedbacks 💬
        </button>
      </div>

      {/* ── Inhalt ── */}
      <div className={aktiv === 'quiz' ? '' : 'hidden'}>{quiz}</div>
      <div className={aktiv === 'feedback' ? '' : 'hidden'}>{feedback}</div>
    </div>
  )
}
