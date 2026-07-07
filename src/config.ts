const rawBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const API_BASE = rawBase;

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers = { ...extra };
  if (API_BASE.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }
  return headers;
}
