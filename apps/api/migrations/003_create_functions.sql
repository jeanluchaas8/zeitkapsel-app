-- Anzahl Werktage zwischen zwei Daten (Samstag/Sonntag ausgeschlossen)
CREATE OR REPLACE FUNCTION werktage_zwischen(von DATE, bis DATE)
RETURNS INT AS $$
  SELECT COUNT(*)::INT
  FROM generate_series(von, bis - INTERVAL '1 day', '1 day') AS d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);
$$ LANGUAGE SQL IMMUTABLE;
