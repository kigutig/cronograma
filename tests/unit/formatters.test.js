import { describe, it, expect, beforeAll } from 'vitest';

describe('Unit Tests: Formatação e Utilitários (auth.js)', () => {
  beforeAll(() => {
    globalThis.loadScript('../js/auth.js');
    globalThis.loadScript('../js/admin.js');
  });

  it('fmtDate() deve formatar datas YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(window.fmtDate('2026-11-05')).toBe('05/11/2026');
    expect(window.fmtDate('2025-01-01')).toBe('01/01/2025');
    expect(window.fmtDate('')).toBe('—');
    expect(window.fmtDate(null)).toBe('—');
    expect(window.fmtDate(undefined)).toBe('—');
  });

  it('fmtCurrency() deve formatar valores monetários em BRL', () => {
    const formatted = window.fmtCurrency(1500.50);
    expect(formatted.replace(/\s/g, ' ')).toMatch(/R\$\s*1\.500,50/);
    expect(window.fmtCurrency(0).replace(/\s/g, ' ')).toMatch(/R\$\s*0,00/);
    expect(window.fmtCurrency(null)).toBe('—');
    expect(window.fmtCurrency('')).toBe('—');
  });

  it('fmtDateTime() deve formatar timestamp ISO para data e hora brasileira', () => {
    const iso = '2026-07-15T14:30:00Z';
    const formatted = window.fmtDateTime(iso);
    expect(formatted).toBeTruthy();
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(window.fmtDateTime('')).toBe('');
    expect(window.fmtDateTime(null)).toBe('');
  });

  it('friendlyError() deve traduzir erros comuns de autenticação do Supabase', () => {
    expect(window.friendlyError({ message: 'Invalid login credentials' }))
      .toBe('E-mail ou senha incorretos.');

    expect(window.friendlyError({ message: 'Email not confirmed' }))
      .toBe('Confirme seu e-mail antes de entrar.');

    expect(window.friendlyError({ message: 'User already registered' }))
      .toBe('Este e-mail já está cadastrado.');

    expect(window.friendlyError({ message: 'Password should be at least 6 characters' }))
      .toBe('A senha deve ter no mínimo 6 caracteres.');

    expect(window.friendlyError({ message: 'Unable to validate email address' }))
      .toBe('E-mail inválido.');

    expect(window.friendlyError({ message: 'Network error occurred' }))
      .toBe('Network error occurred');

    expect(window.friendlyError(null))
      .toBe('Ocorreu um erro. Tente novamente.');
  });

  it('getStatusMeta() deve retornar a classe e variável CSS do status', () => {
    const metaPendente = window.getStatusMeta('Pendente');
    expect(metaPendente).toBeDefined();
    expect(metaPendente.cls).toBe('badge-pendente');
    expect(metaPendente.color).toBe('var(--s-pendente)');

    const metaEntregue = window.getStatusMeta('Entregue');
    expect(metaEntregue.cls).toBe('badge-entregue');

    const metaInexistente = window.getStatusMeta('Status Desconhecido');
    expect(metaInexistente.cls).toBe('badge-pendente');
  });

  it('getInitials() em admin.js deve extrair as iniciais de nomes', () => {
    expect(window.getInitials('Carlos Silva')).toBe('CS');
    expect(window.getInitials('Ana')).toBe('A');
    expect(window.getInitials('João Pedro Santos Almeida')).toBe('JP');
    expect(window.getInitials('')).toBe('?');
    expect(window.getInitials(null)).toBe('?');
  });
});
