import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Abstraktionsschicht für Datei-Speicherung (lokal oder R2)
export interface SpeicherAnbieter {
  speichern(datei: Buffer, dateiname: string, mimetype: string): Promise<string>
  loeschen(pfad: string): Promise<void>
  oeffentlicheUrl(pfad: string): string
}

// Lokaler Speicher — Dateien liegen im uploads/-Ordner
class LokalespeicherAnbieter implements SpeicherAnbieter {
  private readonly basisPfad: string

  constructor() {
    this.basisPfad = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
    fs.mkdirSync(this.basisPfad, { recursive: true })
  }

  async speichern(datei: Buffer, dateiname: string, _mimetype: string): Promise<string> {
    const erweiterung = path.extname(dateiname).toLowerCase() || '.jpg'
    const schluessel = `${randomUUID()}${erweiterung}`
    const vollPfad = path.join(this.basisPfad, schluessel)
    fs.writeFileSync(vollPfad, datei)
    return schluessel
  }

  async loeschen(pfad: string): Promise<void> {
    const vollPfad = path.join(this.basisPfad, pfad)
    if (fs.existsSync(vollPfad)) fs.unlinkSync(vollPfad)
  }

  oeffentlicheUrl(pfad: string): string {
    return `${process.env.API_URL ?? 'http://localhost:4000'}/dateien/${pfad}`
  }
}

export const speicher: SpeicherAnbieter = new LokalespeicherAnbieter()
