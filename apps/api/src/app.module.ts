// apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "./prisma/prisma.service";

import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { ProjectAccessGuard } from "./auth/project-access.guard";

import { ProjectsController } from "./projects/projects.controller";
import { ProjectsService } from "./projects/projects.service";

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
import { FloorPlanController } from "./floorplan/floorplan.controller";
import { FloorPlanService } from "./floorplan/floorplan.service";
import { SymbolCatalogController } from "./floorplan/symbol-catalog.controller";

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
      signOptions: { expiresIn: "12h" },
    }),
  ],
  controllers: [
    AuthController,
    ProjectsController,
    TopologyController, CabinetController, BomController,
    KnxController, TestReportController,
    FloorPlanController, SymbolCatalogController,
  ],
  providers: [
    PrismaService,
    AuthService,
    ProjectsService,
    JwtAuthGuard, ProjectAccessGuard,
    TopologyService, CabinetService, BomService,
    EtsExportService, TestReportService, TestReportPdfService,
    FloorPlanService,
  ],
})
export class AppModule {}
