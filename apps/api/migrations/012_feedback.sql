CREATE TABLE IF NOT EXISTS feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lernende_id   UUID NOT NULL REFERENCES lernende(id) ON DELETE CASCADE,
  lehrperson_id UUID NOT NULL REFERENCES lehrperson(id) ON DELETE CASCADE,
  typ           TEXT NOT NULL CHECK (typ IN ('lehrjahr_1','lehrjahr_2','lehrjahr_3','lehrjahr_4','abschluss')),
  anfrage_text  TEXT,
  inhalt        TEXT,
  status        TEXT NOT NULL DEFAULT 'angefragt' CHECK (status IN ('angefragt','geschrieben')),
  erstellt_am   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lernende_id, lehrperson_id, typ)
);
