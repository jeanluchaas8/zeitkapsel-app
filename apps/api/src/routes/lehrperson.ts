import { Router } from 'express'
import { z } from 'zod'
import { authentifiziert, nurRolle } from '../middleware/auth.js'
import { AppFehler } from '../middleware/fehler.js'
import {
  klassenFuerLehrperson,
  lernendeInKlasse,
  briefFuerLehrperson,
  kommentarLaden,
  kommentarSpeichern,
  kommentarLoeschen,
  lehrpersonHatZugangZuBrief,
} from '../db/lehrperson.js'

export const lehrpersonRouter = Router()

lehrpersonRouter.use(authentifiziert, nurRolle('lehrperson'))

// Alle eigenen Klassen
lehrpersonRouter.get('/klassen', async (req, res, next) => {
  try {
    const klassen = await klassenFuerLehrperson(req.nutzer!.id)
    res.json(klassen)
  } catch (err) {
    next(err)
  }
})

// Alle Lernenden einer Klasse mit Brief-Status
lehrpersonRouter.get('/klassen/:klasseId/lernende', async (req, res, next) => {
  try {
    const lernende = await lernendeInKlasse(req.params.klasseId!, req.nutzer!.id)
    res.json(lernende)
  } catch (err) {
    next(err)
  }
})

// Brief einer Lernenden lesen — nur wenn sie die LP gewählt hat und Sichtbarkeit erlaubt
lehrpersonRouter.get('/briefe/:briefId', async (req, res, next) => {
  try {
    const zugang = await lehrpersonHatZugangZuBrief(req.params.briefId!, req.nutzer!.id)
    if (!zugang) throw new AppFehler(403, 'Kein Zugang zu diesem Brief')

    const brief = await briefFuerLehrperson(req.params.briefId!, req.nutzer!.id)
    if (!brief) throw new AppFehler(404, 'Brief nicht gefunden')

    // Brief-Inhalt nur zeigen wenn Lernende/r die Sichtbarkeit freigegeben hat
    if (!brief.brief_sichtbar) {
      const { inhalt: _inhalt, ...ohneInhalt } = brief
      return res.json({ ...ohneInhalt, inhalt: null, hinweis: 'Inhalt nicht freigegeben' })
    }

    res.json(brief)
  } catch (err) {
    next(err)
  }
})

// Eigenen Kommentar zu einem Brief laden
lehrpersonRouter.get('/briefe/:briefId/kommentar', async (req, res, next) => {
  try {
    const zugang = await lehrpersonHatZugangZuBrief(req.params.briefId!, req.nutzer!.id)
    if (!zugang) throw new AppFehler(403, 'Kein Zugang zu diesem Brief')

    const kommentar = await kommentarLaden(req.params.briefId!, req.nutzer!.id)
    if (!kommentar) throw new AppFehler(404, 'Noch kein Kommentar vorhanden')

    res.json(kommentar)
  } catch (err) {
    next(err)
  }
})

// Digitalen Kommentar schreiben oder aktualisieren
const kommentarSchema = z.object({
  inhalt: z.string().min(1).max(5000),
})

lehrpersonRouter.put('/briefe/:briefId/kommentar', async (req, res, next) => {
  try {
    const zugang = await lehrpersonHatZugangZuBrief(req.params.briefId!, req.nutzer!.id)
    if (!zugang) throw new AppFehler(403, 'Kein Zugang zu diesem Brief')

    const eingabe = kommentarSchema.safeParse(req.body)
    if (!eingabe.success) throw new AppFehler(400, 'Ungültige Eingabe')

    const kommentar = await kommentarSpeichern(
      req.params.briefId!,
      req.nutzer!.id,
      eingabe.data.inhalt,
    )
    res.json(kommentar)
  } catch (err) {
    next(err)
  }
})

// Kommentar löschen
lehrpersonRouter.delete('/briefe/:briefId/kommentar', async (req, res, next) => {
  try {
    const zugang = await lehrpersonHatZugangZuBrief(req.params.briefId!, req.nutzer!.id)
    if (!zugang) throw new AppFehler(403, 'Kein Zugang zu diesem Brief')

    await kommentarLoeschen(req.params.briefId!, req.nutzer!.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})
