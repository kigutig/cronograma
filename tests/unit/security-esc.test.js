import { describe, it, expect, beforeAll } from 'vitest';

describe('Unit Tests: Sanitização e Prevenção de XSS (escHtml)', () => {
  beforeAll(() => {
    globalThis.loadScript('../js/auth.js');
  });

  it('escHtml() deve neutralizar tags de script e caracteres perigosos', () => {
    const malicious = '<script>alert("XSS")</script>';
    const escaped = window.escHtml(malicious);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(escaped).not.toContain('<script>');
  });

  it('escHtml() deve neutralizar injeção de imagens com handlers onerror', () => {
    const payload = '<img src=x onerror=alert(document.cookie)>';
    const escaped = window.escHtml(payload);
    expect(escaped).toBe('&lt;img src=x onerror=alert(document.cookie)&gt;');
    expect(escaped).not.toContain('<img');
  });

  it('escHtml() deve neutralizar aspas simples e duplas', () => {
    const input = `João's "Super" Delivery & Co.`;
    const escaped = window.escHtml(input);
    expect(escaped).toBe('João&#39;s &quot;Super&quot; Delivery &amp; Co.');
  });

  it('escHtml() deve tratar valores nulos, indefinidos e números com segurança', () => {
    expect(window.escHtml(null)).toBe('');
    expect(window.escHtml(undefined)).toBe('');
    expect(window.escHtml(12345)).toBe('12345');
    expect(window.escHtml(0)).toBe('0');
    expect(window.escHtml('')).toBe('');
  });
});
