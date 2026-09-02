// apps/web/components/share/ShareProjectButton.tsx
"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { authFetch } from "@/lib/auth-client";

/**
 * Entspricht "Projekt teilen / QR Code" bei stromlaufplan.de: erzeugt einen
 * öffentlichen, unauthentifizierten Lese-Link für dieses eine Projekt und
 * stellt ihn als QR-Code dar (z.B. zum Scannen auf der Baustelle durch den
 * Kunden oder einen anderen Gewerken-Partner ohne eigenen Account).
 */
export default function ShareProjectButton({ projectId }: { projectId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    setLoading(true);
    try {
      const res = await authFetch(`/projects/${projectId}/share`, { method: "POST" });
      const { shareToken } = await res.json();
      const publicOrigin = window.location.origin;
      setShareUrl(`${publicOrigin}/share/${shareToken}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    await authFetch(`/projects/${projectId}/share`, { method: "DELETE" });
    setShareUrl(null);
  }

  if (!shareUrl) {
    return (
      <button onClick={handleShare} disabled={loading} className="text-sm px-3 py-1.5 rounded border">
        {loading ? "Erzeuge Link…" : "Projekt teilen"}
      </button>
    );
  }

  return (
    <div className="border rounded p-4 inline-block">
      <QRCodeSVG value={shareUrl} size={140} />
      <p className="text-xs text-slate-500 mt-2 max-w-[140px] break-all">{shareUrl}</p>
      <button onClick={handleRevoke} className="text-xs text-red-600 mt-2">
        Freigabe widerrufen
      </button>
    </div>
  );
}
