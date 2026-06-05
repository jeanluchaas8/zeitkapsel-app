import { render } from '@react-email/render'
import React from 'react'
import { pool } from '../db/pool.js'
import { emailSenden } from '../email/index.js'
import { speicher } from '../storage/index.js'
import { Erinnerung5wEmail } from '../email/vorlagen/erinnerung5w.js'
import { LpBenachrichtigung4wEmail } from '../email/vorlagen/lpBenachrichtigung4w.js'
import { ZustellungEmail } from '../email/vorlagen/zustellung.js'

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'

// Hauptfunktion — führt alle drei Checks sequenziell aus
export async function dailyCheck(): Promise<void> {
  await Promise.allSettled([
    erinnerung5wCheck(),
    lpBenachrichtigung4wCheck(),
    zustellungCheck(),
  ])
}

// --- Check 1: Erinnerung 35 Tage vor Abschluss ---

async function erinnerung5wCheck(): Promise<void> {
  const { rows } = await pool.query(`
    SELECT
      l.id AS lernende_id, l.vorname, l.email,
      k.bezeichnung AS klasse_name, k.lehrabschluss AS abschluss_datum,
      k.lehrabschluss - 28 AS einstellungen_deadline,
      s.name AS schule_name,
      b.zustellart,
      COALESCE(
        json_agg(json_build_object(
          'name', lp.vorname || ' ' || lp.nachname,
          'fachbereich', lp.fachbereich
        )) FILTER (WHERE la.id IS NOT NULL), '[]'::json
      ) AS lp_auswahl
    FROM lernende l
    JOIN klasse k ON l.klasse_id = k.id
    JOIN schule s ON s.id = k.schule_id
    JOIN brief b ON b.lernende_id = l.id
    LEFT JOIN lp_auswahl la ON la.brief_id = b.id
    LEFT JOIN lehrperson lp ON lp.id = la.lehrperson_id
    WHERE k.lehrabschluss - CURRENT_DATE = 35
      AND b.status = 'versiegelt'
      AND NOT EXISTS (
        SELECT 1 FROM email_log el
        WHERE el.lernende_id = l.id AND el.typ = 'erinnerung_5w'
      )
    GROUP BY l.id, l.vorname, l.email, k.bezeichnung, k.lehrabschluss, s.name, b.zustellart
  `)

  for (const row of rows) {
    try {
      const lpNamen = (row.lp_auswahl as Array<{ name: string }>)
        .map((lp) => lp.name)
        .join(', ') || 'keine'

      const html = await render(React.createElement(Erinnerung5wEmail, {
        vorname: row.vorname as string,
        abschlussDatum: formatDatum(row.abschluss_datum as string),
        deadlineDatum: formatDatum(row.einstellungen_deadline as string),
        zustellart: zustellartText(row.zustellart as string),
        lpZusammenfassung: lpNamen,
        schuleName: row.schule_name as string,
        einstellungenLink: `${WEB_URL}/brief/einstellungen`,
      }))

      await emailSenden({
        an: row.email as string,
        betreff: 'Noch 5 Wochen — überprüfe deine Einstellungen',
        html,
        lernendeId: row.lernende_id as string,
        typ: 'erinnerung_5w',
      })
    } catch (err) {
      console.error(`Erinnerung fehlgeschlagen für Lernende ${row.lernende_id}:`, err)
    }
  }
}

// --- Check 2: LP-Benachrichtigung + Sperren 28 Tage vor Abschluss ---

