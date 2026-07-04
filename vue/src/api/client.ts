const API_BASE = import.meta.env.VITE_API_URL ?? "";

// The client attaches the user token to api based requests, passing the JWT as an auth header.

export class ApiError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function getToken(): string | null {
  return typeof localStorage !== "undefined" ? localStorage.getItem("auth-token") : null;
}

const REQUEST_TIMEOUT_MS = 10_000;

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  // AbortController (not AbortSignal.timeout, which is Safari 16+ only) so a hung
  // request surfaces as a retryable error instead of spinning forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${url}`, { ...init, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `${res.status} ${res.statusText}`, body);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
