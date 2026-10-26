# Tester report: Phase 1, Milestone 1.1 (Scaffold and tooling)

Tester: Ditto. Source: `docs/PLAN.md` Milestone 1.1 and items 1.1.1-1.1.10 of `docs/review/phase-1-plan.md`. Node v24.22.1, Windows 11, `npm_config_script_shell` set to Git bash for each command.

## Tests added

- `tests/unit/scaffold.test.ts` (Vitest, 25 tests): package.json, `.nvmrc`, astro config, tsconfig, source files, git files, CI workflow, README, and ESLint behaviour through the `ESLint` API.
- `e2e/scaffold.spec.ts` (Playwright, 9 tests x 2 projects): placeholder homepage against the built site.

Existing `tests/unit/astro-config.test.ts` and `e2e/smoke.spec.ts` are unchanged.

## Results

| Command | Result |
|---|---|
| `npm run check` | pass, 0 errors |
| `npm run lint` | pass |
| `npm run test` | pass, 27/27 |
| `npm run e2e` (default workers, 6 on this 12-core box) | FAIL, intermittently. 4 to 12 of 20 tests time out in `page.goto`. Reproduced 6 times. |
| `npx playwright test --workers=1`, `--workers=2` and `--workers=3` | pass, 20/20 (5 runs) |

## Milestone clauses covered

| Clause | Tests |
|---|---|
| 1.1.1 `type: module`, `private`, `engines >=24.16.0`, the seven exact scripts, deps and devDeps, lockfile, `.nvmrc` = 24, running Node satisfies engines | `scaffold.test.ts` "package.json", "Node version" |
| 1.1.2 `build.format: 'directory'`, Tailwind Vite plugin registered, `compressHTML` not overridden (site and trailingSlash are already covered by the harness test) | "astro.config.mjs" |
| 1.1.3 tsconfig extends strict, includes `.astro/types.d.ts` and `**/*`, excludes `dist` | "tsconfig.json" |
| 1.1.4 `global.css` holds only the Tailwind import and `index.astro` imports it. The built page serves `text/html` with a utf-8 charset, a viewport, the title `AJ Gebara`, a non-empty description and one visible h1. Tailwind preflight actually applies (h1 margin 0, font-size inherited) | "source files"; `scaffold.spec.ts` "serves HTML...", "loads Tailwind through global.css" |
| 1.1.5 ESLint: a clean `.astro` page has no errors; `set:html` is an `astro/no-set-html-directive` error; `<img>` without alt is flagged by jsx-a11y `alt-text`; `any` hits `@typescript-eslint/no-explicit-any`; `dist`, `.astro`, `playwright-report`, `test-results` and `node_modules` are ignored | "ESLint config" |
| 1.1.6 Vitest picks up `tests/**/*.test.ts` (the new file runs) | implicit |
| 1.1.7 Desktop 1280 and mobile 375 projects: no horizontal overflow, no console errors or failed or 4xx requests, every img has alt, axe (wcag2a/aa, 21a/aa) has zero violations in light and dark `prefers-color-scheme`, unknown route returns 404, build writes `dist/index.html` | `scaffold.spec.ts` |
| 1.1.8 `.gitignore` has all nine entries; `.gitattributes` sets `* text=auto eol=lf` | "git config files" |
| 1.1.9 CI triggers on push and pull_request, `contents: read`, checkout, setup-node with `.nvmrc` and npm cache, then `npm ci`, playwright install, check, lint, test and e2e in that order, and uploads the report on `failure()` | "CI workflow" |
| 1.1.10 README Development section mentions Node 24, `npm install`, `npx playwright install chromium` and all seven `npm run` scripts | "README" |

## Not testable here, and why

- "CI green": this needs a real GitHub Actions run. The workflow is only checked statically.
- 1.1.0 and 1.1.11 belong to AJ (Node install and the read-through).
- Navigation, links, keyboard focus, the skip link, theme toggle, Open Graph meta and a custom 404 page: none of these exist in 1.1 (the homepage has no links or focusable elements, and 1.2/1.3 add layout, theme and SEO). The 404 check only asserts the status code. The dark-mode test only emulates the OS preference, because there are no theme styles yet.
- Empty or missing content entries: there are no content collections in 1.1.
- The jsx-a11y package swap (`eslint-plugin-jsx-a11y-x`) is accepted in the verdict. The test checks the rule fires, not the package name.

## Bugs found

### BLOCKING: `npm run e2e` is unreliable locally at the default worker count

- Where: `playwright.config.ts:3-30`. No `workers` is set, so Playwright uses half the cores (6 here).
- Clause: Milestone 1.1 outcome, "every npm script from CLAUDE.md working", and CLAUDE.md's definition of satisfied (`npm run e2e` passes).
- Repro: `npm_config_script_shell="C:\Program Files\Git\usr\bin\bash.exe" npm run e2e`. 4 to 12 tests fail with `page.goto: Test timeout of 30000ms exceeded`, waiting for "load". With `npx playwright test --workers=2` all 20 pass.
- Evidence: in a failing trace, the document request to `http://localhost:4321/` gets no response (status -1). While a 6-worker run was going, `curl -m 3 http://localhost:4321/` from outside also timed out several times. Outside the runner, 24 concurrent curls and 12 pages across 6 Chromium instances in one process all succeed. So the preview server stalls only when 4 or more Playwright workers run at once. This happened whether the server was started by Playwright's `webServer`, by `npm run preview` or by `node node_modules/astro/bin/astro.mjs preview`. The old 2-test suite never showed it because it never had more than 2 workers.
- Also: `astro preview` listens on `::1` only. `127.0.0.1:4321` refused every request. This doesn't matter while every URL says `localhost`.
- Suggested fix (config, not mine to edit): set `workers: process.env.CI ? undefined : 2` in `playwright.config.ts`, or find out why the server stalls, for example by binding `--host 127.0.0.1` and pointing `baseURL` at it. GitHub's 4-vCPU runners default to 2 workers, so CI probably isn't affected, but that is unverified.
- I did not mark the tests `test.fails`, because each one passes on its own. The flake comes from the harness.

### Non-blocking

None.
