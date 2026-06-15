import { expect, test } from '@playwright/test';

// Demonstrates the IDE-side gateway feature shipped on this branch: an
// optional, locally-stored API key per backend, sent inside the session
// handshake. Runs against `vite preview` (no gateway needed) and records a
// video under e2e/videos as proof of the feature.
test('Settings → Backends exposes a per-backend API key field', async ({ page }) => {
  await page.goto('/');

  const settingsHeading = page.getByRole('heading', { name: 'Settings' });
  if (!(await settingsHeading.isVisible().catch(() => false))) {
    await page.getByTitle('Settings').click();
  }
  await page.getByRole('button', { name: 'Backends' }).click();

  const url = page.getByPlaceholder('http://localhost:8000');
  const apiKey = page.getByPlaceholder(/API key/i);
  await expect(url).toBeVisible();
  await expect(apiKey).toBeVisible();
  // The key is sensitive: rendered as a password field.
  await expect(apiKey).toHaveAttribute('type', 'password');

  await url.fill('http://localhost:9000');
  await apiKey.fill('nfk_demo_key');
  await expect(page.getByRole('button', { name: 'Add' })).toBeEnabled();
});
