CREATE TABLE IF NOT EXISTS berufe (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bezeichnung  TEXT NOT NULL UNIQUE,
  aktiv        BOOLEAN NOT NULL DEFAULT TRUE,
  erstellt_am  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lehrperson
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktiv'
    CHECK (status IN ('pending', 'aktiv', 'abgelehnt')),
  ADD COLUMN IF NOT EXISTS beruf_id UUID REFERENCES berufe(id);
