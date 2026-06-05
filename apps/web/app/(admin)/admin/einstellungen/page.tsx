import Link from 'next/link'
import { getKonfiguration } from '@/lib/api'
import { EinstellungenFormular } from './EinstellungenFormular'

export default async function AdminEinstellungenSeite() {
  const config = await getKonfiguration()

  const formConfig = {
    zustellart_auswahl_aktiv: config.zustellart_auswahl_aktiv ?? 'true',
    zustellart_standard:      config.zustellart_standard      ?? 'mail',
    registrierung_aktiv:      config.registrierung_aktiv      ?? 'true',
    brief_anleitung_titel:    config.brief_anleitung_titel    ?? 'So schreibst du deinen Brief',
    brief_anleitung_text:     config.brief_anleitung_text     ?? '',
    brief_placeholder:        config.brief_placeholder        ?? '',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/admin" className="text-stone-400 hover:text-stone-900 text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-1">Einstellungen</h1>
        <p className="text-sm text-stone-500 mt-1">
          Steuere das Verhalten der App ohne Code-Änderungen.
        </p>
      </div>

      <EinstellungenFormular config={formConfig} />
    </div>
  )
}
