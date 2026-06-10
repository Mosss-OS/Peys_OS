import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Navigating all routes ===\n');

  // 1. Homepage
  console.log('1. Navigating to /');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test/screenshots/final_homepage.png', fullPage: true });
  console.log('   URL:', page.url());

  // 2. Register page
  console.log('2. Navigating to /register');
  await page.goto('http://localhost:5173/register');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test/screenshots/final_register.png', fullPage: true });
  console.log('   URL:', page.url());

  // 3. WhatsApp register
  console.log('3. Navigating to /register/whatsapp?wa=+1234567890');
  await page.goto('http://localhost:5173/register/whatsapp?wa=+1234567890');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test/screenshots/final_whatsapp.png', fullPage: true });
  console.log('   URL:', page.url());

  // 4. Success page
  console.log('4. Navigating to /success');
  await page.goto('http://localhost:5173/success');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test/screenshots/final_success.png', fullPage: true });
  console.log('   URL:', page.url());

  // 5. Confirm page
  console.log('5. Navigating to /confirm/abc123');
  await page.goto('http://localhost:5173/confirm/abc123');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test/screenshots/final_confirm.png', fullPage: true });
  console.log('   URL:', page.url());

  console.log('\n=== Done! All screenshots captured ===');
  await browser.close();
}

main();