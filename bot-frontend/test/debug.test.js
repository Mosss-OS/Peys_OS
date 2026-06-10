import { test, expect } from '@playwright/test';

test('debug routes', async ({ page }) => {
  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));
  
  await page.goto('http://localhost:5173/register');
  await page.waitForTimeout(5000);
  console.log('Page title:', await page.title());
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root content length:', rootContent.length);
  console.log('Root content:', rootContent.substring(0, 1000));
});