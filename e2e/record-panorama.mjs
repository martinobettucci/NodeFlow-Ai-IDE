// Records a single narrated panorama video covering the gateway-related
// features shipped in this work: the IDE's per-backend API key field, the
// aggregated node catalogue served by the gateway, and the gateway control
// plane + proxy surface (Swagger). Produces a .webm under OUT_DIR.
//
// Usage (servers must already be running):
//   IDE_URL=http://127.0.0.1:4173 GATEWAY_URL=http://127.0.0.1:9000 \
//   GATEWAY_API_KEY=nfk_... OUT_DIR=/tmp/panorama node e2e/record-panorama.mjs

import { chromium } from '@playwright/test';

const IDE = process.env.IDE_URL || 'http://127.0.0.1:4173';
const GATEWAY = process.env.GATEWAY_URL || 'http://127.0.0.1:9000';
const API_KEY = process.env.GATEWAY_API_KEY || '';
const OUT_DIR = process.env.OUT_DIR || '/tmp/panorama';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function caption(page, title, subtitle = '') {
  await page.evaluate(
    ({ title, subtitle }) => {
      let el = document.getElementById('__pano_caption');
      if (!el) {
        el = document.createElement('div');
        el.id = '__pano_caption';
        el.style.cssText = [
          'position:fixed', 'left:0', 'right:0', 'top:0', 'z-index:2147483647',
          'padding:14px 22px', 'font-family:system-ui,sans-serif',
          'background:linear-gradient(90deg,#1d4ed8,#0ea5e9)', 'color:#fff',
          'box-shadow:0 2px 14px rgba(0,0,0,.4)', 'pointer-events:none',
        ].join(';');
        document.body.appendChild(el);
      }
      el.innerHTML =
        `<div style="font-size:20px;font-weight:700">${title}</div>` +
        (subtitle ? `<div style="font-size:14px;opacity:.92;margin-top:2px">${subtitle}</div>` : '');
    },
    { title, subtitle },
  );
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // 1. IDE — Settings -> Backends: the new API key field.
  await page.goto(IDE, { waitUntil: 'networkidle' });
  await sleep(1200);
  await caption(page, 'NodeFlow API Gateway — feature panorama',
    'Multi-tenant gateway aggregating NodeFlow backends behind API keys, policies and credits');
  await sleep(2500);

  const settingsHeading = page.getByRole('heading', { name: 'Settings' });
  if (!(await settingsHeading.isVisible().catch(() => false))) {
    await page.getByTitle('Settings').click();
  }
  await page.getByRole('button', { name: 'Backends' }).click();
  await caption(page, 'IDE · Settings → Backends',
    'New optional “API key” field per backend — stored locally, sent in the handshake');
  await sleep(2500);

  await page.getByPlaceholder('http://localhost:8000').fill(GATEWAY);
  await sleep(700);
  await page.getByPlaceholder(/API key/i).fill(API_KEY);
  await sleep(1500);
  await caption(page, 'IDE · Connecting to the gateway',
    'The API key rides inside the RSA-PSS handshake; plain SDK backends ignore it');
  await page.getByRole('button', { name: 'Add' }).click();

  // Wait for the connected state ("connected" badge + node count).
  await page.getByText('connected', { exact: false }).first().waitFor({ timeout: 20000 }).catch(() => {});
  await sleep(2500);
  await caption(page, 'IDE · Backend connected',
    'The gateway answered like a node backend and exposed its aggregated catalogue');
  await sleep(2000);

  // 2. Close settings, show the aggregated node in the palette.
  await page.locator('button:has(svg.lucide-x)').first().click().catch(async () => {
    await page.keyboard.press('Escape');
  });
  await sleep(1200);
  await caption(page, 'IDE · Node palette',
    'Aggregated upstream nodes appear namespaced ({backend}::{node})');
  await page.getByText('Capitalize').first().waitFor({ timeout: 8000 }).catch(() => {});
  await page.getByText('Capitalize').first().hover().catch(() => {});
  await sleep(3000);

  // 3. Gateway control plane + proxy surface (Swagger).
  await page.goto(`${GATEWAY}/docs`, { waitUntil: 'networkidle' });
  await sleep(2500);
  await caption(page, 'Gateway · OpenAPI surface',
    'Every route is a shipped feature: proxy protocol, self-service, admin, billing, auth');
  // Slow scroll through all the tagged route groups for a true panorama.
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((frac) => window.scrollTo(0, document.body.scrollHeight * frac),
      i / steps);
    await sleep(1100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);
  await caption(page, 'Panorama complete',
    'IDE API key · aggregated catalogue · policies, wallets, Stripe & OIDC control plane');
  await sleep(2500);

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const path = await video.path();
    console.log('VIDEO_PATH=' + path);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
