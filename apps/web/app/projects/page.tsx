// apps/web/app/projects/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-client";

interface Project {
  id: string;
  name: string;
  address: string | null;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");

  async function refresh() {
    const res = await authFetch("/projects");
    setProjects(await res.json());
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await authFetch("/projects", { method: "POST", body: JSON.stringify({ name }) });
    setName("");
    refresh();
  }

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Projekte</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Neues Projekt (z.B. Musterstraße 12)"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Anlegen</button>
      </form>

      <ul className="divide-y">
        {projects.map((p) => (
          <li key={p.id} className="py-3">
            <Link href={`/projects/${p.id}/floorplan`} className="font-medium hover:underline">
              {p.name}
            </Link>
            {p.address && <span className="text-sm text-slate-500 ml-2">{p.address}</span>}
          </li>
        ))}
        {projects.length === 0 && <p className="text-sm text-slate-500 py-4">Noch keine Projekte angelegt.</p>}
      </ul>
    </main>
  );
}
