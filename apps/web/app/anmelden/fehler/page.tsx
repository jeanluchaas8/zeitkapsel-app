import Link from 'next/link'

export default function FehlerSeite({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const fehlerTexte: Record<string, string> = {
    Verification: 'Der Anmeldelink ist abgelaufen oder wurde bereits verwendet. Bitte fordere einen neuen Link an.',
    Configuration: 'Es liegt ein Konfigurationsfehler vor. Bitte wende dich an den Support.',
    AccessDenied: 'Zugriff verweigert.',
    Default: 'Ein unbekannter Fehler ist aufgetreten.',
  }

  const meldung = fehlerTexte[searchParams.error ?? ''] ?? fehlerTexte.Default

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h1 className="text-xl font-semibold">Anmeldung fehlgeschlagen</h1>
        <p className="mt-2 text-stone-500 text-sm">{meldung}</p>
        <Link href="/anmelden" className="btn-primary mt-6 inline-block">
          Zurück zur Anmeldung
        </Link>
      </div>
    </main>
  )
}
