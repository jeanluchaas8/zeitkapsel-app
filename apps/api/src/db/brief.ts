import { pool } from './pool.js'
import type { BriefStatus, BriefTyp, Zustellart } from '@zeitkapsel/shared'

export interface BriefZeile {
  id: string
  lernende_id: string
  typ: BriefTyp
  inhalt: string | null
  status: BriefStatus
  zustellart: Zustellart
  versiegelt_am: string | null
  zugestellt_am: string | null
  einstellungen_gesperrt_ab: string | null
  erstellt_am: string
}

export interface LpAuswahlZeile {
  id: string
  lehrperson_id: string
  vorname: string
  nachname: string
  fachbereich: string
  brief_sichtbar: boolean
}

export async function briefNachLernendeId(lernendeId: string): Promise<BriefZeile | null> {
  const { rows } = await pool.query<BriefZeile>(
    'SELECT * FROM brief WHERE lernende_id = $1',
    [lernendeId],
  )
  return rows[0] ?? null
}

export async function briefErstellen(
  lernendeId: string,
  typ: BriefTyp,
  zustellart: Zustellart,
  einstellungenGesperrtAb: string,
): Promise<BriefZeile> {
  const { rows } = await pool.query<BriefZeile>(
    `INSERT INTO brief (lernende_id, typ, zustellart, einstellungen_gesperrt_ab)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [lernendeId, typ, zustellart, einstellungenGesperrtAb],
  )
  return rows[0]!
}

export async function briefAktualisieren(
  briefId: string,
  felder: { inhalt?: string; zustellart?: Zustellart },
): Promise<BriefZeile> {
  const { rows } = await pool.query<BriefZeile>(
    `UPDATE brief
     SET inhalt     = COALESCE($2, inhalt),
         zustellart = COALESCE($3, zustellart)
     WHERE id = $1 AND status = 'entwurf'
     RETURNING *`,
    [briefId, felder.inhalt ?? null, felder.zustellart ?? null],
  )
  if (!rows[0]) throw new Error('Brief nicht gefunden oder bereits versiegelt')
  return rows[0]
}

export async function briefVersiegeln(briefId: string): Promise<BriefZeile> {
  const { rows } = await pool.query<BriefZeile>(
    `UPDATE brief
     SET status = 'versiegelt', versiegelt_am = NOW()
     WHERE id = $1 AND status = 'entwurf'
     RETURNING *`,
    [briefId],
  )
  if (!rows[0]) throw new Error('Brief nicht gefunden oder bereits versiegelt')
  return rows[0]
}

export async function lpAuswahlLaden(briefId: string): Promise<LpAuswahlZeile[]> {
  const { rows } = await pool.query<LpAuswahlZeile>(
    `SELECT la.id, la.lehrperson_id, lp.vorname, lp.nachname, lp.fachbereich, la.brief_sichtbar
     FROM lp_auswahl la
     JOIN lehrperson lp ON lp.id = la.lehrperson_id
     WHERE la.brief_id = $1`,
    [briefId],
  )
  return rows
}

export async function lpAuswahlAktualisieren(
  briefId: string,
  lehrpersonId: string,
  briefSichtbar: boolean,
): Promise<void> {
  await pool.query(
    `INSERT INTO lp_auswahl (brief_id, lehrperson_id, brief_sichtbar)
     VALUES ($1, $2, $3)
     ON CONFLICT (brief_id, lehrperson_id)
     DO UPDATE SET brief_sichtbar = $3, einstellungen_geaendert_am = NOW()`,
    [briefId, lehrpersonId, briefSichtbar],
  )
}

export async function lpAuswahlEntfernen(briefId: string, lehrpersonId: string): Promise<void> {
  await pool.query(
    'DELETE FROM lp_auswahl WHERE brief_id = $1 AND lehrperson_id = $2',
    [briefId, lehrpersonId],
  )
}
