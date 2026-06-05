import { pool } from './pool.js'

export interface BriefFotoZeile {
  id: string
  brief_id: string
  seite: number
  datei_pfad: string
  hochgeladen_am: string
}

export async function fotosSpeichern(
  briefId: string,
  seite: number,
  dateiPfad: string,
): Promise<BriefFotoZeile> {
  const { rows } = await pool.query<BriefFotoZeile>(
    `INSERT INTO brief_foto (brief_id, seite, datei_pfad)
     VALUES ($1, $2, $3)
     ON CONFLICT (brief_id, seite)
     DO UPDATE SET datei_pfad = $3, hochgeladen_am = NOW()
     RETURNING *`,
    [briefId, seite, dateiPfad],
  )
  return rows[0]!
}

export async function fotosLaden(briefId: string): Promise<BriefFotoZeile[]> {
  const { rows } = await pool.query<BriefFotoZeile>(
    'SELECT * FROM brief_foto WHERE brief_id = $1 ORDER BY seite',
    [briefId],
  )
  return rows
}

export async function fotoLoeschen(briefId: string, seite: number): Promise<string | null> {
  const { rows } = await pool.query<{ datei_pfad: string }>(
    'DELETE FROM brief_foto WHERE brief_id = $1 AND seite = $2 RETURNING datei_pfad',
    [briefId, seite],
  )
  return rows[0]?.datei_pfad ?? null
}

// Foto-Kommentar einer Lehrperson speichern
export async function kommentarFotoSpeichern(
  briefId: string,
  lehrpersonId: string,
  dateiPfad: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO kommentar (brief_id, lehrperson_id, typ, datei_pfad)
     VALUES ($1, $2, 'foto', $3)
     ON CONFLICT (brief_id, lehrperson_id)
     DO UPDATE SET typ = 'foto', datei_pfad = $3, inhalt = NULL`,
    [briefId, lehrpersonId, dateiPfad],
  )
}

// Gibt den alten Dateipfad zurück (damit die Datei vom Speicher gelöscht werden kann)
export async function altenKommentarPfadLaden(
  briefId: string,
  lehrpersonId: string,
): Promise<string | null> {
  const { rows } = await pool.query<{ datei_pfad: string | null }>(
    'SELECT datei_pfad FROM kommentar WHERE brief_id = $1 AND lehrperson_id = $2',
    [briefId, lehrpersonId],
  )
  return rows[0]?.datei_pfad ?? null
}
