// apps/api/src/topology/topology.controller.ts
import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { TopologyService } from "./topology.service";

interface CreateTopologyNodeDto {
  nodeType: string; parentId?: string; label: string; catalogItemId?: string;
}
interface UpdateParentDto { newParentId: string; }

@Controller("projects/:projectId/topology")
export class TopologyController {
  constructor(private readonly service: TopologyService) {}

  @Get()
  getTree(@Param("projectId") projectId: string) {
    return this.service.getFlatTree(projectId);
  }

  @Post("nodes")
  createNode(@Param("projectId") projectId: string, @Body() dto: CreateTopologyNodeDto) {
    return this.service.createNode(projectId, dto);
  }

  @Patch("nodes/:nodeId/parent")
  updateParent(@Param("nodeId") nodeId: string, @Body() dto: UpdateParentDto) {
    return this.service.reparent(nodeId, dto.newParentId);
  }

  @Get("unplaced")
  getUnplaced(@Param("projectId") projectId: string) {
    return this.service.getUnplacedComponents(projectId);
  }
}
