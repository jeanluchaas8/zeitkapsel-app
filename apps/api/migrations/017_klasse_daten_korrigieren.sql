-- Lehrstart: auf den echten ersten Schultag des Schuljahrs setzen
UPDATE klasse k
SET lehrstart = sf.beginn
FROM schulferien sf
WHERE sf.bezeichnung = 'Schuljahresbeginn'
  AND sf.schuljahr = (
    EXTRACT(YEAR FROM k.lehrstart)::TEXT || '/' ||
    RIGHT(EXTRACT(YEAR FROM k.lehrstart + INTERVAL '1 year')::TEXT, 2)
  );

-- Lehrabschluss: auf 4 Wochen vor Sommerferien des Abschlussjahres setzen
UPDATE klasse k
SET lehrabschluss = sf.beginn - INTERVAL '28 days'
FROM schulferien sf
WHERE sf.bezeichnung = 'Sommerferien'
  AND EXTRACT(YEAR FROM sf.beginn) = EXTRACT(YEAR FROM k.lehrabschluss);
