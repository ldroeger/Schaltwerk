# Architektur — Schaltwerk (OpenCircuit)

Vollständige Konzeption in vier Teilen:

1. **Datenmodell** — `apps/api/prisma/schema.prisma`
   Zentrale Entität ist `TopologyNode` (selbstreferenzierender Baum: Einspeisung →
   Hauptschalter → RCD → LS → Verbraucher/Klemme). Räume/Symbole nutzen PostGIS
   (`geometry(Polygon)` / `geometry(Point)`) für Grundriss-Koordinaten.
   `CabinetSlot` referenziert `TopologyNode` 1:1 — unplatzierte Komponenten sind
   einfach Knoten ohne zugehörigen Slot.

2. **Auto-Layout-Algorithmus** — `apps/pdf-service/src/layout-engine.ts`
   Breitentraversierung pro Sammelschienen-Ebene. Sammelschienen (L1–L3/N/PE)
   werden zuerst über die Seitenbreite gezeichnet, darunter hängen Blöcke
   (RCD → LS → Verbraucher) im Raster. Bei Platzmangel: Seitenumbruch nur
   zwischen abgeschlossenen Teilbäumen + Abbruchpfeil mit Querverweis.

3. **PDF-Rendering** — `apps/pdf-service/templates/schematic.typ`
   Typst-Template liest die Layout-JSON und zeichnet Sammelschienen, DIN-EN-60617-
   Symbole (SVG) und Querverweis-Pfeile. Deterministisch, mm-genau, sehr schnell
   auch bei vielen Seiten.

4. **Module**
   - Grundriss-Editor: `apps/api/src/floorplan` (Upload via Multer, Skalierungs-
     Kalibrierung über zwei Referenzpunkte + bekannten Realabstand, Raum-Polygone
     und Symbolpositionen per Raw-SQL gegen PostGIS geschrieben/gelesen, da Prisma
     `Unsupported("geometry(...)")`-Felder nicht direkt (de)serialisiert).
     Frontend: `apps/web/components/floorplan-editor` (Konva.js-Canvas mit
     Kalibrier-/Zeichen-/Platzierungs-Modi) + `symbol-library` (DIN-18015-Katalog,
     geseedet über `apps/api/prisma/seed.ts`).
   - Topologie-Baum: React Flow (`apps/web/components/topology-tree`).
   - Schaltschrank-Grid: Snap-to-Grid via `@dnd-kit/core` (`apps/web/components/cabinet-grid`).
   - KNX/ETS-Export: `apps/api/src/knx/ets-export.service.ts` (CSV 3-Level-Format + vereinfachtes XML).
   - VDE-0100-600-Prüfprotokoll: `apps/api/src/test-reports` (Vorbefüllung aus Topologie,
     Plausibilitätsprüfung gegen Grenzwerttabellen, PDF-Export über den pdf-service).
   - Stücklisten (BOM): `apps/api/src/bom/bom.service.ts` — Aggregation aus
     Topologie-Knoten, Installationssymbolen und einer Kabellängen-Heuristik
     (produktiv: PostGIS `ST_Distance` statt Pauschalwert).

## Docker Compose

`docker-compose.yml` startet vier Services: `postgres` (PostGIS), `api` (NestJS +
Prisma), `pdf-service` (Fastify + Typst-CLI), `web` (Next.js). Siehe README für
Quickstart.
