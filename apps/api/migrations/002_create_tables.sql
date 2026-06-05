-- ENUMS

CREATE TYPE brief_typ AS ENUM ('digital', 'foto');
CREATE TYPE brief_status AS ENUM ('entwurf', 'versiegelt', 'zugestellt', 'ausdruck_pendent', 'zugestellt_ausdruck_pendent');
CREATE TYPE zustellart AS ENUM ('mail', 'print', 'both');
CREATE TYPE kommentar_typ AS ENUM ('digital', 'foto');
CREATE TYPE email_typ AS ENUM (
    'brief_versiegelt',
    'lp_einladung',
    'erinnerung_5w',
    'lp_benachrichtigung_4w',
    'zustellung'
);
CREATE TYPE email_status AS ENUM ('gesendet', 'fehlgeschlagen', 'bounced');

-- TABELLEN

CREATE TABLE schule (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    domain       TEXT,
    erstellt_am  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE klasse (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schule_id        UUID NOT NULL REFERENCES schule(id) ON DELETE CASCADE,
    bezeichnung      TEXT NOT NULL,
    beruf            TEXT NOT NULL,
    lehrstart        DATE NOT NULL,
    lehrabschluss    DATE NOT NULL,
    erstellt_am      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT klasse_daten_check CHECK (lehrabschluss > lehrstart)
);

CREATE TABLE lehrperson (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schule_id    UUID NOT NULL REFERENCES schule(id) ON DELETE CASCADE,
    vorname      TEXT NOT NULL,
    nachname     TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    fachbereich  TEXT NOT NULL CHECK (fachbereich IN ('Berufskunde', 'Sport', 'Allgemeinbildung')),
    erstellt_am  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE klasse_lehrperson (
    klasse_id       UUID NOT NULL REFERENCES klasse(id) ON DELETE CASCADE,
    lehrperson_id   UUID NOT NULL REFERENCES lehrperson(id) ON DELETE CASCADE,
    zugewiesen_am   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (klasse_id, lehrperson_id)
);

CREATE TABLE lernende (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    klasse_id        UUID NOT NULL REFERENCES klasse(id) ON DELETE CASCADE,
    vorname          TEXT NOT NULL,
    nachname         TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    beitritt_datum   DATE NOT NULL,
    erstellt_am      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brief (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lernende_id                 UUID NOT NULL UNIQUE REFERENCES lernende(id) ON DELETE CASCADE,
    typ                         brief_typ NOT NULL,
    inhalt                      TEXT,
    status                      brief_status NOT NULL DEFAULT 'entwurf',
    zustellart                  zustellart NOT NULL,
    versiegelt_am               TIMESTAMPTZ,
    zugestellt_am               TIMESTAMPTZ,
    einstellungen_gesperrt_ab   DATE,
    erstellt_am                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brief_foto (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id         UUID NOT NULL REFERENCES brief(id) ON DELETE CASCADE,
    seite            INT NOT NULL CHECK (seite >= 1),
    datei_pfad       TEXT NOT NULL,
    hochgeladen_am   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (brief_id, seite)
);

CREATE TABLE lp_auswahl (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id                    UUID NOT NULL REFERENCES brief(id) ON DELETE CASCADE,
    lehrperson_id               UUID NOT NULL REFERENCES lehrperson(id) ON DELETE CASCADE,
    brief_sichtbar              BOOLEAN NOT NULL DEFAULT FALSE,
    gewaehlt_am                 TIMESTAMPTZ DEFAULT NOW(),
    einstellungen_geaendert_am  TIMESTAMPTZ,
    UNIQUE (brief_id, lehrperson_id)
);

CREATE TABLE kommentar (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id         UUID NOT NULL REFERENCES brief(id) ON DELETE CASCADE,
    lehrperson_id    UUID NOT NULL REFERENCES lehrperson(id) ON DELETE CASCADE,
    typ              kommentar_typ NOT NULL,
    inhalt           TEXT,
    datei_pfad       TEXT,
    erstellt_am      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (brief_id, lehrperson_id),
    CONSTRAINT kommentar_inhalt_check CHECK (
        (typ = 'digital' AND inhalt IS NOT NULL) OR
        (typ = 'foto' AND datei_pfad IS NOT NULL)
    )
);

CREATE TABLE email_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lernende_id   UUID REFERENCES lernende(id) ON DELETE SET NULL,
    lehrperson_id UUID REFERENCES lehrperson(id) ON DELETE SET NULL,
    typ           email_typ NOT NULL,
    empfaenger    TEXT NOT NULL,
    status        email_status NOT NULL,
    gesendet_am   TIMESTAMPTZ DEFAULT NOW()
);
