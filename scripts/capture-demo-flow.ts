import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR =
  '/Users/jakub/.gemini/antigravity/brain/314321e4-27ff-4a6f-9ce1-7e61f653b924';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log(
    'Launching Chrome for end-to-end verification and screenshots...',
  );
  const browser = await puppeteer.launch({
    executablePath:
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,960',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  // 1. Explore Marketplace Hero
  console.log('1. Capturing Kickstarter Explore Marketplace...');
  await page.goto('http://localhost:5173/#explore', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_explore_marketplace.png'),
    fullPage: false,
  });

  // 2. Explore Marketplace - Trending Campaigns Grid
  console.log('2. Capturing Trending Campaigns Grid...');
  await page.evaluate(() => {
    window.scrollBy(0, 750);
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_trending_campaigns_grid.png'),
    fullPage: false,
  });

  // 3. Category Filter: Commercial BESS
  console.log('3. Capturing Category Filter (Commercial BESS)...');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 500));
  const bessBtn = await page.$(
    'xpath/.//button[contains(text(), "Commercial BESS")]',
  );
  if (bessBtn) {
    await bessBtn.click();
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03_category_filter_bess.png'),
      fullPage: false,
    });
  }

  // 4. Real-time Search: "Prague"
  console.log('4. Capturing Real-time Search for "Prague"...');
  const allProjectsBtn = await page.$(
    'xpath/.//button[contains(text(), "All Projects")]',
  );
  if (allProjectsBtn) await allProjectsBtn.click();
  const searchInput = await page.$('input[placeholder*="Search clean energy"]');
  if (searchInput) {
    await searchInput.type('Prague', { delay: 50 });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04_search_prague.png'),
      fullPage: false,
    });
    // Clear search input
    await searchInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
  }

  // 5. Hardware Dossier - Treetino V1 (#asset/100001) - Story & PPA
  console.log('5. Capturing Asset Dossier (Treetino V1) - Story & PPA...');
  await page.goto('http://localhost:5173/#asset/100001', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_dossier_treetino_story.png'),
    fullPage: false,
  });

  // 6. Hardware Dossier - Treetino V1 - Hardware Power Flow
  console.log('6. Capturing Asset Dossier - Hardware Power Flow Schematic...');
  const flowTab = await page.$(
    'xpath/.//button[contains(text(), "Real Hardware Power Flow")]',
  );
  if (flowTab) {
    await flowTab.click();
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06_dossier_treetino_schematic.png'),
      fullPage: false,
    });
  }

  // 7. Hardware Dossier - Treetino V1 - 24-Hour Energy Data
  console.log('7. Capturing Asset Dossier - 24-Hour Energy Data Charts...');
  const energyTab = await page.$(
    'xpath/.//button[contains(text(), "24-Hour Energy Data")]',
  );
  if (energyTab) {
    await energyTab.click();
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07_dossier_treetino_energy_data.png'),
      fullPage: false,
    });
  }

  // 8. Hardware Dossier - Treetino V1 - Back Project & Yield Calculator
  console.log('8. Capturing Asset Dossier - Back Project & Yield Share...');
  const yieldTab = await page.$(
    'xpath/.//button[contains(text(), "Back Project & Yield Share")]',
  );
  if (yieldTab) {
    await yieldTab.click();
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        '08_dossier_treetino_yield_calculator.png',
      ),
      fullPage: false,
    });
  }

  // 9. Hardware Dossier - Commercial ESS Battery Storage (#asset/219742)
  console.log('9. Capturing Asset Dossier - Commercial ESS Battery Storage...');
  await page.goto('http://localhost:5173/#asset/219742', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '09_dossier_ess_battery.png'),
    fullPage: false,
  });

  // 10. Investor Portfolio & Live Streaming Yield (#portfolio)
  console.log('10. Capturing Investor Portfolio with Active Investments...');
  // Seed sample investments into localStorage
  await page.evaluate(() => {
    localStorage.setItem(
      'treetino_victron_investments_guest',
      JSON.stringify({
        100001: {
          amountUsdc: 2500,
          investedAt: Date.now() - 3600000 * 24 * 7,
          lastClaimedAt: Date.now() - 3600000 * 2,
          totalClaimedUsdc: 14.28,
        },
        219742: {
          amountUsdc: 5000,
          investedAt: Date.now() - 3600000 * 24 * 14,
          lastClaimedAt: Date.now() - 3600000 * 6,
          totalClaimedUsdc: 45.6,
        },
      }),
    );
  });
  await page.goto('http://localhost:5173/#portfolio', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '10_investor_portfolio_live_yield.png'),
    fullPage: false,
  });

  // 11. Client Billing Portal (#client)
  console.log('11. Capturing Client Billing Portal...');
  await page.goto('http://localhost:5173/#client', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '11_client_billing_portal.png'),
    fullPage: false,
  });

  // 12. Protocol Admin Workspace (#admin)
  console.log('12. Capturing Protocol Admin Workspace...');
  await page.goto('http://localhost:5173/#admin', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '12_protocol_admin_portal.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('All 12 screenshots captured successfully in:', SCREENSHOT_DIR);
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
