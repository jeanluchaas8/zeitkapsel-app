import { Pool } from 'pg'

// Globaler Datenbankpool — wird einmal erstellt und wiederverwendet
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('Unerwarteter Datenbankfehler:', err)
  process.exit(1)
})
