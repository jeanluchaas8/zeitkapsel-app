import type { Adapter, AdapterUser, AdapterSession } from 'next-auth/adapters'
import { pool } from './db'
import type { Rolle } from './typen'

// Minimaler Adapter — verbindet Auth.js mit unseren bestehenden Tabellen
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zeitkapselAdapter(): Adapter {
  return ({
    // Nutzer anhand E-Mail suchen (zuerst Lernende, dann Lehrperson)
    async getUserByEmail(email) {
      // Lernende prüfen
      const { rows: lernende } = await pool.query(
        'SELECT id, vorname, nachname, email FROM lernende WHERE email = $1',
        [email],
      )
      if (lernende[0]) {
        return {
          id: lernende[0].id as string,
          name: `${lernende[0].vorname as string} ${lernende[0].nachname as string}`,
          email: lernende[0].email as string,
          emailVerified: null,
          rolle: 'lernende' as Rolle,
        }
      }

      // Lehrperson prüfen
      const { rows: lp } = await pool.query(
        'SELECT id, vorname, nachname, email FROM lehrperson WHERE email = $1',
        [email],
      )
      if (lp[0]) {
        return {
          id: lp[0].id as string,
          name: `${lp[0].vorname as string} ${lp[0].nachname as string}`,
          email: lp[0].email as string,
          emailVerified: null,
          rolle: 'lehrperson' as Rolle,
        }
      }

      return null
    },

    // Wird nach Login aufgerufen — prüft Lernende und Lehrpersonen
    async getUserById(id: string) {
      const { rows: lernende } = await pool.query(
        'SELECT id, vorname, nachname, email FROM lernende WHERE id = $1', [id],
      )
      if (lernende[0]) {
        return {
          id: lernende[0].id as string,
          name: `${lernende[0].vorname as string} ${lernende[0].nachname as string}`,
          email: lernende[0].email as string,
          emailVerified: null,
          rolle: 'lernende' as Rolle,
        }
      }
      const { rows: lp } = await pool.query(
        'SELECT id, vorname, nachname, email FROM lehrperson WHERE id = $1', [id],
      )
      if (lp[0]) {
        return {
          id: lp[0].id as string,
          name: `${lp[0].vorname as string} ${lp[0].nachname as string}`,
          email: lp[0].email as string,
          emailVerified: null,
          rolle: 'lehrperson' as Rolle,
        }
      }
      return null
    },

    // Wir erstellen keine neuen Nutzer — nur bekannte E-Mails erlaubt
    async createUser(user) {
      return { ...user, id: user.email ?? '', emailVerified: null } as AdapterUser
    },

    async updateUser(user) {
      return { ...user, email: user.email ?? '', emailVerified: null } as AdapterUser
    },

    // Verification Tokens (für Magic Links)
    async createVerificationToken({ identifier, token, expires }) {
      await pool.query(
        `INSERT INTO verification_token (identifier, token, expires)
         VALUES ($1, $2, $3)
         ON CONFLICT (identifier, token) DO UPDATE SET expires = $3`,
        [identifier, token, expires],
      )
      return { identifier, token, expires }
    },

    async useVerificationToken({ identifier, token }) {
      console.log('[ADAPTER] useVerificationToken aufgerufen für:', identifier)
      const { rows } = await pool.query(
        'DELETE FROM verification_token WHERE identifier = $1 AND token = $2 RETURNING *',
        [identifier, token],
      )
      console.log('[ADAPTER] Token gefunden und gelöscht:', !!rows[0])
      if (!rows[0]) return null
      return {
        identifier: rows[0].identifier as string,
        token: rows[0].token as string,
        expires: rows[0].expires as Date,
      }
    },

    // Session-Methoden — wir nutzen JWT statt DB-Sessions
    async createSession(session) { return session as AdapterSession },
    async getSessionAndUser() { return null },
    async updateSession(session) { return session as AdapterSession },
    async deleteSession() {},
    async linkAccount() {},
  }) as Adapter
}
