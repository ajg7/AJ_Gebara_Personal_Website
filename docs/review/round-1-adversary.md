# Round 1 adversary: Milestone 1.1 (Scaffold and tooling)

Adversary: Gengar. Scope: `docs/review/round-1-review.md` and the uncommitted working tree for items 1.1.1-1.1.10 (excluding `CLAUDE.md`, `.claude/`). Node v24.22.1, `npm_config_script_shell` set to Git bash.

## Reproduced checks

| Command | Result |
|---|---|
| `npm run check` | pass, `Result (8 files): 0 errors, 0 warnings, 0 hints` |
| `npm run lint` | pass (exit 0) |
| `npm run build` | pass, `1 page(s) built`, `dist/index.html` + `dist/_astro/index.DoyyvmZG.css` |
| `npm run test` | pass, `Test Files 1 passed (1), Tests 2 passed (2)`, Vitest v5.0.5 |
| `npm run e2e` | pass, `[desktop]` and `[mobile]` smoke, `2 passed (19.0s)` |

## Reviewer claims

| Claim | Status | Evidence |
|---|---|---|
| All five checks pass | CONFIRMED | Table above. |
| Lint probe: a11y and `set:html` rules are wired | CONFIRMED | Piped `<img src="a.png" />`, `<a href="#">`, `<div set:html={"x"} />` via `node node_modules/eslint/bin/eslint.js --stdin --stdin-filename src/pages/probe.astro` (no file written): 3 errors, `astro/jsx-a11y/alt-text`, `astro/jsx-a11y/anchor-is-valid`, `astro/no-set-html-directive`. |
| CI action majors v7 are current | CONFIRMED | `api.github.com/repos/actions/*/releases/latest`: checkout `v7.0.1`, setup-node `v7.1.0`, upload-artifact `v7.0.2`. |
| BLOCKING: none | CONFIRMED | I found no blocking issue either (see below). |
| MINOR 1: `eslint-plugin-jsx-a11y-x` instead of `eslint-plugin-jsx-a11y` | CONFIRMED, severity right | Installed `-x` peers `eslint ^9 \|\| ^10`; the lint probe shows the rules fire under the `astro/jsx-a11y/*` prefix. Recording the deviation is the right fix. |
| MINOR 2: `@types/node` added | CONFIRMED, severity right | `playwright.config.ts` uses `process.env`. |
| MINOR 3: `mobile` project is `Desktop Chrome` at 375x812 | CONFIRMED, severity right | `playwright.config.ts:24-25`. `isMobile`/`hasTouch` off means the viewport meta is ignored. That doesn't matter for this placeholder page, but it will for 1.2.12. |

The reviewer missed one thing worth confirming. `typescript` is pinned `~6.0.3`, a deliberate deviation from the plan's unversioned `typescript`, and it is correct: `typescript-eslint@8.72` peers `typescript >=4.8.4 <6.1.0`, and `@astrojs/check` peers `^5 || ^6`. The reviewer's MINOR 1 note should also record this pin so nobody bumps it to 6.1.

## Things the reviewer did not check (verified clean)

- **CI lockfile portability.** The lockfile was generated on Windows, which can drop other platforms' optional native binaries (npm/cli#4828). Here it doesn't: `package-lock.json` contains the linux-x64 gnu and musl entries for `@rolldown/binding`, `@tailwindcss/oxide`, `lightningcss` (both copies), `@astrojs/compiler-binding` and `@img/sharp`. `npm ci` on `ubuntu-latest` should resolve them. I couldn't run CI from here, so a real run is still needed to confirm.
- **Peer deps.** `npm ls --all` reports no invalid, missing or extraneous packages.
- **Line endings.** Every new file is LF (`cat -A`, no `^M`). `git ls-files --eol` shows the existing docs as `i/lf w/crlf` with `attr/text=auto eol=lf`, and they don't show as modified, so adding `.gitattributes` causes no renormalization churn.
- **Built output.** `dist/index.html` has `lang="en"`, charset, viewport, title, a description (93 chars), one `<h1>` and the CSS link. The placeholder has no JS and no images, so JS-disabled, slow-network, theme-flash and reduced-motion concerns don't apply until 1.2. OG and canonical belong to 1.3.
- **README.** It covers Node 24, `npm install`, `npx playwright install chromium`, and the script table, which matches CLAUDE.md.

## New findings

### BLOCKING

None.

### MINOR

1. `playwright.config.ts:15` `reuseExistingServer: !process.env.CI`. Locally, if anything is already listening on 4321, Playwright tests it instead of a fresh build. That could be `npm run dev` (which 1.1.11 tells AJ to run, also on 4321) or an old `npm run preview` of a stale `dist/`. The tests can then pass or fail against the wrong server with no warning. This is what the plan specified, so it isn't a defect. Direction: add one README line ("stop `npm run dev`/`preview` before `npm run e2e`"), or use a dedicated port for e2e (`astro preview --port 4322` in the webServer command plus a matching `url`/`baseURL`).
2. `playwright.config.ts` has no `use.trace`, so CI failures upload an HTML report with no trace to debug. Direction: `trace: 'on-first-retry'` (CI already retries twice) and include `test-results/` in the uploaded artifact. This is optional.
3. The README doesn't mention the Windows `&`-in-path problem with npm's cmd shims. Any npm script fails in this checkout without `npm_config_script_shell`. This is specific to the machine, not the code. Direction: AJ decides whether a one-line README note is worth it. Not a code defect.

Not checked: real behavior on GitHub Actions (I only did static lockfile and action-tag checks), and Vercel, which is out of scope until 1.3.
