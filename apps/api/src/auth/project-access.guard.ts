// apps/api/src/auth/project-access.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Stellt sicher, dass das im Pfad referenzierte Projekt (`:projectId`) zur
 * Organisation des authentifizierten Nutzers gehört. Muss NACH der
 * JwtAuthGuard laufen (request.user muss bereits gesetzt sein).
 *
 * Anwendung: @UseGuards(JwtAuthGuard, ProjectAccessGuard) auf jedem
 * Controller, dessen Routen einen :projectId-Parameter führen.
 */
@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const projectId: string | undefined = request.params?.projectId;
    if (!projectId) return true; // Route ohne :projectId -> nichts zu prüfen

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException("Projekt nicht gefunden.");

    if (project.organizationId !== request.user.organizationId) {
      throw new ForbiddenException("Kein Zugriff auf dieses Projekt.");
    }
    return true;
  }
}
