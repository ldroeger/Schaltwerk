// apps/api/src/projects/projects.controller.ts
import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard, AuthenticatedUser } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";
import { CurrentUser } from "../auth/current-user.decorator";

interface CreateProjectDto {
  name: string;
  address?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForOrganization(user.organizationId);
  }

  @Roles("OWNER", "PLANNER")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.service.create(user.organizationId, dto.name, dto.address);
  }

  // "Projekt teilen / QR-Code": erzeugt einen öffentlichen, unauthentifizierten
  // Lese-Link. Frontend rendert daraus den QR-Code.
  @Roles("OWNER", "PLANNER")
  @Post(":projectId/share")
  createShareLink(@Param("projectId") projectId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createShareLink(projectId, user.organizationId);
  }

  @Roles("OWNER", "PLANNER")
  @Delete(":projectId/share")
  revokeShareLink(@Param("projectId") projectId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.revokeShareLink(projectId, user.organizationId);
  }
}

// Separater, öffentlicher Controller ohne Guards -> bewusst nicht unter
// "projects" gemountet, um klar von den authentifizierten Routen getrennt zu sein.
@Controller("public/share")
export class PublicShareController {
  constructor(private readonly service: ProjectsService) {}

  @Public()
  @Get(":shareToken")
  getSharedProject(@Param("shareToken") shareToken: string) {
    return this.service.getByShareToken(shareToken);
  }
}
