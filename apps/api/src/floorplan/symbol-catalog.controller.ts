// apps/api/src/floorplan/symbol-catalog.controller.ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

// Globaler, organisationsübergreifender Katalog (kein Mandantenbezug) ->
// nur Authentifizierung erforderlich, keine ProjectAccessGuard.
@UseGuards(JwtAuthGuard)
@Controller("symbol-catalog")
export class SymbolCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getAll() {
    return this.prisma.symbolCatalogItem.findMany({ orderBy: { category: "asc" } });
  }
}
