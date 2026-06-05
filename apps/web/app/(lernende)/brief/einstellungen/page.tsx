import { getLernendeId, getBrief, getLehrpersonenFuerLernende, getKonfiguration } from '@/lib/api'
import { EinstellungenFormular } from './EinstellungenFormular'
import { ZustellartFormular } from '../ZustellartFormular'
import { AvatarErsteller } from '../AvatarErsteller'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EinstellungenSeite() {
  const lernendeId = await getLernendeId()
  if (!lernendeId) redirect('/anmelden')

  const { pool } = await import('@/lib/db')
  const { rows: lernRows } = await pool.query(
    'SELECT vorname, nachname, email FROM lernende WHERE id = $1', [lernendeId]
  )
  const vorname = lernRows[0]?.vorname as string ?? ''
  const nachname = lernRows[0]?.nachname as string ?? ''
  const email = lernRows[0]?.email as string ?? ''

  const [brief, lehrpersonen, config] = await Promise.all([
    getBrief(lernendeId),
    getLehrpersonenFuerLernende(lernendeId),
    getKonfiguration(),
  ])
  const zustellartAuswahlAktiv = (config.zustellart_auswahl_aktiv ?? 'true') === 'true'
  const zustellartStandard = config.zustellart_standard ?? 'mail'

  if (!brief) redirect('/brief/erstellen')

  const gesperrt = brief.einstellungen_gesperrt_ab
    ? new Date() >= new Date(brief.einstellungen_gesperrt_ab as string)
    : false

  const bereitsZugestellt = ['zugestellt', 'zugestellt_ausdruck_pendent']
    .includes(brief.status as string)

  return (
    <div className="space-y-8">
      <div>
        <Link href="/brief" className="text-stone-400 hover:text-stone-900 text-sm">← Zurück</Link>
        <h1 className="text-2xl font-bold mt-1">Einstellungen</h1>
        <p className="mt-1 text-stone-500 text-sm">
          {(() => {
            const optionen = [
              'Avatar anpassen',
              'Lehrpersonen auswählen',
              ...(zustellartAuswahlAktiv ? ['Zustellungsart wählen'] : []),
            ]
            if (optionen.length === 1) return optionen[0] + '.'
            return optionen.slice(0, -1).join(', ') + ' und ' + optionen.at(-1) + '.'
          })()}
        </p>
      </div>

      {/* Mein Profil */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Mein Profil</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-stone-100">
            <span className="text-stone-500">Name</span>
            <span className="font-medium">{vorname} {nachname}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-stone-500">E-Mail</span>
            <span className="font-medium text-stone-700">{email}</span>
          </div>
        </div>
        <p className="text-xs text-stone-400">
          Name und E-Mail können nur durch deine Lehrperson geändert werden.
        </p>
      </div>

      {gesperrt && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⚠ Die Einstellungen sind 28 Tage vor dem Lehrabschluss gesperrt.
        </div>
      )}

      {/* Avatar */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Mein Avatar</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Lade ein Foto hoch oder lass dir einen Avatar generieren.
          </p>
        </div>
        <div className="card">
          <AvatarErsteller vorname={vorname} />
        </div>
      </div>

      {/* Lehrpersonen */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Lehrpersonen</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Wähle, welche Lehrpersonen einen Kommentar hinzufügen dürfen.
          </p>
        </div>
        <EinstellungenFormular
          lehrpersonen={lehrpersonen as Array<{ id: string; vorname: string; nachname: string; fachbereich: string }>}
          aktuelleAuswahl={(brief.lp_auswahl as Array<{ lehrperson_id: string; brief_sichtbar: boolean }>) ?? []}
          briefId={brief.id as string}
          gesperrt={gesperrt}
        />
      </div>

      {/* Zustellung — nur anzeigen wenn Auswahl aktiv oder Brief bereits zugestellt */}
      {(zustellartAuswahlAktiv || bereitsZugestellt) && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Zustellung</h2>
            <p className="text-sm text-stone-500 mt-0.5">
              Wie möchtest du deinen Brief erhalten?
            </p>
          </div>
          {bereitsZugestellt ? (
            <p className="text-sm text-stone-400 italic">
              Dein Brief wurde bereits zugestellt.
            </p>
          ) : (
            <ZustellartFormular
              aktuelleZustellart={brief.zustellart as string}
              gesperrt={gesperrt}
            />
          )}
        </div>
      )}
    </div>
  )
}
