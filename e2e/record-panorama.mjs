// Records a single narrated panorama video of the gateway-related features
// shipped on this branch:
//   1. IDE — the per-backend API key field and the aggregated catalogue
//      served by the gateway (the node appears in the palette).
//   2. Gateway — a LIVE control-plane panel (real responses from the running
//      gateway) and a feature map built from the live /openapi.json.
// Both gateway views are fully self-contained (no CDN), unlike FastAPI's
// default /docs which fetches Swagger assets from a CDN and renders blank
// in restricted networks.
//
// Usage (servers must already be running):
//   IDE_URL=http://127.0.0.1:4173 GATEWAY_URL=http://127.0.0.1:9000 \
//   GATEWAY_API_KEY=nfk_... OUT_DIR=/tmp/panorama node e2e/record-panorama.mjs

import http from 'node:http';
import { chromium } from '@playwright/test';
import { featureMapHtml, livePanelHtml } from './lib/gateway-views.mjs';

const IDE = process.env.IDE_URL || 'http://127.0.0.1:4173';
const GATEWAY = process.env.GATEWAY_URL || 'http://127.0.0.1:9000';
const API_KEY = process.env.GATEWAY_API_KEY || '';
const OUT_DIR = process.env.OUT_DIR || '/tmp/panorama';
const SHOTS = process.env.SHOTS_DIR;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function caption(page, title, subtitle = '') {
  await page.evaluate(({ title, subtitle }) => {
    let el = document.getElementById('__pano_caption');
    if (!el) {
      el = document.createElement('div');
      el.id = '__pano_caption';
      el.style.cssText = [
        'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
        'padding:14px 22px', 'font-family:system-ui,sans-serif',
        'background:linear-gradient(90deg,#1d4ed8,#0ea5e9)', 'color:#fff',
        'box-shadow:0 -2px 14px rgba(0,0,0,.4)', 'pointer-events:none',
      ].join(';');
      document.body.appendChild(el);
    } else {
      document.body.appendChild(el); // keep on top after navigations
    }
    el.innerHTML =
      `<div style="font-size:20px;font-weight:700">${title}</div>` +
      (subtitle ? `<div style="font-size:14px;opacity:.92;margin-top:2px">${subtitle}</div>` : '');
  }, { title, subtitle });
}

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // 1. IDE — Settings → Backends: the new API key field.
  await page.goto(IDE, { waitUntil: 'networkidle' });
  await sleep(1000);
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
  await shot(page, '01-backends-tab');

  await page.getByPlaceholder('http://localhost:8000').fill(GATEWAY);
  await sleep(600);
  await page.getByPlaceholder(/API key/i).fill(API_KEY);
  await sleep(1200);
  await caption(page, 'IDE · Connecting to the gateway',
    'The API key rides inside the RSA-PSS handshake; plain SDK backends ignore it');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByText('connected', { exact: false }).first().waitFor({ timeout: 20000 }).catch(() => {});
  await sleep(2000);
  await shot(page, '02-connected');

  // Close settings, show the aggregated node in the palette.
  await page.locator('button:has(svg.lucide-x)').first().click().catch(() => {});
  await sleep(1000);
  await caption(page, 'IDE · Aggregated node palette',
    'The gateway answered like a node backend; its upstream node now appears in the palette');
  await page.getByText('Capitalize').first().waitFor({ timeout: 8000 }).catch(() => {});
  await page.getByText('Capitalize').first().hover().catch(() => {});
  await sleep(2500);
  await shot(page, '03-palette');

  // 2a. Gateway — LIVE control plane (real responses from the running gateway).
  await page.setContent(livePanelHtml(GATEWAY, API_KEY), { waitUntil: 'load' });
  await page.waitForFunction(() => document.title === 'done', { timeout: 15000 }).catch(() => {});
  await sleep(800);
  await caption(page, 'Gateway · Live control plane',
    'Real responses: capabilities, account & wallets, registered backend, API keys');
  await sleep(1500);
  const liveSteps = 6;
  for (let i = 1; i <= liveSteps; i++) {
    await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), i / liveSteps);
    await sleep(1100);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(800);
  await shot(page, '04-live-panel');

  // 2b. Gateway — feature map from the live /openapi.json.
  const spec = await getJSON(`${GATEWAY}/openapi.json`);
  await page.setContent(featureMapHtml(spec), { waitUntil: 'load' });
  await sleep(800);
  await caption(page, 'Gateway · Feature map',
    `${Object.keys(spec.paths).length} routes — proxy protocol, self-service, admin, billing, auth`);
  await sleep(1500);
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), i / steps);
    await sleep(1000);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(800);
  await shot(page, '05-feature-map');
  await caption(page, 'Panorama complete',
    'IDE API key · aggregated catalogue · live control plane · policies, wallets, Stripe & OIDC');
  await sleep(2500);

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) console.log('VIDEO_PATH=' + (await video.path()));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
