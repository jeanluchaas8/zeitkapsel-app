import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const { rows } = await pool.query(
    'SELECT id, bezeichnung FROM berufe WHERE aktiv = TRUE ORDER BY bezeichnung'
  )
  return NextResponse.json(rows)
}
