import { test, expect } from '@playwright/test';

test.describe('E2E: Interações no Cockpit de Entregas (app.html)', () => {
  test.beforeEach(async ({ page }) => {
    // Injeta mock de autenticação e dados para testar o cockpit sem depender de banco remoto em CI
    await page.addInitScript(() => {
      window.__mockUser = { id: 'mock-user-1', email: 'admin@shopping.com' };
      window.__mockProfile = {
        id: 'mock-user-1',
        nome: 'Administrador E2E',
        email: 'admin@shopping.com',
        papel: 'admin',
        ativo: true
      };
      window.__mockRows = [
        { id: '1', pedido: '9001', cliente: 'Academia Playwright', motorista: 'Roberto', rota: 'Litoral', placa: 'E2E-2026', data: '2026-11-10', status: 'Agendado', frete: 'CIF' },
        { id: '2', pedido: '9002', cliente: 'CrossFit Teste', motorista: 'Roberto', rota: 'Capital', placa: 'E2E-2026', data: '2026-11-12', status: 'Entregue', frete: 'FOB' }
      ];
      window.__mockAguardando = [
        { id: 'ag-1', pedido: '9900', cliente: 'Cliente em Espera', observacoes: 'Sem pressa' }
      ];
    });

    await page.goto('/app.html');
  });

  test('deve renderizar o header com dados do usuário logado e badge de permissão', async ({ page }) => {
    await expect(page.locator('#userName')).toHaveText(/Administrador E2E/);
    await expect(page.locator('#userRoleBadge')).toHaveText(/Administrador/);
    await expect(page.locator('#adminLink')).toBeVisible();
  });

  test('deve abrir e fechar o modal de Novo Registro', async ({ page }) => {
    await page.click('#btnNovo');
    const modal = page.locator('#rowModal');
    await expect(modal).toHaveClass(/show/);
    await expect(page.locator('#modalTitle')).toHaveText('Novo Registro');

    // Fecha o modal pelo botão cancelar
    await page.click('#rowModal button.btn-secondary');
    await expect(modal).not.toHaveClass(/show/);
  });

  test('deve alternar entre as abas Cronograma e Arquivo', async ({ page }) => {
    const tabCronograma = page.locator('#tabCronograma');
    const tabArquivo = page.locator('#tabArquivo');
    const btnNovo = page.locator('#btnNovo');

    await expect(tabCronograma).toHaveClass(/active/);
    await expect(btnNovo).toBeVisible();

    // Alterna para aba Arquivo (Histórico)
    await tabArquivo.click();
    await expect(tabArquivo).toHaveClass(/active/);
    await expect(btnNovo).toBeHidden();

    // Retorna para Cronograma
    await tabCronograma.click();
    await expect(tabCronograma).toHaveClass(/active/);
    await expect(btnNovo).toBeVisible();
  });

  test('deve filtrar registros pelo campo de busca', async ({ page }) => {
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('Playwright');
    await expect(page.locator('#cronogramaBody')).toContainText('Academia Playwright');

    await searchInput.fill('RegistroInexistente');
    await expect(page.locator('#emptyState')).toBeVisible();
  });

  test('deve alternar o tema do sistema pelo botão de tema', async ({ page }) => {
    const themeBtn = page.locator('#themeToggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

