import * as React from 'react'
import { Html, Head, Body, Container, Heading, Text, Link, Hr } from '@react-email/components'

interface Props {
  vorname: string
  abschlussDatum: string
  klasseName: string
  briefTyp: string
  zustellart: string
  lpZusammenfassung: string
  schuleName: string
  einstellungenLink: string
}

export function BriefVersiegeltEmail({
  vorname,
  abschlussDatum,
  klasseName,
  briefTyp,
  zustellart,
  lpZusammenfassung,
  schuleName,
  einstellungenLink,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: 'sans-serif', color: '#222' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading>Dein Brief ist versiegelt</Heading>
          <Text>Hallo {vorname}</Text>
          <Text>
            Dein Brief an dein zukünftiges Ich ist sicher versiegelt. Er wird dir pünktlich
            zu deinem Lehrabschluss am <strong>{abschlussDatum}</strong> zugestellt.
          </Text>
          <Text><strong>Deine Einstellungen:</strong></Text>
          <Text>
            Klasse: {klasseName}<br />
            Brief: {briefTyp}<br />
            Zustellart: {zustellart}<br />
            Lehrpersonen: {lpZusammenfassung}
          </Text>
          <Text>
            Du kannst deine Einstellungen bis 4 Wochen vor dem Lehrabschluss anpassen:
          </Text>
          <Link href={einstellungenLink}>Einstellungen anpassen →</Link>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#888' }}>
            Zeitkapsel-App · {schuleName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
