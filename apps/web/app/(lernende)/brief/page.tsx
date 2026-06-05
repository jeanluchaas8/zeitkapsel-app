import Link from 'next/link'
import { getLernendeId, getBrief, getLernende } from '@/lib/api'
import { redirect } from 'next/navigation'
import { KapselLandung } from './KapselLandung'
import { getStandort, getVerlauf } from './standorteDB'
import { TabBereich } from './TabBereich'
import { QuizKarte } from './QuizKarte'
import { FeedbacksAnzeige } from './FeedbacksAnzeige'
import { FeedbackAnfrage } from './FeedbackAnfrage'
import { LehrfortschrittAnzeige } from './LehrfortschrittAnzeige'
import { QuizVerlauf } from './QuizVerlauf'
import { pool } from '@/lib/db'

const STATUS_TEXT: Record<string, string> = {
  entwurf: 'In Bearbeitung',
  versiegelt: 'Versiegelt',
  zugestellt: 'Zugestellt',
  ausdruck_pendent: 'Ausdruck ausstehend',
  zugestellt_ausdruck_pendent: 'Zugestellt',
}

const STATUS_FARBE: Record<string, string> = {
  entwurf: 'bg-yellow-100 text-yellow-800',
  versiegelt: 'bg-blue-100 text-blue-800',
  zugestellt: 'bg-green-100 text-green-800',
  ausdruck_pendent: 'bg-orange-100 text-orange-800',
  zugestellt_ausdruck_pendent: 'bg-green-100 text-green-800',
}

