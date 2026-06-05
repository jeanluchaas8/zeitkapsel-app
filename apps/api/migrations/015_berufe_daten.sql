ALTER TABLE berufe
  ADD COLUMN IF NOT EXISTS lehrdauer INT NOT NULL DEFAULT 3;

INSERT INTO berufe (bezeichnung, lehrdauer) VALUES
  ('Assistent/in Gesundheit und Soziales EBA', 2),
  ('Automatiker/in EFZ', 4),
  ('Automobil-Assistent/in EBA', 2),
  ('Automobil-Fachmann/-frau EFZ', 3),
  ('Automobil-Mechatroniker/in EFZ', 4),
  ('Coiffeur/-euse EFZ', 3),
  ('Elektroinstallateur/in EFZ', 4),
  ('Elektroniker/in EFZ', 4),
  ('Entwässerungspraktiker/in EBA', 2),
  ('Entwässerungstechnologe/-login EFZ', 3),
  ('Fachfrau/Fachmann Betreuung EFZ', 3),
  ('Fachfrau/Fachmann Gesundheit EFZ', 3),
  ('Fachfrau/Fachmann Hotellerie-Hauswirtschaft EFZ', 3),
  ('ICT-Fachmann/-frau EFZ', 3),
  ('Informatiker/in EFZ', 4),
  ('Koch/Köchin EFZ', 3),
  ('Konstrukteur/in EFZ', 4),
  ('Küchenangestellte/r EBA', 2),
  ('Maurer/in EFZ', 3),
  ('Montage-Elektriker/in EFZ', 3),
  ('Polymechaniker/in EFZ', 4),
  ('Praktiker/in Hotellerie-Hauswirtschaft EBA', 2),
  ('Reifenpraktiker/in EBA', 2),
  ('Sanitärinstallateur/in EFZ', 4),
  ('Schreiner/in EFZ', 4),
  ('Zahntechniker/in EFZ', 4),
  ('Zeichner/in EFZ Fachrichtung Architektur', 4),
  ('Zeichner/in EFZ Fachrichtung Ingenieurbau', 4)
ON CONFLICT (bezeichnung) DO NOTHING;