async function lpBenachrichtigung4wCheck(): Promise<void> {
  // Einstellungen sperren
  await pool.query(`
    UPDATE brief b
    SET einstellungen_gesperrt_ab = CURRENT_DATE
    FROM lernende l JOIN klasse k ON k.id = l.klasse_id
    WHERE b.lernende_id = l.id
      AND k.lehrabschluss - CURRENT_DATE = 28
      AND b.status = 'versiegelt'
      AND b.einstellungen_gesperrt_ab IS NULL
  `)

  const { rows } = await pool.query(`
    SELECT
      lp.id AS lehrperson_id, lp.vorname, lp.email,
      k.bezeichnung AS klasse_name, k.lehrabschluss AS abschluss_datum,
      s.name AS schule_name,
      json_agg(json_build_object(
        'vorname', l.vorname, 'nachname', l.nachname,
        'brief_sichtbar', la.brief_sichtbar, 'brief_typ', b.typ
      ) ORDER BY l.nachname, l.vorname) AS lernende_liste
    FROM lehrperson lp
    JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
    JOIN klasse k ON k.id = kl.klasse_id
    JOIN schule s ON s.id = k.schule_id
    JOIN lp_auswahl la ON la.lehrperson_id = lp.id
    JOIN brief b ON b.id = la.brief_id
    JOIN lernende l ON l.id = b.lernende_id
    WHERE k.lehrabschluss - CURRENT_DATE = 28
      AND b.status = 'versiegelt'
      AND NOT EXISTS (
        SELECT 1 FROM email_log el
        WHERE el.lehrperson_id = lp.id
          AND el.typ = 'lp_benachrichtigung_4w'
          AND el.gesendet_am::date = CURRENT_DATE
      )
    GROUP BY lp.id, lp.vorname, lp.email, k.bezeichnung, k.lehrabschluss, s.name
    HAVING COUNT(la.id) > 0
  `)

  for (const row of rows) {
    try {
      const html = await render(React.createElement(LpBenachrichtigung4wEmail, {
        vorname: row.vorname as string,
        klasseName: row.klasse_name as string,
        abschlussDatum: formatDatum(row.abschluss_datum as string),
        lernendeListe: row.lernende_liste as Array<{
          vorname: string; nachname: string; brief_sichtbar: boolean; brief_typ: string
        }>,
        schuleName: row.schule_name as string,
        dashboardLink: `${WEB_URL}/lehrperson/dashboard`,
      }))

      await emailSenden({
        an: row.email as string,
        betreff: `Klasse ${row.klasse_name as string} — Zeit für deine Kommentare`,
        html,
        lehrpersonId: row.lehrperson_id as string,
        typ: 'lp_benachrichtigung_4w',
      })
    } catch (err) {
      console.error(`LP-Benachrichtigung fehlgeschlagen für ${row.lehrperson_id}:`, err)
    }
  }
}

// --- Check 3: Zustellung am Abschlusstag ---

