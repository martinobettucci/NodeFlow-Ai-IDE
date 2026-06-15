// Records a narrated walkthrough of the gateway web console (the optional
// standalone GUI). It shows the OIDC login gate, then — with a session
// cookie standing in for a completed SSO login — tours every section and
// creates real resources (a team, an API key with once-only reveal) through
// the GUI. Self-hosted CSS → renders without any CDN.
//
//   CONSOLE_URL=http://127.0.0.1:9100 COOKIE=<gateway_session value> \
//   OUT_DIR=/tmp/console SHOTS_DIR=/tmp/cshots node e2e/record-console.mjs

import { chromium } from '@playwright/test';

const URLB = process.env.CONSOLE_URL || 'http://127.0.0.1:9100';
const COOKIE = process.env.COOKIE || '';
const OUT_DIR = process.env.OUT_DIR || '/tmp/console';
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

async function shot(page, name) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }).catch(() => {});
}

async function visit(page, path, title, subtitle, name) {
  await page.goto(URLB + path, { waitUntil: 'networkidle' });
  await caption(page, title, subtitle);
  await sleep(1900);
  await shot(page, name);
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // 1. Unauthenticated → OIDC login gate.
  await page.goto(URLB + '/console/account', { waitUntil: 'networkidle' });
  await caption(page, 'Gateway web console — optional standalone GUI',
    'Unauthenticated requests are redirected to single sign-on (per-tenant OIDC)');
  await sleep(2600);
  await shot(page, '01-login');

  // 2. Sign in (cookie stands in for a completed OIDC round-trip).
  await context.addCookies([{
    name: 'gateway_session', value: COOKIE, url: URLB,
    httpOnly: true, sameSite: 'Lax',
  }]);
  await page.goto(URLB + '/console/account', { waitUntil: 'networkidle' });
  await caption(page, 'Signed in (org admin + operator)',
    'Real login bounces through the tenant IdP (Keycloak); the cookie here represents that session');
  await sleep(2400);
  await shot(page, '02-account');

  // 3. Tour each section.
  await visit(page, '/console/keys', 'Account · API keys',
    'Users mint and revoke their own keys — created keys are revealed once', '03-keys');

  // Create a key through the GUI (shows the once-only reveal).
  await page.fill('input[name="name"]', 'demo key from console');
  await caption(page, 'Creating an API key via the GUI', 'No API call — the form does it');
  await sleep(1200);
  await page.click('form[action="/console/keys"] button');
  await page.waitForLoadState('networkidle');
  await caption(page, 'Account · API keys',
    'The new key is shown once, with copy-to-clipboard; only a hash is stored');
  await sleep(2400);
  await shot(page, '04-key-created');

  await visit(page, '/console/usage', 'Account · Usage & spend',
    'Per-node run counts and credit spend, attributed to the user', '05-usage');
  await visit(page, '/console/users', 'Admin · Users',
    'Invite users (OIDC-bound on first login), set roles, status and billing team', '06-users');
  await visit(page, '/console/teams', 'Admin · Teams',
    'Create teams (each gets a wallet) and manage memberships', '07-teams');

  // Create a team through the GUI.
  await page.fill('form[action="/console/teams"] input[name="name"]', 'Design');
  await page.click('form[action="/console/teams"] button');
  await page.waitForLoadState('networkidle');
  await caption(page, 'Admin · Teams', 'Team created through the GUI (flash confirms)');
  await sleep(2000);
  await shot(page, '08-team-created');

  await visit(page, '/console/groups', 'Admin · Groups',
    'Team-scoped groups for finer policy targeting', '09-groups');
  await visit(page, '/console/profiles', 'Admin · Profiles',
    'Reusable policy bundles, assignable to users and teams', '10-profiles');
  await visit(page, '/console/policies', 'Admin · Policies',
    'allow/deny + rate, usage, budget and concurrency — org layer vs restrict-only team layer', '11-policies');
  await visit(page, '/console/backends', 'Admin · Backends',
    'Register upstream NodeFlow backends; nodes are namespaced {slug}::{node}', '12-backends');
  await visit(page, '/console/wallets', 'Admin · Wallets',
    'Credit balances; adjustments hit the append-only ledger and audit log', '13-wallets');
  await visit(page, '/console/audit', 'Admin · Audit log',
    'Every control-plane mutation is recorded', '14-audit');
  await visit(page, '/console/billing', 'Billing',
    'Stripe top-up / subscription checkout and subscription status', '15-billing');
  await visit(page, '/console/operator/tenants', 'Operator · Tenants',
    'Onboard organizations with their own OIDC provider', '16-operator');

  await caption(page, 'Web console — full control-plane parity',
    'Same OIDC, roles, validation and audit as the API · no CDN · runs as its own process');
  await sleep(2600);

  const video = page.video();
  await context.close();
  await browser.close();
  if (video) console.log('VIDEO_PATH=' + (await video.path()));
}

run().catch((e) => { console.error(e); process.exit(1); });
