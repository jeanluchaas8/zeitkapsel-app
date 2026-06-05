import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

export async function GET(req: Request) {
  if (!(await adminPruefen())) return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const titel = searchParams.get('titel')
  if (!titel) return NextResponse.json({ fehler: 'Kein Titel' }, { status: 400 })

  try {
    // Vollständigen Artikel-Text via Wikipedia Action API holen
    const url = new URL('https://en.wikipedia.org/w/api.php')
    url.searchParams.set('action', 'query')
    url.searchParams.set('titles', titel.replace(/_/g, ' '))
    url.searchParams.set('prop', 'extracts')
    url.searchParams.set('exintro', '1')       // Nur Einleitung
    url.searchParams.set('explaintext', '1')   // Kein HTML, nur Text
    url.searchParams.set('exsectionformat', 'plain')
    url.searchParams.set('exchars', '2000')    // Max. 2000 Zeichen
    url.searchParams.set('format', 'json')
    url.searchParams.set('origin', '*')

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'ZeitkapselEdu/1.0' },
    })
    if (!res.ok) return NextResponse.json({ fehler: 'Wikipedia nicht erreichbar' }, { status: 502 })

    const data = await res.json() as {
      query?: { pages?: Record<string, { extract?: string; title?: string }> }
    }
    const page = Object.values(data.query?.pages ?? {})[0]
    const extract = page?.extract ?? ''
    const articleTitle = page?.title ?? titel

    // Auch deutsche Wikipedia-URL für die Anzeige
    const deUrl = `https://de.wikipedia.org/wiki/${encodeURIComponent(titel)}`

    return NextResponse.json({ extract, title: articleTitle, deUrl })
  } catch (err) {
    console.error('[WIKI-EXTRACT]', err)
    return NextResponse.json({ fehler: 'Fehler beim Laden' }, { status: 500 })
  }
}
