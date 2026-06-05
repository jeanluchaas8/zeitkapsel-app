import { getLehrpersonId, getBriefFuerLehrperson } from '@/lib/api'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function BriefDetailSeite({ params }: { params: { briefId: string } }) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const brief = await getBriefFuerLehrperson(params.briefId, lehrpersonId)
  if (!brief) redirect('/lehrperson/dashboard')

  const lehrabschluss = new Date(brief.lehrabschluss as string)
  const freigegebAb = new Date(lehrabschluss)
  freigegebAb.setDate(freigegebAb.getDate() - 28)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/lehrperson/dashboard" className="text-stone-400 hover:text-stone-900">← Zurück</Link>
          <div>
            <h1 className="text-2xl font-bold">{brief.vorname as string} {brief.nachname as string}</h1>
            <p className="text-sm text-stone-500">
              Zeitkapsel-Brief
              {brief.versiegelt_am && (
                <> · Versiegelt am {new Date(brief.versiegelt_am as string).toLocaleDateString('de-CH')}</>
              )}
            </p>
          </div>
        </div>
        {brief.inhalt && (brief.inhalt_freigegeben as boolean) && (
          <Link href={`/lehrperson/briefe/${params.briefId}/drucken`}
            target="_blank"
            className="btn-secondary text-sm">
            🖨 Drucken
          </Link>
        )}
      </div>

      {/* Brief-Inhalt */}
      <div className="card">
        <h2 className="font-semibold mb-3">Brief</h2>
        {!(brief.inhalt_freigegeben as boolean) ? (
          <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-4 text-sm text-stone-500 space-y-1">
            <p className="font-medium text-stone-700">Brief noch nicht lesbar</p>
            <p>
              Der Brief wird dir erst <strong>28 Tage vor dem Lehrabschluss</strong>{' '}
              ({freigegebAb.toLocaleDateString('de-CH')}) zugänglich —
              oder sofort bei einem Austritt.
            </p>
          </div>
        ) : !brief.brief_sichtbar ? (
          <p className="text-stone-400 text-sm italic">
            {brief.vorname as string} hat den Brief-Inhalt nicht für Lehrpersonen freigegeben.
          </p>
        ) : brief.inhalt ? (
          <div className="bg-amber-50 rounded-lg border border-amber-100 p-4">
            <p className="whitespace-pre-wrap leading-relaxed font-serif text-stone-800">{brief.inhalt as string}</p>
          </div>
        ) : (
          <p className="text-stone-500 text-sm italic">Kein Inhalt vorhanden.</p>
        )}
      </div>

      {/* Hinweis: Feedback statt Kommentar */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎓</span>
          <div className="flex-1">
            <p className="font-semibold text-indigo-900">Abschluss-Feedback schreiben</p>
            <p className="text-sm text-indigo-700 mt-0.5">
              Dein persönliches Wort an {brief.vorname as string} schreibst du als Abschluss-Feedback —
              zusammen mit allen anderen Feedbacks an einem zentralen Ort.
              Es wird {brief.vorname as string} erst am Lehrabschluss zugestellt.
            </p>
          </div>
        </div>
        <Link
          href={`/lehrperson/lernende/${brief.lernende_id as string}/feedback?oeffne=abschluss`}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Zum Abschluss-Feedback →
        </Link>
      </div>
    </div>
  )
}
