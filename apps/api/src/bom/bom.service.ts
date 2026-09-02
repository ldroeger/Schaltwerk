// apps/api/src/bom/bom.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface AggregatedBomLine {
  articleName: string; articleNumber: string | null; quantity: number; unit: string;
  sourceType: "TOPOLOGY_NODE" | "SYMBOL" | "CABLE";
}

@Injectable()
export class BomService {
  constructor(private prisma: PrismaService) {}

  async aggregate(projectId: string): Promise<AggregatedBomLine[]> {
    const lines = new Map<string, AggregatedBomLine>();

    const nodes = await this.prisma.topologyNode.findMany({
      where: { projectId, catalogItemId: { not: null } }, include: { catalogItem: true },
    });
    for (const n of nodes) {
      this.addLine(lines, { key: n.catalogItem!.code, articleName: n.catalogItem!.label, articleNumber: n.catalogItemId, unit: "Stk", sourceType: "TOPOLOGY_NODE" });
    }

    const symbols = await this.prisma.installationSymbol.findMany({
      where: { room: { projectId } }, include: { catalogItem: true },
    });
    for (const s of symbols) {
      this.addLine(lines, { key: s.catalogItem.code, articleName: s.catalogItem.label, articleNumber: s.catalogItemId, unit: "Stk", sourceType: "SYMBOL" });
    }

    const leafConsumers = nodes.filter((n: { nodeType: string }) => n.nodeType === "VERBRAUCHER");
    if (leafConsumers.length > 0) {
      this.addLine(lines, {
        key: "CABLE-NYM-3X1.5", articleName: "NYM-J 3x1,5mm²", articleNumber: null, unit: "m",
        sourceType: "CABLE", quantityOverride: leafConsumers.length * 12,
      });
    }

    return Array.from(lines.values());
  }

  private addLine(
    map: Map<string, AggregatedBomLine>,
    item: { key: string; articleName: string; articleNumber: string | null; unit: string; sourceType: any; quantityOverride?: number }
  ) {
    const existing = map.get(item.key);
    if (existing) existing.quantity += item.quantityOverride ?? 1;
    else map.set(item.key, {
      articleName: item.articleName, articleNumber: item.articleNumber,
      quantity: item.quantityOverride ?? 1, unit: item.unit, sourceType: item.sourceType,
    });
  }

  async exportCsv(projectId: string): Promise<string> {
    const lines = await this.aggregate(projectId);
    const header = "Artikel;Artikelnummer;Menge;Einheit;Quelle\n";
    const rows = lines.map((l) => `${l.articleName};${l.articleNumber ?? ""};${l.quantity};${l.unit};${l.sourceType}`).join("\n");
    return header + rows;
  }
}
