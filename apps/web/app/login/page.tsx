// apps/web/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "LOGIN") {
        await login(email, password);
      } else {
        await register(email, password, name, organizationName);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message ?? "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">Schaltwerk</h1>
        <p className="text-sm text-slate-500 mb-6">
          {mode === "LOGIN" ? "Bei deiner Organisation anmelden" : "Neue Organisation registrieren"}
        </p>

        {mode === "REGISTER" && (
          <>
            <Field label="Name" value={name} onChange={setName} />
            <Field label="Organisation" value={organizationName} onChange={setOrganizationName} />
          </>
        )}
        <Field label="E-Mail" type="email" value={email} onChange={setEmail} />
        <Field label="Passwort" type="password" value={password} onChange={setPassword} />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 text-white rounded py-2 mt-2 disabled:opacity-50"
        >
          {loading ? "Bitte warten…" : mode === "LOGIN" ? "Anmelden" : "Registrieren"}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "LOGIN" ? "REGISTER" : "LOGIN")}
          className="w-full text-sm text-slate-500 mt-3"
        >
          {mode === "LOGIN" ? "Noch keine Organisation? Registrieren" : "Bereits registriert? Anmelden"}
        </button>
      </form>
    </main>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block mb-3 text-sm">
      {label}
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border rounded px-3 py-2"
      />
    </label>
  );
}
