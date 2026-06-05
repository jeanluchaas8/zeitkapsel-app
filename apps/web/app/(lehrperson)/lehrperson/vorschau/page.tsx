import Link from 'next/link'
import { getLehrpersonId, getKonfiguration } from '@/lib/api'
import { redirect } from 'next/navigation'

export default async function VorschauSeite() {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const config = await getKonfiguration()
  const anleitung = config['brief_anleitung_text'] ?? ''
  const placeholder = config['brief_placeholder'] ?? ''

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900 text-sm">← Dashboard</Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-bold">Lernenden-Vorschau</h1>
          <Link href="/lehrperson/anweisungen" className="btn-secondary text-sm">
            Anweisungen bearbeiten
          </Link>
        </div>
        <p className="text-sm text-stone-500 mt-1">
          So sieht die Oberfläche für die Lernenden aus.
        </p>
      </div>

      {/* Schritt 1: Startseite */}
      <VorschauKarte schritt="1" titel="Startseite — noch kein Brief">
        <div className="text-center py-8 space-y-3">
          <p className="text-4xl">✉️</p>
          <h2 className="text-lg font-semibold">Schreibe deinen ersten Brief</h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            Halte fest, was dir jetzt wichtig ist — du liest ihn erst zu deinem Lehrabschluss.
          </p>
          <div className="inline-block bg-stone-900 text-white text-sm px-4 py-2 rounded-xl">
            Brief erstellen
          </div>
        </div>
      </VorschauKarte>

      {/* Schritt 2: Brief schreiben */}
      <VorschauKarte schritt="2" titel="Brief schreiben">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Brief schreiben</p>
              <p className="text-sm text-stone-500">Dieser Brief wird dir erst zu deinem Lehrabschluss angezeigt.</p>
            </div>
            <div className="bg-stone-100 text-stone-500 text-sm px-3 py-1 rounded-lg">Speichern</div>
          </div>

          {/* Anleitung */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-900">Anleitung</p>
              <span className="text-blue-400 text-xs">Schliessen ✕</span>
            </div>
            <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">{anleitung}</p>
          </div>

          {/* Textfeld */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="min-h-[200px] p-4 bg-white">
              <p className="text-stone-300 font-serif text-base leading-relaxed whitespace-pre-wrap">
                {placeholder}
              </p>
            </div>
            <div className="flex justify-end border-t border-stone-100 px-4 py-2">
              <span className="text-xs text-stone-400">0 / 10'000 Zeichen</span>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="bg-stone-100 text-stone-500 text-sm px-4 py-2 rounded-xl">Zurück</div>
            <div className="bg-stone-200 text-stone-400 text-sm px-4 py-2 rounded-xl">Weiter zu Einstellungen</div>
          </div>
        </div>
      </VorschauKarte>

      {/* Schritt 3: Lehrpersonen wählen */}
      <VorschauKarte schritt="3" titel="Lehrpersonen wählen">
        <div className="space-y-3">
          <p className="font-bold text-lg">Einstellungen</p>
          <p className="text-sm text-stone-500">Wähle, welche Lehrpersonen einen Kommentar hinzufügen dürfen.</p>
          {['Muster, Anna (Berufskunde)', 'Haas, Jean-Luc (Allgemeinbildung)'].map((lp) => (
            <div key={lp} className="border border-stone-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-4 h-4 rounded border-2 border-stone-300" />
              <div>
                <p className="text-sm font-medium">{lp.split(' (')[0]}</p>
                <p className="text-xs text-stone-400">{lp.split('(')[1]?.replace(')', '')}</p>
              </div>
            </div>
          ))}
        </div>
      </VorschauKarte>

      {/* Schritt 4: Versiegeln */}
      <VorschauKarte schritt="4" titel="Brief versiegeln">
        <div className="space-y-3 text-center py-4">
          <p className="text-4xl">🔒</p>
          <p className="font-bold text-lg">Bereit zum Versiegeln?</p>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Nach dem Versiegeln kann der Brief nicht mehr bearbeitet werden.
            Er wird dir zu deinem Lehrabschluss zugestellt.
          </p>
          <div className="inline-block bg-stone-900 text-white text-sm px-6 py-2 rounded-xl">
            Brief versiegeln
          </div>
        </div>
      </VorschauKarte>

      <div className="rounded-xl bg-stone-50 border border-stone-200 px-5 py-4 text-sm text-stone-500">
        💡 Die Anleitung in Schritt 2 kannst du unter{' '}
        <Link href="/lehrperson/anweisungen" className="underline hover:text-stone-900">
          Anweisungen bearbeiten
        </Link>{' '}
        anpassen.
      </div>
    </div>
  )
}

function VorschauKarte({ schritt, titel, children }: { schritt: string; titel: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-medium">
          {schritt}
        </span>
        <p className="text-sm font-semibold text-stone-600">{titel}</p>
      </div>
      <div className="rounded-xl border-2 border-dashed border-stone-200 p-5 bg-stone-50/50">
        {children}
      </div>
    </div>
  )
}
