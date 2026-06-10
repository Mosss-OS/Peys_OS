import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const routes = [
    '/',
    '/register',
    '/success',
    '/confirm/test123',
    '/register/whatsapp?wa=+1234567890'
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route}...`);
    await page.goto(`http://localhost:5173${route}`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test/screenshots/${route.replace(/[^a-z]/g, '_')}.png`, fullPage: true });
  }

  console.log('All routes navigated and screenshots captured!');
  await browser.close();
}

main();