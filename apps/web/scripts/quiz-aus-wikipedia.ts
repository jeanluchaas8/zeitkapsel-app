/**
 * Generiert Quiz-Fragen aus Wikipedia-Artikeln.
 * Löscht bestehende Fragen und erstellt neue, die NICHT auf dem Info-Text basieren.
 * Ausführen: npx tsx scripts/quiz-aus-wikipedia.ts
 */
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://zeitkapsel:zeitkapsel@localhost:5432/zeitkapsel',
})
const HEADERS = { 'User-Agent': 'ZeitkapselEdu/1.0 (Schulprojekt)' }
const PAUSE = 1500

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

// ── Wikipedia-Extrakt laden (REST API, zuverlässiger) ──────────────────────
async function wikiExtrakt(titel: string, versuch = 1): Promise<string> {
  await sleep(PAUSE * versuch)
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titel)}`,
      { headers: HEADERS }
    )
    if (res.status === 429) {
      if (versuch < 4) { console.log(`    Rate-limit, Pause ${versuch * 3}s…`); return wikiExtrakt(titel, versuch + 1) }
      return ''
    }
    if (!res.ok) return ''
    const d = await res.json() as { extract?: string; extract_html?: string }
    return d.extract ?? ''
  } catch { return '' }
}

// ── Fakten-Extraktor ────────────────────────────────────────────────────────
interface Fakt { typ: string; wert: string; einheit: string; kontext: string }

function findeFakten(text: string): Fakt[] {
  const fakten: Fakt[] = []
  const saetze = text.split(/\.(?:\s|$)/).filter(s => s.length > 20 && s.length < 350)

  for (const satz of saetze) {
    // Jahreszahlen (erweiterte Muster)
    const jahrMatch = satz.match(/\b(?:in|since|from|founded|opened|built|completed|established|created|designed|constructed|inaugurated|erected)\s+(?:in\s+)?(\d{3,4})\b/i)
      ?? satz.match(/\b(\d{3,4})\s+(?:AD|CE|BC|BCE)\b/i)
      ?? satz.match(/\b(?:was|were)\s+\w+\s+in\s+(\d{4})\b/i)
    if (jahrMatch) {
      const jahr = jahrMatch[1] ?? jahrMatch[2]
      if (jahr && parseInt(jahr) > 100 && parseInt(jahr) <= 2030) {
        fakten.push({ typ: 'jahr', wert: jahr, einheit: 'Jahr', kontext: satz.trim() })
        continue
      }
    }
    // Grosse Zahlen
    const zahlMatch = satz.match(/\b(?:over|approximately|about|more than|nearly|around|some|roughly)?\s*(\d[\d,]*(?:\.\d+)?)\s*(million|billion|thousand|meters?|metres?|kilometres?|km|feet|ft|acres?|square\s+\w+|floors?|stor(?:eys?|ies)|tons?|years?|days?|hours?|visitors?|objects?|items?|species?|animals?|people|members?|countries?|percent|%|seats?|rooms?|steps?|pages?|works?|pieces?|paintings?|manuscripts?|copies)\b/i)
    if (zahlMatch) {
      fakten.push({ typ: 'zahl', wert: zahlMatch[1].replace(/,/g, ''), einheit: zahlMatch[2], kontext: satz.trim() })
      continue
    }
    // Superlative (erweitert)
    const supMatch = satz.match(/\b(?:largest|tallest|highest|deepest|longest|oldest|biggest|busiest|most\s+visited|most\s+famous|first|only|world.?s\s+\w+est)\b.{5,100}/i)
    if (supMatch && !satz.includes('?') && satz.length < 200) {
      fakten.push({ typ: 'superlativ', wert: supMatch[0].slice(0, 120), einheit: '', kontext: satz.trim() })
      continue
    }
    // Personen
    const personMatch = satz.match(/\b(?:designed|built|founded|created|architect(?:ed)?|constructed|commissioned|established)\s+(?:by\s+)?([A-Z][a-zÀ-ž]+ [A-Z][a-zÀ-ž]+(?:\s+[A-Z][a-zÀ-ž]+)?)/i)
    if (personMatch) {
      fakten.push({ typ: 'person', wert: personMatch[1], einheit: personMatch[0].split(' ')[0], kontext: satz.trim() })
      continue
    }
    // Länder/Städte (liegt in, befindet sich in)
    const ortMatch = satz.match(/\b(?:located|situated|found|lies?|stands?)\s+(?:in|on|near|at)\s+([A-Z][a-zA-Z\s,]+?)(?:\s*[,.]|\s+and\s|\s+in\s)/i)
    if (ortMatch && ortMatch[1].length < 50) {
      fakten.push({ typ: 'ort', wert: ortMatch[1].trim(), einheit: 'Lage', kontext: satz.trim() })
    }
  }

  // Fallback: Erster informativer Satz mit Zahl oder Superlativ
  if (fakten.length === 0) {
    const ersteSaetze = saetze.slice(0, 5)
    for (const satz of ersteSaetze) {
      if (/\d/.test(satz) && satz.length > 30 && satz.length < 200) {
        fakten.push({ typ: 'superlativ', wert: satz.trim(), einheit: '', kontext: satz.trim() })
        break
      }
    }
    // Letzter Fallback: einfach den zweiten Satz nehmen
    if (fakten.length === 0 && saetze.length > 1) {
      const s = saetze[1]?.trim() ?? ''
      if (s.length > 30 && s.length < 200) {
        fakten.push({ typ: 'superlativ', wert: s, einheit: '', kontext: s })
      }
    }
  }

  return fakten
}

// ── Falsche Antworten generieren ────────────────────────────────────────────
function falscheAntworten(typ: string, richtig: string, einheit: string): string[] {
  if (typ === 'jahr') {
    const j = parseInt(richtig)
    const offsets = [[20,50,100],[10,30,200],[50,150,300],[100,200,500]]
    const off = offsets[j % 4]
    return [`${j - off[0]}`, `${j + off[1]}`, `${j - off[2]}`]
  }
  if (typ === 'zahl') {
    const n = parseFloat(richtig.replace(/,/g, ''))
    const fmt = (x: number) => x >= 1000 ? x.toLocaleString('de-CH') : x.toString()
    return [fmt(Math.round(n * 0.1)), fmt(Math.round(n * 10)), fmt(Math.round(n * 0.5))]
      .filter(x => x !== fmt(n))
      .slice(0, 3)
  }
  // Superlativ / Person: Platzhalter
  return ['Nein, das stimmt nicht', 'Das ist eine andere Attraktion', 'Nur teilweise korrekt']
}

// ── Frage formulieren ───────────────────────────────────────────────────────
interface QuizFrage { frage: string; richtig: string; falsch: string[] }

function formeFrageAusText(fakt: Fakt, ort: string): QuizFrage | null {
  const { typ, wert, einheit, kontext } = fakt

  if (typ === 'jahr') {
    const verb = kontext.match(/\b(founded|opened|built|completed|established|created|designed)\b/i)?.[1] ?? 'founded'
    const verbMap: Record<string, string> = {
      founded: 'gegründet', opened: 'eröffnet', built: 'gebaut',
      completed: 'fertiggestellt', established: 'errichtet',
      created: 'geschaffen', designed: 'entworfen',
    }
    const dt = verbMap[verb.toLowerCase()] ?? 'eröffnet'
    return {
      frage: `Wann wurde ${ort} ${dt}?`,
      richtig: `Im Jahr ${wert}`,
      falsch: falscheAntworten('jahr', wert, einheit).map(j => `Im Jahr ${j}`),
    }
  }

  if (typ === 'zahl') {
    const eu = einheit.toLowerCase()
    const frageMap: Record<string, string> = {
      meters: 'Wie hoch/tief/lang ist', km: 'Wie gross ist',
      kilometres: 'Wie lang ist', million: 'Wie viele', billion: 'Wie viele',
      thousand: 'Wie viele', visitors: 'Wie viele Besucher hat',
      objects: 'Wie viele Objekte besitzt', species: 'Wie viele Arten leben in',
      percent: 'Wie viele Prozent',
    }
    const fp = Object.entries(frageMap).find(([k]) => eu.includes(k))
    const fp2 = fp ? fp[1] : 'Welche Grösse hat'
    const einheitDe: Record<string, string> = {
      meters: 'Meter', km: 'km', kilometres: 'km', million: 'Millionen',
      billion: 'Milliarden', thousand: 'Tausend', visitors: 'Besucher jährlich',
      objects: 'Objekte', species: 'Arten', percent: '%', years: 'Jahre',
      days: 'Tage', floors: 'Stockwerke', tons: 'Tonnen',
    }
    const edStr = Object.entries(einheitDe).find(([k]) => eu.includes(k))?.[1] ?? einheit
    const n = parseFloat(wert.replace(/,/g, ''))
    const nStr = n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} Millionen`
      : n >= 1000 ? n.toLocaleString('de-CH')
      : wert
    return {
      frage: `${fp2} ${ort} (gemäss Wikipedia)?`,
      richtig: `${nStr} ${edStr}`,
      falsch: falscheAntworten('zahl', wert, einheit).map(f => {
        const fn = parseFloat(f.replace(/,/g, ''))
        const fs = fn >= 1_000_000 ? `${(fn / 1_000_000).toFixed(1)} Millionen`
          : fn >= 1000 ? fn.toLocaleString('de-CH') : f
        return `${fs} ${edStr}`
      }),
    }
  }

  if (typ === 'superlativ' && kontext.length < 200) {
    return {
      frage: `Was trifft auf ${ort} gemäss Wikipedia zu?`,
      richtig: kontext.length < 120 ? kontext : kontext.slice(0, 120) + '…',
      falsch: [
        `${ort} ist das kleinste seiner Art`,
        `${ort} wurde erst im 21. Jahrhundert gebaut`,
        `${ort} ist nur für Fachleute zugänglich`,
      ],
    }
  }

  if (typ === 'person') {
    const aktionMap: Record<string, string> = {
      designed: 'entworfen', built: 'gebaut', founded: 'gegründet',
      created: 'erschaffen', 'built by': 'gebaut', architect: 'entworfen',
    }
    const akt = aktionMap[einheit.toLowerCase()] ?? 'entworfen'
    return {
      frage: `Von wem wurde ${ort} ${akt}?`,
      richtig: wert,
      falsch: [
        'Ludwig Mies van der Rohe', 'Frank Lloyd Wright', 'Zaha Hadid',
        'Rem Koolhaas', 'Renzo Piano', 'Norman Foster',
      ].filter(n => n !== wert).slice(0, 3),
    }
  }

  return null
}