async function zustellungCheck(): Promise<void> {
  const { rows } = await pool.query(`
    SELECT
      l.id AS lernende_id, l.vorname, l.email, l.beitritt_datum,
      k.bezeichnung AS klasse_name, k.beruf AS klasse_beruf,
      k.lehrstart, k.lehrabschluss,
      s.name AS schule_name,
      b.id AS brief_id, b.typ AS brief_typ, b.inhalt AS brief_inhalt,
      b.zustellart, b.versiegelt_am,
      CASE
        WHEN l.beitritt_datum = k.lehrstart
          THEN werktage_zwischen(k.lehrstart::date, b.versiegelt_am::date) + 1
        ELSE werktage_zwischen(l.beitritt_datum::date, b.versiegelt_am::date) + 1
      END AS tag_der_lehre,
      TO_CHAR(b.versiegelt_am AT TIME ZONE 'Europe/Zurich', 'TMDay, DD. TMMonth YYYY') AS verfasst_am_formatiert,
      (l.beitritt_datum > k.lehrstart) AS ist_quereinsteiger,
      COALESCE(
        json_agg(json_build_object(
          'seite', bf.seite, 'datei_pfad', bf.datei_pfad
        ) ORDER BY bf.seite) FILTER (WHERE bf.id IS NOT NULL), '[]'::json
      ) AS brief_fotos,
      COALESCE((
        SELECT json_agg(json_build_object(
          'lehrperson_vorname', lp2.vorname, 'lehrperson_nachname', lp2.nachname,
          'fachbereich', lp2.fachbereich, 'kommentar_typ', ko.typ,
          'kommentar_inhalt', ko.inhalt, 'kommentar_datei', ko.datei_pfad
        ) ORDER BY lp2.nachname, lp2.vorname)
        FROM lp_auswahl la2
        JOIN lehrperson lp2 ON lp2.id = la2.lehrperson_id
        LEFT JOIN kommentar ko ON ko.brief_id = b.id AND ko.lehrperson_id = la2.lehrperson_id
        WHERE la2.brief_id = b.id
      ), '[]'::json) AS kommentare
    FROM lernende l
    JOIN klasse k ON k.id = l.klasse_id
    JOIN schule s ON s.id = k.schule_id
    JOIN brief b ON b.lernende_id = l.id
    LEFT JOIN brief_foto bf ON bf.brief_id = b.id
    WHERE k.lehrabschluss = CURRENT_DATE
      AND b.status = 'versiegelt'
    GROUP BY l.id, l.vorname, l.email, l.beitritt_datum,
             k.bezeichnung, k.beruf, k.lehrstart, k.lehrabschluss, s.name,
             b.id, b.typ, b.inhalt, b.zustellart, b.versiegelt_am
  `)

  for (const row of rows) {
    try {
      const zustellart = row.zustellart as string
      const anhaenge: Array<{ dateiname: string; inhalt: Buffer }> = []

      // PDF für Foto-Briefe erstellen
      if (row.brief_typ === 'foto') {
        const fotos = row.brief_fotos as Array<{ seite: number; datei_pfad: string }>
        const pdfBuffer = await fotoPdfErstellen(fotos)
        anhaenge.push({ dateiname: 'dein-brief.pdf', inhalt: pdfBuffer })
      }

      // Foto-Kommentare als Anhang
      const kommentare = row.kommentare as Array<{
        lehrperson_vorname: string; lehrperson_nachname: string
        fachbereich: string; kommentar_typ: string
        kommentar_inhalt: string | null; kommentar_datei: string | null
      }>
      for (const k of kommentare) {
        if (k.kommentar_typ === 'foto' && k.kommentar_datei) {
          const datei = await speicher.speichern(Buffer.alloc(0), k.kommentar_datei, 'image/jpeg')
          anhaenge.push({ dateiname: `kommentar-${k.lehrperson_nachname}.jpg`, inhalt: Buffer.from(datei) })
        }
      }

      if (zustellart === 'mail' || zustellart === 'both') {
        const html = await render(React.createElement(ZustellungEmail, {
          vorname: row.vorname as string,
          beruf: row.klasse_beruf as string,
          verfasstAmFormatiert: row.verfasst_am_formatiert as string,
          tagDerLehre: row.tag_der_lehre as number,
          istQuereinsteiger: row.ist_quereinsteiger as boolean,
          klasseName: row.klasse_name as string,
          schuleName: row.schule_name as string,
          briefTyp: row.brief_typ as string,
          briefInhalt: row.brief_inhalt as string | null,
          kommentare,
        }))

        await emailSenden({
          an: row.email as string,
          betreff: 'Ein Brief von dir — damals, am Anfang',
          html,
          anhaenge,
          lernendeId: row.lernende_id as string,
          typ: 'zustellung',
        })
      }

      // Status aktualisieren
      const neuerStatus = neuerBriefStatus(zustellart)
      await pool.query(
        'UPDATE brief SET status = $1, zugestellt_am = NOW() WHERE id = $2',
        [neuerStatus, row.brief_id],
      )
    } catch (err) {
      console.error(`Zustellung fehlgeschlagen für Lernende ${row.lernende_id as string}:`, err)
    }
  }
}

// --- Hilfsfunktionen ---

function formatDatum(datum: string): string {
  return new Date(datum).toLocaleDateString('de-CH', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function zustellartText(zustellart: string): string {
  const texte: Record<string, string> = {
    mail: 'E-Mail',
    print: 'Ausdruck',
    both: 'E-Mail und Ausdruck',
  }
  return texte[zustellart] ?? zustellart
}

function neuerBriefStatus(zustellart: string): string {
  if (zustellart === 'mail') return 'zugestellt'
  if (zustellart === 'print') return 'ausdruck_pendent'
  return 'zugestellt_ausdruck_pendent'
}

// Erstellt ein einfaches PDF aus Foto-Dateien (Platzhalter — kann mit pdfkit erweitert werden)
async function fotoPdfErstellen(
  fotos: Array<{ seite: number; datei_pfad: string }>,
): Promise<Buffer> {
  // Minimales PDF mit einem Hinweis — für Produktion mit pdfkit oder ähnlichem ersetzen
  const inhalt = fotos.map((f) => `Seite ${f.seite}: ${f.datei_pfad}`).join('\n')
  return Buffer.from(`%PDF-1.4\n% Foto-Brief\n${inhalt}`)
}
