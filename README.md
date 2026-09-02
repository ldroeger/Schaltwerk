# Schaltwerk (OpenCircuit)

Open-Source-Alternative zu stromlaufplan.de / myElectricPlan: Grundriss-Editor,
Topologie-basierter Stromlaufplan-Generator, Schaltschrank-Grid-Planung,
KNX-Verwaltung mit ETS-Export sowie VDE-0100-600-Prüfprotokolle — vollständig
via Docker Compose isoliert lauffähig.

## Module

1. **Grundriss- & Installations-Editor** — Upload/Skalierung von Plänen, DIN-18015-Symbole
2. **Topologie- & Stromlaufplan-Generator** — Baumeditor + regelbasierte DIN-EN-60617-Rendering-Engine
3. **Schaltschrank-Grid-Planung** — Snap-to-Grid nach TE-Breite, "Unplatziert"-Sidebar
4. **KNX / Prüfprotokolle / Stücklisten** — GA/PA-Verwaltung, ETS-Export, VDE-0100-600-Editor, BOM-Aggregation
5. **PDF Export Engine** — Typst-basiertes Vektor-Rendering, mehrseitig

## Quickstart

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000
- PDF-Service: http://localhost:5000

## Architektur

Siehe [`/docs/architecture.md`](./docs/architecture.md) für Datenmodell,
Auto-Layout-Algorithmus und Modul-Beschreibungen.

## Stack

- Frontend: Next.js, Tailwind, React Flow, Konva.js
- Backend: NestJS, Prisma, PostgreSQL + PostGIS
- PDF: Typst CLI
- Containerisierung: Docker Compose

## Verifizierungsstatus

- `apps/pdf-service`: `tsc --noEmit` ✅, `npm run build` ✅
- `apps/api`: `tsc --noEmit` ✅ (Prisma-Client-Typen setzen `prisma generate` mit Netzwerkzugriff auf `binaries.prisma.sh` voraus)
- `apps/web`: `next build` ✅ (Next.js 15.5.21 / React 19, gepatchte Version — siehe [Next.js-Sicherheitsupdate 12/2025](https://nextjs.org/blog/security-update-2025-12-11))
- CI: `.github/workflows/ci.yml` prüft alle drei Services + `docker compose config` bei jedem Push/PR

Bekannte MVP-Einschränkungen: keine Auth/Multi-Tenancy, Kabellängen in der Stückliste sind eine Pauschal-Heuristik statt PostGIS-Distanzberechnung, DIN-EN-60617-/DIN-18015-Symbole sind Platzhalter-SVGs.

## Lizenz

MIT
