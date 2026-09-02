// apps/api/src/cabinet/cabinet.service.ts
import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CabinetService {
  constructor(private prisma: PrismaService) {}

  async placeComponent(rowId: string, topologyNodeId: string, startTE: number) {
    const node = await this.prisma.topologyNode.findUniqueOrThrow({
      where: { id: topologyNodeId }, include: { catalogItem: true },
    });
    const widthTE = node.catalogItem?.teWidth ?? 1;

    const row = await this.prisma.cabinetRow.findUniqueOrThrow({ where: { id: rowId }, include: { slots: true } });

    const overlap = row.slots.some((s) => startTE < s.startTE + s.widthTE && startTE + widthTE > s.startTE);
    if (overlap) throw new ConflictException("Slot-Bereich bereits belegt.");
    if (startTE + widthTE > row.totalTE) throw new ConflictException("Außerhalb der Reihenbreite.");

    return this.prisma.cabinetSlot.create({ data: { rowId, topologyNodeId, startTE, widthTE } });
  }
}
