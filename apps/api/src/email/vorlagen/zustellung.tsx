import * as React from 'react'
import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components'

interface Kommentar {
  lehrperson_vorname: string
  lehrperson_nachname: string
  fachbereich: string
  kommentar_typ: string
  kommentar_inhalt: string | null
}

interface Props {
  vorname: string
  beruf: string
  verfasstAmFormatiert: string
  tagDerLehre: number
  istQuereinsteiger: boolean
  klasseName: string
  schuleName: string
  briefTyp: string
  briefInhalt: string | null
  kommentare: Kommentar[]
}

function tagBeschreibung(tag: number, quereinsteiger: boolean): string {
  if (tag === 1 && !quereinsteiger) return 'dem ersten Tag deiner Ausbildung'
  const ordinal = `${tag}.`
  if (quereinsteiger) return `dem ${ordinal} Tag nach deinem Einstieg in die Klasse`
  return `dem ${ordinal} Tag deiner Ausbildung`
}

export function ZustellungEmail({
  vorname,
  beruf,
  verfasstAmFormatiert,
  tagDerLehre,
  istQuereinsteiger,
  klasseName,
  schuleName,
  briefTyp,
  briefInhalt,
  kommentare,
}: Props) {
  return (
    <Html lang="de">
      <Head />
      <Body style={{ fontFamily: 'serif', color: '#222' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <Heading style={{ fontWeight: 'normal' }}>
            Herzlichen Glückwunsch, {vorname}.
          </Heading>
          <Text>
            Du hast es geschafft. Heute, am Ende deiner Ausbildung als{' '}
            <strong>{beruf}</strong>, möchten wir dir etwas zurückgeben — einen Brief,
            den du dir selbst geschrieben hast.
          </Text>
          <Text style={{ color: '#666' }}>
            📅 Geschrieben am {verfasstAmFormatiert}<br />
            &nbsp;&nbsp;&nbsp;&nbsp;— {tagBeschreibung(tagDerLehre, istQuereinsteiger)}
          </Text>
          <Text style={{ fontSize: '12px', color: '#999' }}>
            Klasse {klasseName} · {schuleName}
          </Text>
          <Hr />

          {briefTyp === 'digital' && briefInhalt ? (
            <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{briefInhalt}</Text>
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic' }}>
              Dein handschriftlicher Brief ist als PDF-Anhang beigefügt.
            </Text>
          )}

          {kommentare.length > 0 && (
            <>
              <Hr />
              <Heading as="h2" style={{ fontSize: '18px' }}>
                Kommentare deiner Lehrpersonen
              </Heading>
              {kommentare.map((k, i) => (
                <div key={i} style={{ marginBottom: '24px' }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {k.lehrperson_vorname} {k.lehrperson_nachname} ({k.fachbereich}):
                  </Text>
                  {k.kommentar_typ === 'digital' && k.kommentar_inhalt ? (
                    <Text style={{ whiteSpace: 'pre-wrap', marginTop: '0' }}>
                      {k.kommentar_inhalt}
                    </Text>
                  ) : (
                    <Text style={{ color: '#666', fontStyle: 'italic', marginTop: '0' }}>
                      Handschriftlicher Kommentar als PDF-Anhang.
                    </Text>
                  )}
                </div>
              ))}
            </>
          )}

          <Hr />
          <Text style={{ fontSize: '12px', color: '#888' }}>
            Mit herzlichen Glückwünschen<br />
            {schuleName} · Zeitkapsel-App
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
