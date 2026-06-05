import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// .env aus dem Monorepo-Root laden (nicht aus apps/api/)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { gesundheitRouter } from './routes/gesundheit.js'
import { lernendeRouter } from './routes/lernende.js'
import { briefRouter } from './routes/brief.js'
import { lehrpersonRouter } from './routes/lehrperson.js'
import { uploadRouter } from './routes/upload.js'
import { schedulerStarten } from './jobs/scheduler.js'
import { fehlerHandler } from './middleware/fehler.js'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(helmet())
app.use(cors({
  origin: process.env.WEB_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// Routen
app.use('/gesundheit', gesundheitRouter)
app.use('/lernende', lernendeRouter)
app.use('/brief', briefRouter)
app.use('/lehrperson', lehrpersonRouter)
app.use('/', uploadRouter)

// Globaler Fehler-Handler (muss nach allen Routen stehen)
app.use(fehlerHandler)

app.listen(PORT, () => {
  console.log(`Zeitkapsel API läuft auf Port ${PORT}`)
  schedulerStarten().catch((err) => {
    console.error('Scheduler konnte nicht gestartet werden:', err)
  })
})
