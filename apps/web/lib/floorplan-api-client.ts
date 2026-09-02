// apps/web/lib/floorplan-api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function uploadFloorPlan(projectId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/projects/${projectId}/floorplans`, { method: "POST", body: formData });
  return res.json();
}

export async function calibrateFloorPlan(
  floorPlanId: string,
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  realDistanceM: number
) {
  const res = await fetch(`${API_URL}/projects/_/floorplans/${floorPlanId}/calibrate`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pointA, pointB, realDistanceM }),
  });
  return res.json();
}

export async function createRoom(
  floorPlanId: string, name: string, roomType: string | undefined, points: { x: number; y: number }[]
) {
  const res = await fetch(`${API_URL}/projects/_/floorplans/${floorPlanId}/rooms`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, roomType, points }),
  });
  return res.json();
}

export async function fetchRoomsWithGeometry(floorPlanId: string) {
  const res = await fetch(`${API_URL}/projects/_/floorplans/${floorPlanId}/rooms`);
  return res.json();
}

export async function placeSymbolOnFloorPlan(
  roomId: string, catalogItemId: string, position: { x: number; y: number }
) {
  const res = await fetch(`${API_URL}/projects/_/floorplans/rooms/${roomId}/symbols`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catalogItemId, position }),
  });
  return res.json();
}

export async function fetchSymbolCatalog() {
  const res = await fetch(`${API_URL}/symbol-catalog`);
  return res.json();
}
