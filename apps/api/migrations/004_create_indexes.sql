-- Performance-Indexes
CREATE INDEX idx_klasse_lehrabschluss ON klasse(lehrabschluss);
CREATE INDEX idx_lernende_klasse ON lernende(klasse_id);
CREATE INDEX idx_brief_lernende ON brief(lernende_id);
CREATE INDEX idx_brief_status ON brief(status);
CREATE INDEX idx_lp_auswahl_brief ON lp_auswahl(brief_id);
CREATE INDEX idx_lp_auswahl_lehrperson ON lp_auswahl(lehrperson_id);
CREATE INDEX idx_email_log_typ_status ON email_log(typ, status);
CREATE INDEX idx_email_log_gesendet ON email_log(gesendet_am DESC);
