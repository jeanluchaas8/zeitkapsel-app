import { Router } from 'express'
import { pool } from '../db/pool.js'

export const gesundheitRouter = Router()

// Prüft ob API und Datenbank erreichbar sind
gesundheitRouter.get('/', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', datenbank: 'verbunden' })
  } catch {
    res.status(503).json({ status: 'fehler', datenbank: 'nicht verbunden' })
  }
})
