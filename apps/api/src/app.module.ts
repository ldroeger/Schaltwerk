// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { TopologyController } from "./topology/topology.controller";
import { TopologyService } from "./topology/topology.service";
import { CabinetController } from "./cabinet/cabinet.controller";
import { CabinetService } from "./cabinet/cabinet.service";
import { BomController } from "./bom/bom.controller";
import { BomService } from "./bom/bom.service";
import { KnxController } from "./knx/knx.controller";
import { EtsExportService } from "./knx/ets-export.service";
import { TestReportController } from "./test-reports/test-report.controller";
import { TestReportService } from "./test-reports/test-report.service";
import { TestReportPdfService } from "./test-reports/test-report-pdf.service";

@Module({
  controllers: [
    TopologyController, CabinetController, BomController,
    KnxController, TestReportController,
  ],
  providers: [
    PrismaService, TopologyService, CabinetService, BomService,
    EtsExportService, TestReportService, TestReportPdfService,
  ],
})
export class AppModule {}
