// apps/web/lib/api-client.ts
import { authFetch } from "./auth-client";

export async function fetchTopology(projectId: string) {
  const res = await authFetch(`/projects/${projectId}/topology`);
  return res.json();
}

export async function createTopologyNode(projectId: string, dto: { nodeType: string; parentId: string; label: string }) {
  const res = await authFetch(`/projects/${projectId}/topology/nodes`, {
    method: "POST", body: JSON.stringify(dto),
  });
  return res.json();
}

export async function updateNodeParent(projectId: string, nodeId: string, newParentId: string) {
  const res = await authFetch(`/projects/${projectId}/topology/nodes/${nodeId}/parent`, {
    method: "PATCH", body: JSON.stringify({ newParentId }),
  });
  return res.json();
}

export async function placeComponent(rowId: string, topologyNodeId: string, startTE: number) {
  const res = await authFetch(`/cabinet/rows/${rowId}/slots`, {
    method: "POST", body: JSON.stringify({ topologyNodeId, startTE }),
  });
  return res.json();
}

export async function updateMeasurement(projectId: string, reportId: string, measurementId: string, dto: Record<string, unknown>) {
  const res = await authFetch(`/projects/${projectId}/test-reports/${reportId}/measurements/${measurementId}`, {
    method: "PATCH", body: JSON.stringify(dto),
  });
  return res.json();
}
