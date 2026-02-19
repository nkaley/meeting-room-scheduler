/**
 * API client for backend. Use getApiUrl() for base URL (works in server and client).
 * For server: set BACKEND_URL. For client: set NEXT_PUBLIC_API_URL (or leave empty for same-origin).
 */

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

type RequestInitWithAuth = RequestInit & { token?: string | null };

async function request<T>(
  path: string,
  options: RequestInitWithAuth = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const { token, ...init } = options;
  const base = getApiUrl();
  const url = path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  let data: T | undefined;
  let error: string | undefined;
  const text = await res.text();
  if (text) {
    try {
      const json = JSON.parse(text);
      if (res.ok) data = json as T;
      else error = json?.error ?? text;
    } catch {
      if (!res.ok) error = text || res.statusText;
    }
  }
  if (!res.ok && !error) error = res.statusText;
  return { data, error, status: res.status };
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "GET", token }),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: "DELETE", token }),
};

export { getApiUrl };
