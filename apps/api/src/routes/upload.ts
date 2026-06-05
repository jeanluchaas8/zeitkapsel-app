import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { authentifiziert, nurRolle } from '../middleware/auth.js'
import { uploadMiddleware } from '../middleware/upload.js'
import { AppFehler } from '../middleware/fehler.js'
import { speicher } from '../storage/index.js'
import { briefNachLernendeId } from '../db/brief.js'
import { lehrpersonHatZugangZuBrief } from '../db/lehrperson.js'
import {
  fotosSpeichern,
  fotosLaden,
  fotoLoeschen,
  kommentarFotoSpeichern,
  altenKommentarPfadLaden,
} from '../db/fotos.js'

export const uploadRouter = Router()

// --- Brief-Fotos (Lernende) ---

// Alle Seiten eines Foto-Briefs laden
uploadRouter.get(
  '/brief/fotos',
  authentifiziert,
  nurRolle('lernende'),
  async (req, res, next) => {
    try {
      const brief = await briefNachLernendeId(req.nutzer!.id)
      if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')
      if (brief.typ !== 'foto') throw new AppFehler(400, 'Dieser Brief ist kein Foto-Brief')

      const fotos = await fotosLaden(brief.id)
      const mitUrl = fotos.map((f) => ({
        ...f,
        url: speicher.oeffentlicheUrl(f.datei_pfad),
      }))
      res.json(mitUrl)
    } catch (err) {
      next(err)
    }
  },
)

// Foto-Seite hochladen (ersetzt bestehende Seite falls vorhanden)
uploadRouter.put(
  '/brief/fotos/:seite',
  authentifiziert,
  nurRolle('lernende'),
  uploadMiddleware.single('foto'),
  async (req, res, next) => {
    try {
      const brief = await briefNachLernendeId(req.nutzer!.id)
      if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')
      if (brief.typ !== 'foto') throw new AppFehler(400, 'Dieser Brief ist kein Foto-Brief')
      if (brief.status !== 'entwurf') throw new AppFehler(409, 'Der Brief ist bereits versiegelt')

      const seite = parseInt(req.params.seite ?? '0', 10)
      if (!Number.isInteger(seite) || seite < 1 || seite > 20) {
        throw new AppFehler(400, 'Seitenzahl muss zwischen 1 und 20 liegen')
      }

      if (!req.file) throw new AppFehler(400, 'Keine Datei hochgeladen')

      const pfad = await speicher.speichern(req.file.buffer, req.file.originalname, req.file.mimetype)
      const foto = await fotosSpeichern(brief.id, seite, pfad)

      res.json({ ...foto, url: speicher.oeffentlicheUrl(foto.datei_pfad) })
    } catch (err) {
      next(err)
    }
  },
)

// Foto-Seite löschen
uploadRouter.delete(
  '/brief/fotos/:seite',
  authentifiziert,
  nurRolle('lernende'),
  async (req, res, next) => {
    try {
      const brief = await briefNachLernendeId(req.nutzer!.id)
      if (!brief) throw new AppFehler(404, 'Kein Brief gefunden')
      if (brief.status !== 'entwurf') throw new AppFehler(409, 'Der Brief ist bereits versiegelt')

      const seite = parseInt(req.params.seite ?? '0', 10)
      const alterPfad = await fotoLoeschen(brief.id, seite)
      if (alterPfad) await speicher.loeschen(alterPfad)

      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
)

// --- Kommentar-Fotos (Lehrperson) ---

uploadRouter.put(
  '/lehrperson/briefe/:briefId/kommentar/foto',
  authentifiziert,
  nurRolle('lehrperson'),
  uploadMiddleware.single('foto'),
  async (req, res, next) => {
    try {
      const zugang = await lehrpersonHatZugangZuBrief(req.params.briefId!, req.nutzer!.id)
      if (!zugang) throw new AppFehler(403, 'Kein Zugang zu diesem Brief')

      if (!req.file) throw new AppFehler(400, 'Keine Datei hochgeladen')

      // Altes Foto löschen falls vorhanden
      const alterPfad = await altenKommentarPfadLaden(req.params.briefId!, req.nutzer!.id)
      if (alterPfad) await speicher.loeschen(alterPfad)

      const pfad = await speicher.speichern(req.file.buffer, req.file.originalname, req.file.mimetype)
      await kommentarFotoSpeichern(req.params.briefId!, req.nutzer!.id, pfad)

      res.json({ datei_pfad: pfad, url: speicher.oeffentlicheUrl(pfad) })
    } catch (err) {
      next(err)
    }
  },
)

// --- Statische Datei-Auslieferung (nur lokal) ---

uploadRouter.get('/dateien/:dateiname', (req, res, next) => {
  try {
    const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
    // Pfad-Traversal verhindern
    const dateiPfad = path.join(uploadDir, path.basename(req.params.dateiname!))
    if (!fs.existsSync(dateiPfad)) throw new AppFehler(404, 'Datei nicht gefunden')
    res.sendFile(dateiPfad)
  } catch (err) {
    next(err)
  }
})
