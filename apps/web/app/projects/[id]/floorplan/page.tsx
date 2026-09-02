// apps/web/app/projects/[id]/floorplan/page.tsx
"use client";

import { useState } from "react";
import FloorPlanEditor from "@/components/floorplan-editor/FloorPlanEditor";
import SymbolLibrary from "@/components/symbol-library/SymbolLibrary";
import { uploadFloorPlan } from "@/lib/floorplan-api-client";

export default function FloorPlanPage({ params }: { params: { id: string } }) {
  const [floorPlan, setFloorPlan] = useState<{ id: string; fileUrl: string; scalePxPerM: number } | null>(null);
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const created = await uploadFloorPlan(params.id, file);
    setFloorPlan(created);
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Grundriss- & Installations-Editor</h1>

      {!floorPlan ? (
        <label className="block border-2 border-dashed rounded p-8 text-center cursor-pointer text-slate-500">
          <input type="file" accept=".png,.jpg,.jpeg,.svg,.pdf" onChange={handleUpload} className="hidden" />
          Grundrissplan hochladen (PNG, JPG, SVG, PDF)
        </label>
      ) : (
        <div className="flex gap-6">
          <SymbolLibrary onSelect={setPendingSymbol} />
          <FloorPlanEditor
            floorPlanId={floorPlan.id}
            imageUrl={floorPlan.fileUrl}
            scalePxPerM={floorPlan.scalePxPerM}
          />
        </div>
      )}
    </div>
  );
}
