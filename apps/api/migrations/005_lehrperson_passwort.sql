-- Passwort-Hash für Lehrperson-Login (HMAC-SHA256)
ALTER TABLE lehrperson ADD COLUMN passwort_hash TEXT NOT NULL DEFAULT '';
