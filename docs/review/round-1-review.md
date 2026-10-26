# Round 1 review: Milestone 1.1 (Scaffold and tooling)

Reviewer: Noctowl. Scope: items 1.1.1-1.1.10 of `docs/review/phase-1-plan.md`, uncommitted working tree (excluding `CLAUDE.md`, `.claude/`).

## Checks run (Node v24.22.1, `npm_config_script_shell` set to Git bash)

| Command | Result |
|---|---|
| `npm run check` | pass (8 files, 0 errors / 0 warnings / 0 hints) |
| `npm run lint` | pass |
| `npm run build` | pass (1 page, `dist/index.html`, static) |
| `npm run test` | pass (1 file, 2 tests, Vitest 5.0.5) |
| `npm run e2e` | pass (2 tests: desktop + mobile) |

Lint probe: a throwaway `.astro` file with `<img>` lacking `alt`, `href="#"` and `set:html` raised `astro/jsx-a11y/alt-text`, `astro/jsx-a11y/anchor-is-valid` and `astro/no-set-html-directive` as errors, so the a11y and set:html rules are actually wired. The probe file was deleted.

CI action majors (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-artifact@v7`) match the current latest releases.

## BLOCKING

None.

## MINOR

1. `package.json:30`: the plan (1.1.1) specifies `eslint-plugin-jsx-a11y`; the code uses `eslint-plugin-jsx-a11y-x`. The substitution is justified (`eslint-plugin-jsx-a11y@6.10.2` peers on `eslint ^3 ... ^9`, and this repo is on ESLint 10; `eslint-plugin-astro` explicitly supports the `-x` fork as a fallback). Direction: record the deviation and its reason in the phase plan or README so a later "fix to match the plan" doesn't reintroduce a peer conflict.

2. `package.json:27`: `@types/node` was added beyond the plan's dependency list. It is needed for `process.env` in `playwright.config.ts`, so keep it; just note it alongside item 1 as an intentional addition.

3. `playwright.config.ts:24-25`: the `mobile` project is `Desktop Chrome` with a 375x812 viewport, so `isMobile`, `hasTouch` and the mobile user agent are off. That meets the plan's literal "Chromium 375x812", but the 1.2.12 overflow and nav checks would better reflect real phones with mobile emulation on. Direction: consider setting `isMobile: true` / `hasTouch: true` (or a Chromium-based phone descriptor) before 1.2.12 lands.
