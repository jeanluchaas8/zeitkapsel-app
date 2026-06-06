-- Separate Tabelle für Vorerfassungen: Name + Fachbereich + optionaler Beruf
-- Dient als Autocomplete-Quelle bei der Registrierung.
-- Keine E-Mail, kein Passwort – nur Stammdaten.

CREATE TABLE IF NOT EXISTS lehrperson_vorerfassung (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vorname     TEXT NOT NULL,
  nachname    TEXT NOT NULL,
  fachbereich TEXT NOT NULL,
  beruf       TEXT NOT NULL DEFAULT '',
  erstellt_am TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lp_vorerfassung_nachname ON lehrperson_vorerfassung (nachname);
