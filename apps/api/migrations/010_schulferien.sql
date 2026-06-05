-- Schulferien Kanton Zug (2025/26 bis 2029/30)
-- Quelle: Amt für gemeindliche Schulen, 24. Juni 2025

CREATE TABLE schulferien (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schuljahr   TEXT    NOT NULL,   -- z.B. '2025/26'
    bezeichnung TEXT    NOT NULL,   -- z.B. 'Sommerferien'
    beginn      DATE    NOT NULL,
    ende        DATE    NOT NULL,
    CONSTRAINT schulferien_zeitraum_check CHECK (ende >= beginn)
);

-- 2025/26
INSERT INTO schulferien (schuljahr, bezeichnung, beginn, ende) VALUES
  ('2025/26', 'Herbstferien',      '2025-10-04', '2025-10-19'),
  ('2025/26', 'Weihnachtsferien',  '2025-12-20', '2026-01-04'),
  ('2025/26', 'Sportferien',       '2026-01-31', '2026-02-15'),
  ('2025/26', 'Frühlingsferien',   '2026-04-11', '2026-04-26'),
  ('2025/26', 'Auffahrtsferien',   '2026-05-14', '2026-05-17'),
  ('2025/26', 'Sommerferien',      '2026-07-04', '2026-08-16');

-- 2026/27
INSERT INTO schulferien (schuljahr, bezeichnung, beginn, ende) VALUES
  ('2026/27', 'Herbstferien',      '2026-10-03', '2026-10-18'),
  ('2026/27', 'Weihnachtsferien',  '2026-12-19', '2027-01-03'),
  ('2026/27', 'Sportferien',       '2027-02-06', '2027-02-21'),
  ('2026/27', 'Frühlingsferien',   '2027-04-17', '2027-05-02'),
  ('2026/27', 'Auffahrtsferien',   '2027-05-06', '2027-05-09'),
  ('2026/27', 'Sommerferien',      '2027-07-03', '2027-08-15');

-- 2027/28
INSERT INTO schulferien (schuljahr, bezeichnung, beginn, ende) VALUES
  ('2027/28', 'Herbstferien',      '2027-10-02', '2027-10-17'),
  ('2027/28', 'Weihnachtsferien',  '2027-12-23', '2028-01-05'),
  ('2027/28', 'Sportferien',       '2028-02-05', '2028-02-20'),
  ('2027/28', 'Frühlingsferien',   '2028-04-15', '2028-04-30'),
  ('2027/28', 'Auffahrtsferien',   '2028-05-25', '2028-05-28'),
  ('2027/28', 'Sommerferien',      '2028-07-08', '2028-08-20');

-- 2028/29
INSERT INTO schulferien (schuljahr, bezeichnung, beginn, ende) VALUES
  ('2028/29', 'Herbstferien',      '2028-10-07', '2028-10-22'),
  ('2028/29', 'Weihnachtsferien',  '2028-12-23', '2029-01-07'),
  ('2028/29', 'Sportferien',       '2029-02-03', '2029-02-18'),
  ('2028/29', 'Frühlingsferien',   '2029-04-14', '2029-04-29'),
  ('2028/29', 'Auffahrtsferien',   '2029-05-10', '2029-05-13'),
  ('2028/29', 'Sommerferien',      '2029-07-07', '2029-08-19');

-- 2029/30
INSERT INTO schulferien (schuljahr, bezeichnung, beginn, ende) VALUES
  ('2029/30', 'Herbstferien',      '2029-10-06', '2029-10-21'),
  ('2029/30', 'Weihnachtsferien',  '2029-12-22', '2030-01-06'),
  ('2029/30', 'Sportferien',       '2030-02-02', '2030-02-17'),
  ('2029/30', 'Frühlingsferien',   '2030-04-13', '2030-04-28'),
  ('2029/30', 'Auffahrtsferien',   '2030-05-30', '2030-06-02'),
  ('2029/30', 'Sommerferien',      '2030-07-06', '2030-08-18');
