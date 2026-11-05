import { test, expect } from '@playwright/test';

test.describe('E2E: Navegação, Metadados e Guards de Rota', () => {
  test('deve possuir meta tags essenciais e viewport responsiva em index.html', async ({ page }) => {
    await page.goto('/index.html');
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');

    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset?.toUpperCase()).toBe('UTF-8');
  });

  test('deve proteger rotas restritas e redirecionar para index.html quando não autenticado', async ({ page }) => {
    // Tenta acessar app.html sem sessão
    await page.goto('/app.html');
    // Como requireAuth('index.html') é chamado, se não houver sessão ativa deve redirecionar
    await page.waitForURL(/index\.html/, { timeout: 10000 });
    expect(page.url()).toContain('index.html');
  });

  test('deve proteger painel admin.html e redirecionar para index.html quando não autenticado', async ({ page }) => {
    await page.goto('/admin.html');
    await page.waitForURL(/index\.html/, { timeout: 10000 });
    expect(page.url()).toContain('index.html');
  });
});

