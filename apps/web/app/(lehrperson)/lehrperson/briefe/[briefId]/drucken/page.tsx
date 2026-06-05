import { getLehrpersonId, getBriefFuerLehrperson, getKommentar } from '@/lib/api'
import { redirect } from 'next/navigation'

export default async function DruckSeite({ params }: { params: { briefId: string } }) {
  const lehrpersonId = await getLehrpersonId()
  if (!lehrpersonId) redirect('/anmelden')

  const [brief, kommentar] = await Promise.all([
    getBriefFuerLehrperson(params.briefId, lehrpersonId),
    getKommentar(params.briefId, lehrpersonId),
  ])

  if (!brief || !brief.inhalt) redirect(`/lehrperson/briefe/${params.briefId}`)

  const kommentarText = kommentar?.inhalt as string | null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: #f5f0e8;
          font-family: 'Caveat', cursive;
          color: #2c2416;
          min-height: 100vh;
        }

        .no-print {
          background: white;
          border-bottom: 1px solid #e5e0d8;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-between;
          gap: 16px;
        }

        @media print {
          .no-print { display: none; }
          body { background: white; }
          .seite { box-shadow: none; margin: 0; max-width: 100%; }
        }

        .seite {
          max-width: 680px;
          margin: 40px auto;
          background: #fffef9;
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
          padding: 60px 70px;
          min-height: 900px;
          position: relative;
        }

        .linien {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            transparent,
            transparent 39px,
            #e8e0d0 39px,
            #e8e0d0 40px
          );
          margin: 60px 70px;
          pointer-events: none;
        }

        .inhalt {
          position: relative;
          z-index: 1;
          font-size: 22px;
          line-height: 40px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .trenner {
          border: none;
          border-top: 1px dashed #c8b89a;
          margin: 48px 0;
        }

        .kommentar-titel {
          font-size: 16px;
          font-weight: 600;
          color: #8a7560;
          margin-bottom: 16px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: Georgia, serif;
          font-style: italic;
        }

        .kommentar-text {
          font-size: 21px;
          line-height: 40px;
          white-space: pre-wrap;
          color: #3a2e20;
        }

        .fusszeile {
          position: relative;
          z-index: 1;
          margin-top: 48px;
          font-size: 15px;
          color: #b0a090;
          text-align: right;
          font-family: Georgia, serif;
          font-style: italic;
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderBottom: '1px solid #e5e0d8', padding: '12px 24px' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '14px', color: '#666' }}>
          {brief.vorname as string} {brief.nachname as string} — Druckvorschau
        </span>
        <button
          onClick={undefined}
          style={{ fontFamily: 'Georgia, serif', fontSize: '14px', padding: '6px 16px', background: '#1c1917', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          className="no-print"
        >
          🖨 Drucken
        </button>
      </div>

      <DruckButton />

      <div className="seite">
        <div className="linien" />
        <div className="inhalt">{brief.inhalt as string}</div>

        {kommentarText && (
          <>
            <hr className="trenner" />
            <p className="kommentar-titel">Worte deiner Lehrperson</p>
            <div className="kommentar-text">{kommentarText}</div>
          </>
        )}

        <div className="fusszeile">
          Zeitkapsel — {brief.vorname as string} {brief.nachname as string}
          {brief.versiegelt_am && (
            <> · versiegelt am {new Date(brief.versiegelt_am as string).toLocaleDateString('de-CH')}</>
          )}
        </div>
      </div>
    </>
  )
}

function DruckButton() {
  return (
    <script dangerouslySetInnerHTML={{
      __html: `
        document.addEventListener('DOMContentLoaded', function() {
          var btn = document.querySelector('button');
          if (btn) btn.addEventListener('click', function() { window.print(); });
        });
      `
    }} />
  )
}
