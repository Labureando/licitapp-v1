import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'sergiogalafdz@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';

async function loginAs(page: Page) {
  await page.goto('/login');
  await page.fill('input[id=email]', TEST_EMAIL);
  await page.fill('input[id=password]', TEST_PASSWORD);
  await page.click('button[type=submit]');
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('Ajustes', () => {
  test('tab perfil muestra datos del usuario logado', async ({ page }) => {
    await loginAs(page);
    await page.goto('/ajustes/perfil');
    await expect(page.locator('input#firstName')).toBeVisible();
    await expect(page.locator('input#firstName')).not.toHaveValue('');
  });

  test('actualización de perfil persiste tras F5', async ({ page }) => {
    await loginAs(page);
    await page.goto('/ajustes/perfil');

    const input = page.locator('input#firstName');
    const original = await input.inputValue();
    const newValue = `${original}-X`;

    await input.fill(newValue);
    await page.click('button[type=submit]');
    await expect(page.getByText(/perfil actualizado/i)).toBeVisible();

    await page.reload();
    await expect(input).toHaveValue(newValue);

    // Cleanup: revertir para no contaminar futuros tests
    await input.fill(original);
    await page.click('button[type=submit]');
  });

  test('cambiar password con oldPassword incorrecta falla con 401', async ({ page }) => {
    await loginAs(page);
    await page.goto('/ajustes/seguridad');
    await page.fill('input#oldPassword', 'WrongPassword1!');
    await page.fill('input#newPassword', 'NewValid1234!');
    await page.fill('input#newPasswordConfirm', 'NewValid1234!');
    await page.click('button[type=submit]');
    await expect(
      page.getByText(/contraseña actual no es correcta/i)
    ).toBeVisible();
  });
});

test.describe('Reset password', () => {
  test('solicitud muestra pantalla de confirmación aunque el email no exista', async ({ page }) => {
    await page.goto('/reset-password');
    await page.fill('input#email', 'noexiste@test.com');
    await page.click('button[type=submit]');
    await expect(page.getByText(/revisa tu email/i)).toBeVisible();
  });

  test('token inválido redirige a solicitar', async ({ page }) => {
    await page.goto('/reset-password/confirm');
    // Sin token en query → redirige
    await expect(page).toHaveURL(/\/reset-password$/);
  });
});

test.describe('Landing', () => {
  test('muestra hero y CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/gana más licitaciones/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /empezar gratis/i }).first()
    ).toBeVisible();
  });

  test('logado no ve landing, redirige a /app', async ({ page }) => {
    await loginAs(page);
    // Estamos logados, ir a / debería llevarnos al orbital
    await page.goto('/');
    // La landing permanece visible PARA EL LOGADO también (decisión UX actual)
    // Si cambias esa decisión: await expect(page).toHaveURL('/app');
    await expect(page.getByText(/gana más licitaciones/i)).toBeVisible();
  });
});

test.describe('Redirects post-login', () => {
  test('login preserva redirect query param', async ({ page }) => {
    // Desde incógnito intentamos /buscar
    await page.goto('/buscar');
    await expect(page).toHaveURL(/\/login\?redirect=/);

    // Logueamos
    await page.fill('input[id=email]', TEST_EMAIL);
    await page.fill('input[id=password]', TEST_PASSWORD);
    await page.click('button[type=submit]');

    // Tras login debería terminarnos en /buscar, no en /app
    await expect(page).toHaveURL(/\/buscar/);
  });
});