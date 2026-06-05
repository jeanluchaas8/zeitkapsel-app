import * as React from 'react'
import { Html, Head, Body, Container, Heading, Text, Link, Hr } from '@react-email/components'

interface Lernende {
  vorname: string
  nachname: string
  brief_sichtbar: boolean
  brief_typ: string
}

interface Props {
  vorname: string
  klasseName: string
  abschlussDatum: string
  lernendeListe: Lernende[]
  schuleName: string
  dashboardLink: string
}

export function LpBenachrichtigung4wEmail({
  vorname,
  klasseName,
  abschlussDatum,
  lernendeListe,
  schuleName,
  dashboardLink,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', color: '#222' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>Klasse {klasseName} — Zeit für deine Kommentare</Heading>
          <Text>Hallo {vorname}</Text>
          <Text>
            Der Lehrabschluss der Klasse <strong>{klasseName}</strong> findet am{' '}
            <strong>{abschlussDatum}</strong> statt. Ab jetzt kannst du deine Kommentare verfassen.
          </Text>
          <Text><strong>Folgende Lernende haben dich ausgewählt:</strong></Text>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Lernende/r</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Brief</th>
              </tr>
            </thead>
            <tbody>
              {lernendeListe.map((l, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {l.vorname} {l.nachname}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {l.brief_sichtbar
                      ? `sichtbar (${l.brief_typ === 'foto' ? 'Foto' : 'Digital'})`
                      : 'privat'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <br />
          <Link href={dashboardLink}>Kommentare schreiben →</Link>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#888' }}>
            Zeitkapsel-App · {schuleName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
