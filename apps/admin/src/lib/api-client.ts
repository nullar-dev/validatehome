const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * CreatesHeaders with default Content-Type and Authorization headers.
 * @param headers - Optional initial headers to merge
 * @returns Configured Headers object
 */
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

/**
 * Builds the full API URL from a path.
 * @param path - The API path (with or without leading slash)
 * @returns Full URL string
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

/**
 * Fetches from the API with automatic path resolution and default headers.
 * @param path - API endpoint path
 * @param init - Fetch init options
 * @returns Fetch Response
 */
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
