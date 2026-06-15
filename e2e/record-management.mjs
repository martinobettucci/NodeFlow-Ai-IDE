// Records a video of the full gateway management lifecycle from a captured
// steps file (produced by the management driver that drives the real API):
// operator → users → team → group → profile → policies → a user minting
// their own key → wallet funding → a metered run → policy enforcement →
// audit trail. Fully self-contained (no CDN).
//
//   STEPS_JSON=/tmp/manage_steps.json OUT_DIR=/tmp/manage \
//   SHOTS_DIR=/tmp/mshots node e2e/record-management.mjs

import fs from 'node:fs';
import { chromium } from '@playwright/test';
import { stepsTimelineHtml } from './lib/steps-view.mjs';

const STEPS_JSON = process.env.STEPS_JSON || '/tmp/manage_steps.json';
const OUT_DIR = process.env.OUT_DIR || '/tmp/manage';
const SHOTS = process.env.SHOTS_DIR;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const steps = JSON.parse(fs.readFileSync(STEPS_JSON, 'utf8'));
  const html = stepsTimelineHtml(steps, {
    title: 'NodeFlow API Gateway — managing it end-to-end (live API)',
    subtitle:
      'operator → users → team → group → profile → policies → user mints a key → ' +
      'wallet funding → metered run → enforcement → audit · every response is real',
  });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await sleep(1500);

  const total = await page.evaluate(() => document.body.scrollHeight);
  const view = 720;
  const stepPx = 360; // half a viewport per tick for a readable pan
  let y = 0;
  let shotIdx = 0;
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/m-00.png` }).catch(() => {});
  while (y < total - view) {
    y += stepPx;
    await page.evaluate((yy) => window.scrollTo({ top: yy }), y);
    await sleep(950);
    if (SHOTS && ++shotIdx % 4 === 0) {
      await page.screenshot({ path: `${SHOTS}/m-${String(shotIdx).padStart(2, '0')}.png` }).catch(() => {});
    }
  }
  await sleep(1200);

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) console.log('VIDEO_PATH=' + (await video.path()));
}

run().catch((e) => { console.error(e); process.exit(1); });
