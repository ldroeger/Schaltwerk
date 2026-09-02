// apps/api/src/knx/knx.controller.ts
import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { EtsExportService } from "./ets-export.service";

@Controller("projects/:projectId/knx")
export class KnxController {
  constructor(private readonly etsExport: EtsExportService) {}

  @Get("export/csv")
  async exportCsv(@Param("projectId") projectId: string, @Res() res: Response) {
    const csv = await this.etsExport.exportCsv(projectId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="knx-gruppenadressen-${projectId}.csv"`);
    res.send(csv);
  }

  @Get("export/xml")
  async exportXml(@Param("projectId") projectId: string, @Res() res: Response) {
    const xml = await this.etsExport.exportXml(projectId);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="knx-export-${projectId}.xml"`);
    res.send(xml);
  }
}