// ── Antworten mischen ───────────────────────────────────────────────────────
function misch(frage: QuizFrage): { a: string; b: string; c: string; d: string; richtig: string } {
  const alle = [frage.richtig, ...frage.falsch.slice(0, 3)]
  // Sicherstellen dass 4 Antworten
  while (alle.length < 4) alle.push(`Keine der anderen Angaben`)
  // Zufällig mischen (deterministisch per Frage-Hash)
  const hash = frage.frage.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const reihenfolge = ['a', 'b', 'c', 'd']
  const idx = hash % 4
  const verschoben = [...alle.slice(idx), ...alle.slice(0, idx)]
  const richtigIdx = verschoben.indexOf(frage.richtig)
  const buchstaben = ['a', 'b', 'c', 'd']
  return {
    a: verschoben[0], b: verschoben[1], c: verschoben[2], d: verschoben[3],
    richtig: buchstaben[richtigIdx] ?? 'a',
  }
}

// ── Hauptprogramm ───────────────────────────────────────────────────────────
async function main() {
  console.log('Lade Standorte…')
  const { rows: standorte } = await pool.query(
    "SELECT id, ort, wiki_titel FROM kapsel_standorte WHERE aktiv = TRUE AND wiki_titel != '' ORDER BY ort"
  )
  // Nur Standorte verarbeiten deren Frage noch NICHT "gemäss Wikipedia" oder ein Jahresfakt ist
  // d.h. deren Fragen noch von mir manuell geschrieben wurden
  const { rows: bereitsOk } = await pool.query(`
    SELECT DISTINCT kq.standort_id FROM kapsel_quiz kq
    WHERE kq.frage ILIKE '%gemäss wikipedia%'
       OR kq.frage ILIKE '%wann wurde%'
       OR kq.frage ILIKE '%wie viele%'
       OR kq.frage ILIKE '%wie gross%'
       OR kq.frage ILIKE '%wie lang%'
       OR kq.frage ILIKE '%wie hoch%'
       OR kq.frage ILIKE '%wie tief%'
       OR kq.frage ILIKE '%von wem%'
  `)
  const bereitsOkIds = new Set(bereitsOk.map(r => r.standort_id as string))
  const zuVerarbeiten = (standorte as Array<{ id: string; ort: string; wiki_titel: string }>)
    .filter(s => !bereitsOkIds.has(s.id))
  console.log(`${standorte.length} Standorte total, ${zuVerarbeiten.length} noch ohne Wikipedia-Frage.\n`)

  let erstellt = 0, uebersprungen = 0, fehler = 0

  for (const s of zuVerarbeiten) {
    const extrakt = await wikiExtrakt(s.wiki_titel)
    if (!extrakt) { console.log(`  ✗ ${s.ort}: kein Extrakt`); fehler++; continue }

    const fakten = findeFakten(extrakt)
    if (fakten.length === 0) { console.log(`  ○ ${s.ort}: keine Fakten extrahiert`); uebersprungen++; continue }

    // Besten Fakt wählen: Zahlen > Jahre > Superlative > Personen
    const reihenfolge = ['zahl', 'jahr', 'superlativ', 'person']
    const besterFakt = reihenfolge.map(t => fakten.find(f => f.typ === t)).find(f => f != null)
    if (!besterFakt) { uebersprungen++; continue }

    const frage = formeFrageAusText(besterFakt, s.ort)
    if (!frage) { uebersprungen++; continue }

    const { a, b, c, d, richtig } = misch(frage)

    // Prüfen ob bereits eine Frage existiert
    const { rows: existing } = await pool.query(
      'SELECT id FROM kapsel_quiz WHERE standort_id = $1 LIMIT 1', [s.id]
    )
    if (existing[0]) {
      // Bestehende Frage aktualisieren (kein Delete wegen FK-Constraints)
      await pool.query(
        `UPDATE kapsel_quiz SET frage=$1, antwort_a=$2, antwort_b=$3, antwort_c=$4, antwort_d=$5, richtig=$6
         WHERE id = $7`,
        [frage.frage, a, b, c, d, richtig, existing[0].id]
      )
      // Überschüssige weitere Fragen löschen (nur solche ohne Ergebnisse)
      await pool.query(
        `DELETE FROM kapsel_quiz WHERE standort_id = $1 AND id != $2
         AND id NOT IN (SELECT quiz_id FROM quiz_ergebnis)`,
        [s.id, existing[0].id]
      )
    } else {
      // Neue Frage einfügen
      await pool.query(
        `INSERT INTO kapsel_quiz (standort_id, frage, antwort_a, antwort_b, antwort_c, antwort_d, richtig, punkte)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
        [s.id, frage.frage, a, b, c, d, richtig]
      )
    }
    console.log(`  ✓ ${s.ort}: "${frage.frage.slice(0, 60)}…"`)
    erstellt++
  }

  console.log(`\n✓ Fertig: ${erstellt} Fragen erstellt, ${uebersprungen} übersprungen, ${fehler} Fehler`)
  await pool.end()
}

main().catch(console.error)
