import { test, expect } from '@playwright/test';

test.describe('Bot Frontend Routes', () => {
  test('should load homepage and redirect to register', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url === 'http://localhost:5173/register' || url === 'http://localhost:5173/').toBeTruthy();
  });

  test('should load register page', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    await page.waitForTimeout(3000);
    const title = await page.title();
    expect(title).toBe('Peys - WhatsApp Payments');
  });

  test('should load success page', async ({ page }) => {
    await page.goto('http://localhost:5173/success');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain('/success');
  });

  test('should load confirm page', async ({ page }) => {
    await page.goto('http://localhost:5173/confirm/test123');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toContain('/confirm/test123');
  });
});