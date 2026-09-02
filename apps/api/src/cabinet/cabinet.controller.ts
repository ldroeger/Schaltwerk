// apps/api/src/cabinet/cabinet.controller.ts
import { Body, Controller, Post, Param, UseGuards } from "@nestjs/common";
import { CabinetService } from "./cabinet.service";
import { JwtAuthGuard, AuthenticatedUser } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

// Kein :projectId im Pfad -> ProjectAccessGuard greift hier nicht;
// die Mandantengrenze wird stattdessen im Service anhand der
// Cabinet -> Project -> organizationId-Kette geprüft (s. cabinet.service.ts).
@UseGuards(JwtAuthGuard)
@Controller("cabinet/rows/:rowId/slots")
export class CabinetController {
  constructor(private readonly service: CabinetService) {}

  @Post()
  place(
    @Param("rowId") rowId: string,
    @Body() dto: { topologyNodeId: string; startTE: number },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.placeComponent(rowId, dto.topologyNodeId, dto.startTE, user.organizationId);
  }
}
