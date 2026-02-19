const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";
const API_KEY = import.meta.env.VITE_API_KEY;

function createHeaders(headers?: HeadersInit): Headers {
  const resolved = new Headers(headers);
  if (!resolved.has("Content-Type")) {
    resolved.set("Content-Type", "application/json");
  }
  if (API_KEY && !resolved.has("Authorization")) {
    resolved.set("Authorization", `Bearer ${API_KEY}`);
  }
  return resolved;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: createHeaders(init.headers),
  });
}

export async function httpClient(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: createHeaders(options.headers),
  });
}
