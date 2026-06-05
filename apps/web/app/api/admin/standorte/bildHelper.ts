const HEADERS = { 'User-Agent': 'ZeitkapselEdu/1.0 (Schulprojekt; github.com/zeitkapsel)' }

// Gibt die URL des besten Fotos für einen Wikipedia-Artikel zurück.
export async function holeBildUrlFuerArtikel(wikiTitel: string): Promise<string> {
  if (!wikiTitel) return ''

  // ── Schritt 1: REST API ──────────────────────────────────────────────
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitel)}`,
      { headers: HEADERS }
    )
    if (res.ok) {
      const d = await res.json() as {
        originalimage?: { source: string; width?: number; height?: number }
        thumbnail?:     { source: string }
      }
      const url = d.originalimage?.source ?? d.thumbnail?.source ?? ''
      const istFoto = url &&
        !url.endsWith('.svg') &&
        !/[Ll]ogo|[Ee]mblem|[Ss]eal|[Cc]oat_of|[Ff]lag_of/i.test(url) &&
        (url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') ||
         (url.toLowerCase().includes('.png') && (d.originalimage?.width ?? 0) >= 600))
      if (istFoto) return url
    }
  } catch { /* weiter */ }

  // ── Schritt 2: Alle Bilder des Artikels holen ────────────────────────
  try {
    const apiUrl = new URL('https://en.wikipedia.org/w/api.php')
    apiUrl.searchParams.set('action', 'query')
    apiUrl.searchParams.set('titles', wikiTitel.replace(/_/g, ' '))
    apiUrl.searchParams.set('prop', 'images')
    apiUrl.searchParams.set('imlimit', '20')
    apiUrl.searchParams.set('format', 'json')
    apiUrl.searchParams.set('origin', '*')

    const res = await fetch(apiUrl.toString(), { headers: HEADERS })
    if (!res.ok) return ''

    const data = await res.json() as {
      query?: { pages?: Record<string, { images?: Array<{ title: string }> }> }
    }
    const page = Object.values(data.query?.pages ?? {})[0]
    const bilder = (page?.images ?? [])
      .map(i => i.title.replace('File:', ''))
      .filter(name =>
        /\.(jpg|jpeg)$/i.test(name) &&
        !/[Ll]ogo|[Ee]mblem|[Ss]eal|[Cc]oat.of|[Ff]lag.of|[Ii]con|[Ss]ign|[Pp]ort?r?a?i?t?|[Mm]ap.of|[Ll]ocator|[Bb]adge|[Ss]ymbol/i.test(name)
      )

    if (bilder.length === 0) return ''

    const infoUrl = new URL('https://en.wikipedia.org/w/api.php')
    infoUrl.searchParams.set('action', 'query')
    infoUrl.searchParams.set('titles', bilder.slice(0, 5).map(f => `File:${f}`).join('|'))
    infoUrl.searchParams.set('prop', 'imageinfo')
    infoUrl.searchParams.set('iiprop', 'url|size')
    infoUrl.searchParams.set('iiurlwidth', '800')
    infoUrl.searchParams.set('format', 'json')
    infoUrl.searchParams.set('origin', '*')

    const infoRes = await fetch(infoUrl.toString(), { headers: HEADERS })
    if (!infoRes.ok) {
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(bilder[0])}?width=800`
    }

    const infoData = await infoRes.json() as {
      query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string; width?: number }> }> }
    }

    let besteUrl = ''
    let besteBreite = 0
    for (const p of Object.values(infoData.query?.pages ?? {})) {
      const info = p.imageinfo?.[0]
      if (info && (info.width ?? 0) > besteBreite && (info.width ?? 0) >= 400) {
        besteUrl = info.thumburl ?? info.url ?? ''
        besteBreite = info.width ?? 0
      }
    }

    return besteUrl
  } catch { return '' }
}
