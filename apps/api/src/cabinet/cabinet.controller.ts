// apps/api/src/cabinet/cabinet.controller.ts
import { Body, Controller, Post, Param } from "@nestjs/common";
import { CabinetService } from "./cabinet.service";

@Controller("cabinet/rows/:rowId/slots")
export class CabinetController {
  constructor(private readonly service: CabinetService) {}

  @Post()
  place(@Param("rowId") rowId: string, @Body() dto: { topologyNodeId: string; startTE: number }) {
    return this.service.placeComponent(rowId, dto.topologyNodeId, dto.startTE);
  }
}
