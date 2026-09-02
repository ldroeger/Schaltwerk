// apps/api/src/bom/bom.controller.ts
import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { BomService } from "./bom.service";

@Controller("projects/:projectId/bom")
export class BomController {
  constructor(private readonly service: BomService) {}

  @Get()
  getAggregated(@Param("projectId") projectId: string) {
    return this.service.aggregate(projectId);
  }

  @Get("export.csv")
  async exportCsv(@Param("projectId") projectId: string, @Res() res: Response) {
    const csv = await this.service.exportCsv(projectId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="stueckliste-${projectId}.csv"`);
    res.send(csv);
  }
}
