import { pool } from './pool.js'

export interface LernendeZeile {
  id: string
  klasse_id: string
  vorname: string
  nachname: string
  email: string
  beitritt_datum: string
  klasse_bezeichnung: string
  beruf: string
  lehrstart: string
  lehrabschluss: string
}

export async function lernendeNachId(id: string): Promise<LernendeZeile | null> {
  const { rows } = await pool.query<LernendeZeile>(
    `SELECT l.*, k.bezeichnung AS klasse_bezeichnung, k.beruf, k.lehrstart, k.lehrabschluss
     FROM lernende l
     JOIN klasse k ON k.id = l.klasse_id
     WHERE l.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

// Gibt alle Lehrpersonen zurück, die der Klasse dieser Lernenden zugewiesen sind
export async function lehrpersonenFuerKlasse(klasseId: string) {
  const { rows } = await pool.query(
    `SELECT lp.id, lp.vorname, lp.nachname, lp.fachbereich
     FROM lehrperson lp
     JOIN klasse_lehrperson kl ON kl.lehrperson_id = lp.id
     WHERE kl.klasse_id = $1
     ORDER BY lp.nachname, lp.vorname`,
    [klasseId],
  )
  return rows
}
