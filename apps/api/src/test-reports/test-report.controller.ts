// apps/api/src/test-reports/test-report.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { TestReportService } from "./test-report.service";
import { TestReportPdfService } from "./test-report-pdf.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProjectAccessGuard } from "../auth/project-access.guard";

@UseGuards(JwtAuthGuard, ProjectAccessGuard)
@Controller("projects/:projectId/test-reports")
export class TestReportController {
  constructor(
    private readonly service: TestReportService,
    private readonly pdfService: TestReportPdfService
  ) {}

  @Post()
  create(@Param("projectId") projectId: string, @Body() dto: { inspector: string }) {
    return this.service.createWithPrefill(projectId, dto.inspector);
  }

  @Get(":reportId")
  get(@Param("reportId") reportId: string) {
    return this.service.getReport(reportId);
  }

  @Patch(":reportId/measurements/:measurementId")
  updateMeasurement(
    @Param("measurementId") measurementId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.service.updateMeasurement(measurementId, dto as any);
  }

  @Get(":reportId/export.pdf")
  async exportPdf(@Param("reportId") reportId: string, @Res() res: Response) {
    const report = await this.service.getReport(reportId);
    const pdfBuffer = await this.pdfService.render(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="pruefprotokoll-${reportId}.pdf"`);
    res.send(pdfBuffer);
  }
}
