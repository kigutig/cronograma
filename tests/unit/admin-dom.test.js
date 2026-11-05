import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

describe('Unit Tests: Painel Administrativo de Usuários (admin.js)', () => {
  beforeAll(() => {
    globalThis.loadScript('../js/auth.js');
    globalThis.loadScript('../js/admin.js');
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toastContainer"></div>
      <span id="adminUserName"></span>
      <span id="userCount">0</span>
      <input id="userSearch" value="" />
      <table><tbody id="usersBody"></tbody></table>
      <div id="emptyUsers" style="display:none"></div>
      <!-- Modais Admin -->
      <div id="roleModal" class="modal-overlay">
        <span id="roleUserName"></span>
        <select id="roleSelect"><option value="viewer">viewer</option><option value="editor">editor</option><option value="admin">admin</option></select>
        <button id="saveRoleBtn"></button>
      </div>
      <div id="createUserModal" class="modal-overlay">
        <input id="newNome" />
        <input id="newEmail" />
        <input id="newPassword" type="password" />
        <select id="newPapel"><option value="viewer">viewer</option></select>
        <div id="createUserError" style="display:none"><span id="createUserErrorMsg"></span></div>
        <button id="createUserBtn"></button>
        <svg id="newPwdEye"></svg>
      </div>
    `;

    window.adminUser = { id: 'admin-1', email: 'admin@empresa.com' };
    window.adminProfile = { id: 'admin-1', nome: 'Admin Chefe', email: 'admin@empresa.com', papel: 'admin', ativo: true };
    window.allUsers = [
      { id: 'admin-1', nome: 'Admin Chefe', email: 'admin@empresa.com', papel: 'admin', ativo: true, criado_em: '2026-01-01T10:00:00Z' },
      { id: 'u2', nome: 'Operador Logística', email: 'operador@empresa.com', papel: 'editor', ativo: true, criado_em: '2026-02-01T10:00:00Z' },
      { id: 'u3', nome: 'Consulta Somente', email: 'consulta@empresa.com', papel: 'viewer', ativo: false, criado_em: '2026-03-01T10:00:00Z' }
    ];
  });

  it('renderUsers() deve renderizar as linhas de usuários na tabela com badges de papel e status', () => {
    window.renderUsers(window.allUsers);
    const tbody = document.getElementById('usersBody');
    expect(tbody.children.length).toBe(3);
    expect(tbody.innerHTML).toContain('Admin Chefe');
    expect(tbody.innerHTML).toContain('operador@empresa.com');
    expect(tbody.innerHTML).toContain('badge-admin');
    expect(tbody.innerHTML).toContain('badge-editor');
    expect(tbody.innerHTML).toContain('Inativo');
  });

  it('renderUsers() com lista vazia deve exibir emptyUsers', () => {
    window.renderUsers([]);
    expect(document.getElementById('emptyUsers').style.display).toBe('flex');
    expect(document.getElementById('usersBody').innerHTML).toBe('');
  });

  it('openRoleModal() deve abrir o modal com os dados do usuário a ser editado', () => {
    window.openRoleModal('u2', 'Operador Logística', 'editor');
    expect(document.getElementById('roleUserName').textContent).toBe('Operador Logística');
    expect(document.getElementById('roleSelect').value).toBe('editor');
    expect(document.getElementById('roleModal').classList.contains('show')).toBe(true);
  });

  it('openCreateUserModal() deve limpar os campos e abrir o modal de criação', () => {
    window.openCreateUserModal();
    expect(document.getElementById('newNome').value).toBe('');
    expect(document.getElementById('newEmail').value).toBe('');
    expect(document.getElementById('newPassword').value).toBe('');
    expect(document.getElementById('createUserModal').classList.contains('show')).toBe(true);
  });

  it('toggleNewPwd() deve alternar o tipo do campo de senha entre password e text', () => {
    const pwdInput = document.getElementById('newPassword');
    expect(pwdInput.type).toBe('password');

    window.toggleNewPwd();
    expect(pwdInput.type).toBe('text');

    window.toggleNewPwd();
    expect(pwdInput.type).toBe('password');
  });
});