export default async function BriefUebersichtSeite() {
  const lernendeId = await getLernendeId()
  if (!lernendeId) redirect('/anmelden')

  const [brief, lernende] = await Promise.all([
    getBrief(lernendeId),
    getLernende(lernendeId),
  ])

  // Avatar laden
  const { rows: avRows } = await pool.query(
    'SELECT avatar_seed, avatar_url FROM lernende WHERE id = $1', [lernendeId]
  )
  const avatarSeed = avRows[0]?.avatar_seed as string ?? ''
  const avatarUploadUrl = avRows[0]?.avatar_url as string ?? ''
  // Avatar-URL bestimmen — Fallback: Auto-Avatar aus Namen
  let avatarUrl = ''
  if (avatarUploadUrl) {
    avatarUrl = avatarUploadUrl
  } else if (avatarSeed && avatarSeed.includes(':')) {
    const [stil, seed] = avatarSeed.split(':')
    avatarUrl = `https://api.dicebear.com/7.x/${stil}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  } else {
    // Automatischer Avatar aus Vorname — immer vorhanden
    const name = (lernende?.vorname as string ?? 'user').toLowerCase()
    avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  }

  const lehrabschlussDatum = lernende?.lehrabschluss
    ? new Date(lernende.lehrabschluss as string).toLocaleDateString('de-CH', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  // Kein Brief → Startseite ohne Brief
  if (!brief) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="Avatar"
            className="w-14 h-14 rounded-full border-2 border-stone-200 bg-stone-50 object-cover flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-bold">Hallo {lernende?.vorname as string} 👋</h1>
            <p className="text-stone-500 text-sm">{lernende?.beruf as string}</p>
            {lehrabschlussDatum && (
              <p className="text-xs text-stone-400 mt-0.5">Brief-Zustellung: {lehrabschlussDatum}</p>
            )}
          </div>
        </div>

        {/* Brief erstellen */}
        <div className="card text-center py-10 space-y-4">
          <p className="text-4xl">✉️</p>
          <h2 className="text-lg font-semibold">Schreibe deinen ersten Brief</h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            Halte fest, was dir jetzt wichtig ist — du liest ihn erst zu deinem Lehrabschluss.
          </p>
          <Link href="/brief/erstellen" className="btn-primary inline-block">
            Brief erstellen
          </Link>
        </div>
      </div>
    )
  }

  const istAusgetreten = !!(lernende?.ausgetreten_am)
  const istEntwurf = brief.status === 'entwurf' && !istAusgetreten
  const bereitsZugestellt = ['zugestellt', 'zugestellt_ausdruck_pendent'].includes(brief.status as string) || istAusgetreten
  const gibzAnzahl = (brief.gibz_anzahl as number) ?? 0

  const versiegeltAm = brief.versiegelt_am ? new Date(brief.versiegelt_am as string) : new Date()

  // ISO-Wochennummer berechnen
  const jetzt = new Date()
  const jan4 = new Date(jetzt.getFullYear(), 0, 4)
  const aktWoche = Math.ceil(((jetzt.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
  const aktJahr = jetzt.getFullYear()

  // Schulferien prüfen
  const { rows: ferienRows } = await pool.query(
    `SELECT bezeichnung FROM schulferien
     WHERE $1::date BETWEEN beginn AND ende
     LIMIT 1`,
    [jetzt.toISOString().slice(0, 10)]
  )
  const aktuelleFerien = ferienRows[0]?.bezeichnung as string | null

  // Standort dieser Woche holen
  let { rows: aktuelleZuweisung } = await pool.query(
    `SELECT lsw.standort_id AS id, ks.ort, ks.land, ks.emoji, ks.info, ks.temp,
            ks.lat, ks.lng, ks.foto, ks.foto_alt, ks.wiki_titel, ks.link, ks.link_text
     FROM lernende_standort_woche lsw
     JOIN kapsel_standorte ks ON ks.id = lsw.standort_id
     WHERE lsw.lernende_id = $1 AND lsw.woche = $2 AND lsw.jahr = $3`,
    [lernendeId, aktWoche, aktJahr]
  )

  if (aktuelleZuweisung.length === 0) {
    if (aktuelleFerien) {
      // Schulferien — letzten bekannten Standort anzeigen, keinen neuen zuweisen
      const { rows: letzter } = await pool.query(
        `SELECT ks.id, ks.ort, ks.land, ks.emoji, ks.info, ks.temp,
                ks.lat, ks.lng, ks.foto, ks.foto_alt, ks.wiki_titel, ks.link, ks.link_text
         FROM lernende_standort_woche lsw
         JOIN kapsel_standorte ks ON ks.id = lsw.standort_id
         WHERE lsw.lernende_id = $1
         ORDER BY lsw.jahr DESC, lsw.woche DESC
         LIMIT 1`,
        [lernendeId]
      )
      aktuelleZuweisung = letzter
    } else {
      // Normalbetrieb — neuen Standort zuweisen (letzte 10 Wochen ausschliessen)
      const { rows: neuer } = await pool.query(
        `SELECT id, ort, land, emoji, info, temp, lat, lng, foto, foto_alt, wiki_titel, link, link_text
         FROM kapsel_standorte WHERE aktiv = TRUE
           AND id NOT IN (SELECT standort_id FROM lernende_standort_woche WHERE lernende_id = $1 AND woche > $2 - 10)
         ORDER BY RANDOM() LIMIT 1`,
        [lernendeId, aktWoche]
      )
      const picked = neuer[0] ?? (await pool.query(
        'SELECT id, ort, land, emoji, info, temp, lat, lng, foto, foto_alt, wiki_titel, link, link_text FROM kapsel_standorte WHERE aktiv = TRUE ORDER BY RANDOM() LIMIT 1'
      )).rows[0]
      if (picked) {
        await pool.query(
          'INSERT INTO lernende_standort_woche (lernende_id, woche, jahr, standort_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
          [lernendeId, aktWoche, aktJahr, picked.id]
        )
        aktuelleZuweisung = [picked]
      }
    }
  }

  const sr = aktuelleZuweisung[0] as Record<string, unknown>
  const standort = {
    ort: sr?.ort as string ?? '', land: sr?.land as string ?? '', emoji: sr?.emoji as string ?? '📍',
    info: sr?.info as string ?? '', temp: sr?.temp as string ?? '',
    lat: sr?.lat as number ?? 0, lng: sr?.lng as number ?? 0,
    foto: sr?.foto as string ?? '', fotoAlt: sr?.foto_alt as string ?? '',
    wikiTitel: sr?.wiki_titel as string ?? '', link: sr?.link as string ?? '', linkText: sr?.link_text as string ?? '',
  }
  const standortDbId = sr?.id as string ?? ''

  // Verlauf aller Wochen-Standorte (für Karte + Km)
  const { rows: verlaufRows } = await pool.query(
    `SELECT ks.ort, ks.land, ks.emoji, ks.info, ks.temp, ks.lat, ks.lng,
            ks.foto, ks.foto_alt, ks.wiki_titel, ks.link, ks.link_text
     FROM lernende_standort_woche lsw
     JOIN kapsel_standorte ks ON ks.id = lsw.standort_id
     WHERE lsw.lernende_id = $1
     ORDER BY lsw.woche ASC`,
    [lernendeId]
  )
  const verlauf = verlaufRows.map(r => ({
    ort: r.ort as string, land: r.land as string, emoji: r.emoji as string,
    info: r.info as string, temp: r.temp as string, lat: r.lat as number, lng: r.lng as number,
    foto: r.foto as string, fotoAlt: r.foto_alt as string,
    wikiTitel: r.wiki_titel as string, link: r.link as string, linkText: r.link_text as string,
  }))

  // Quiz-Frage vorhanden?
  const { rows: quizRows } = await pool.query(
    standortDbId ? 'SELECT id FROM kapsel_quiz WHERE standort_id = $1' : 'SELECT NULL LIMIT 0',
    standortDbId ? [standortDbId] : []
  )
  const hatQuizfrage = quizRows.length > 0

  const lpAuswahl = (brief.lp_auswahl as Array<{
    lehrperson_id: string; vorname: string; nachname: string; fachbereich: string
  }>) ?? []

  return (
    <div className="space-y-5">

      {/* ── Header: Avatar + Name + Einstellungen-Button ──────── */}
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="Avatar"
          className="w-14 h-14 rounded-full border-2 border-stone-200 bg-stone-50 object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">Hallo {lernende?.vorname as string} 👋</h1>
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium flex-shrink-0 ${STATUS_FARBE[brief.status as string] ?? 'bg-stone-100 text-stone-700'}`}>
              {STATUS_TEXT[brief.status as string] ?? brief.status}
            </span>
          </div>
          <p className="text-stone-500 text-sm truncate">{lernende?.beruf as string}</p>
          {lehrabschlussDatum && (
            <p className="text-xs text-stone-400 mt-0.5">
              Brief kommt am <strong>{lehrabschlussDatum}</strong>
            </p>
          )}
        </div>
      </div>

      {/* ── Lehrfortschritt ───────────────────────────────────── */}
      {lernende?.lehrstart && lernende?.lehrabschluss && (
        <LehrfortschrittAnzeige
          lehrstart={lernende.lehrstart as string}
          lehrabschluss={lernende.lehrabschluss as string}
          lehrdauer={(lernende.lehrdauer as number) ?? 3}
        />
      )}

      {/* ── Brief schreiben (nur Entwurf) ──────────────────────── */}
      {istEntwurf && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Dein Brief</h2>
          <Link href="/brief/schreiben"
            className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3 hover:bg-stone-50 transition-colors">
            <div>
              <p className="text-sm font-medium">Brief schreiben</p>
              <p className="text-xs text-stone-400">{brief.inhalt ? 'Bearbeiten' : 'Noch kein Inhalt'}</p>
            </div>
            <span className={`text-lg ${brief.inhalt ? 'text-green-500' : 'text-stone-300'}`}>
              {brief.inhalt ? '✓' : '→'}
            </span>
          </Link>
          {brief.inhalt && (
            <Link href="/brief/versiegeln" className="btn-primary w-full block text-center">
              Brief versiegeln 🔒
            </Link>
          )}
        </div>
      )}

      {/* ── Versiegelt-Info ────────────────────────────────────── */}
      {!istEntwurf && !bereitsZugestellt && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Dein Brief ist sicher versiegelt und wird dir zu deinem Lehrabschluss zugestellt.
        </div>
      )}

      {/* ── Schulferien-Hinweis ───────────────────────────────── */}
      {!istEntwurf && aktuelleFerien && (
        <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800 flex items-center gap-2">
          <span className="text-lg">🏖️</span>
          <div>
            <span className="font-medium">{aktuelleFerien}</span>
            {' — '}Die Zeitkapsel pausiert. Der Standort wird nach den Ferien neu bestimmt.
          </div>
        </div>
      )}

      {/* ── Kapsel-Standort ───────────────────────────────────── */}
      {!istEntwurf && standort.ort && (
        <KapselLandung
          standort={standort}
          verlauf={verlauf}
          gibzAnzahl={gibzAnzahl}
          lehrpersonen={lpAuswahl.map(lp => ({
            id: lp.lehrperson_id,
            vorname: lp.vorname,
            nachname: lp.nachname,
            fachbereich: lp.fachbereich,
          }))}
        />
      )}

      {/* ── Quiz & Feedback Tabs ─────────────────────────────── */}
      {!istEntwurf && (
        <TabBereich
          quiz={
            <div className="space-y-4">
              <div className="card space-y-2">
                <h2 className="font-semibold">Wissens-Quiz 🎯</h2>
                <QuizKarte standortId={standortDbId} hatQuizfrage={hatQuizfrage} />
              </div>
              <QuizVerlauf lernendeId={lernendeId} />
            </div>
          }
          feedback={
            <div className="card space-y-4">
              {!bereitsZugestellt && <FeedbackAnfrage />}
              <FeedbacksAnzeige lernendeId={lernendeId} nurJahresfeedbacks={!bereitsZugestellt} />
            </div>
          }
        />
      )}

    </div>
  )
}
