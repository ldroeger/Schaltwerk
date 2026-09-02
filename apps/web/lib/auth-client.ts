// apps/web/lib/auth-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_STORAGE_KEY = "schaltwerk_access_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Anmeldung fehlgeschlagen — E-Mail oder Passwort prüfen.");
  const data = await res.json();
  storeToken(data.accessToken);
  return data;
}

export async function register(email: string, password: string, name: string, organizationName: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, organizationName }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Registrierung fehlgeschlagen.");
  }
  const data = await res.json();
  storeToken(data.accessToken);
  return data;
}

/**
 * Zentraler fetch-Wrapper, der den gespeicherten JWT automatisch als
 * Authorization-Header mitschickt. Alle API-Clients (topology, floorplan,
 * cabinet, ...) sollten hierüber laufen statt über nacktes fetch().
 */
export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  return res;
}
