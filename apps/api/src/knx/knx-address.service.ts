// apps/api/src/knx/knx-address.service.ts
import { Injectable, BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Fester Funktions-Dictionary für die Hauptgruppen-Zuordnung nach Funktion,
 * angelehnt an die in der Praxis übliche myElectricPlan/ETS-Konvention.
 */
const FUNCTION_MAIN_GROUPS: Record<string, number> = {
  Schalten: 1,
  Dimmen: 2,
  Jalousie: 3,
  Heizung: 4,
  Status: 5,
  Szene: 6,
  Sonstiges: 9,
};

@Injectable()
export class KnxAddressService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateKnxProject(projectId: string) {
    const existing = await this.prisma.knxProject.findUnique({ where: { projectId } });
    if (existing) return existing;
    return this.prisma.knxProject.create({ data: { projectId } });
  }

  async configureScheme(projectId: string, addressLevels: 2 | 3, groupSortBy: "FUNCTION" | "ROOM") {
    const knxProject = await this.getOrCreateKnxProject(projectId);
    return this.prisma.knxProject.update({
      where: { id: knxProject.id },
      data: { addressLevels, groupSortBy },
    });
  }

  async registerDevice(projectId: string, topologyNodeId: string, physicalAddress: string) {
    const knxProject = await this.getOrCreateKnxProject(projectId);
    const node = await this.prisma.topologyNode.findUniqueOrThrow({ where: { id: topologyNodeId } });
    if (node.projectId !== projectId) {
      throw new BadRequestException("Bauteil gehört nicht zu diesem Projekt.");
    }

    return this.prisma.knxDevice.create({
      data: { knxProjectId: knxProject.id, topologyNodeId, physicalAddress },
    });
  }

  /**
   * Vergibt der übergebenen Kennung (Funktion/Raumname für Hauptgruppen,
   * bzw. das jeweils andere Kriterium für Mittelgruppen) eine feste,
   * dauerhaft zugeordnete Gruppennummer innerhalb des angegebenen `scope`
   * ("main" oder "mid:<hauptgruppe>") — bei Funktionen auf oberster Ebene aus
   * dem festen Dictionary, sonst fortlaufend die nächste freie Nummer.
   */
  private async resolveGroupNumber(knxProjectId: string, scope: string, key: string, useDictionary: boolean): Promise<number> {
    const existing = await this.prisma.knxGroupPrefix.findUnique({
      where: { knxProjectId_scope_key: { knxProjectId, scope, key } },
    });
    if (existing) return existing.mainGroup;

    let groupNumber: number;
    if (useDictionary && FUNCTION_MAIN_GROUPS[key] !== undefined) {
      groupNumber = FUNCTION_MAIN_GROUPS[key];
    } else {
      const maxAssigned = await this.prisma.knxGroupPrefix.aggregate({
        where: { knxProjectId, scope },
        _max: { mainGroup: true },
      });
      groupNumber = (maxAssigned._max.mainGroup ?? 0) + 1;
    }

    await this.prisma.knxGroupPrefix.create({ data: { knxProjectId, scope, key, mainGroup: groupNumber } });
    return groupNumber;
  }

  /**
   * Schlägt die nächste freie Gruppenadresse für eine gegebene
   * Funktion+Raum-Kombination vor (3-stufig: Haupt/Mittel/Untergruppe,
   * 2-stufig: Haupt/Untergruppe). Prüft dabei automatisch auf Kollisionen
   * mit bereits vergebenen Adressen im Projekt.
   */
  async suggestNextAddress(projectId: string, functionName: string, roomName: string): Promise<string> {
    const knxProject = await this.getOrCreateKnxProject(projectId);
    const primaryKey = knxProject.groupSortBy === "FUNCTION" ? functionName : roomName;
    const secondaryKey = knxProject.groupSortBy === "FUNCTION" ? roomName : functionName;

    const mainGroup = await this.resolveGroupNumber(
      knxProject.id, "main", primaryKey, knxProject.groupSortBy === "FUNCTION"
    );

    if (knxProject.addressLevels === 2) {
      const used = await this.getUsedSubGroups(knxProject.id, `${mainGroup}/`);
      const next = this.firstFreeInRange(used, 0, 255);
      return `${mainGroup}/${next}`;
    }

    const middleGroup = await this.resolveGroupNumber(
      knxProject.id, `mid:${mainGroup}`, secondaryKey, knxProject.groupSortBy !== "FUNCTION"
    );
    const usedSub = await this.getUsedSubGroups(knxProject.id, `${mainGroup}/${middleGroup}/`);
    const nextSub = this.firstFreeInRange(usedSub, 0, 255);
    return `${mainGroup}/${middleGroup}/${nextSub}`;
  }

  private async getUsedSubGroups(knxProjectId: string, addressPrefix: string): Promise<Set<number>> {
    const rows = await this.prisma.knxGroupAddress.findMany({
      where: { device: { knxProjectId }, address: { startsWith: addressPrefix } },
      select: { address: true },
    });
    const used = new Set<number>();
    for (const row of rows) {
      const last = row.address.split("/").pop();
      const n = Number(last);
      if (!Number.isNaN(n)) used.add(n);
    }
    return used;
  }

  private firstFreeInRange(used: Set<number>, min: number, max: number): number {
    for (let i = min; i <= max; i++) {
      if (!used.has(i)) return i;
    }
    throw new BadRequestException("Adressraum für diese Haupt-/Mittelgruppe ist erschöpft.");
  }

  /**
   * Legt eine Gruppenadresse fest an — mit Konfliktprüfung: dieselbe Adresse
   * darf innerhalb eines KNX-Projekts nicht doppelt vergeben werden.
   */
  async assignGroupAddress(deviceId: string, address: string, functionName: string, dpt: string) {
    const device = await this.prisma.knxDevice.findUniqueOrThrow({
      where: { id: deviceId },
      include: { knxProject: true },
    });

    const conflict = await this.prisma.knxGroupAddress.findFirst({
      where: { address, device: { knxProjectId: device.knxProjectId } },
    });
    if (conflict) {
      throw new ConflictException(`Gruppenadresse ${address} ist in diesem Projekt bereits vergeben.`);
    }

    return this.prisma.knxGroupAddress.create({
      data: { deviceId, address, function: functionName, dpt },
    });
  }

  async listDevices(projectId: string) {
    const knxProject = await this.prisma.knxProject.findUnique({
      where: { projectId },
      include: { devices: { include: { groupAddresses: true, topologyNode: true } } },
    });
    if (!knxProject) return [];
    return knxProject.devices;
  }
}
