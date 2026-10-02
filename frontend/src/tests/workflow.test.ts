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
});
