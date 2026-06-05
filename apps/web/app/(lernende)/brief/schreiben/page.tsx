import { getKonfiguration } from '@/lib/api'
import { BriefEditor } from './BriefEditor'

export default async function BriefSchreibenSeite() {
  const config = await getKonfiguration()

  return (
    <BriefEditor
      anleitung={config['brief_anleitung_text'] ?? ''}
      placeholder={config['brief_placeholder'] ?? 'Liebe/r zukünftige/r Ich,\n\nHeute, am Anfang meiner Ausbildung…'}
    />
  )
}
