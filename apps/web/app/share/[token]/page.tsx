// apps/web/app/share/[token]/page.tsx
"use client";

import { use, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface SharedProject {
  id: string;
  name: string;
  address: string | null;
  topologyNodes: { id: string; label: string; nodeType: string }[];
}

/**
 * Öffentliche, unauthentifizierte Ansicht für den "Projekt teilen"-Link.
 * Bewusst nur lesend und ohne die vollen Editoren — ein Kunde soll den Stand
 * einsehen können, nicht ohne Account Änderungen vornehmen.
 */
export default function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [project, setProject] = useState<SharedProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/public/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Freigabe-Link ungültig oder abgelaufen.");
        return res.json();
      })
      .then(setProject)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) return <main className="p-8 text-red-600">{error}</main>;
  if (!project) return <main className="p-8 text-slate-500">Lädt…</main>;

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <p className="text-xs text-slate-400 mb-1">Öffentliche Freigabe — nur lesend</p>
      <h1 className="text-xl font-semibold mb-1">{project.name}</h1>
      {project.address && <p className="text-slate-500 mb-6">{project.address}</p>}

      <h2 className="font-medium mb-2">Stromkreise</h2>
      <ul className="divide-y">
        {project.topologyNodes.map((n) => (
          <li key={n.id} className="py-2 text-sm">
            <span className="text-slate-400 mr-2">{n.nodeType}</span>
            {n.label}
          </li>
        ))}
      </ul>
    </main>
  );
}
