CREATE TABLE IF NOT EXISTS kapsel_standorte (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ort         TEXT NOT NULL,
  land        TEXT,
  kontinent   TEXT,
  kategorie   TEXT,
  emoji       TEXT,
  lat         NUMERIC,
  lng         NUMERIC,
  info        TEXT,
  temp        TEXT,
  foto        TEXT DEFAULT '',
  foto_alt    TEXT,
  wiki_titel  TEXT,
  link        TEXT,
  link_text   TEXT,
  aktiv       BOOLEAN NOT NULL DEFAULT TRUE,
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kapsel_quiz (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standort_id UUID REFERENCES kapsel_standorte(id) ON DELETE CASCADE,
  frage       TEXT NOT NULL,
  antwort_a   TEXT NOT NULL,
  antwort_b   TEXT NOT NULL,
  antwort_c   TEXT NOT NULL,
  antwort_d   TEXT NOT NULL,
  richtig     CHAR(1) NOT NULL CHECK (richtig IN ('a','b','c','d')),
  punkte      INT NOT NULL DEFAULT 1,
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_anmeldung (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lernende_id UUID NOT NULL REFERENCES lernende(id) ON DELETE CASCADE,
  standort_id UUID REFERENCES kapsel_standorte(id) ON DELETE SET NULL,
  woche       INT NOT NULL,
  jahr        INT NOT NULL,
  erstellt_am TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lernende_id, woche, jahr)
);

CREATE TABLE IF NOT EXISTS quiz_ergebnis (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anmeldung_id     UUID NOT NULL REFERENCES quiz_anmeldung(id) ON DELETE CASCADE,
  frage_id         UUID REFERENCES kapsel_quiz(id) ON DELETE SET NULL,
  korrekt          BOOLEAN NOT NULL,
  punkte           INT NOT NULL DEFAULT 0,
  durchgefuehrt_am TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lernende_standort_woche (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lernende_id UUID NOT NULL REFERENCES lernende(id) ON DELETE CASCADE,
  woche       INT NOT NULL,
  jahr        INT NOT NULL,
  standort_id UUID REFERENCES kapsel_standorte(id) ON DELETE SET NULL,
  erstellt_am TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lernende_id, woche, jahr)
);
