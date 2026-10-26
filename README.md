# AJ_Gebara_Personal_Website

## Development

Requires Node 24 (see `.nvmrc`; `engines` asks for `>=24.16.0`).

```
npm install
npx playwright install chromium   # first run only, for npm run e2e
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server |
| `npm run build` | Astro build (output in `dist/`) |
| `npm run preview` | Serve the built site |
| `npm run check` | `astro check` (types and `.astro` diagnostics) |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit tests |
| `npx vitest run <file>` | A single unit test file |
| `npm run e2e` | Playwright tests against the built site |
| `npx playwright test <file> -g "<name>"` | A single e2e test |
