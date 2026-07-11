import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('page structure', () => {
  test('loads with the correct title and brand', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/El Código del Guerrero/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Guerrero');
  });

  test('all main sections are present', async ({ page }) => {
    await page.goto('/');
    for (const id of ['metodo', 'servicios', 'planes', 'contacto']) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.locator('.plan')).toHaveCount(4);
    await expect(page.locator('.card')).toHaveCount(4);
  });

  test('images load successfully', async ({ page }) => {
    const failed = [];
    page.on('response', (response) => {
      if (!response.ok() && response.url().match(/\.(avif|webp|jpg|svg)$/)) {
        failed.push(response.url());
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(failed).toEqual([]);
    // The hero image must actually render
    const heroImg = page.locator('.hero-bg img');
    await expect(heroImg).toBeVisible();
    expect(await heroImg.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  });
});

test.describe('navigation', () => {
  test('mobile menu opens, navigates and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only behavior');
    await page.goto('/');
    const toggle = page.locator('#nav-toggle');
    const menu = page.locator('#nav-menu');

    await expect(menu).toBeHidden();
    await toggle.click();
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await menu.getByRole('link', { name: 'Planes' }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator('#planes')).toBeInViewport();
  });

  test('desktop nav links are visible without the hamburger', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only behavior');
    await page.goto('/');
    await expect(page.locator('#nav-toggle')).toBeHidden();
    await expect(page.locator('#nav-menu')).toBeVisible();
  });
});

test.describe('plans carousel', () => {
  test('arrows reveal the last plan and return to the first', async ({ page }) => {
    await page.goto('/');
    await page.locator('#planes').scrollIntoViewIfNeeded();
    const next = page.locator('#plans-next');
    const prev = page.locator('#plans-prev');
    const plans = page.locator('.plan');

    await expect(prev).toBeDisabled();

    // Advance until the end (bounded to avoid an infinite loop)
    for (let i = 0; i < 6 && !(await next.isDisabled()); i++) {
      await next.click();
      await page.waitForTimeout(500);
    }
    await expect(next).toBeDisabled();
    await expect(plans.last()).toBeInViewport();

    // Go back to the start
    for (let i = 0; i < 6 && !(await prev.isDisabled()); i++) {
      await prev.click();
      await page.waitForTimeout(500);
    }
    await expect(prev).toBeDisabled();
    await expect(plans.first()).toBeInViewport();
  });
});

test.describe('contact form', () => {
  test('shows Spanish validation errors for empty submission', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact-form button[type="submit"]').click();
    await expect(page.locator('#error-name')).not.toBeEmpty();
    await expect(page.locator('#error-email')).not.toBeEmpty();
    await expect(page.locator('#error-message')).not.toBeEmpty();
    await expect(page.locator('#form-status')).toHaveClass(/error/);
  });

  test('accepts a valid submission in local mode', async ({ page }) => {
    await page.goto('/');
    await page.locator('#field-name').fill('Oscar');
    await page.locator('#field-email').fill('oscar@example.com');
    await page.locator('#field-message').fill('Quiero empezar a entrenar contigo.');
    await page.locator('#contact-form button[type="submit"]').click();
    await expect(page.locator('#form-status')).toContainText('Gracias');
    await expect(page.locator('#form-status')).not.toHaveClass(/error/);
    await expect(page.locator('#field-name')).toHaveValue('');
  });
});

test.describe('accessibility', () => {
  test('axe finds no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
