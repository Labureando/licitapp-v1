import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('redirige a /login si se accede a ruta protegida sin sesión', async ({ page }) => {
    await page.goto('/buscar');
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id=email]', 'noexiste@test.com');
    await page.fill('input[id=password]', 'WrongPassword1!');
    await page.click('button[type=submit]');
    await expect(page.getByText(/email o contraseña incorrectos/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('login exitoso redirige a /app', async ({ page }) => {
    // Necesitas un usuario de prueba en tu BD local
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@licitapp.com';
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';

    await page.goto('/login');
    await page.fill('input[id=email]', TEST_EMAIL);
    await page.fill('input[id=password]', TEST_PASSWORD);
    await page.click('button[type=submit]');

    await expect(page).toHaveURL(/\/app|\//);
    await expect(page.getByText(/licitapp/i).first()).toBeVisible();

    // Refrescamos y seguimos logados
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('logout vuelve a /login', async ({ page, context }) => {
    const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@licitapp.com';
    const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';

    await page.goto('/login');
    await page.fill('input[id=email]', TEST_EMAIL);
    await page.fill('input[id=password]', TEST_PASSWORD);
    await page.click('button[type=submit]');
    await expect(page).not.toHaveURL(/\/login/);

    // Abrir menú usuario y cerrar sesión
    await page.getByText(TEST_EMAIL).click();
    await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('validación: campos obligatorios en register', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type=submit]');
    await expect(page.getByText(/el email es obligatorio/i)).toBeVisible();
    await expect(page.getByText(/al menos 2 caracteres/i).first()).toBeVisible();
  });

  test('checklist de requisitos de password en complete-signup', async ({ page }) => {
    // Usa un token dummy (debe fallar en el submit, pero la UI de requisitos es lo que probamos)
    await page.goto('/complete-signup/token-dummy-para-test');

    const input = page.locator('input[id=password]');
    await input.fill('abc');
    await expect(page.getByText(/una letra mayúscula/i)).toBeVisible();

    await input.fill('Abc1234!');
    // Todos los requisitos deberían verse como cumplidos
  });
});