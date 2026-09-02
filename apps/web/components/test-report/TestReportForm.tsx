// apps/web/components/test-report/TestReportForm.tsx
"use client";

import { useState } from "react";
import { updateMeasurement } from "@/lib/api-client";

interface MeasurementDto {
  id: string;
  topologyNode: { label: string; nodeType: string; ratedCurrentA: number | null };
  isolationResistanceMOhm: number | null;
  loopImpedanceOhm: number | null;
  rcdTripCurrentMa: number | null;
  rcdTripTimeMs: number | null;
  continuityOk: boolean | null;
  polarityOk: boolean | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function TestReportForm({
  projectId,
  reportId,
  measurements,
}: {
  projectId: string;
  reportId: string;
  measurements: MeasurementDto[];
}) {
  const [rows, setRows] = useState(measurements);
  const [warnings, setWarnings] = useState<Record<string, string[]>>({});

  async function handleChange(id: string, field: string, value: string | boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleBlurSave(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const { warnings: newWarnings } = await updateMeasurement(id, {
      isolationResistanceMOhm: row.isolationResistanceMOhm,
      loopImpedanceOhm: row.loopImpedanceOhm,
      rcdTripCurrentMa: row.rcdTripCurrentMa,
      rcdTripTimeMs: row.rcdTripTimeMs,
      continuityOk: row.continuityOk,
      polarityOk: row.polarityOk,
    });
    setWarnings((prev) => ({ ...prev, [id]: newWarnings }));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-slate-50 text-left">
            <th className="p-2">Stromkreis / Bauteil</th>
            <th className="p-2">Riso (MΩ)</th>
            <th className="p-2">Zsch (Ω)</th>
            <th className="p-2">IΔ (mA)</th>
            <th className="p-2">Auslösezeit (ms)</th>
            <th className="p-2">Durchgang</th>
            <th className="p-2">Polarität</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b align-top">
              <td className="p-2 font-medium">
                {row.topologyNode.label}
                {warnings[row.id]?.length > 0 && (
                  <div className="mt-1 text-xs text-amber-600">
                    {warnings[row.id].map((w, i) => (
                      <div key={i}>⚠ {w}</div>
                    ))}
                  </div>
                )}
              </td>
              <NumberCell
                value={row.isolationResistanceMOhm}
                onChange={(v) => handleChange(row.id, "isolationResistanceMOhm", v)}
                onBlur={() => handleBlurSave(row.id)}
              />
              <NumberCell
                value={row.loopImpedanceOhm}
                onChange={(v) => handleChange(row.id, "loopImpedanceOhm", v)}
                onBlur={() => handleBlurSave(row.id)}
              />
              <NumberCell
                value={row.rcdTripCurrentMa}
                onChange={(v) => handleChange(row.id, "rcdTripCurrentMa", v)}
                onBlur={() => handleBlurSave(row.id)}
              />
              <NumberCell
                value={row.rcdTripTimeMs}
                onChange={(v) => handleChange(row.id, "rcdTripTimeMs", v)}
                onBlur={() => handleBlurSave(row.id)}
              />
              <BoolCell
                value={row.continuityOk}
                onChange={(v) => {
                  handleChange(row.id, "continuityOk", v);
                  handleBlurSave(row.id);
                }}
              />
              <BoolCell
                value={row.polarityOk}
                onChange={(v) => {
                  handleChange(row.id, "polarityOk", v);
                  handleBlurSave(row.id);
                }}
              />
            </tr>
          ))}
        </tbody>
      </table>

      <a
        href={`${API_URL}/projects/${projectId}/test-reports/${reportId}/export.pdf`}
        className="mt-4 inline-block px-4 py-2 bg-slate-800 text-white rounded"
      >
        Prüfbericht als PDF exportieren
      </a>
    </div>
  );
}

function NumberCell({
  value, onChange, onBlur,
}: { value: number | null; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <td className="p-2">
      <input
        type="number"
        step="0.01"
        className="w-24 border rounded px-2 py-1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </td>
  );
}

function BoolCell({
  value, onChange,
}: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <td className="p-2">
      <select
        className="border rounded px-2 py-1"
        value={value === null ? "" : value ? "ok" : "nok"}
        onChange={(e) => onChange(e.target.value === "ok")}
      >
        <option value="">–</option>
        <option value="ok">OK</option>
        <option value="nok">Fehler</option>
      </select>
    </td>
  );
}
