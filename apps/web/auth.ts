import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import Credentials from 'next-auth/providers/credentials'
import { pool } from './lib/db'
import { createHmac, timingSafeEqual } from 'crypto'
import type { Rolle } from './lib/typen'
import { authConfig } from './auth.config'
import { zeitkapselAdapter } from './lib/auth-adapter'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: zeitkapselAdapter(),
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,

  providers: [
    // Magic-Link für Lernende
    Resend({
      from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
      sendVerificationRequest: async ({ identifier, url }) => {
        // Lernende muss in der DB existieren
        const { rows } = await pool.query(
          'SELECT id, vorname FROM lernende WHERE email = $1',
          [identifier],
        )
        if (rows.length === 0) {
          throw new Error('Diese E-Mail-Adresse ist nicht registriert.')
        }

        const vorname = (rows[0] as { vorname: string }).vorname

        const { Resend: ResendClient } = await import('resend')
        const resend = new ResendClient(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@zeitkapsel.ch',
          to: identifier,
          subject: 'Dein Zeitkapsel-Anmeldelink',
          html: `
            <p>Hallo ${vorname}</p>
            <p>Klicke auf den folgenden Link, um dich bei Zeitkapsel anzumelden:</p>
            <p><a href="${url}" style="display:inline-block;background:#1c1917;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:500">Jetzt anmelden</a></p>
            <p style="color:#888;font-size:12px;margin-top:16px">Der Link ist 10 Minuten gültig und kann nur einmal verwendet werden.</p>
          `,
        })
      },
    }),

    // E-Mail/Passwort für Lehrpersonen
    Credentials({
      name: 'Lehrperson',
      credentials: {
        email: { label: 'E-Mail', type: 'email' },
        passwort: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] authorize aufgerufen, email:', credentials?.email)

          if (!credentials?.email || !credentials?.passwort) {
            console.log('[AUTH] Fehlende Credentials')
            return null
          }

          const { rows } = await pool.query(
            'SELECT id, vorname, nachname, email, passwort_hash, status FROM lehrperson WHERE email = $1',
            [credentials.email],
          )
          console.log('[AUTH] DB-Zeilen gefunden:', rows.length)
          if (rows.length === 0) return null

          const lp = rows[0] as {
            id: string; vorname: string; nachname: string
            email: string; passwort_hash: string; status: string
          }

          if (lp.status === 'pending') {
            console.log('[AUTH] Konto noch nicht bestätigt')
            return null
          }
          if (lp.status === 'abgelehnt') {
            console.log('[AUTH] Konto abgelehnt')
            return null
          }

          const hash = createHmac('sha256', process.env.AUTH_SECRET ?? '')
            .update(credentials.passwort as string)
            .digest('hex')

          if (hash.trim() !== lp.passwort_hash.trim()) {
            console.log('[AUTH] Passwort falsch')
          }

          if (hash.trim() !== lp.passwort_hash.trim()) return null

          return {
            id: lp.id,
            name: `${lp.vorname} ${lp.nachname}`,
            email: lp.email,
            rolle: 'lehrperson' as Rolle,
          }
        } catch (err) {
          console.error('[AUTH] Fehler:', err)
          return null
        }
      },
    }),
  ],

  callbacks: {
    // Rolle vom JWT auf die Session übertragen
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      ;(session.user as { rolle?: Rolle }).rolle = (token as { rolle?: Rolle }).rolle
      return session
    },

    // Rolle in das JWT-Token schreiben
    async jwt({ token, user, account }) {
      console.log('[JWT] user:', user?.email, 'account.provider:', account?.provider, 'account.providerAccountId:', account?.providerAccountId, 'token.rolle:', token.rolle)
      try {
        const email = user?.email ?? account?.providerAccountId ?? (token.email as string | undefined)
        if (email && !token.rolle) {
          // Lernende prüfen
          const { rows: lernende } = await pool.query(
            'SELECT id FROM lernende WHERE email = $1', [email],
          )
          if (lernende[0]) {
            token.rolle = 'lernende'
            token.sub = (lernende[0] as { id: string }).id
            console.log('[JWT] Rolle gesetzt: lernende, id:', token.sub)
            return token
          }

          // Lehrperson prüfen (inkl. Admin-Flag)
          const { rows: lp } = await pool.query(
            'SELECT id, ist_admin FROM lehrperson WHERE email = $1', [email],
          )
          if (lp[0]) {
            const lpRow = lp[0] as { id: string; ist_admin: boolean }
            token.rolle = lpRow.ist_admin ? 'admin' : 'lehrperson'
            token.sub = lpRow.id
            console.log('[JWT] Rolle gesetzt:', token.rolle, 'id:', token.sub)
            return token
          }

          console.log('[JWT] Kein Nutzer in DB gefunden für:', email)
        }
      } catch (err) {
        console.error('[JWT] Fehler:', err)
      }
      return token
    },

    // Session-Callback ist in auth.config.ts definiert (wird auch von Middleware genutzt)
  },

  pages: {
    signIn: '/anmelden',
    verifyRequest: '/anmelden/link-gesendet',
    error: '/anmelden/fehler',
  },
})
