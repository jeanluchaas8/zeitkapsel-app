// Führt alle SQL-Migrationsdateien in nummerierter Reihenfolge aus
import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Fehlercodes die ignoriert werden (Objekt existiert bereits)
const IGNORIERBARE_CODES = new Set([
  '42P07', // relation already exists
  '42710', // object already exists
  '42701', // column already exists
  '42P06', // schema already exists
  '23505', // unique violation beim Seeding
])

/**
 * Teilt SQL sauber in einzelne Statements auf.
 * Respektiert $$-Dollar-Quotes (für PL/pgSQL-Funktionen).
 */
function splitStatements(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''
  let i = 0

  while (i < sql.length) {
    // Dollar-Quote öffnen/schliessen erkennen
    if (!inDollarQuote) {
      const match = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/)
      if (match) {
        dollarTag = match[0]
        inDollarQuote = true
        current += dollarTag
        i += dollarTag.length
        continue
      }
    } else {
      if (sql.slice(i).startsWith(dollarTag)) {
        current += dollarTag
        i += dollarTag.length
        inDollarQuote = false
        dollarTag = ''
        continue
      }
    }

    const char = sql[i]

    if (!inDollarQuote && char === ';') {
      const stmt = current.trim()
      if (stmt.length > 0) statements.push(stmt)
      current = ''
    } else {
      current += char
    }
    i++
  }

  const last = current.trim()
  if (last.length > 0) statements.push(last)

  return statements
}

async function migrate() {
  const migrationsDir = path.resolve(__dirname, '../../migrations')
  const dateien = fs.readdirSync(migrationsDir).sort()

  for (const datei of dateien) {
    if (!datei.endsWith('.sql')) continue
    const sql = fs.readFileSync(path.join(migrationsDir, datei), 'utf-8')
    console.log(`Führe Migration aus: ${datei}`)

    const statements = splitStatements(sql)

    for (const statement of statements) {
      await pool.query('BEGIN')
      try {
        await pool.query(statement)
        await pool.query('COMMIT')
      } catch (err: unknown) {
        await pool.query('ROLLBACK')
        const pg = err as { code?: string; message?: string }
        if (pg.code && IGNORIERBARE_CODES.has(pg.code)) {
          console.log(`  → übersprungen (${pg.code}): ${pg.message?.split('\n')[0]}`)
        } else {
          throw err
        }
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
