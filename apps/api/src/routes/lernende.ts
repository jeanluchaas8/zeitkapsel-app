import { Router } from 'express'
import { authentifiziert, nurRolle } from '../middleware/auth.js'
import { lernendeNachId, lehrpersonenFuerKlasse } from '../db/lernende.js'
import { AppFehler } from '../middleware/fehler.js'

export const lernendeRouter = Router()

// Eigenes Profil inkl. Klasse laden
lernendeRouter.get('/ich', authentifiziert, nurRolle('lernende'), async (req, res, next) => {
  try {
    const lernende = await lernendeNachId(req.nutzer!.id)
    if (!lernende) throw new AppFehler(404, 'Lernende/r nicht gefunden')
    res.json(lernende)
  } catch (err) {
    next(err)
  }
})

// Alle Lehrpersonen der eigenen Klasse
lernendeRouter.get('/ich/lehrpersonen', authentifiziert, nurRolle('lernende'), async (req, res, next) => {
  try {
    const lernende = await lernendeNachId(req.nutzer!.id)
    if (!lernende) throw new AppFehler(404, 'Lernende/r nicht gefunden')
    const lehrpersonen = await lehrpersonenFuerKlasse(lernende.klasse_id)
    res.json(lehrpersonen)
  } catch (err) {
    next(err)
  }
})
