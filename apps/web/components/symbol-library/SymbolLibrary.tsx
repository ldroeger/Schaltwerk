// apps/web/components/symbol-library/SymbolLibrary.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchSymbolCatalog } from "@/lib/floorplan-api-client";

interface CatalogItem {
  id: string;
  code: string;
  category: string;
  label: string;
  svgIconUrl: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  STECKDOSE: "Steckdosen",
  SCHALTER: "Schalter",
  LEUCHTE: "Leuchten",
  KNX_SENSOR: "KNX-Sensoren",
  KNX_AKTOR: "KNX-Aktoren",
};

/**
 * Zeigt die DIN-18015-Symbolbibliothek gruppiert nach Kategorie.
 * `onSelect` wird aufgerufen, wenn der Nutzer ein Symbol zum Platzieren
 * auswählt — der Editor wechselt dann in den PLACE_SYMBOL-Modus.
 */
export default function SymbolLibrary({ onSelect }: { onSelect: (catalogItemId: string) => void }) {
  const [items, setItems] = useState<CatalogItem[]>([]);

  useEffect(() => {
    fetchSymbolCatalog().then(setItems);
  }, []);

  const grouped = items.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    // Nur Grundriss-relevante Kategorien anzeigen (keine Schaltschrank-Geräte)
    if (!(item.category in CATEGORY_LABELS)) return acc;
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="w-64 border-r pr-4">
      <h3 className="font-semibold mb-3">Symbolbibliothek (DIN 18015)</h3>
      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} className="mb-4">
          <h4 className="text-xs uppercase text-slate-500 mb-2">{CATEGORY_LABELS[category]}</h4>
          <div className="grid grid-cols-2 gap-2">
            {catItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className="flex flex-col items-center p-2 border rounded hover:border-slate-800 hover:bg-slate-50 text-center"
                title={item.label}
              >
                <img src={`/${item.svgIconUrl}`} alt={item.label} className="w-6 h-6 mb-1" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
