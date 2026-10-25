# Phase 1 plan: Foundation (Milestones 1.1, 1.2, 1.3)

Source of truth: `docs/PLAN.md`, Phase 1. Owner legend: **AJ** writes it, **Claude** writes it, **AJ (ops)** is an account or dashboard action.

## Context

The repo is empty apart from `CLAUDE.md`, `README.md` and `.claude/agents/`. Every later phase depends on three things that don't exist yet:
1. A working Astro 7 project with the npm scripts the agent loop runs (`check`, `lint`, `build`, `test`, `e2e`). Without these, the gatekeeper can't decide anything.
2. One layout, a set of design tokens and one head/SEO component that every page reuses. Doing these once now stops each later page from inventing its own.
3. A live deploy at the canonical domain, so canonical URLs, the sitemap and robots point at the real host from day one, and Search Console starts collecting data early.

Environment facts that shape this plan:
- AJ's Node is **22.17.0**. `astro@7.4.2` declares `node >=22.23.4`, and `eslint-plugin-astro@3.2.1` declares `^22.22.3 || ^24.16.0 || >=26.3.0`. Node must be upgraded before `npm install`.
- `origin` is `https://github.com/ajg7/AJ_Gebara_Personal_Website` and it is **public** (the GitHub API returned 200 unauthenticated). That matters for the scheduled-workflow inactivity rule in Phase 4 and for Giscus in Phase 8.
- `core.autocrlf=true` on this machine. Add a `.gitattributes` with `* text=auto eol=lf` so line endings stay stable across Windows, CI and Vercel.

## Approach

