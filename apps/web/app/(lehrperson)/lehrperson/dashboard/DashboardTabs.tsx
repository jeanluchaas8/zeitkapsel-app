'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  klassen: ReactNode
  quiz: ReactNode
  feedbacks: ReactNode
  rangliste: ReactNode
  feedbacksAnzahl: number
}

type Tab = 'klassen' | 'quiz' | 'feedbacks' | 'rangliste'

export function DashboardTabs({ klassen, quiz, feedbacks, rangliste, feedbacksAnzahl }: Props) {
  const [aktiv, setAktiv] = useState<Tab>('klassen')

  return (
    <div className="space-y-6">
      {/* ── Tab-Leiste ── */}
      <div className="flex rounded-xl bg-stone-100 p-1 gap-1">
        <button
          onClick={() => setAktiv('klassen')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            aktiv === 'klassen'
              ? 'bg-white shadow-sm text-stone-900'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Klassen 🏫
        </button>
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
          onClick={() => setAktiv('rangliste')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            aktiv === 'rangliste'
              ? 'bg-white shadow-sm text-stone-900'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Rangliste 🏆
        </button>
        <button
          onClick={() => setAktiv('feedbacks')}
          className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            aktiv === 'feedbacks'
              ? 'bg-white shadow-sm text-stone-900'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Feedbacks 💬
          {feedbacksAnzahl > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
              {feedbacksAnzahl}
            </span>
          )}
        </button>
      </div>

      {/* ── Inhalte ── */}
      <div className={aktiv === 'klassen' ? '' : 'hidden'}>{klassen}</div>
      <div className={aktiv === 'quiz' ? '' : 'hidden'}>{quiz}</div>
      <div className={aktiv === 'rangliste' ? '' : 'hidden'}>{rangliste}</div>
      <div className={aktiv === 'feedbacks' ? '' : 'hidden'}>{feedbacks}</div>
    </div>
  )
}
