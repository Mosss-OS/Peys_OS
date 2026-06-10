import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const routes = [
    { path: '/', name: 'homepage' },
    { path: '/register', name: 'register' },
    { path: '/success', name: 'success' },
    { path: '/confirm/test123', name: 'confirm' },
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route.path}...`);
    await page.goto(`http://localhost:5173${route.path}`);
    await page.waitForTimeout(3000);
    
    const screenshotPath = `test/screenshots/${route.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }

  await browser.close();
  console.log('All screenshots captured!');
}

main();