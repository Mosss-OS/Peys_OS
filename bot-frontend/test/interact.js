import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Interacting with the application ===\n');

  // 1. Go to homepage
  console.log('1. Going to homepage (/)');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test/screenshots/interact_1_homepage.png', fullPage: true });

  // 2. Go to register page
  console.log('2. Going to /register');
  await page.goto('http://localhost:5173/register');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test/screenshots/interact_2_register.png', fullPage: true });

  // 3. Go to WhatsApp register with wa param
  console.log('3. Going to /register/whatsapp?wa=+1234567890');
  await page.goto('http://localhost:5173/register/whatsapp?wa=+1234567890');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test/screenshots/interact_3_whatsapp.png', fullPage: true });

  // 4. Go to success page
  console.log('4. Going to /success');
  await page.goto('http://localhost:5173/success');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test/screenshots/interact_4_success.png', fullPage: true });

  // 5. Go to confirm page
  console.log('5. Going to /confirm/abc123');
  await page.goto('http://localhost:5173/confirm/abc123');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test/screenshots/interact_5_confirm.png', fullPage: true });

  console.log('\n=== All interactions complete! ===');
  await browser.close();
}

main();