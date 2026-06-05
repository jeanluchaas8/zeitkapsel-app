import type { NextAuthConfig } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { Rolle } from '@/lib/typen'

// Leichte Auth-Konfiguration ohne Datenbankzugriff — sicher für Edge Runtime (Middleware)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/anmelden',
    verifyRequest: '/anmelden/link-gesendet',
    error: '/anmelden/fehler',
  },
  callbacks: {
    // Rolle vom JWT-Token in die Session übertragen (läuft auch in der Middleware)
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      ;(session.user as { rolle?: Rolle }).rolle = (token as JWT & { rolle?: Rolle }).rolle
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const eingeloggt = !!auth?.user
      const { pathname } = nextUrl

      // Öffentliche Routen immer erlauben
      const oeffentlich =
        pathname.startsWith('/anmelden') ||
        pathname.startsWith('/registrieren') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/registrieren')

      if (oeffentlich) return true
      if (!eingeloggt) return false

      const rolle = (auth.user as { rolle?: Rolle }).rolle

      // Admin-Bereich nur für Admins
      if (pathname.startsWith('/admin')) {
        return rolle === 'admin'
      }

      // Lehrperson-Bereich für Lehrpersonen und Admins
      if (pathname.startsWith('/lehrperson')) {
        return rolle === 'lehrperson' || rolle === 'admin'
      }

      return true
    },
  },
  providers: [], // Providers werden in auth.ts ergänzt
}
