import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

// Öffentlich — gibt alle aktiven Klassen zurück (Lehrstart in der Vergangenheit, Abschluss in der Zukunft)
export async function GET() {
  const { rows } = await pool.query(`
    SELECT id, bezeichnung, beruf, lehrstart
    FROM klasse
    WHERE lehrstart <= CURRENT_DATE AND lehrabschluss >= CURRENT_DATE
    ORDER BY bezeichnung
  `)
  return NextResponse.json(rows)
}
