/**
 * Lightweight API client utilities for the chess backend.
 * Uses fetch and normalizes error payloads from FastAPI.
 */

function normalizeBaseUrl(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function getApiBaseUrl() {
  // IMPORTANT: Configure a single API base URL via environment.
  //
  // Primary (preferred): REACT_APP_API_BASE
  //
  // Compatibility fallback (some deployments may still set this): REACT_APP_BACKEND_URL
  //
  // If neither is provided, we attempt a sensible preview/dev default:
  // - In browser/preview: same hostname as the frontend, port 3001
  // - Otherwise: http://localhost:3001
  const fromPrimaryEnv = process.env.REACT_APP_API_BASE;
  const fromCompatEnv = process.env.REACT_APP_BACKEND_URL;

  if (fromPrimaryEnv) return normalizeBaseUrl(fromPrimaryEnv);
  if (fromCompatEnv) return normalizeBaseUrl(fromCompatEnv);

  // window.location-based fallback for preview environments (frontend :3000 -> backend :3001).
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return normalizeBaseUrl(`${protocol}//${hostname}:3001`);
  }

  // Local dev fallback
  return 'http://localhost:3001';
}

// PUBLIC_INTERFACE
export async function apiRequest(path, { method = 'GET', query, body } = {}) {
  /** Perform an HTTP request to the backend API with error normalization. */
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}${path}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const headers = {
    Accept: 'application/json',
  };

  const init = {
    method,
    headers,
    credentials: 'omit',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url.toString(), init);
  } catch (e) {
    const err = new Error('Network error: unable to reach backend.');
    err.status = 0;
    throw err;
  }

  // 204/205 No Content (common for DELETE): return null to avoid parsing issues.
  // Some proxies may also use 205 Reset Content.
  if (res.status === 204 || res.status === 205) return null;

  let payload = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = await res.text();
    } catch {
      payload = null;
    }
  }

  // Treat empty body as "no content" for convenience across the app.
  if (payload === '') payload = null;

  if (!res.ok) {
    const message =
      payload && typeof payload === 'object' && payload.detail
        ? payload.detail
        : typeof payload === 'string' && payload
          ? payload
          : `Request failed with status ${res.status}.`;

    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}
