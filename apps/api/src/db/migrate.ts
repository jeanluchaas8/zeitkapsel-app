// Führt alle SQL-Migrationsdateien in nummerierter Reihenfolge aus
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const migrationsDir = path.resolve(__dirname, '../../migrations')
  const dateien = fs.readdirSync(migrationsDir).sort()

  for (const datei of dateien) {
    if (!datei.endsWith('.sql')) continue
    const sql = fs.readFileSync(path.join(migrationsDir, datei), 'utf-8')
    console.log(`Führe Migration aus: ${datei}`)
    await pool.query('BEGIN')
    try {
      await pool.query(sql)
      await pool.query('COMMIT')
    } catch (err: unknown) {
      await pool.query('ROLLBACK')
      const pg = err as { code?: string }
      // 42P07 = relation exists, 42710 = object exists → überspringen
      if (pg.code === '42P07' || pg.code === '42710') {
        console.log(`  → bereits vorhanden, übersprungen.`)
      } else {
        throw err
      }
    }
  }

  console.log('Alle Migrationen erfolgreich ausgeführt.')
  await pool.end()
}

migrate().catch((err) => {
  console.error('Fehler bei Migration:', err)
  process.exit(1)
})
