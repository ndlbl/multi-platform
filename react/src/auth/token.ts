const KEY = 'auth-token';

const hasStorage = (): boolean => typeof localStorage !== 'undefined';

export function getToken(): string | null {
  return hasStorage() ? localStorage.getItem(KEY) : null;
}

export function setToken(token: string): void {
  if (hasStorage()) localStorage.setItem(KEY, token);
}

export function clearToken(): void {
  if (hasStorage()) localStorage.removeItem(KEY);
}
