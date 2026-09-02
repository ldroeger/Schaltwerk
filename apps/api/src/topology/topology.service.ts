// apps/api/src/topology/topology.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Standard-Präfixe für die automatische Nummerierung, angelehnt an gängige
// Betriebsmittelkennzeichnung (RCD/LS als "-Q", Klemmen als "-X").
// Wird nur verwendet, wenn der Nutzer selbst kein Label angibt.
const AUTO_NUMBER_PREFIX: Partial<Record<string, string>> = {
  RCD: "F",
  LS_SCHALTER: "Q",
  RELAIS: "K",
  SCHUETZ: "K",
  KLEMME: "X",
  UNTERVERTEILER: "UV",
};

@Injectable()
export class TopologyService {
  constructor(private prisma: PrismaService) {}

  getFlatTree(projectId: string) {
    return this.prisma.topologyNode.findMany({
      where: { projectId },
      orderBy: [{ orderIndex: "asc" }],
      include: { catalogItem: true },
    });
  }

  async createNode(projectId: string, dto: { nodeType: string; parentId?: string; label?: string; catalogItemId?: string }) {
    if (dto.parentId) await this.assertNoCycle(dto.parentId);

    const label = dto.label?.trim() || (await this.generateAutoLabel(projectId, dto.nodeType));

    const maxOrder = await this.prisma.topologyNode.aggregate({
      where: { projectId, parentId: dto.parentId ?? null },
      _max: { orderIndex: true },
    });

    return this.prisma.topologyNode.create({
      data: {
        projectId,
        parentId: dto.parentId ?? null,
        nodeType: dto.nodeType as any,
        label,
        catalogItemId: dto.catalogItemId,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
      },
    });
  }

  /**
   * Automatische Nummerierung (analog zu stromlaufplan.de "Erste Schritte"):
   * zählt bestehende Knoten desselben Typs im Projekt und vergibt das nächste
   * fortlaufende Betriebsmittelkennzeichen, z.B. "-F1", "-F2" für RCDs,
   * "-Q1", "-Q2" für LS-Schalter, "-X1" für Klemmen(-leisten).
   */
  private async generateAutoLabel(projectId: string, nodeType: string): Promise<string> {
    const prefix = AUTO_NUMBER_PREFIX[nodeType];
    if (!prefix) return nodeType; // Fallback für Typen ohne Nummerierungsschema

    const count = await this.prisma.topologyNode.count({ where: { projectId, nodeType: nodeType as any } });
    return `-${prefix}${count + 1}`;
  }

  /**
   * Nummeriert alle RCDs, LS-Schalter und Klemmen eines Projekts anhand ihrer
   * aktuellen Baumreihenfolge (orderIndex, tiefenorientiert je Elternknoten)
   * neu durch. Entspricht der dedizierten "automatische Nummerierung"-Funktion
   * von stromlaufplan.de — z.B. nach dem Verschieben/Löschen von Knoten
   * manuell auslösbar, damit keine Lücken/Duplikate in der Zählung entstehen.
   */
  async renumberProject(projectId: string) {
    const nodes = await this.prisma.topologyNode.findMany({
      where: { projectId, nodeType: { in: Object.keys(AUTO_NUMBER_PREFIX) as any[] } },
      orderBy: [{ orderIndex: "asc" }],
    });

    const counters: Record<string, number> = {};
    const updates = nodes.map((node: { id: string; nodeType: string }) => {
      const prefix = AUTO_NUMBER_PREFIX[node.nodeType]!;
      counters[node.nodeType] = (counters[node.nodeType] ?? 0) + 1;
      return this.prisma.topologyNode.update({
        where: { id: node.id },
        data: { label: `-${prefix}${counters[node.nodeType]}` },
      });
    });

    return this.prisma.$transaction(updates);
  }

  async reparent(nodeId: string, newParentId: string) {
    if (nodeId === newParentId) throw new BadRequestException("Knoten kann nicht sein eigener Parent sein.");
    await this.assertNoCycle(newParentId, nodeId);
    return this.prisma.topologyNode.update({ where: { id: nodeId }, data: { parentId: newParentId } });
  }

  private async assertNoCycle(candidateParentId: string, excludeNodeId?: string) {
    let current = await this.prisma.topologyNode.findUnique({ where: { id: candidateParentId } });
    while (current?.parentId) {
      if (current.parentId === excludeNodeId) {
        throw new BadRequestException("Ungültige Zuordnung: würde einen Zyklus erzeugen.");
      }
      current = await this.prisma.topologyNode.findUnique({ where: { id: current.parentId } });
    }
  }

  getUnplacedComponents(projectId: string) {
    return this.prisma.topologyNode.findMany({
      where: { projectId, cabinetSlot: null, catalogItem: { teWidth: { not: null } } },
      include: { catalogItem: true },
    });
  }
}
