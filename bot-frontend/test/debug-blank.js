import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('Console:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('Page error:', err.message));

  console.log('Opening http://localhost:5173/register...');
  await page.goto('http://localhost:5173/register');
  await page.waitForTimeout(8000);
  
  const html = await page.content();
  console.log('Page HTML length:', html.length);
  
  const rootContent = await page.locator('#root').innerHTML();
  console.log('Root content:', rootContent.substring(0, 500));
  
  await page.screenshot({ path: 'test/screenshots/debug.png', fullPage: true });
  console.log('Screenshot saved');

  await browser.close();
}

main();