// apps/api/src/cabinet/cabinet.controller.ts
import { Body, Controller, Post, Param, UseGuards } from "@nestjs/common";
import { CabinetService } from "./cabinet.service";
import { JwtAuthGuard, AuthenticatedUser } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";

// Kein :projectId im Pfad -> ProjectAccessGuard greift hier nicht;
// die Mandantengrenze wird stattdessen im Service anhand der
// Cabinet -> Project -> organizationId-Kette geprüft (s. cabinet.service.ts).
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("cabinet/rows/:rowId/slots")
export class CabinetController {
  constructor(private readonly service: CabinetService) {}

  @Roles("OWNER", "PLANNER")
  @Post()
  place(
    @Param("rowId") rowId: string,
    @Body() dto: { topologyNodeId: string; startTE: number },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.placeComponent(rowId, dto.topologyNodeId, dto.startTE, user.organizationId);
  }
}
