// apps/web/components/floorplan-editor/FloorPlanEditor.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle, Group, Text } from "react-konva";
import useImage from "use-image";
import {
  calibrateFloorPlan, createRoom, placeSymbolOnFloorPlan, fetchRoomsWithGeometry,
} from "@/lib/floorplan-api-client";

type EditorMode = "VIEW" | "CALIBRATE" | "DRAW_ROOM" | "PLACE_SYMBOL";

interface RoomGeoJson {
  id: string;
  name: string;
  boundary_geojson: { type: "Polygon"; coordinates: number[][][] };
  symbols: { id: string; position: { coordinates: [number, number] }; label: string | null }[];
}

export default function FloorPlanEditor({
  floorPlanId, imageUrl, scalePxPerM: initialScale,
}: { floorPlanId: string; imageUrl: string; scalePxPerM: number }) {
  const [image] = useImage(imageUrl);
  const [mode, setMode] = useState<EditorMode>("VIEW");
  const [scalePxPerM, setScalePxPerM] = useState(initialScale);
  const [calibPoints, setCalibPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentRoomPoints, setCurrentRoomPoints] = useState<{ x: number; y: number }[]>([]);
  const [rooms, setRooms] = useState<RoomGeoJson[]>([]);
  const [pendingSymbolCatalogId, setPendingSymbolCatalogId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoomsWithGeometry(floorPlanId).then(setRooms);
  }, [floorPlanId]);

  // Konvertiert Bildschirm-Pixel in Weltkoordinaten (Meter) anhand der Kalibrierung
  function toWorld(px: number, py: number) {
    return { x: px / scalePxPerM, y: py / scalePxPerM };
  }

  async function handleStageClick(e: any) {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    if (mode === "CALIBRATE") {
      const next = [...calibPoints, pos];
      setCalibPoints(next);
      if (next.length === 2) {
        const realDistanceM = Number(prompt("Bekannter Realabstand in Metern (z.B. Türbreite 0.885):"));
        if (realDistanceM > 0) {
          const updated = await calibrateFloorPlan(floorPlanId, next[0], next[1], realDistanceM);
          setScalePxPerM(updated.scalePxPerM);
        }
        setCalibPoints([]);
        setMode("VIEW");
      }
      return;
    }

    if (mode === "DRAW_ROOM") {
      setCurrentRoomPoints((prev) => [...prev, toWorld(pos.x, pos.y)]);
      return;
    }

    if (mode === "PLACE_SYMBOL" && pendingSymbolCatalogId) {
      // Vereinfachung: Symbol wird dem ersten Raum zugeordnet, der den Klickpunkt enthält.
      // Produktiv: ST_Contains-Abfrage serverseitig oder Point-in-Polygon clientseitig.
      const targetRoom = rooms[0];
      if (!targetRoom) {
        alert("Bitte zuerst einen Raum zeichnen.");
        return;
      }
      await placeSymbolOnFloorPlan(targetRoom.id, pendingSymbolCatalogId, toWorld(pos.x, pos.y));
      const refreshed = await fetchRoomsWithGeometry(floorPlanId);
      setRooms(refreshed);
      setMode("VIEW");
      setPendingSymbolCatalogId(null);
    }
  }

  async function finishRoomDrawing() {
    if (currentRoomPoints.length < 3) {
      alert("Mindestens 3 Punkte für einen Raum nötig.");
      return;
    }
    const name = prompt("Raumname:") ?? "Neuer Raum";
    await createRoom(floorPlanId, name, undefined, currentRoomPoints);
    const refreshed = await fetchRoomsWithGeometry(floorPlanId);
    setRooms(refreshed);
    setCurrentRoomPoints([]);
    setMode("VIEW");
  }

  return (
    <div>
      <Toolbar
        mode={mode}
        setMode={setMode}
        onFinishRoom={finishRoomDrawing}
        scalePxPerM={scalePxPerM}
      />

      <Stage width={1000} height={700} onClick={handleStageClick} className="border rounded bg-slate-50">
        <Layer>
          {image && <KonvaImage image={image} />}

          {/* Bereits gespeicherte Räume */}
          {rooms.map((room) => (
            <Group key={room.id}>
              <Line
                points={room.boundary_geojson.coordinates[0].flatMap(([x, y]) => [x * scalePxPerM, y * scalePxPerM])}
                closed
                stroke="#0891b2"
                strokeWidth={2}
                fill="rgba(8,145,178,0.08)"
              />
              {room.symbols.map((s) => (
                <Circle
                  key={s.id}
                  x={s.position.coordinates[0] * scalePxPerM}
                  y={s.position.coordinates[1] * scalePxPerM}
                  radius={6}
                  fill="#b45309"
                />
              ))}
              <Text
                x={room.boundary_geojson.coordinates[0][0][0] * scalePxPerM}
                y={room.boundary_geojson.coordinates[0][0][1] * scalePxPerM - 14}
                text={room.name}
                fontSize={12}
                fill="#0f172a"
              />
            </Group>
          ))}

          {/* Aktuell gezeichneter Raum (noch nicht gespeichert) */}
          {currentRoomPoints.length > 0 && (
            <Line
              points={currentRoomPoints.flatMap((p) => [p.x * scalePxPerM, p.y * scalePxPerM])}
              stroke="#15803d"
              strokeWidth={2}
              dash={[6, 4]}
            />
          )}

          {/* Kalibrierungspunkte */}
          {calibPoints.map((p, i) => (
            <Circle key={i} x={p.x} y={p.y} radius={5} fill="#dc2626" />
          ))}
        </Layer>
      </Stage>

      <p className="text-xs text-slate-500 mt-2">
        Maßstab: {scalePxPerM.toFixed(1)} px/m
      </p>
    </div>
  );
}

function Toolbar({
  mode, setMode, onFinishRoom, scalePxPerM,
}: { mode: EditorMode; setMode: (m: EditorMode) => void; onFinishRoom: () => void; scalePxPerM: number }) {
  return (
    <div className="flex gap-2 mb-3">
      <button onClick={() => setMode("CALIBRATE")} className={btnClass(mode === "CALIBRATE")}>
        📏 Kalibrieren
      </button>
      <button onClick={() => setMode("DRAW_ROOM")} className={btnClass(mode === "DRAW_ROOM")}>
        ✏️ Raum zeichnen
      </button>
      {mode === "DRAW_ROOM" && (
        <button onClick={onFinishRoom} className="px-3 py-1.5 rounded bg-green-600 text-white text-sm">
          Raum abschließen
        </button>
      )}
      <button onClick={() => setMode("VIEW")} className={btnClass(mode === "VIEW")}>
        👁 Ansicht
      </button>
    </div>
  );
}

function btnClass(active: boolean) {
  return `px-3 py-1.5 rounded text-sm ${active ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`;
}
