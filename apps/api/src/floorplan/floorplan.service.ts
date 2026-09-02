// apps/api/src/floorplan/floorplan.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/data/uploads";
const ALLOWED_MIME: Record<string, "PNG" | "JPG" | "SVG" | "PDF"> = {
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/svg+xml": "SVG",
  "application/pdf": "PDF",
};

@Injectable()
export class FloorPlanService {
  constructor(private prisma: PrismaService) {}

  /**
   * Speichert die hochgeladene Datei auf dem Volume und legt den FloorPlan-
   * Datensatz an. Die Skalierung (scalePxPerM) wird zunächst auf einen
   * Platzhalterwert gesetzt — sie wird im zweiten Schritt über
   * `calibrateScale()` gesetzt, nachdem der Nutzer im Editor zwei Punkte
   * mit bekanntem Realabstand markiert hat.
   */
  async uploadFloorPlan(projectId: string, file: { buffer: Buffer; mimetype: string; originalname: string }) {
    const fileType = ALLOWED_MIME[file.mimetype];
    if (!fileType) {
      throw new BadRequestException(`Nicht unterstützter Dateityp: ${file.mimetype}`);
    }

    await mkdir(path.join(UPLOAD_DIR, projectId), { recursive: true });
    const fileName = `${randomUUID()}-${file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, projectId, fileName);
    await writeFile(filePath, file.buffer);

    return this.prisma.floorPlan.create({
      data: {
        projectId,
        fileUrl: `/uploads/${projectId}/${fileName}`,
        fileType,
        scalePxPerM: 100, // Platzhalter bis zur Kalibrierung
      },
    });
  }

  /**
   * Kalibrierung: Nutzer klickt zwei Punkte im Bild (in Pixeln) und gibt den
   * bekannten Realabstand in Metern an (z.B. Türbreite = 0.885m).
   * scalePxPerM = Pixelabstand / Realabstand.
   */
  async calibrateScale(floorPlanId: string, pointA: { x: number; y: number }, pointB: { x: number; y: number }, realDistanceM: number) {
    if (realDistanceM <= 0) throw new BadRequestException("Realabstand muss größer als 0 sein.");
    const pixelDistance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
    const scalePxPerM = pixelDistance / realDistanceM;

    return this.prisma.floorPlan.update({
      where: { id: floorPlanId },
      data: { scalePxPerM },
    });
  }

  /**
   * Erstellt einen Raum mit Polygon-Grenze. `points` sind Weltkoordinaten
   * (Meter), bereits mit scalePxPerM umgerechnet auf Client-Seite oder hier.
   * PostGIS-Geometrietypen werden von Prisma nicht nativ unterstützt
   * (siehe `Unsupported("geometry(Polygon, 0)")` im Schema) — daher Raw SQL.
   */
  async createRoom(projectId: string, floorPlanId: string, name: string, roomType: string | undefined, points: { x: number; y: number }[]) {
    if (points.length < 3) {
      throw new BadRequestException("Ein Raum-Polygon benötigt mindestens 3 Punkte.");
    }
    // Polygon muss geschlossen sein (erster == letzter Punkt)
    const closed = [...points, points[0]];
    const wkt = `POLYGON((${closed.map((p) => `${p.x} ${p.y}`).join(", ")}))`;

    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO "Room" (id, "projectId", "floorPlanId", name, "roomType", boundary)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, ST_GeomFromText($5, 0))
       RETURNING id`,
      projectId, floorPlanId, name, roomType ?? null, wkt
    );
    return this.prisma.room.findUniqueOrThrow({ where: { id: rows[0].id } });
  }

  /**
   * Platziert ein Symbol (Steckdose, Schalter, ...) an einer Position im Raum.
   */
  async placeSymbol(roomId: string, catalogItemId: string, position: { x: number; y: number }, rotationDeg = 0, label?: string) {
    const point = `POINT(${position.x} ${position.y})`;
    const rows = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO "InstallationSymbol" (id, "roomId", "catalogItemId", position, "rotationDeg", label)
       VALUES (gen_random_uuid()::text, $1, $2, ST_GeomFromText($3, 0), $4, $5)
       RETURNING id`,
      roomId, catalogItemId, point, rotationDeg, label ?? null
    );
    return rows[0].id;
  }

  /**
   * Liest alle Räume eines Grundrisses inkl. Symbolen aus, wobei die PostGIS-
   * Geometrie über ST_AsGeoJSON in für das Frontend nutzbares JSON umgewandelt wird.
   */
  async getRoomsWithGeometry(floorPlanId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT
         r.id, r.name, r."roomType",
         ST_AsGeoJSON(r.boundary) AS boundary_geojson,
         COALESCE(
           json_agg(
             json_build_object(
               'id', s.id,
               'catalogItemId', s."catalogItemId",
               'label', s.label,
               'rotationDeg', s."rotationDeg",
               'position', ST_AsGeoJSON(s.position)::json
             )
           ) FILTER (WHERE s.id IS NOT NULL), '[]'
         ) AS symbols
       FROM "Room" r
       LEFT JOIN "InstallationSymbol" s ON s."roomId" = r.id
       WHERE r."floorPlanId" = $1
       GROUP BY r.id`,
      floorPlanId
    );
  }
}
