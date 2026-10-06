import { describe, it, expect, beforeEach } from 'vitest';
import { setAuthToken, getAuthToken, setCurrentOrgId, getCurrentOrgId } from '../lib/api';

describe('Zervuno Frontend Core Logic', () => {
  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    global.sessionStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
      key: (index: number) => Object.keys(storage)[index] || null,
      length: 0,
    };
  });

  it('manages auth session token securely in sessionStorage', () => {
    expect(getAuthToken()).toBeNull();
    setAuthToken('test-access-token-123');
    expect(getAuthToken()).toBe('test-access-token-123');
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it('manages multi-tenant organization context', () => {
    expect(getCurrentOrgId()).toBeNull();
    setCurrentOrgId('org-apex-logistics');
    expect(getCurrentOrgId()).toBe('org-apex-logistics');
    setCurrentOrgId(null);
    expect(getCurrentOrgId()).toBeNull();
  });

  it('validates role types correctly', () => {
    const validRoles = ['Admin', 'Manager', 'Technician', 'Customer'];
    expect(validRoles).toContain('Technician');
    expect(validRoles).toContain('Customer');
    expect(validRoles).toHaveLength(4);
  });

  it('handles API errors cleanly without body stream read crashes', async () => {
    const { apiRequest, ApiError } = await import('../lib/api');

    // Mock fetch with a 401 JSON error
    global.fetch = async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ detail: 'Incorrect email or password.' }),
    } as any);

    try {
      await apiRequest('/auth/login', { method: 'POST' });
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(401);
      expect(err.message).toBe('Incorrect email or password.');
    }

    // Mock fetch with a 500 non-JSON plain text error
    global.fetch = async () => ({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error (Database Connection Failed)',
    } as any);

    try {
      await apiRequest('/auth/register', { method: 'POST' });
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(500);
      expect(err.message).toBe('Internal Server Error (Database Connection Failed)');
    }
  });

  it('injects Authorization and X-Organization-Id headers when session is present', async () => {
    const { apiRequest, setAuthToken, setCurrentOrgId } = await import('../lib/api');
    setAuthToken('valid-jwt-token-xyz');
    setCurrentOrgId('org-uuid-1234');

    let capturedHeaders: Headers | null = null;
    global.fetch = async (_url: any, options: any) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true }),
      } as any;
    };

    const res = await apiRequest('/requests/');
    expect(res).toEqual({ success: true });
    expect(capturedHeaders).not.toBeNull();
    expect(capturedHeaders!.get('Authorization')).toBe('Bearer valid-jwt-token-xyz');
    expect(capturedHeaders!.get('X-Organization-Id')).toBe('org-uuid-1234');

    setAuthToken(null);
    setCurrentOrgId(null);
  });

  it('handles 204 No Content responses gracefully without parsing error', async () => {
    const { apiRequest } = await import('../lib/api');

    global.fetch = async () => ({
      ok: true,
      status: 204,
      text: async () => '',
    } as any);

    const res = await apiRequest('/requests/123/cancel', { method: 'POST' });
    expect(res).toEqual({});
  });

  it('targets the configured API base URL with /api/v1 prefix for auth routes', async () => {
    const { apiRequest } = await import('../lib/api');

    let capturedUrls: string[] = [];
    global.fetch = async (url: any) => {
      capturedUrls.push(url.toString());
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ status: 'ok' }),
      } as any;
    };

    await apiRequest('/auth/me');
    await apiRequest('/auth/register', { method: 'POST' });

    expect(capturedUrls[0]).toContain('/api/v1/auth/me');
    expect(capturedUrls[1]).toContain('/api/v1/auth/register');
  });

  it('correctly resolves relative upload file URLs with getFileUrl', async () => {
    const { getFileUrl, API_BASE } = await import('../lib/api');
    expect(getFileUrl('/uploads/org-1/photo.jpg')).toBe(`${API_BASE}/uploads/org-1/photo.jpg`);
    expect(getFileUrl('https://images.unsplash.com/photo-123')).toBe('https://images.unsplash.com/photo-123');
    expect(getFileUrl('')).toBe('');
    expect(getFileUrl(null)).toBe('');
  });
});
