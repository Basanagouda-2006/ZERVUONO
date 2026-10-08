const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://zervono-api.onrender.com' : '');

export const API_BASE = rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
export const BASE_URL = `${API_BASE}/api/v1`;

export function getFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = API_BASE || 'https://zervono-api.onrender.com';
  return `${base}${cleanPath}`;
}

let authToken: string | null = null;
let currentOrgId: string | null = null;

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
  } catch {}
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(key);
    }
  } catch {}
  return null;
}

function setStorageItem(key: string, value: string | null) {
  if (value) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, value); } catch {}
    try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value); } catch {}
  } else {
    try { if (typeof localStorage !== 'undefined') localStorage.removeItem(key); } catch {}
    try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key); } catch {}
  }
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
  setStorageItem('zervuno_token', token);
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = getStorageItem('zervuno_token');
  }
  return authToken;
}

export function setCurrentOrgId(orgId: string | null) {
  currentOrgId = orgId;
  setStorageItem('zervuno_org_id', orgId);
}

export function getCurrentOrgId(): string | null {
  if (!currentOrgId) {
    currentOrgId = getStorageItem('zervuno_org_id');
  }
  return currentOrgId;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const orgId = getCurrentOrgId();

  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (orgId) {
    headers.set('X-Organization-Id', orgId);
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // for HttpOnly cookies
    });
  } catch (err: any) {
    // If it's a GET request and network dropped or server waking up, try once more after a brief delay
    if (isGet) {
      try {
        await new Promise(r => setTimeout(r, 800));
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      } catch (retryErr: any) {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const msg = isOffline
          ? 'You appear to be offline. Please check your internet connection.'
          : 'Unable to connect to server. Please check your network or try again in a moment.';
        throw new ApiError(msg, 0, { originalError: retryErr?.message || 'NetworkError' });
      }
    } else {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const msg = isOffline
        ? 'You appear to be offline. Please check your internet connection.'
        : 'Network request failed. Please check your connection or try again.';
      throw new ApiError(msg, 0, { originalError: err?.message || 'NetworkError' });
    }
  }

  // Read response text once to avoid "body stream already read" TypeError
  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    // If stream reading fails, keep rawText empty
  }

  let parsedData: any = null;
  if (rawText) {
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = rawText;
    }
  }

  if (!response.ok) {
    let errorDetail = `HTTP error ${response.status}`;
    if (parsedData && typeof parsedData === 'object') {
      errorDetail = parsedData.detail || parsedData.message || JSON.stringify(parsedData);
    } else if (typeof parsedData === 'string' && parsedData.trim()) {
      errorDetail = parsedData;
    }
    throw new ApiError(errorDetail, response.status, parsedData);
  }

  if (response.status === 204 || !rawText) {
    return {} as T;
  }

  return parsedData as T;
}
