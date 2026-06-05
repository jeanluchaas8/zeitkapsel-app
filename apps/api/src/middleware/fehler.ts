import { Request, Response, NextFunction } from 'express'

export class AppFehler extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppFehler'
  }
}

// Globaler Fehler-Handler — muss als letztes Middleware registriert werden
export function fehlerHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppFehler) {
    res.status(err.statusCode).json({ fehler: err.message })
    return
  }

  console.error('Unerwarteter Fehler:', err)
  res.status(500).json({ fehler: 'Interner Serverfehler' })
}
