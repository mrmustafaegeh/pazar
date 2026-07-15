import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/screenshots/redesign');
const base = 'http://localhost:3000/ar';

async function capture() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Header at top of page (transparent over hero)
  await page.goto(base, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '01-header-top.png') });

  // Hero full view
  await page.screenshot({ path: path.join(outDir, '02-hero-top.png') });

  // Scrolled header (solid white)
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '03-header-scrolled.png') });

  // Parallax mid-scroll
  await page.evaluate(() => window.scrollTo(0, 280));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '04-hero-parallax.png') });

  // Login page
  await page.goto(`${base}/giris`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '05-login.png'), fullPage: true });

  // Register page
  await page.goto(`${base}/kayit`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, '06-register.png'), fullPage: true });

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