Hand-write the minimal Astro project instead of running `npm create astro`. The interactive scaffolder won't write into a non-empty directory cleanly, and the minimal template is only about five files. Then add Tailwind 4 through its Vite plugin (the official Astro path), ESLint flat config, Vitest through Astro's `getViteConfig`, and Playwright against the built site. Keep output fully static with **no adapter** (Vercel doesn't need one for static sites; the adapter arrives in Phase 6). There is no UI framework: interactive bits are Astro components with bundled `<script>`.

URL policy, decided now because it affects canonicals and the sitemap: `build.format: 'directory'` plus Astro `trailingSlash: 'always'` plus `vercel.json` `trailingSlash: true`. Every page has exactly one URL, ending in `/`. Files with extensions (`/robots.txt`, `/rss.xml`) are not redirected.

Theme policy: semantic color tokens are plain CSS variables that switch per theme and are exposed to Tailwind through `@theme inline`. Components use `bg-canvas text-fg` and almost never need `dark:`. An inline pre-paint script always resolves the theme into `data-theme` on `<html>` (from `localStorage`, else `matchMedia`). A `prefers-color-scheme` media block covers no-JS visitors. Tailwind's `dark:` variant is overridden to key on `[data-theme=dark]` for the rare utility that needs it.

## Steps

### Milestone 1.1: Scaffold and tooling

| # | Owner | Item | Files |
|---|---|---|---|
| 1.1.0 | **AJ (ops)** | Install Node 24 LTS (>= 24.16.0), for example with `winget install OpenJS.NodeJS.LTS` or nvm-windows. Confirm with `node -v`. Set the Vercel project's Node version to 24.x later (1.3). | none |
| 1.1.1 | Claude | `package.json`: `"type": "module"`, `"private": true`, `"engines": { "node": ">=24.16.0" }`. Scripts, exactly: `dev: astro dev`, `build: astro build`, `preview: astro preview`, `check: astro check`, `lint: eslint .`, `test: vitest run`, `e2e: playwright test`. Deps: `astro`, `tailwindcss`, `@tailwindcss/vite`. DevDeps: `@astrojs/check`, `typescript`, `eslint`, `eslint-plugin-astro`, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `vitest`, `@playwright/test`, `@axe-core/playwright`. Use `npm install` to generate and keep `package-lock.json`. | `package.json`, `package-lock.json`, `.nvmrc` (`24`) |
| 1.1.2 | Claude | `astro.config.mjs`: `site: 'https://ajgebara.com'`, `trailingSlash: 'always'`, `build: { format: 'directory' }`, `vite: { plugins: [tailwindcss()] }`. Leave `compressHTML` at its Astro 7 default (`'jsx'`), and check for inline whitespace in 1.2. | `astro.config.mjs` |
| 1.1.3 | Claude | `tsconfig.json` extends `astro/tsconfigs/strict`, includes `.astro/types.d.ts` and `**/*`, excludes `dist`. | `tsconfig.json` |
| 1.1.4 | Claude | `src/styles/global.css` with `@import "tailwindcss";` only (AJ fills tokens in 1.2). Placeholder `src/pages/index.astro`: `<html lang="en">`, charset, viewport, `<title>AJ Gebara</title>`, a meta description, one `<h1>`, and it imports `global.css`. | `src/styles/global.css`, `src/pages/index.astro` |
| 1.1.5 | Claude | `eslint.config.js` (flat): `typescript-eslint` recommended, `eslintPluginAstro.configs.recommended` and `configs['jsx-a11y-recommended']`, rule `astro/no-set-html-directive: error`. Ignores `dist/`, `.astro/`, `playwright-report/`, `test-results/`, `node_modules/`. | `eslint.config.js` |
| 1.1.6 | Claude | `vitest.config.ts` using `getViteConfig` from `astro/config`, `test.include: ['src/**/*.test.ts', 'tests/**/*.test.ts']`. One harness test, `tests/unit/astro-config.test.ts`, asserts the config's `site` is an `https:` URL with path `/` and `trailingSlash` is `'always'`. | `vitest.config.ts`, `tests/unit/astro-config.test.ts` |
| 1.1.7 | Claude | `playwright.config.ts`: `testDir: 'e2e'`; `webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4321/', reuseExistingServer: !process.env.CI, timeout: 120_000 }`; projects `desktop` (Chromium 1280x800) and `mobile` (Chromium 375x812). `e2e/smoke.spec.ts`: `/` returns 200, `html[lang=en]`, non-empty `<title>`, one `<h1>`, and axe (`wcag2a, wcag2aa, wcag21a, wcag21aa`) reports zero violations. | `playwright.config.ts`, `e2e/smoke.spec.ts` |
| 1.1.8 | Claude | `.gitignore` (`node_modules/`, `dist/`, `.astro/`, `.env`, `.env.*`, `!.env.example`, `.vercel/`, `playwright-report/`, `test-results/`) and `.gitattributes` (`* text=auto eol=lf`). | `.gitignore`, `.gitattributes` |
| 1.1.9 | Claude | CI: `.github/workflows/ci.yml` on `push` and `pull_request`. Steps: `actions/checkout`, `actions/setup-node` with `node-version-file: .nvmrc` and `cache: npm`, `npm ci`, `npx playwright install --with-deps chromium`, then `npm run check`, `npm run lint`, `npm run test`, `npm run e2e` (e2e builds). Upload the Playwright report on failure. Permissions: `contents: read`. | `.github/workflows/ci.yml` |
| 1.1.10 | Claude | README "Development" section: Node 24, `npm install`, the script table from CLAUDE.md, and `npx playwright install chromium` on first run. | `README.md` |
| 1.1.11 | **AJ** | Read-through (no code): run `npm run build` and open `dist/index.html`; read `astro.config.mjs` and `tsconfig.json`; run `npm run dev` and edit the `<h1>`. Concepts: static output and the `dist/` layout, what `directory` format does to URLs, the `astro check` vs `tsc` difference, and how Vite plugins slot into Astro. | none |

### Milestone 1.2: Design tokens and layout shell

| # | Owner | Item | Files |
|---|---|---|---|
| 1.2.1 | Claude | Fonts API in `astro.config.mjs`: `fonts: [{ provider: fontProviders.fontsource(), name: 'JetBrains Mono', cssVariable: '--font-jetbrains-mono', weights: [400, 700], styles: ['normal'], subsets: ['latin'] }]`. The field names come from the config reference nav, but their exact types are **unverified**, so the coder confirms them against https://docs.astro.build/en/reference/configuration-reference/ before writing. If Astro 7 still gates fonts behind `experimental`, use that flag. | `astro.config.mjs` |
| 1.2.2 | Claude | `src/data/site.ts`: `export const site = { name: 'AJ Gebara', url: 'https://ajgebara.com', title: 'AJ Gebara', description: string, locale: 'en_US', author: { name: 'AJ Gebara', handle: 'ajg7' }, crawlers: { allowTraining: true } } as const`. The `url` must match `astro.config.mjs` `site`; a unit test enforces this. | `src/data/site.ts`, `tests/unit/site.test.ts` |
| 1.2.3 | Claude | `src/data/socials.ts`: `export interface Social { id: 'github' \| 'linkedin' \| 'x' \| 'bluesky' \| 'youtube' \| 'mastodon' \| 'devto' \| 'hashnode'; label: string; url: string; handle: string }` and `export const socials: readonly Social[]`. GitHub is `https://github.com/ajg7`. The others are left **empty strings until AJ supplies them**, and a helper `export const activeSocials = socials.filter(s => s.url)` is used by consumers. Unit test: every non-empty `url` is `https:` and ids are unique. | `src/data/socials.ts`, `tests/unit/socials.test.ts` |
| 1.2.4 | Claude | `src/data/nav.ts`: `export const nav: readonly { href: string; label: string }[] = [{ href: '/', label: 'home' }]`. It grows as later phases add routes. Hrefs end in `/`. | `src/data/nav.ts` |
| 1.2.5 | **AJ** | **Design tokens** in `src/styles/global.css`, below the import. (a) `:root` plain variables for light: `--canvas`, `--surface`, `--fg`, `--muted`, `--accent`, `--border`, `--focus`. (b) Dark values for `[data-theme=dark]`, plus the same dark values inside `@media (prefers-color-scheme: dark) { :root:not([data-theme]) {...} }` for no-JS. (c) `@theme inline { --color-canvas: var(--canvas); ... --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace; }`. (d) `@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));`. (e) Base layer: `html { color-scheme: light dark }` and `[data-theme=dark] { color-scheme: dark }` so form controls and scrollbars match. Concepts: Tailwind 4 CSS-first config, why `inline` is needed when a token references a variable that changes per theme, and contrast targets: **fg on canvas >= 7:1, muted >= 4.5:1, accent used as text >= 4.5:1, focus ring >= 3:1 against both canvas and surface, in both themes**. Dark-first: design the dark palette first, then derive light. | `src/styles/global.css` |
| 1.2.6 | **AJ** | **`src/layouts/BaseLayout.astro`**. `interface Props { title: string; description: string }`. Structure: `<html lang="en">`; `<head>` with charset, viewport, `<Font cssVariable="--font-jetbrains-mono" preload />` (from `astro:assets`), the **inline pre-paint theme script** (`<script is:inline>`: read `localStorage.theme`, fall back to `matchMedia('(prefers-color-scheme: dark)')`, set `document.documentElement.dataset.theme`, all inside try/catch), title and description (replaced by `<Seo>` in 1.3), favicon link. `<body class="bg-canvas text-fg font-sans">`: skip link `<a href="#main">` as the **first focusable element**, visible on focus; `<SiteHeader />`; `<main id="main" tabindex="-1">` with `<slot />`; `<SiteFooter />`. Concepts: `is:inline` vs processed scripts (why the theme script must be inline and render-blocking), landmarks, and why the skip-link target needs `tabindex="-1"`. Then move `src/pages/index.astro` onto this layout. | `src/layouts/BaseLayout.astro`, `src/pages/index.astro` |
| 1.2.7 | **AJ** | **`src/components/SiteHeader.astro`**. No props. Reads `nav` from `src/data/nav.ts` and `Astro.url.pathname`. Renders `<header>` with a home link styled as a prompt (`ajgebara:~$`; accessible name "AJ Gebara, home"), `<nav aria-label="Primary"><ul>` of plain `<a>` links with `aria-current="page"` on the active one, and `<ThemeToggle />`. At 375px the links wrap or scroll horizontally. **No hamburger menu.** Concepts: crawlable nav (real `<a href>`), `aria-current`, and why a plain list beats a JS menu for this nav size. | `src/components/SiteHeader.astro` |
| 1.2.8 | **AJ** | **`src/components/ThemeToggle.astro`**. No props. `<button type="button" aria-pressed="false">` with visible text (for example `[dark]`/`[light]`) and the accessible name "Dark theme". Its bundled `<script>` reads the current `data-theme`, syncs `aria-pressed`, flips it on click, and writes `localStorage.theme` (guarded with try/catch). Concepts: Astro bundles and dedupes `<script>` in components, `aria-pressed` toggle semantics, and progressive enhancement (without JS the button is irrelevant and the OS theme applies, so render it `hidden` and unhide it from the script). | `src/components/ThemeToggle.astro` |
| 1.2.9 | **AJ** | **`src/components/PromptHeading.astro`**. `interface Props { level?: 1 \| 2 \| 3; prompt?: string }`, defaults `level = 1`, `prompt = '~$'`. Renders a dynamic heading tag (`const Tag = \`h${level}\``) with `<span aria-hidden="true">{prompt}</span>` before `<slot />` and an optional blinking caret using `motion-safe:` utilities only. Concepts: decorative text must be hidden from assistive tech, so heading text stays clean for screen readers, search engines and AI extractors; dynamic tags in Astro; `motion-safe`/`motion-reduce` variants. | `src/components/PromptHeading.astro` |
| 1.2.10 | Claude | `src/components/SiteFooter.astro`: `<footer>` with a `<nav aria-label="Social">` list from `activeSocials` (each `<a href rel="me noopener noreferrer" target="_blank">`, with visible label text and no icon-only links), a copyright line with the year computed at build time, and an RSS link placeholder **omitted until 2.1**. | `src/components/SiteFooter.astro` |
| 1.2.11 | Claude | `src/pages/404.astro` on `BaseLayout`, with a `PromptHeading` `command not found` and a link home. `public/favicon.svg` (a `>_` glyph that reads in both themes, with a `prefers-color-scheme` style inside the SVG). | `src/pages/404.astro`, `public/favicon.svg` |
| 1.2.12 | Claude | e2e `e2e/layout.spec.ts`: landmarks exist (`banner`, `navigation[name=Primary]`, `main`, `contentinfo`); the first Tab focuses the skip link and Enter moves focus to `main`; the focus ring is visible (computed `outline` not `none`); the theme toggle flips `data-theme` and `aria-pressed`, and the choice persists across reload; `emulateMedia({ colorScheme })` light and dark give the right default `data-theme`; axe has zero violations in both themes on `/` and `/404/`; 375px has no horizontal overflow (`scrollWidth <= clientWidth`); the 404 route returns the custom page. | `e2e/layout.spec.ts` |

### Milestone 1.3: Head/SEO base and first deploy

| # | Owner | Item | Files |
|---|---|---|---|
| 1.3.1 | **AJ** | **`src/components/Seo.astro`**. `interface Props { title: string; description: string; image?: { src: string; alt: string; width: number; height: number }; type?: 'website' \| 'article'; noindex?: boolean }`. Inserted in `BaseLayout`'s `<head>`, replacing the bare title/description; BaseLayout forwards its props. Emits: `<title>` (`${title} \| AJ Gebara`, or just `AJ Gebara` when the title equals `site.title`), `meta description`, `link rel="canonical"` built with `new URL(Astro.url.pathname, Astro.site)`, `og:title`, `og:description`, `og:url` (= canonical), `og:type`, `og:site_name`, `og:locale`, `twitter:card` (`summary_large_image` when an image is given, otherwise `summary`), plus `og:image`, `og:image:alt`, width and height **only when `image` is given** (no placeholder images; real ones arrive in 3.2), `robots noindex` when asked, and `link rel="sitemap"`. Concepts: canonical URLs and the trailing-slash policy, OG vs Twitter tags, why the description must match visible content, and `Astro.site` vs `Astro.url`. | `src/components/Seo.astro`, `src/layouts/BaseLayout.astro` |
| 1.3.2 | **AJ** | **`src/pages/robots.txt.ts`**. `export const GET: APIRoute = ({ site }) => Response` with `Content-Type: text/plain`. Body: `User-agent: *` / `Allow: /`; explicit `Allow` groups for `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`; the training tokens `GPTBot`, `ClaudeBot`, `Google-Extended` with `Allow` or `Disallow` taken from `site.crawlers.allowTraining`; then `Sitemap: ${new URL('sitemap-index.xml', site)}`. Concepts: static endpoints are prerendered to files; robots groups and user-agent token matching; search vs training vs user-triggered agents; robots controls crawling, not indexing. Check that `site` exists on the endpoint context against https://docs.astro.build/en/reference/api-reference/ (**unverified here**); `import.meta.env.SITE` is the fallback. | `src/pages/robots.txt.ts` |
| 1.3.3 | Claude | `@astrojs/sitemap` added to `integrations`, with `filter` excluding `/404/`. `vercel.json`: `{ "$schema": "https://openapi.vercel.sh/vercel.json", "trailingSlash": true }`. | `astro.config.mjs`, `package.json`, `vercel.json` |
| 1.3.4 | Claude | e2e `e2e/seo.spec.ts`: for every route in the built sitemap plus `/404/`, check exactly one `<title>`; a description of 50-160 characters; a canonical that is absolute, `https://ajgebara.com`, and ends in `/`; `og:url` equals the canonical; `og:title`, `og:description` and `og:type` are present; no `og:image` without `og:image:alt`. `/robots.txt` is 200 `text/plain`, contains the `Sitemap:` absolute URL, and has a group for each of the nine tokens. `/sitemap-index.xml` is 200 and lists `https://ajgebara.com/`. `/404/` is excluded from the sitemap. | `e2e/seo.spec.ts` |
| 1.3.5 | Claude | `docs/deploy.md` runbook covering: domain purchase at Cloudflare Registrar (`ajgebara.com`, optional `ajgebara.dev`); creating the Vercel project from `ajg7/AJ_Gebara_Personal_Website` (framework preset Astro, build `npm run build`, output `dist`, Node 24.x); adding the domains in Vercel Settings > Domains, with apex canonical and `www` (and `.dev`) redirecting to `https://ajgebara.com`; copying the **exact A/CNAME values Vercel shows** into Cloudflare DNS with proxy status **DNS only**; verifying HTTPS; Google Search Console (Domain property, DNS TXT) and Bing Webmaster Tools; submitting `sitemap-index.xml`; post-deploy checks (`curl -I` for 308 redirects, 404 status). | `docs/deploy.md` |
| 1.3.6 | **AJ (ops)** | Follow `docs/deploy.md`: buy the domain, create the Vercel project, connect DNS, verify Search Console and Bing, submit the sitemap. | dashboards |

## Security, accessibility, performance notes

**Security**
- Phase 1 has no secrets and no env vars, so there is no `.env.example` yet. `.env*` are gitignored ahead of time.
- Social links open in a new tab with `rel="me noopener noreferrer"`. `rel="me"` matters for Mastodon verification and identity graphs.
- ESLint `astro/no-set-html-directive: error` from day one. No `set:html` anywhere in Phase 1.
- The inline theme script reads only `localStorage` and `matchMedia`, so it can't inject anything. If a CSP is added later, it needs a hash for this script; note it for Phase 6.
- CI workflow permissions are `contents: read`.
- Vercel Preview deployments get `noindex` by default, so previews won't compete with production for the canonical (https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines).

**Accessibility**
- Landmarks, skip link, `aria-current`, `aria-pressed`, and decorative prompt text hidden with `aria-hidden`.
- Visible focus via the `--focus` token: a `focus-visible:` outline of at least 2px with offset, at 3:1 or better against adjacent colors.
- Contrast targets are in 1.2.5 and are checked by axe in both themes. Axe can't judge every case (for example text over gradients), so AJ also spot-checks with a contrast checker.
- `prefers-reduced-motion`: the only motion in Phase 1 is the caret blink, gated by `motion-safe:`.
- No icon-only links. Every control has visible text.

**Performance / SEO**
- Zero framework JS. The only JS is the inline theme script (under 1 KB) and the toggle's bundled script.
- One self-hosted webfont (two weights, latin subset), preloaded once in the layout. Prose uses the system sans stack.
- No images in Phase 1 besides the SVG favicon. `astro:assets` starts in Phase 2.
- Canonical, OG, sitemap and robots from day one. Inline whitespace: Astro 7's `compressHTML: 'jsx'` can drop spaces between inline elements, so check the nav and prompt spacing in the browser.

## Risks and open questions

1. **Node upgrade (blocking).** Nothing installs until AJ is on Node >= 24.16.0.
2. **Fonts API status and field names in Astro 7 (unverified).** The coder confirms them against the config reference before writing 1.2.1.
3. **Vitest 5 + Astro 7 `getViteConfig` + Vite 8 compatibility (unverified).** If it breaks, pin the Vitest major that Astro's testing guide pairs with, and record that in the round review.
4. **`site` on the endpoint context (unverified).** The fallback is `import.meta.env.SITE`.
5. **Domain availability.** RDAP showed `ajgebara.com` unregistered on 2026-10-25. Confirm at checkout. Until DNS is live, `site` still points at `https://ajgebara.com`, which is correct for canonicals because they must name the final host.
6. **Social handles.** Only GitHub (`ajg7`) is known. The footer shows only filled-in profiles, so this doesn't block anything.
7. **Training crawlers.** The default is allow (`site.crawlers.allowTraining: true`); AJ can flip it.
8. **Prose font.** The plan uses system sans for prose. If AJ wants monospace everywhere, only the `font-sans` on `body` changes.

## Research sources

- Node requirement: https://docs.astro.build/en/install-and-setup/ and npm registry metadata for `astro@7.4.2` (`engines.node >=22.23.4`), `eslint-plugin-astro@3.2.1`, `vitest@5.0.5` (`^22.12.0 || ^24.0.0 || >=26.0.0`), checked 2026-10-25
- Astro 7 changes (Vite 8, Rust compiler strict nesting, `compressHTML: 'jsx'`): https://docs.astro.build/en/guides/upgrade-to/v7/
- Tailwind + Astro install: https://tailwindcss.com/docs/installation/framework-guides/astro
- Tailwind `@theme`, `@theme inline`: https://tailwindcss.com/docs/theme
- Tailwind dark variant override: https://tailwindcss.com/docs/dark-mode
- Fonts API: https://docs.astro.build/en/guides/fonts/
- `trailingSlash` / `build.format` pairing: https://docs.astro.build/en/reference/configuration-reference/
- Vercel `trailingSlash` (308, files with extensions not redirected): https://vercel.com/docs/project-configuration/vercel-json#trailingslash
- Static sites need no Vercel adapter: https://docs.astro.build/en/guides/integrations-guide/vercel/
- Endpoints: https://docs.astro.build/en/guides/endpoints/
- Sitemap integration (`site` required, `filter`, `sitemap-index.xml`): https://docs.astro.build/en/guides/integrations-guide/sitemap/
- Testing (Vitest `getViteConfig`, Playwright `webServer` on preview at 4321): https://docs.astro.build/en/guides/testing/
- Axe with Playwright: https://playwright.dev/docs/accessibility-testing
- ESLint Astro flat config and jsx-a11y configs: https://ota-meshi.github.io/eslint-plugin-astro/user-guide/
- AI crawler tokens: https://developers.openai.com/api/docs/bots , https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web , https://docs.perplexity.ai/guides/bots , https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- Vercel custom domains: https://vercel.com/docs/domains/working-with-domains/add-a-domain
- Cloudflare Registrar at-cost: https://www.cloudflare.com/products/registrar/

## Test plan

Unit (Vitest):
- `tests/unit/astro-config.test.ts` (1.1): `site` is https with path `/`, and `trailingSlash === 'always'`.
- `tests/unit/site.test.ts` (1.2): `site.url` equals the config `site` and the description is 50-160 characters.
- `tests/unit/socials.test.ts` (1.2): unique ids, all eight ids present, every non-empty URL is `https:`, and `activeSocials` excludes empty URLs.

E2E (Playwright, desktop 1280 and mobile 375, against the built site):
- `e2e/smoke.spec.ts` (1.1): 200, lang, title, one h1, axe clean.
- `e2e/layout.spec.ts` (1.2): landmarks, skip link, focus visibility, theme default per `colorScheme`, toggle plus persistence, axe in both themes, no horizontal overflow at 375px, 404 page.
- `e2e/seo.spec.ts` (1.3): head meta per route, canonical rules, robots body and tokens, sitemap contents and exclusions.

After the gatekeeper is SATISFIED, the tester adds tests from the milestone text: every route renders, nav links resolve, and meta per page.

## Verification

Commands (all must pass):
```
npm run check
npm run lint
npm run build
npm run test
npm run e2e
```

Browser checks (`npm run build && npm run preview`, http://localhost:4321/):
- **375px (DevTools device mode)** and **desktop (1280px or wider)**, each in **light and dark** (toggle, and also DevTools > Rendering > emulate `prefers-color-scheme` with `localStorage.theme` cleared):
  - No horizontal scroll. Nav is readable and wraps or scrolls cleanly. The prompt heading spacing is intact (watch for `compressHTML: 'jsx'` eating spaces).
  - Tab from the address bar: the skip link appears first, Enter jumps to main, and the focus ring is visible on every link and the toggle.
  - Toggle the theme and reload: no flash of the wrong theme, and the choice persists.
  - DevTools > Rendering > emulate `prefers-reduced-motion: reduce`: the caret doesn't blink.
  - Disable JavaScript: the page follows the OS theme and the toggle is hidden.
  - `/does-not-exist/` shows the custom 404.
- View source: one title, a description, an absolute canonical ending in `/`, OG tags. `/robots.txt` and `/sitemap-index.xml` load.
- After deploy (1.3.6): `curl -I https://www.ajgebara.com/` returns 308 to the apex, `curl -I https://ajgebara.com/about` (once it exists) returns 308 to `/about/`, a missing page returns 404 status, and Search Console accepts the sitemap.

## Handoff

**Coder (Porygon) may start on, in order (Claude-owned):**
1.1.1 to 1.1.10 (after AJ finishes 1.1.0, the Node upgrade): `package.json` and scripts, `astro.config.mjs`, `tsconfig.json`, placeholder page and `global.css` import, ESLint, Vitest plus harness test, Playwright plus smoke test, `.gitignore`/`.gitattributes`, CI workflow, README. Then 1.2.1 to 1.2.4 (fonts config, `site.ts`, `socials.ts`, `nav.ts` plus unit tests), which don't depend on AJ's files.

**AJ writes first:**
1. 1.1.0: upgrade to Node 24 LTS (blocks everything).
2. 1.2.5: design tokens in `src/styles/global.css` (`:root` and `[data-theme=dark]` variables, `@theme inline` mapping, `@custom-variant dark`).
3. 1.2.6: `src/layouts/BaseLayout.astro` with the inline pre-paint theme script and the skip link.
Then 1.2.7 to 1.2.9 (`SiteHeader`, `ThemeToggle`, `PromptHeading`), after which Claude does 1.2.10 to 1.2.12 (footer, 404, favicon, layout e2e tests).
