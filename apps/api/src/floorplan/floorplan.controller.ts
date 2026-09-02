// apps/api/src/floorplan/floorplan.controller.ts
import {
  Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FloorPlanService } from "./floorplan.service";

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

@Controller("projects/:projectId/floorplans")
export class FloorPlanController {
  constructor(private readonly service: FloorPlanService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  upload(@Param("projectId") projectId: string, @UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFloorPlan(projectId, file);
  }

  @Post(":floorPlanId/calibrate")
  calibrate(@Param("floorPlanId") floorPlanId: string, @Body() dto: CalibrateDto) {
    return this.service.calibrateScale(floorPlanId, dto.pointA, dto.pointB, dto.realDistanceM);
  }

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

  @Post("rooms/:roomId/symbols")
  placeSymbol(@Param("roomId") roomId: string, @Body() dto: PlaceSymbolDto) {
    return this.service.placeSymbol(roomId, dto.catalogItemId, dto.position, dto.rotationDeg, dto.label);
  }
}
