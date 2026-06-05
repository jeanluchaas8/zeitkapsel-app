-- Schuljahresbeginn-Daten (erster Schultag) für Kanton Zug
-- Jeweils der Montag nach Ende der Sommerferien

INSERT INTO schulferien (schuljahr, bezeichnung, beginn, ende) VALUES
  ('2022/23', 'Schuljahresbeginn', '2022-08-22', '2022-08-22'),
  ('2023/24', 'Schuljahresbeginn', '2023-08-21', '2023-08-21'),
  ('2024/25', 'Schuljahresbeginn', '2024-08-19', '2024-08-19'),
  ('2025/26', 'Schuljahresbeginn', '2025-08-18', '2025-08-18'),
  ('2026/27', 'Schuljahresbeginn', '2026-08-17', '2026-08-17'),
  ('2027/28', 'Schuljahresbeginn', '2027-08-16', '2027-08-16'),
  ('2028/29', 'Schuljahresbeginn', '2028-08-21', '2028-08-21'),
  ('2029/30', 'Schuljahresbeginn', '2029-08-20', '2029-08-20')
ON CONFLICT DO NOTHING;

-- Berufsnamen korrigieren: INFA und INFP Klassen
UPDATE klasse
SET beruf = 'Informatiker/in Applikationsentwicklung EFZ'
WHERE bezeichnung LIKE 'INFA%'
  AND beruf IN ('Informatiker/in EFZ', 'Informatiker/in Applikationsentwicklung EFZ');

UPDATE klasse
SET beruf = 'Informatiker/in Plattformentwicklung EFZ'
WHERE bezeichnung LIKE 'INFP%'
  AND beruf IN ('Informatiker/in EFZ', 'Informatiker/in Plattformentwicklung EFZ');

-- Berufe-Tabelle ebenfalls aktualisieren
UPDATE berufe
SET bezeichnung = 'Informatiker/in Applikationsentwicklung EFZ'
WHERE bezeichnung = 'Informatiker/in EFZ'
  AND NOT EXISTS (
    SELECT 1 FROM berufe WHERE bezeichnung = 'Informatiker/in Applikationsentwicklung EFZ'
  );

INSERT INTO berufe (bezeichnung, lehrdauer)
VALUES ('Informatiker/in Plattformentwicklung EFZ', 4)
ON CONFLICT (bezeichnung) DO NOTHING;
