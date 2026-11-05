import { test, expect } from '@playwright/test';

test.describe('E2E: Tela de Autenticação (index.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('deve renderizar a página de login com título e elementos visuais corretos', async ({ page }) => {
    await expect(page).toHaveTitle(/Login — Shopping das Academias/);
    await expect(page.locator('#tabLogin')).toBeVisible();
    await expect(page.locator('#tabRegister')).toBeVisible();
    await expect(page.locator('#loginEmail')).toBeVisible();
    await expect(page.locator('#loginPassword')).toBeVisible();
    await expect(page.locator('#loginBtn')).toBeVisible();
  });

  test('deve alternar entre as abas de Login e Cadastro', async ({ page }) => {
    // Inicialmente no painel de login
    await expect(page.locator('#panelLogin')).toHaveClass(/active/);
    await expect(page.locator('#panelRegister')).not.toHaveClass(/active/);

    // Clica na aba de cadastro
    await page.click('#tabRegister');
    await expect(page.locator('#panelRegister')).toHaveClass(/active/);
    await expect(page.locator('#panelLogin')).not.toHaveClass(/active/);
    await expect(page.locator('#regNome')).toBeVisible();
    await expect(page.locator('#regConfirm')).toBeVisible();

    // Retorna para a aba de login
    await page.click('#tabLogin');
    await expect(page.locator('#panelLogin')).toHaveClass(/active/);
  });

  test('deve alternar visibilidade da senha (mostrar/ocultar senha)', async ({ page }) => {
    const pwdInput = page.locator('#loginPassword');
    const toggleBtn = page.locator('button[onclick*="loginPassword"]');

    await expect(pwdInput).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(pwdInput).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(pwdInput).toHaveAttribute('type', 'password');
  });

  test('deve validar formulário de cadastro em caso de senhas divergentes', async ({ page }) => {
    await page.click('#tabRegister');
    await page.fill('#regNome', 'Usuário Teste');
    await page.fill('#regEmail', 'teste@academias.com');
    await page.fill('#regPassword', 'senha123');
    await page.fill('#regConfirm', 'outrasenha');

    await page.click('#regBtn');

    const errBox = page.locator('#regError');
    await expect(errBox).toHaveClass(/show/);
    await expect(page.locator('#regErrorMsg')).toHaveText('As senhas não coincidem.');
  });

  test('deve validar formulário de cadastro para senha com menos de 6 caracteres', async ({ page }) => {
    await page.click('#tabRegister');
    await page.fill('#regNome', 'Usuário Teste');
    await page.fill('#regEmail', 'teste@academias.com');
    await page.fill('#regPassword', '123');
    await page.fill('#regConfirm', '123');

    await page.click('#regBtn');

    const errBox = page.locator('#regError');
    await expect(errBox).toHaveClass(/show/);
    await expect(page.locator('#regErrorMsg')).toHaveText('A senha deve ter pelo menos 6 caracteres.');
  });

  test('deve inicializar com o tema dark e suportar persistência de tema', async ({ page }) => {
    const themeAttr = await page.getAttribute('html', 'data-theme');
    expect(themeAttr).toBe('dark');
  });
});

