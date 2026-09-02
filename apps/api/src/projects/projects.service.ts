// apps/api/src/projects/projects.service.ts
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /** Listet ausschließlich Projekte der eigenen Organisation. */
  listForOrganization(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(organizationId: string, name: string, address?: string) {
    return this.prisma.project.create({ data: { organizationId, name, address } });
  }

  /**
   * Wird trotz ProjectAccessGuard defensiv nochmal geprüft, falls dieser
   * Service direkt aus anderen Modulen ohne Guard-Kontext aufgerufen wird.
   */
  async getScoped(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Projekt nicht gefunden.");
    if (project.organizationId !== organizationId) {
      throw new ForbiddenException("Kein Zugriff auf dieses Projekt.");
    }
    return project;
  }

  /**
   * Erzeugt (oder erneuert) einen öffentlichen Lese-Link ("Projekt teilen /
   * QR-Code" bei stromlaufplan.de). Der Token ist absichtlich lang und
   * zufällig statt fortlaufend, damit er nicht erraten werden kann — er
   * gewährt unauthentifizierten Lesezugriff auf Grundriss/Stromlaufplan/
   * Prüfbericht dieses einen Projekts, vergleichbar der VIEWER-Rolle.
   */
  async createShareLink(projectId: string, organizationId: string) {
    await this.getScoped(projectId, organizationId);
    const shareToken = randomBytes(24).toString("base64url");
    await this.prisma.project.update({ where: { id: projectId }, data: { shareToken } });
    return { shareToken };
  }

  async revokeShareLink(projectId: string, organizationId: string) {
    await this.getScoped(projectId, organizationId);
    await this.prisma.project.update({ where: { id: projectId }, data: { shareToken: null } });
  }

  /** Öffentlicher, unauthentifizierter Lookup über den Share-Token. */
  async getByShareToken(shareToken: string) {
    const project = await this.prisma.project.findUnique({
      where: { shareToken },
      include: {
        topologyNodes: { orderBy: { orderIndex: "asc" } },
        floorPlans: true,
      },
    });
    if (!project) throw new NotFoundException("Freigabe-Link ungültig oder abgelaufen.");
    return project;
  }
}
