// apps/api/src/floorplan/symbol-catalog.controller.ts
import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("symbol-catalog")
export class SymbolCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getAll() {
    return this.prisma.symbolCatalogItem.findMany({ orderBy: { category: "asc" } });
  }
}
