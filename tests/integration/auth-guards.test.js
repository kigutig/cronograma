import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Integration Tests: Guards de Autenticação e Autorização (auth.js)', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = {
      auth: {
        getSession: vi.fn(),
        signOut: vi.fn()
      },
      from: vi.fn()
    };
    window.db = mockDb;

    delete window.location;
    window.location = { href: 'http://localhost/' };

    globalThis.loadScript('../js/auth.js');
  });

  it('requireAuth() deve redirecionar para index.html se não houver usuário logado', async () => {
    mockDb.auth.getSession.mockResolvedValue({ data: { session: null } });

    const user = await window.requireAuth('index.html');
    expect(user).toBeNull();
    expect(window.location.href).toBe('index.html');
  });

  it('requireAuth() deve retornar o usuário logado se a sessão for válida', async () => {
    const mockUser = { id: 'user-123', email: 'test@shopping.com' };
    mockDb.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } }
    });

    const user = await window.requireAuth('index.html');
    expect(user).toEqual(mockUser);
    expect(window.location.href).toBe('http://localhost/');
  });

  it('requireAdmin() deve redirecionar se o usuário não possuir papel "admin"', async () => {
    const mockUser = { id: 'user-editor' };
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-editor', papel: 'editor', ativo: true },
            error: null
          })
        })
      })
    });

    const profile = await window.requireAdmin(mockUser, 'app.html');
    expect(profile).toBeNull();
    expect(window.location.href).toBe('app.html');
  });

  it('requireAdmin() deve permitir acesso se o usuário for "admin"', async () => {
    const mockUser = { id: 'user-admin' };
    const adminData = { id: 'user-admin', papel: 'admin', ativo: true };
    mockDb.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: adminData,
            error: null
          })
        })
      })
    });

    const profile = await window.requireAdmin(mockUser, 'app.html');
    expect(profile).toEqual(adminData);
    expect(window.location.href).toBe('http://localhost/');
  });
});
