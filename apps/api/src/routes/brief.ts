import { Router } from 'express'
import { z } from 'zod'
import { authentifiziert, nurRolle } from '../middleware/auth.js'
import { AppFehler } from '../middleware/fehler.js'
import { lernendeNachId } from '../db/lernende.js'
import {
  briefNachLernendeId,
  briefErstellen,
  briefAktualisieren,
  briefVersiegeln,
  lpAuswahlLaden,
  lpAuswahlAktualisieren,
  lpAuswahlEntfernen,
} from '../db/brief.js'

export const briefRouter = Router()

// Alle Brief-Routen erfordern eine Lernende-Session
briefRouter.use(authentifiziert, nurRolle('lernende'))

// Eigenen Brief laden
briefRouter.get('/', async (req, res, next) => {
  try {
    const brief = await briefNachLernendeId(req.nutzer!.id)
    if (!brief) throw new AppFehler(404, 'Noch kein Brief vorhanden')
    const lpAuswahl = await lpAuswahlLaden(brief.id)
    res.json({ ...brief, lp_auswahl: lpAuswahl })
  } catch (err) {
    next(err)
  }
})

// Brief erstellen (nur einmal pro Lernende/r möglich)
const briefErstellenSchema = z.object({
  typ: z.enum(['digital', 'foto']),
  zustellart: z.enum(['mail', 'print', 'both']),
})

briefRouter.post('/', async (req, res, next) => {
  try {
    const vorhandener = await briefNachLernendeId(req.nutzer!.id)
    if (vorhandener) throw new AppFehler(409, 'Du hast bereits einen Brief erstellt')

    const eingabe = briefErstellenSchema.safeParse(req.body)
    if (!eingabe.success) throw new AppFehler(400, 'Ungültige Eingabe')

    const lernende = await lernendeNachId(req.nutzer!.id)
    if (!lernende) throw new AppFehler(404, 'Lernende/r nicht gefunden')

    // Einstellungen sperren 28 Tage vor Lehrabschluss
    const gesperrtAb = new Date(lernende.lehrabschluss)
    gesperrtAb.setDate(gesperrtAb.getDate() - 28)

    const brief = await briefErstellen(
      req.nutzer!.id,
      eingabe.data.typ,
      eingabe.data.zustellart,
      gesperrtAb.toISOString().slice(0, 10),
    )

    res.status(201).json(brief)
  } catch (err) {
    next(err)
  }
})

// Brief bearbeiten (Inhalt + Zustellart) — nur im Entwurf-Status
const briefAktualisierenSchema = z.object({
  inhalt: z.string().max(10000).optional(),
  zustellart: z.enum(['mail', 'print', 'both']).optional(),
})

briefRouter.put('/', async (req, res, next) => {
  try {
    const brief = await briefNachLernendeId(req.nutzer!.id)
    if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')
    if (brief.status !== 'entwurf') throw new AppFehler(409, 'Der Brief ist bereits versiegelt')

    pruefeEinstellungenGesperrt(brief.einstellungen_gesperrt_ab)

    const eingabe = briefAktualisierenSchema.safeParse(req.body)
    if (!eingabe.success) throw new AppFehler(400, 'Ungültige Eingabe')

    const aktualisiert = await briefAktualisieren(brief.id, eingabe.data)
    res.json(aktualisiert)
  } catch (err) {
    next(err)
  }
})

// Brief versiegeln — danach nicht mehr bearbeitbar
briefRouter.post('/versiegeln', async (req, res, next) => {
  try {
    const brief = await briefNachLernendeId(req.nutzer!.id)
    if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')
    if (brief.status !== 'entwurf') throw new AppFehler(409, 'Der Brief ist bereits versiegelt')

    // Digitaler Brief braucht Inhalt
    if (brief.typ === 'digital' && !brief.inhalt?.trim()) {
      throw new AppFehler(400, 'Der Brief enthält noch keinen Text')
    }

    const versiegelt = await briefVersiegeln(brief.id)
    res.json(versiegelt)
  } catch (err) {
    next(err)
  }
})

// Lehrperson zum Brief hinzufügen oder Sichtbarkeit ändern
const lpAuswahlSchema = z.object({
  lehrperson_id: z.string().uuid(),
  brief_sichtbar: z.boolean(),
})

briefRouter.put('/lehrpersonen', async (req, res, next) => {
  try {
    const brief = await briefNachLernendeId(req.nutzer!.id)
    if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')

    pruefeEinstellungenGesperrt(brief.einstellungen_gesperrt_ab)

    const eingabe = lpAuswahlSchema.safeParse(req.body)
    if (!eingabe.success) throw new AppFehler(400, 'Ungültige Eingabe')

    await lpAuswahlAktualisieren(brief.id, eingabe.data.lehrperson_id, eingabe.data.brief_sichtbar)
    const auswahl = await lpAuswahlLaden(brief.id)
    res.json(auswahl)
  } catch (err) {
    next(err)
  }
})

// Lehrperson vom Brief entfernen
const lpEntfernenSchema = z.object({
  lehrperson_id: z.string().uuid(),
})

briefRouter.delete('/lehrpersonen', async (req, res, next) => {
  try {
    const brief = await briefNachLernendeId(req.nutzer!.id)
    if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')

    pruefeEinstellungenGesperrt(brief.einstellungen_gesperrt_ab)

    const eingabe = lpEntfernenSchema.safeParse(req.body)
    if (!eingabe.success) throw new AppFehler(400, 'Ungültige Eingabe')

    await lpAuswahlEntfernen(brief.id, eingabe.data.lehrperson_id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// Prüft ob die Einstellungsfrist noch nicht abgelaufen ist
function pruefeEinstellungenGesperrt(gesperrtAb: string | null): void {
  if (!gesperrtAb) return
  if (new Date() >= new Date(gesperrtAb)) {
    throw new AppFehler(403, 'Die Einstellungen sind 28 Tage vor dem Lehrabschluss gesperrt')
  }
}
