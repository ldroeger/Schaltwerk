// apps/web/components/cabinet-grid/CabinetGrid.tsx
"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { placeComponent } from "@/lib/api-client";

const TE_WIDTH_PX = 18;

interface SlotItem { id: string; label: string; widthTE: number; startTE: number; }
interface UnplacedItem { id: string; label: string; widthTE: number; }

export default function CabinetGrid({
  rowId, totalTE, placedSlots, unplaced,
}: { rowId: string; totalTE: number; placedSlots: SlotItem[]; unplaced: UnplacedItem[] }) {
  const [slots, setSlots] = useState(placedSlots);
  const [pool, setPool] = useState(unplaced);

  function findFreeStart(widthTE: number): number | null {
    const occupied = new Array(totalTE).fill(false);
    slots.forEach((s) => { for (let i = 0; i < s.widthTE; i++) occupied[s.startTE + i] = true; });
    for (let start = 0; start <= totalTE - widthTE; start++) {
      if (Array.from({ length: widthTE }, (_, i) => occupied[start + i]).every((v) => !v)) return start;
    }
    return null;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || over.id !== "cabinet-row") return;
    const item = pool.find((p) => p.id === active.id);
    if (!item) return;

    const startTE = findFreeStart(item.widthTE);
    if (startTE === null) { alert("Kein freier Platz in dieser Reihe verfügbar."); return; }
    await placeComponent(rowId, item.id, startTE);
    setSlots((s) => [...s, { ...item, startTE }]);
    setPool((p) => p.filter((x) => x.id !== item.id));
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
        <CabinetRowDropZone totalTE={totalTE} slots={slots} />
        <UnplacedSidebar items={pool} />
      </div>
    </DndContext>
  );
}

function CabinetRowDropZone({ totalTE, slots }: { totalTE: number; slots: SlotItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "cabinet-row" });
  return (
    <div ref={setNodeRef} className={`relative h-16 border-2 rounded ${isOver ? "border-blue-500" : "border-gray-300"}`} style={{ width: totalTE * TE_WIDTH_PX }}>
      {slots.map((s) => (
        <div key={s.id} className="absolute top-0 h-full bg-slate-700 text-white text-xs flex items-center justify-center rounded" style={{ left: s.startTE * TE_WIDTH_PX, width: s.widthTE * TE_WIDTH_PX }}>
          {s.label}
        </div>
      ))}
    </div>
  );
}

function UnplacedSidebar({ items }: { items: UnplacedItem[] }) {
  return (
    <div className="w-56 border-l pl-4">
      <h3 className="font-semibold mb-2">Unplatziert</h3>
      {items.map((item) => <DraggableChip key={item.id} item={item} />)}
    </div>
  );
}

function DraggableChip({ item }: { item: UnplacedItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style} className="mb-2 p-2 bg-slate-100 rounded cursor-grab text-sm">
      {item.label} ({item.widthTE} TE)
    </div>
  );
}
