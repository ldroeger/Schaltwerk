// apps/api/src/floorplan/floorplan.controller.ts
import {
  Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors, UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FloorPlanService } from "./floorplan.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProjectAccessGuard } from "../auth/project-access.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

interface CalibrateDto {
  pointA: { x: number; y: number };
  pointB: { x: number; y: number };
  realDistanceM: number;
}

interface CreateRoomDto {
  name: string;
  roomType?: string;
  points: { x: number; y: number }[];
}

interface PlaceSymbolDto {
  catalogItemId: string;
  position: { x: number; y: number };
  rotationDeg?: number;
  label?: string;
}

@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
@Controller("projects/:projectId/floorplans")
export class FloorPlanController {
  constructor(private readonly service: FloorPlanService) {}

  @Roles("OWNER", "PLANNER")
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  upload(@Param("projectId") projectId: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFloorPlan(projectId, file);
  }

  @Roles("OWNER", "PLANNER")
  @Post(":floorPlanId/calibrate")
  calibrate(@Param("floorPlanId") floorPlanId: string, @Body() dto: CalibrateDto) {
    return this.service.calibrateScale(floorPlanId, dto.pointA, dto.pointB, dto.realDistanceM);
  }

  @Roles("OWNER", "PLANNER")
  @Post(":floorPlanId/rooms")
  createRoom(
    @Param("projectId") projectId: string,
    @Param("floorPlanId") floorPlanId: string,
    @Body() dto: CreateRoomDto
  ) {
    return this.service.createRoom(projectId, floorPlanId, dto.name, dto.roomType, dto.points);
  }

  @Get(":floorPlanId/rooms")
  getRooms(@Param("floorPlanId") floorPlanId: string) {
    return this.service.getRoomsWithGeometry(floorPlanId);
  }

  @Roles("OWNER", "PLANNER")
  @Post("rooms/:roomId/symbols")
  placeSymbol(@Param("roomId") roomId: string, @Body() dto: PlaceSymbolDto) {
    return this.service.placeSymbol(roomId, dto.catalogItemId, dto.position, dto.rotationDeg, dto.label);
  }
}
