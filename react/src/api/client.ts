import { getToken } from '../auth/token';

// Dev: empty  `/api/...` URLs go through the Vite proxy to localhost:3003.
// Prod: set VITE_API_URL for CORS requests
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };

  const res = await fetch(`${API_BASE}${url}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.error ?? `${res.status} ${res.statusText}`,
      body, // payload
    );
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
