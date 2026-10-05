const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://zervono-api.onrender.com' : '');

const API_BASE = rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
const BASE_URL = `${API_BASE}/api/v1`;

let authToken: string | null = null;
let currentOrgId: string | null = null;

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
  if (token) {
    sessionStorage.setItem('zervuno_token', token);
  } else {
    sessionStorage.removeItem('zervuno_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = sessionStorage.getItem('zervuno_token');
  }
  return authToken;
}

export function setCurrentOrgId(orgId: string | null) {
  currentOrgId = orgId;
  if (orgId) {
    sessionStorage.setItem('zervuno_org_id', orgId);
  } else {
    sessionStorage.removeItem('zervuno_org_id');
  }
}

export function getCurrentOrgId(): string | null {
  if (!currentOrgId) {
    currentOrgId = sessionStorage.getItem('zervuno_org_id');
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

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for HttpOnly cookies
  });

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
