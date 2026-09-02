// apps/api/src/projects/projects.controller.ts
import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { JwtAuthGuard, AuthenticatedUser } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

interface CreateProjectDto {
  name: string;
  address?: string;
}

@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listForOrganization(user.organizationId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.service.create(user.organizationId, dto.name, dto.address);
  }
}
