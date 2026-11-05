import { describe, it, expect, beforeEach } from 'vitest';

describe('Integration Tests: Visibilidade e Permissões no DOM (setupPermissions)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="editor-action" id="btnEditar">Editar</button>
      <button class="editor-action" id="btnNovo">Novo</button>
      <button class="admin-action" id="btnExcluir">Excluir</button>
      <a class="admin-action" id="linkAdmin" href="admin.html">Painel Admin</a>
    `;

    globalThis.loadScript('../js/auth.js');
  });

  function setupPermissionsForRole(papel) {
    const canEdit = window.isEditor(papel);
    const canDelete = window.isAdmin(papel);

    document.querySelectorAll('.editor-action').forEach(el => {
      el.style.display = canEdit ? '' : 'none';
    });
    document.querySelectorAll('.admin-action').forEach(el => {
      el.style.display = canDelete ? '' : 'none';
    });
  }

  it('Visualizador (viewer): deve ocultar ações de edição e administração', () => {
    setupPermissionsForRole('viewer');

    expect(document.getElementById('btnEditar').style.display).toBe('none');
    expect(document.getElementById('btnNovo').style.display).toBe('none');
    expect(document.getElementById('btnExcluir').style.display).toBe('none');
    expect(document.getElementById('linkAdmin').style.display).toBe('none');
  });

  it('Editor: deve exibir ações de edição, mas ocultar ações de administração (exclusão)', () => {
    setupPermissionsForRole('editor');

    expect(document.getElementById('btnEditar').style.display).toBe('');
    expect(document.getElementById('btnNovo').style.display).toBe('');
    expect(document.getElementById('btnExcluir').style.display).toBe('none');
    expect(document.getElementById('linkAdmin').style.display).toBe('none');
  });

  it('Administrador (admin): deve exibir todas as ações (edição e administração)', () => {
    setupPermissionsForRole('admin');

    expect(document.getElementById('btnEditar').style.display).toBe('');
    expect(document.getElementById('btnNovo').style.display).toBe('');
    expect(document.getElementById('btnExcluir').style.display).toBe('');
    expect(document.getElementById('linkAdmin').style.display).toBe('');
  });
});
