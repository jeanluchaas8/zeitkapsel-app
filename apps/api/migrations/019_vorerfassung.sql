-- Lehrperson kann vom Admin vorerfasst werden (ohne Passwort).
-- Bei späterer Selbstregistrierung werden die vorerfassten Daten verwendet.

-- 1. CHECK-Constraint erweitern
ALTER TABLE lehrperson DROP CONSTRAINT IF EXISTS lehrperson_status_check;
ALTER TABLE lehrperson ADD CONSTRAINT lehrperson_status_check
  CHECK (status IN ('pending', 'aktiv', 'abgelehnt', 'vorerfasst'));

-- 2. passwort_hash nullable machen (vorerfasste Lehrpersonen haben noch kein Passwort)
ALTER TABLE lehrperson ALTER COLUMN passwort_hash DROP NOT NULL;
ALTER TABLE lehrperson ALTER COLUMN passwort_hash DROP DEFAULT;
UPDATE lehrperson SET passwort_hash = NULL WHERE passwort_hash = '';
