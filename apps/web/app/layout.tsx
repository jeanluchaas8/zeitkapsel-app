import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zeitkapsel',
  description: 'Schreibe einen Brief an dein zukünftiges Ich.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" style={{ colorScheme: 'light dark' }}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap"
          rel="stylesheet"
        />
        {/* Hintergrund sofort anwenden — verhindert Flackern */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var bg = localStorage.getItem('zk-bg');
            if (bg) document.documentElement.setAttribute('data-bg', bg);
          } catch(e) {}
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}
