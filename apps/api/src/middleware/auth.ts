import { Request, Response, NextFunction } from 'express'
import { createHmac } from 'crypto'
import { AppFehler } from './fehler.js'

// Nutzer-Rollen im System
export type Rolle = 'lernende' | 'lehrperson'

export interface AuthNutzer {
  id: string
  email: string
  rolle: Rolle
}

// Erweiterung des Express-Request-Typs
declare global {
  namespace Express {
    interface Request {
      nutzer?: AuthNutzer
    }
  }
}

// Liest den Session-Token aus dem Authorization-Header und verifiziert ihn.
// Auth.js signiert Sessions mit HMAC-SHA256 und dem AUTH_SECRET.
function tokenVerifizieren(token: string): AuthNutzer | null {
  try {
    const [payloadB64, signatur] = token.split('.')
    if (!payloadB64 || !signatur) return null

    const erwartet = createHmac('sha256', process.env.AUTH_SECRET ?? '')
      .update(payloadB64)
      .digest('base64url')

    if (erwartet !== signatur) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

    // Token-Ablauf prüfen
    if (payload.exp && Date.now() / 1000 > payload.exp) return null

    return {
      id: payload.sub as string,
      email: payload.email as string,
      rolle: payload.rolle as Rolle,
    }
  } catch {
    return null
  }
}

// Middleware: Prüft ob eine gültige Session vorhanden ist
export function authentifiziert(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppFehler(401, 'Nicht authentifiziert')
  }

  const token = header.slice(7)
  const nutzer = tokenVerifizieren(token)
  if (!nutzer) {
    throw new AppFehler(401, 'Ungültiger oder abgelaufener Token')
  }

  req.nutzer = nutzer
  next()
}

// Middleware-Factory: Erlaubt nur bestimmte Rollen
export function nurRolle(...rollen: Rolle[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.nutzer || !rollen.includes(req.nutzer.rolle)) {
      throw new AppFehler(403, 'Keine Berechtigung')
    }
    next()
  }
}
