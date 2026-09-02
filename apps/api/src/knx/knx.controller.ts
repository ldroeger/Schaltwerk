// apps/api/src/knx/knx.controller.ts
import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { EtsExportService } from "./ets-export.service";
import { KnxAddressService } from "./knx-address.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProjectAccessGuard } from "../auth/project-access.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
@Controller("projects/:projectId/knx")
export class KnxController {
  constructor(
    private readonly etsExport: EtsExportService,
    private readonly addressService: KnxAddressService
  ) {}

  @Get("devices")
  listDevices(@Param("projectId") projectId: string) {
    return this.addressService.listDevices(projectId);
  }

  @Roles("OWNER", "PLANNER")
  @Post("scheme")
  configureScheme(
    @Param("projectId") projectId: string,
    @Body() dto: { addressLevels: 2 | 3; groupSortBy: "FUNCTION" | "ROOM" }
  ) {
    return this.addressService.configureScheme(projectId, dto.addressLevels, dto.groupSortBy);
  }

  @Roles("OWNER", "PLANNER")
  @Post("devices")
  registerDevice(
    @Param("projectId") projectId: string,
    @Body() dto: { topologyNodeId: string; physicalAddress: string }
  ) {
    return this.addressService.registerDevice(projectId, dto.topologyNodeId, dto.physicalAddress);
  }

  // Automatischer Adressvorschlag nach Funktion+Raum, inkl. Konfliktprüfung
  // gegen bereits vergebene Adressen (siehe KnxAddressService).
  @Get("group-addresses/suggest")
  async suggestAddress(
    @Param("projectId") projectId: string,
    @Query("function") functionName: string,
    @Query("room") roomName: string
  ) {
    const address = await this.addressService.suggestNextAddress(projectId, functionName, roomName);
    return { address };
  }

  @Roles("OWNER", "PLANNER")
  @Post("devices/:deviceId/group-addresses")
  assignGroupAddress(
    @Param("deviceId") deviceId: string,
    @Body() dto: { address: string; function: string; dpt: string }
  ) {
    return this.addressService.assignGroupAddress(deviceId, dto.address, dto.function, dto.dpt);
  }

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
