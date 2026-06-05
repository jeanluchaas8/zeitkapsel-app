import { getLernendeId } from '@/lib/api'
import { pool } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const lernendeId = await getLernendeId()
  if (!lernendeId) return NextResponse.json({ fehler: 'Nicht authentifiziert' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ fehler: 'Keine Datei' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ fehler: 'Datei zu gross (max. 5 MB)' }, { status: 400 })
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    return NextResponse.json({ fehler: 'Nur JPG, PNG, WebP oder GIF erlaubt' }, { status: 400 })
  }

  // Als Base64 Data-URL speichern (einfach, keine externe Abhängigkeit)
  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  await pool.query(
    'UPDATE lernende SET avatar_url = $1, avatar_seed = $2 WHERE id = $3',
    [dataUrl, '', lernendeId]
  )

  return NextResponse.json({ url: dataUrl })
}
