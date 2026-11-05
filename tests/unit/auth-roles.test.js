import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

describe('Unit Tests: RBAC e Gerenciamento de Tema (auth.js)', () => {
  beforeAll(() => {
    globalThis.loadScript('../js/auth.js');
  });

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('isAdmin() deve validar exclusivamente a role "admin"', () => {
    expect(window.isAdmin('admin')).toBe(true);
    expect(window.isAdmin('editor')).toBe(false);
    expect(window.isAdmin('viewer')).toBe(false);
    expect(window.isAdmin('')).toBe(false);
    expect(window.isAdmin(null)).toBe(false);
  });

  it('isEditor() deve permitir "admin" e "editor", mas negar "viewer"', () => {
    expect(window.isEditor('admin')).toBe(true);
    expect(window.isEditor('editor')).toBe(true);
    expect(window.isEditor('viewer')).toBe(false);
    expect(window.isEditor('visitante')).toBe(false);
    expect(window.isEditor(null)).toBe(false);
  });

  it('initTheme() deve carregar o tema salvo ou assumir "dark" por padrão', () => {
    window.initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    localStorage.setItem('sda-theme', 'light');
    window.initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggleTheme() deve alternar entre dark e light e persistir no localStorage', () => {
    window.initTheme(); // dark
    window.toggleTheme(); // vira light
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('sda-theme')).toBe('light');

    window.toggleTheme(); // volta para dark
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('sda-theme')).toBe('dark');
  });

  it('openModal() e closeModal() devem manipular a classe "show"', () => {
    const modal = document.createElement('div');
    modal.id = 'testModal';
    document.body.appendChild(modal);

    window.openModal('testModal');
    expect(modal.classList.contains('show')).toBe(true);

    window.closeModal('testModal');
    expect(modal.classList.contains('show')).toBe(false);
  });
});
