// apps/api/src/cabinet/cabinet.service.ts
import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CabinetService {
  constructor(private prisma: PrismaService) {}

  async placeComponent(rowId: string, topologyNodeId: string, startTE: number, organizationId: string) {
    const node = await this.prisma.topologyNode.findUniqueOrThrow({
      where: { id: topologyNodeId }, include: { catalogItem: true },
    });
    const widthTE = node.catalogItem?.teWidth ?? 1;

    const row = await this.prisma.cabinetRow.findUnique({
      where: { id: rowId },
      include: { slots: true, cabinet: { include: { project: true } } },
    });
    if (!row) throw new NotFoundException("Schaltschrank-Reihe nicht gefunden.");

    // Mandantengrenze: Reihe muss zu einem Projekt der eigenen Organisation gehören,
    // UND das zu platzierende Bauteil muss demselben Projekt zugeordnet sein.
    if (row.cabinet.project.organizationId !== organizationId) {
      throw new ForbiddenException("Kein Zugriff auf diesen Schaltschrank.");
    }
    if (node.projectId !== row.cabinet.projectId) {
      throw new ForbiddenException("Bauteil gehört nicht zum selben Projekt wie der Schaltschrank.");
    }

    const overlap = row.slots.some(
      (s: { startTE: number; widthTE: number }) => startTE < s.startTE + s.widthTE && startTE + widthTE > s.startTE
    );
    if (overlap) throw new ConflictException("Slot-Bereich bereits belegt.");
    if (startTE + widthTE > row.totalTE) throw new ConflictException("Außerhalb der Reihenbreite.");

    return this.prisma.cabinetSlot.create({ data: { rowId, topologyNodeId, startTE, widthTE } });
  }
}
