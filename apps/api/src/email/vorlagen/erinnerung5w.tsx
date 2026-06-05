import * as React from 'react'
import { Html, Head, Body, Container, Heading, Text, Link, Hr } from '@react-email/components'

interface Props {
  vorname: string
  abschlussDatum: string
  deadlineDatum: string
  zustellart: string
  lpZusammenfassung: string
  schuleName: string
  einstellungenLink: string
}

export function Erinnerung5wEmail({
  vorname,
  abschlussDatum,
  deadlineDatum,
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
          <Heading>Noch 5 Wochen — überprüfe deine Einstellungen</Heading>
          <Text>Hallo {vorname}</Text>
          <Text>
            Dein Lehrabschluss rückt näher! In 5 Wochen, am <strong>{abschlussDatum}</strong>,
            wirst du deinen Brief erhalten.
          </Text>
          <Text>
            Jetzt ist der richtige Moment, um deine Einstellungen ein letztes Mal zu überprüfen.
            Ab 4 Wochen vor dem Abschluss sind keine Änderungen mehr möglich.
          </Text>
          <Text><strong>Aktuelle Einstellungen:</strong></Text>
          <Text>
            Zustellart: {zustellart}<br />
            Lehrpersonen: {lpZusammenfassung}<br />
            Änderbar bis: <strong>{deadlineDatum}</strong>
          </Text>
          <Link href={einstellungenLink}>Einstellungen jetzt prüfen →</Link>
          <Hr />
          <Text style={{ fontSize: '12px', color: '#888' }}>
            Zeitkapsel-App · {schuleName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
