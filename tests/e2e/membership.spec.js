import { expect, test } from '@playwright/test';

test.describe('signup form', () => {
  test('shows Spanish validation errors for empty submission', async ({ page }) => {
    await page.goto('/signup.html?plan=estandar');
    await page.locator('#signup-form button[type="submit"]').click();
    await expect(page.locator('#error-name')).not.toBeEmpty();
    await expect(page.locator('#error-email')).not.toBeEmpty();
    await expect(page.locator('#error-password')).not.toBeEmpty();
  });

  test('flags mismatched password confirmation', async ({ page }) => {
    await page.goto('/signup.html?plan=estandar');
    await page.locator('#field-name').fill('Oscar');
    await page.locator('#field-email').fill('oscar@example.com');
    await page.locator('#field-password').fill('supersecreta1');
    await page.locator('#field-password-confirm').fill('otra-contrasena');
    await page.locator('#signup-form button[type="submit"]').click();
    await expect(page.locator('#error-password-confirm')).toHaveText(/no coinciden/i);
  });

  test('always shows all plan options with their price', async ({ page }) => {
    await page.goto('/signup.html');
    await expect(page.locator('#field-plan option')).toHaveCount(3);
    await expect(page.locator('#plan-price')).not.toBeEmpty();
  });

  test('preselects the plan from the URL and updates the price when changed', async ({ page }) => {
    await page.goto('/signup.html?plan=estandar');
    await expect(page.locator('#field-plan')).toHaveValue('estandar');
    await expect(page.locator('#plan-price')).toContainText('90');
    await page.locator('#field-plan').selectOption('black');
    await expect(page.locator('#plan-price')).toContainText('115');
  });

  test('shows "already have an account" link near the top', async ({ page }) => {
    await page.goto('/signup.html');
    const subtitle = page.locator('#signup-plan-subtitle');
    const altAction = page.locator('.auth-alt-action-top');
    await expect(altAction).toBeVisible();
    // The "already have an account" link must appear before the form, not after it.
    await expect(page.locator('#signup-form')).toBeVisible();
    const subtitleBox = await subtitle.boundingBox();
    const altActionBox = await altAction.boundingBox();
    const formBox = await page.locator('#signup-form').boundingBox();
    expect(altActionBox.y).toBeGreaterThan(subtitleBox.y);
    expect(altActionBox.y).toBeLessThan(formBox.y);
  });
});

test.describe('protected pages redirect to login', () => {
  test('dashboard.html redirects an unauthenticated visitor to login.html', async ({ page }) => {
    await page.goto('/dashboard.html');
    await expect(page).toHaveURL(/login\.html\?next=/);
  });

  test('schedule.html redirects an unauthenticated visitor to login.html', async ({ page }) => {
    await page.goto('/schedule.html');
    await expect(page).toHaveURL(/login\.html\?next=/);
  });

  test('checkout.html redirects an unauthenticated visitor to login.html', async ({ page }) => {
    await page.goto('/checkout.html?plan=estandar');
    await expect(page).toHaveURL(/login\.html\?next=/);
  });
});

test.describe('login form', () => {
  test('shows an error message for invalid credentials message shape', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#login-form button[type="submit"]').click();
    await expect(page.locator('#error-email')).not.toBeEmpty();
  });
});
