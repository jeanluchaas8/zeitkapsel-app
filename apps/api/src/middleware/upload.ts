import multer from 'multer'
import { AppFehler } from './fehler.js'
import type { Request } from 'express'

const ERLAUBTE_TYPEN = ['image/jpeg', 'image/png', 'image/webp']
const MAX_GROESSE_MB = 10

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_GROESSE_MB * 1024 * 1024 },
  fileFilter: (_req: Request, file, cb) => {
    if (ERLAUBTE_TYPEN.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppFehler(400, 'Nur JPEG, PNG und WebP sind erlaubt'))
    }
  },
})
