import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  console.log('Browser opened at http://localhost:5173/');
  
  // Keep the browser open
  await new Promise(() => {});
}

main();