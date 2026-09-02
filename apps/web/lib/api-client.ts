// apps/web/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchTopology(projectId: string) {
  const res = await fetch(`${API_URL}/projects/${projectId}/topology`);
  return res.json();
}

export async function createTopologyNode(projectId: string, dto: { nodeType: string; parentId: string; label: string }) {
  const res = await fetch(`${API_URL}/projects/${projectId}/topology/nodes`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto),
  });
  return res.json();
}

export async function updateNodeParent(nodeId: string, newParentId: string) {
  const res = await fetch(`${API_URL}/projects/_/topology/nodes/${nodeId}/parent`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newParentId }),
  });
  return res.json();
}

export async function placeComponent(rowId: string, topologyNodeId: string, startTE: number) {
  const res = await fetch(`${API_URL}/cabinet/rows/${rowId}/slots`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topologyNodeId, startTE }),
  });
  return res.json();
}

export async function updateMeasurement(measurementId: string, dto: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/projects/_/test-reports/_/measurements/${measurementId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dto),
  });
  return res.json();
}
