// apps/api/src/projects/projects.service.ts
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
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
}
