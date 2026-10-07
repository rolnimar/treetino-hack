import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR =
  '/Users/jakub/.gemini/antigravity/brain/7ccc6843-934f-40fd-b874-3f1c8c50e47d';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser to capture layout visual check...');
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

  // 1. Fullscreen Cinematic Hero (Featured Campaign)
  console.log('1. Capturing Kickstarter Featured Campaign Hero...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_hero_cinematic.png'),
  });

  // 2. Kickstarter Campaigns Directory (Directly under Hero)
  console.log('2. Capturing Campaigns Directory...');
  await page.evaluate(() => {
    const el = document.getElementById('campaigns');
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_campaigns_directory.png'),
  });

  // 3. Hardware 3D Showcase
  console.log('3. Capturing 3D Hardware Showcase...');
  await page.evaluate(() => {
    const el = document.getElementById('hardware-showcase');
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_hardware_showcase.png'),
  });

  // 4. How RWA Tokenization Works & Faucet
  console.log('4. Capturing How It Works Architecture & Faucet...');
  await page.evaluate(() => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04_how_it_works.png'),
  });

  // 5. Dedicated Asset Page
  console.log('5. Capturing Dedicated Asset Page (#asset/209689)...');
  await page.goto('http://localhost:5173/#asset/209689', {
    waitUntil: 'networkidle0',
  });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_asset_page.png'),
  });

  await browser.close();
  console.log('All screenshots captured successfully to:', SCREENSHOT_DIR);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
