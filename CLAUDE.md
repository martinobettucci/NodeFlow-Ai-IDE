# CLAUDE.md — NodeFlow AI IDE

Guidance for Claude (and any contributor) working in this repository.

## Definition of Done (MANDATORY for every development OR fix)

No change — feature **or** bug fix — is complete until it ships **both**:

1. **A unit / component test** that asserts the new behaviour and fails
   without the change.
2. **A recorded video test** that visually demonstrates the feature or the
   fix, **sent to the user**.

A change without both is not done. Do not merge, and do not report a task
as finished, until both exist and pass.

### How to satisfy this in this repo

This is a React + Vite + TypeScript app. Tests and videos are produced with
Playwright (already configured).

- **Unit / behaviour test** — add a spec under `e2e/*.spec.ts` (or a
  component test) that asserts the change. Example:
  `e2e/gateway-features.spec.ts` asserts the per-backend API key field.

  ```bash
  npm run test:e2e        # runs Playwright; video: 'on' records every test
  ```

  Recordings land in `e2e/videos/` (gitignored). Each test already produces
  a `video.webm` — that recording IS the per-feature video proof.

- **Demonstration video** — for a user-facing feature, record a narrated
  end-to-end walkthrough and send it to the user:

  ```bash
  # start the IDE preview (and any backends the demo needs), then:
  IDE_URL=http://127.0.0.1:4173 \
  GATEWAY_URL=http://127.0.0.1:9000 GATEWAY_API_KEY=nfk_... \
  OUT_DIR=/tmp/panorama npm run e2e:panorama
  ```

  `e2e/record-panorama.mjs` is the reusable recorder (captioned tour); copy
  it and adapt the steps for the feature under test. Deliver the resulting
  `.webm` to the user.

- Keep `npm run build`, `npm run lint` and `npm run typecheck` green.

## Project conventions

- Backend protocol client lives in `src/services/nodeflow/` — keep it
  wire-compatible with the NodeFlow SDK (and the API gateway, which speaks
  the same protocol).
- The IDE stores no server secrets except the optional per-backend API key,
  kept in `localStorage` and sent only inside the session handshake.
- Match existing code style; prefer text/role-based Playwright selectors so
  tests survive markup tweaks.

## Related repositories

- `NodeFlow-SDK` — backend node framework (protocol source of truth).
- `Nodeflow-API-Gateway` — multi-tenant gateway; a drop-in backend URL that
  aggregates SDK backends behind API keys, policies and credits.
