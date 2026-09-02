// apps/web/app/projects/[id]/floorplan/page.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import SymbolLibrary from "@/components/symbol-library/SymbolLibrary";
import { uploadFloorPlan } from "@/lib/floorplan-api-client";

// react-konva/konva ziehen serverseitig das native "canvas"-Paket nach
// (konva/lib/index-node.js) und lassen den Next.js-Server-Build fehlschlagen.
// Der Canvas-Editor läuft ohnehin nur im Browser -> ssr: false erzwingen.
const FloorPlanEditor = dynamic(() => import("@/components/floorplan-editor/FloorPlanEditor"), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-500">Editor wird geladen…</p>,
});

// Next.js 15: `params` ist in Client Components weiterhin synchron nutzbar,
// aber der Seitentyp muss dem async PageProps-Vertrag entsprechen — daher
// hier über `use()` aus dem übergebenen Promise entpackt.
import { use } from "react";

export default function FloorPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const [floorPlan, setFloorPlan] = useState<{ id: string; fileUrl: string; scalePxPerM: number } | null>(null);
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const created = await uploadFloorPlan(projectId, file);
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
            selectedSymbolId={pendingSymbol}
            onSymbolPlaced={() => setPendingSymbol(null)}
          />
        </div>
      )}
    </div>
  );
}
