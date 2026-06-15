// Records the gateway console first-run setup: an admin signs in with an API
// key (bootstrap, before SSO exists), is guided to configure OIDC and Stripe,
// does both through the GUI, then signs out and logs back in via REAL single
// sign-on against a live Keycloak. No CDN.
//
//   CONSOLE_URL=http://127.0.0.1:9100 API_KEY=nfk_... \
//   KC_USER=admin@demo.test KC_PASS=password \
//   ISSUER=http://127.0.0.1:8081/realms/demo CLIENT=nodeflow-console \
//   OUT_DIR=/tmp/setup SHOTS_DIR=/tmp/sshots node e2e/record-console-setup.mjs

import { chromium } from '@playwright/test';

const C = process.env.CONSOLE_URL || 'http://127.0.0.1:9100';
const API_KEY = process.env.API_KEY || '';
const KC_USER = process.env.KC_USER || 'admin@demo.test';
const KC_PASS = process.env.KC_PASS || 'password';
const ISSUER = process.env.ISSUER || 'http://127.0.0.1:8081/realms/demo';
const CLIENT = process.env.CLIENT || 'nodeflow-console';
const OUT_DIR = process.env.OUT_DIR || '/tmp/setup';
const SHOTS = process.env.SHOTS_DIR;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function caption(page, title, subtitle = '') {
  await page.evaluate(({ title, subtitle }) => {
    let el = document.getElementById('__cap');
    if (!el) {
      el = document.createElement('div');
      el.id = '__cap';
      el.style.cssText = [
        'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
        'padding:13px 22px', 'font-family:system-ui,sans-serif',
        'background:linear-gradient(90deg,#1d4ed8,#0ea5e9)', 'color:#fff',
        'box-shadow:0 -2px 14px rgba(0,0,0,.4)', 'pointer-events:none',
      ].join(';');
    }
    document.body.appendChild(el);
    el.innerHTML = `<div style="font-size:19px;font-weight:700">${title}</div>` +
      (subtitle ? `<div style="font-size:13px;opacity:.92;margin-top:2px">${subtitle}</div>` : '');
  }, { title, subtitle });
}
async function shot(page, n) { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${n}.png` }).catch(() => {}); }

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // 1. Login page — SSO not configured yet, use the API-key bootstrap path.
  await page.goto(C + '/login', { waitUntil: 'networkidle' });
  await caption(page, 'First-run setup — no SSO yet',
    'The admin signs in with an API key (the bootstrap path) to configure the org');
  await sleep(2200);
  await page.click('details.apikey summary').catch(() => {});
  await page.fill('input[name="api_key"]', API_KEY);
  await sleep(1200);
  await shot(page, '01-apikey-login');
  await page.click('details.apikey button');
  await page.waitForLoadState('networkidle');

  // 2. Console landing shows the setup guidance banner.
  await caption(page, 'Guided setup',
    'The console flags what is still missing: single sign-on and Stripe billing');
  await sleep(2600);
  await shot(page, '02-banner');

  // 3. Configure SSO (point at the live Keycloak).
  await page.goto(C + '/console/sso', { waitUntil: 'networkidle' });
  await caption(page, 'Configure single sign-on (OIDC)',
    'Register the shown redirect URI in the IdP, then enter issuer + client');
  await sleep(2200);
  await page.fill('input[name="issuer_url"]', ISSUER);
  await page.fill('input[name="client_id"]', CLIENT);
  await sleep(1200);
  await shot(page, '03-sso-form');
  await page.click('form[action="/console/sso"] button');
  await page.waitForLoadState('networkidle');
  await caption(page, 'SSO configured', 'Stored for this tenant; secrets encrypted at rest');
  await sleep(2200);
  await shot(page, '04-sso-saved');

  // 4. Configure Stripe billing.
  await page.goto(C + '/console/billing', { waitUntil: 'networkidle' });
  await caption(page, 'Configure Stripe billing',
    'Keys are encrypted at rest; price maps grant credits on webhook');
  await sleep(2000);
  await page.fill('input[name="stripe_secret_key"]', 'sk_test_demo_key');
  await page.fill('input[name="stripe_webhook_secret"]', 'whsec_demo');
  await page.fill('input[name="topup_price_map"]', '{"price_10k": {"credits_micro": 10000000000}}');
  await sleep(1200);
  await shot(page, '05-stripe-form');
  await page.click('form[action="/console/billing/config"] button');
  await page.waitForLoadState('networkidle');
  await caption(page, 'Stripe configured', 'The buy-credits form is now enabled');
  await sleep(2200);
  await shot(page, '06-stripe-saved');

  // 5. Banner is gone now that setup is complete.
  await page.goto(C + '/console/account', { waitUntil: 'networkidle' });
  await caption(page, 'Setup complete', 'No more guidance banner — SSO and billing are configured');
  await sleep(2200);
  await shot(page, '07-setup-done');

  // 6. Sign out and log back in via REAL single sign-on (Keycloak).
  await page.click('form[action="/logout"] button');
  await page.waitForLoadState('networkidle');
  await caption(page, 'Now sign in the normal way — single sign-on',
    'Choose the organization and continue to the identity provider');
  await sleep(2200);
  await shot(page, '08-login-sso');
  await page.click('text=Continue with SSO');
  await page.waitForLoadState('networkidle');
  await sleep(1200);
  await caption(page, 'Real SSO — Keycloak', 'Authenticating against the tenant IdP (live container)');
  await sleep(1500);
  await shot(page, '09-keycloak');
  await page.fill('#username', KC_USER).catch(async () => { await page.fill('input[name=username]', KC_USER); });
  await page.fill('#password', KC_PASS).catch(async () => { await page.fill('input[name=password]', KC_PASS); });
  await sleep(800);
  await page.click('#kc-login').catch(async () => { await page.click('button[type=submit]'); });
  await page.waitForLoadState('networkidle');
  await sleep(1500);
  await caption(page, 'Signed in via SSO',
    'Provisioned/bound from the IdP claims — same session the API uses');
  await sleep(2400);
  await shot(page, '10-sso-done');

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) console.log('VIDEO_PATH=' + (await video.path()));
}
run().catch((e) => { console.error(e); process.exit(1); });
