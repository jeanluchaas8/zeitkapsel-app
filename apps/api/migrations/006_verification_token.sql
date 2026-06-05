-- Magic-Link Tokens für NextAuth (Resend-Provider)
CREATE TABLE verification_token (
    identifier  TEXT NOT NULL,
    token       TEXT NOT NULL,
    expires     TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (identifier, token)
);
