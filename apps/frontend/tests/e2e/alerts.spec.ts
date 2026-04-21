import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'sergiogalafdz@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';

async function loginAs(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('input[id=email]', TEST_EMAIL);
  await page.fill('input[id=password]', TEST_PASSWORD);
  await page.click('button[type=submit]');
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('Alertas', () => {
  test('empty state muestra CTA cuando no hay alertas', async ({ page }) => {
    await loginAs(page);
    await page.goto('/alertas');
    // Depende del estado de la BD; si hay alertas, ajustar test
    await expect(page.getByRole('button', { name: /nueva alerta/i })).toBeVisible();
  });

  test('crear alerta mínima funciona', async ({ page }) => {
    await loginAs(page);
    await page.goto('/alertas');
    await page.getByRole('button', { name: /nueva alerta/i }).first().click();

    await page.fill('input[name=name]', `Test alerta ${Date.now()}`);
    await page.fill('input[name=palabrasClave]', 'madrid servicios');
    await page.getByRole('button', { name: /crear alerta/i }).click();

    await expect(page.getByText(/alerta creada correctamente/i)).toBeVisible();
  });
});

test.describe('i18n', () => {
  test('cambiar idioma a inglés', async ({ page }) => {
    await page.goto('/');
    // Abrir el selector de idioma (ajustar según implementación)
    await page.getByRole('button', { name: /cambiar idioma/i }).first().click();
    await page.getByRole('menuitem', { name: /english/i }).click();

    // Verificar que algún texto visible cambió a inglés
    await expect(page.getByText(/win more public tenders/i)).toBeVisible();
  });

  test('idioma se persiste tras F5', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /cambiar idioma/i }).first().click();
    await page.getByRole('menuitem', { name: /english/i }).click();
    await page.reload();
    await expect(page.getByText(/win more public tenders/i)).toBeVisible();
  });
});