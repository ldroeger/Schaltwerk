// apps/api/src/topology/topology.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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

  async createNode(projectId: string, dto: { nodeType: string; parentId?: string; label: string; catalogItemId?: string }) {
    if (dto.parentId) await this.assertNoCycle(dto.parentId);
    return this.prisma.topologyNode.create({
      data: {
        projectId,
        parentId: dto.parentId ?? null,
        nodeType: dto.nodeType as any,
        label: dto.label,
        catalogItemId: dto.catalogItemId,
      },
    });
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
