# Zeitkapsel

Eine Web-App für Berufsschüler/innen: Am ersten Tag der Lehre einen Brief an sich selbst schreiben — zum Lehrabschluss automatisch zugestellt, mit optionalen Kommentaren der Lehrpersonen.

## Voraussetzungen

- Node.js 20+
- Docker & Docker Compose
- npm 10+

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# .env öffnen und Werte anpassen
```

### 3. Datenbank starten

```bash
docker-compose up -d
```

### 4. Datenbank-Migrationen ausführen

```bash
npm run db:migrate
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Projektstruktur

```
zeitkapsel-app/
├── apps/
│   ├── api/          # Express Backend (Node.js + TypeScript)
│   └── web/          # Next.js 14 Frontend (App Router + Tailwind)
├── packages/
│   └── shared/       # Gemeinsame TypeScript-Typen
└── docker-compose.yml
```

## Tech-Stack

| Bereich       | Technologie                    |
|---------------|-------------------------------|
| Backend       | Node.js, Express, TypeScript  |
| Datenbank     | PostgreSQL 15 (via Docker)    |
| Frontend      | Next.js 14, Tailwind CSS      |
| E-Mail        | Resend, React Email           |
| Auth          | Auth.js (Magic Links / E-Mail)|
| Cron-Jobs     | pg-boss                       |
| Hosting       | Railway                       |
