import { auth } from '@/auth'
import { pool } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import type { Rolle } from '@/lib/typen'

async function adminPruefen() {
  const session = await auth()
  return (session?.user as { rolle?: Rolle } | undefined)?.rolle === 'admin'
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await adminPruefen())) {
    return NextResponse.json({ fehler: 'Keine Berechtigung' }, { status: 403 })
  }

  const { id } = await params

  // Eigenen Account kann man nicht löschen
  const session = await auth()
  const eigeneId = (session?.user as { id?: string })?.id
  if (eigeneId === id) {
    return NextResponse.json({ fehler: 'Du kannst deinen eigenen Account nicht löschen.' }, { status: 400 })
  }

  const { rowCount } = await pool.query('DELETE FROM lehrperson WHERE id = $1', [id])
  if (!rowCount) return NextResponse.json({ fehler: 'Nicht gefunden' }, { status: 404 })

  return new NextResponse(null, { status: 204 })
}
