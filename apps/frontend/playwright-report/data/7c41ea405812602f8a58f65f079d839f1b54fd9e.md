# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ajustes.spec.ts >> Ajustes >> tab perfil muestra datos del usuario logado
- Location: tests\e2e\ajustes.spec.ts:15:3

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/login/
Received string: "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:5173/login"

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
              - textbox "Email" [ref=e18]: sergiogalafdz@gmail.com
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
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'sergiogalafdz@gmail.com';
  4   | const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!';
  5   | 
  6   | async function loginAs(page: Page) {
  7   |   await page.goto('/login');
  8   |   await page.fill('input[id=email]', TEST_EMAIL);
  9   |   await page.fill('input[id=password]', TEST_PASSWORD);
  10  |   await page.click('button[type=submit]');
> 11  |   await expect(page).not.toHaveURL(/\/login/);
      |                          ^ Error: expect(page).not.toHaveURL(expected) failed
  12  | }
  13  | 
  14  | test.describe('Ajustes', () => {
  15  |   test('tab perfil muestra datos del usuario logado', async ({ page }) => {
  16  |     await loginAs(page);
  17  |     await page.goto('/ajustes/perfil');
  18  |     await expect(page.locator('input#firstName')).toBeVisible();
  19  |     await expect(page.locator('input#firstName')).not.toHaveValue('');
  20  |   });
  21  | 
  22  |   test('actualización de perfil persiste tras F5', async ({ page }) => {
  23  |     await loginAs(page);
  24  |     await page.goto('/ajustes/perfil');
  25  | 
  26  |     const input = page.locator('input#firstName');
  27  |     const original = await input.inputValue();
  28  |     const newValue = `${original}-X`;
  29  | 
  30  |     await input.fill(newValue);
  31  |     await page.click('button[type=submit]');
  32  |     await expect(page.getByText(/perfil actualizado/i)).toBeVisible();
  33  | 
  34  |     await page.reload();
  35  |     await expect(input).toHaveValue(newValue);
  36  | 
  37  |     // Cleanup: revertir para no contaminar futuros tests
  38  |     await input.fill(original);
  39  |     await page.click('button[type=submit]');
  40  |   });
  41  | 
  42  |   test('cambiar password con oldPassword incorrecta falla con 401', async ({ page }) => {
  43  |     await loginAs(page);
  44  |     await page.goto('/ajustes/seguridad');
  45  |     await page.fill('input#oldPassword', 'WrongPassword1!');
  46  |     await page.fill('input#newPassword', 'NewValid1234!');
  47  |     await page.fill('input#newPasswordConfirm', 'NewValid1234!');
  48  |     await page.click('button[type=submit]');
  49  |     await expect(
  50  |       page.getByText(/contraseña actual no es correcta/i)
  51  |     ).toBeVisible();
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Reset password', () => {
  56  |   test('solicitud muestra pantalla de confirmación aunque el email no exista', async ({ page }) => {
  57  |     await page.goto('/reset-password');
  58  |     await page.fill('input#email', 'noexiste@test.com');
  59  |     await page.click('button[type=submit]');
  60  |     await expect(page.getByText(/revisa tu email/i)).toBeVisible();
  61  |   });
  62  | 
  63  |   test('token inválido redirige a solicitar', async ({ page }) => {
  64  |     await page.goto('/reset-password/confirm');
  65  |     // Sin token en query → redirige
  66  |     await expect(page).toHaveURL(/\/reset-password$/);
  67  |   });
  68  | });
  69  | 
  70  | test.describe('Landing', () => {
  71  |   test('muestra hero y CTAs', async ({ page }) => {
  72  |     await page.goto('/');
  73  |     await expect(page.getByText(/gana más licitaciones/i)).toBeVisible();
  74  |     await expect(
  75  |       page.getByRole('link', { name: /empezar gratis/i }).first()
  76  |     ).toBeVisible();
  77  |   });
  78  | 
  79  |   test('logado no ve landing, redirige a /app', async ({ page }) => {
  80  |     await loginAs(page);
  81  |     // Estamos logados, ir a / debería llevarnos al orbital
  82  |     await page.goto('/');
  83  |     // La landing permanece visible PARA EL LOGADO también (decisión UX actual)
  84  |     // Si cambias esa decisión: await expect(page).toHaveURL('/app');
  85  |     await expect(page.getByText(/gana más licitaciones/i)).toBeVisible();
  86  |   });
  87  | });
  88  | 
  89  | test.describe('Redirects post-login', () => {
  90  |   test('login preserva redirect query param', async ({ page }) => {
  91  |     // Desde incógnito intentamos /buscar
  92  |     await page.goto('/buscar');
  93  |     await expect(page).toHaveURL(/\/login\?redirect=/);
  94  | 
  95  |     // Logueamos
  96  |     await page.fill('input[id=email]', TEST_EMAIL);
  97  |     await page.fill('input[id=password]', TEST_PASSWORD);
  98  |     await page.click('button[type=submit]');
  99  | 
  100 |     // Tras login debería terminarnos en /buscar, no en /app
  101 |     await expect(page).toHaveURL(/\/buscar/);
  102 |   });
  103 | });
```