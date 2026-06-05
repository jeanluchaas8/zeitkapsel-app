import PgBoss from 'pg-boss'
import { dailyCheck } from './dailyCheck.js'

const JOB_NAME = 'daily-check'

// Startet pg-boss und registriert den täglichen Cron-Job (06:00 Uhr)
export async function schedulerStarten(): Promise<void> {
  const boss = new PgBoss(process.env.DATABASE_URL ?? '')

  boss.on('error', (err) => console.error('pg-boss Fehler:', err))

  await boss.start()

  await boss.createQueue(JOB_NAME)

  // Täglich um 06:00 Uhr — Cron-Syntax: Minute Stunde * * *
  await boss.schedule(JOB_NAME, '0 6 * * *', {}, { tz: 'Europe/Zurich' })

  await boss.work(JOB_NAME, async () => {
    console.log(`[${new Date().toISOString()}] Daily-Check gestartet`)
    await dailyCheck()
    console.log(`[${new Date().toISOString()}] Daily-Check abgeschlossen`)
  })

  console.log('Scheduler gestartet — Daily-Check läuft täglich um 06:00 Uhr')
}
