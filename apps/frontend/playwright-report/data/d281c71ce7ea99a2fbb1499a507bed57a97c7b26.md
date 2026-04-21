# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth flow >> login exitoso redirige a /app
- Location: tests\e2e\auth.spec.ts:19:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/licitapp/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/licitapp/i).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - link "L LicitaApp" [ref=e5] [cursor=pointer]:
        - /url: /
        - generic [ref=e7]: L
        - generic [ref=e8]: LicitaApp
    - main [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - heading "Inicia sesión" [level=1] [ref=e12]
          - paragraph [ref=e13]: Accede a tu cuenta de LicitaApp
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]:
              - generic [ref=e17]: Email
              - textbox "Email" [ref=e18]: test@licitapp.com
            - generic [ref=e19]:
              - generic [ref=e20]:
                - generic [ref=e21]: Contraseña
                - link "¿Olvidaste la contraseña?" [ref=e22] [cursor=pointer]:
                  - /url: /reset-password
              - generic [ref=e23]:
                - textbox "Contraseña" [ref=e24]: Test1234!
                - button "Mostrar contraseña" [ref=e25]:
                  - img [ref=e26]
            - button "Iniciar sesión" [ref=e29]
          - generic [ref=e34]: o
          - button "Continuar con Google" [ref=e35]:
            - img [ref=e36]
            - text: Continuar con Google
        - generic [ref=e42]:
          - text: ¿No tienes cuenta?
          - link "Crear cuenta" [ref=e43] [cursor=pointer]:
            - /url: /register
    - contentinfo [ref=e44]: © 2026 LicitaApp · Licitaciones públicas de España
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Auth flow', () => {
  4  |   test('redirige a /login si se accede a ruta protegida sin sesión', async ({ page }) => {
  5  |     await page.goto('/buscar');
  6  |     await expect(page).toHaveURL(/\/login\?redirect=/);
  7  |   });
  8  | 
  9  |   test('muestra error con credenciales incorrectas', async ({ page }) => {
  10 |     await page.goto('/login');
  11 |     await page.fill('input[id=email]', 'noexiste@test.com');
  12 |     await page.fill('input[id=password]', 'WrongPassword1!');
  13 |     await page.click('button[type=submit]');
  14 |     await expect(page.getByText(/email o contraseña incorrectos/i)).toBeVisible({
  15 |       timeout: 5000,
  16 |     });
  17 |   });
  18 | 
  19 |   test('login exitoso redirige a /app', async ({ page }) => {
  20 |     // Necesitas un usuario de prueba en tu BD local
  21 |     const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@licitapp.com';
  22 |     const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';
  23 | 
  24 |     await page.goto('/login');
  25 |     await page.fill('input[id=email]', TEST_EMAIL);
  26 |     await page.fill('input[id=password]', TEST_PASSWORD);
  27 |     await page.click('button[type=submit]');
  28 | 
  29 |     await expect(page).toHaveURL(/\/app|\//);
> 30 |     await expect(page.getByText(/licitapp/i).first()).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  31 | 
  32 |     // Refrescamos y seguimos logados
  33 |     await page.reload();
  34 |     await expect(page).not.toHaveURL(/\/login/);
  35 |   });
  36 | 
  37 |   test('logout vuelve a /login', async ({ page, context }) => {
  38 |     const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@licitapp.com';
  39 |     const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';
  40 | 
  41 |     await page.goto('/login');
  42 |     await page.fill('input[id=email]', TEST_EMAIL);
  43 |     await page.fill('input[id=password]', TEST_PASSWORD);
  44 |     await page.click('button[type=submit]');
  45 |     await expect(page).not.toHaveURL(/\/login/);
  46 | 
  47 |     // Abrir menú usuario y cerrar sesión
  48 |     await page.getByText(TEST_EMAIL).click();
  49 |     await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
  50 | 
  51 |     await expect(page).toHaveURL(/\/login/);
  52 |   });
  53 | 
  54 |   test('validación: campos obligatorios en register', async ({ page }) => {
  55 |     await page.goto('/register');
  56 |     await page.click('button[type=submit]');
  57 |     await expect(page.getByText(/el email es obligatorio/i)).toBeVisible();
  58 |     await expect(page.getByText(/al menos 2 caracteres/i).first()).toBeVisible();
  59 |   });
  60 | 
  61 |   test('checklist de requisitos de password en complete-signup', async ({ page }) => {
  62 |     // Usa un token dummy (debe fallar en el submit, pero la UI de requisitos es lo que probamos)
  63 |     await page.goto('/complete-signup/token-dummy-para-test');
  64 | 
  65 |     const input = page.locator('input[id=password]');
  66 |     await input.fill('abc');
  67 |     await expect(page.getByText(/una letra mayúscula/i)).toBeVisible();
  68 | 
  69 |     await input.fill('Abc1234!');
  70 |     // Todos los requisitos deberían verse como cumplidos
  71 |   });
  72 | });
```