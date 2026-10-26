import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import config from '../../astro.config.mjs';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const pkg = JSON.parse(read('package.json'));

describe('package.json', () => {
  it('is a private ES module requiring Node 24.16+', () => {
    expect(pkg.type).toBe('module');
    expect(pkg.private).toBe(true);
    expect(pkg.engines?.node).toBe('>=24.16.0');
  });

  it('defines every script agents rely on, exactly', () => {
    expect(pkg.scripts).toMatchObject({
      dev: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
      check: 'astro check',
      lint: 'eslint .',
      test: 'vitest run',
      e2e: 'playwright test',
    });
  });

  it('declares the runtime and tooling dependencies', () => {
    expect(Object.keys(pkg.dependencies)).toEqual(
      expect.arrayContaining(['astro', 'tailwindcss', '@tailwindcss/vite']),
    );
    expect(Object.keys(pkg.devDependencies)).toEqual(
      expect.arrayContaining([
        '@astrojs/check',
        'typescript',
        'eslint',
        'eslint-plugin-astro',
        'typescript-eslint',
        'vitest',
        '@playwright/test',
        '@axe-core/playwright',
      ]),
    );
  });

  it('has a lockfile', () => {
    expect(JSON.parse(read('package-lock.json')).lockfileVersion).toBeGreaterThanOrEqual(2);
  });
});

describe('Node version', () => {
  it('.nvmrc pins Node 24', () => {
    expect(read('.nvmrc').trim()).toBe('24');
  });

  it('the running Node satisfies engines', () => {
    const [major, minor] = process.versions.node.split('.').map(Number);
    expect(major > 24 || (major === 24 && minor >= 16)).toBe(true);
  });
});

describe('astro.config.mjs', () => {
  it('builds to directory format', () => {
    expect(config.build?.format).toBe('directory');
  });

  it('registers the Tailwind Vite plugin', () => {
    const plugins = (config.vite?.plugins ?? []) as unknown[];
    const names = plugins.flat(5).map((p) => (p as { name?: string } | null)?.name ?? '');
    expect(names.some((n) => n.includes('tailwindcss'))).toBe(true);
  });

  it('does not override compressHTML', () => {
    expect(config.compressHTML).toBeUndefined();
  });
});

describe('tsconfig.json', () => {
  it('extends Astro strict, includes generated types, excludes dist', () => {
    const ts = JSON.parse(read('tsconfig.json'));
    expect(ts.extends).toBe('astro/tsconfigs/strict');
    expect(ts.include).toEqual(expect.arrayContaining(['.astro/types.d.ts', '**/*']));
    expect(ts.exclude).toContain('dist');
  });
});

describe('source files', () => {
  it('global.css contains only the Tailwind import', () => {
    expect(read('src/styles/global.css').trim()).toBe('@import "tailwindcss";');
  });

  it('index.astro imports global.css', () => {
    expect(read('src/pages/index.astro')).toMatch(/import\s+['"]\.\.\/styles\/global\.css['"]/);
  });
});

describe('git config files', () => {
  it('.gitignore covers build output, secrets and test artifacts', () => {
    const lines = read('.gitignore').split(/\r?\n/).map((l) => l.trim());
    for (const entry of [
      'node_modules/',
      'dist/',
      '.astro/',
      '.env',
      '.env.*',
      '!.env.example',
      '.vercel/',
      'playwright-report/',
      'test-results/',
    ]) {
      expect(lines).toContain(entry);
    }
  });

  it('.gitattributes normalises line endings to LF', () => {
    expect(read('.gitattributes')).toMatch(/^\*\s+text=auto\s+eol=lf\s*$/m);
  });
});

describe('CI workflow', () => {
  const ci = read('.github/workflows/ci.yml');

  it('runs on push and pull_request with read-only contents', () => {
    expect(ci).toMatch(/^on:[\s\S]*^\s+push:/m);
    expect(ci).toMatch(/^on:[\s\S]*^\s+pull_request:/m);
    expect(ci).toMatch(/^permissions:\s*\n\s+contents:\s*read\s*$/m);
  });

  it('sets up Node from .nvmrc with npm cache', () => {
    expect(ci).toContain('actions/checkout');
    expect(ci).toContain('actions/setup-node');
    expect(ci).toMatch(/node-version-file:\s*\.nvmrc/);
    expect(ci).toMatch(/cache:\s*npm/);
  });

  it('runs install and all checks in order', () => {
    const steps = [
      'npm ci',
      'npx playwright install --with-deps chromium',
      'npm run check',
      'npm run lint',
      'npm run test',
      'npm run e2e',
    ];
    const positions = steps.map((s) => ci.indexOf(`run: ${s}`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('uploads the Playwright report on failure', () => {
    expect(ci).toMatch(/if:\s*failure\(\)[\s\S]*upload-artifact[\s\S]*playwright-report/);
  });
});

describe('README', () => {
  const readme = read('README.md');
  const dev = readme.slice(readme.search(/^#+\s*Development/m));

  it('has a Development section', () => {
    expect(readme).toMatch(/^#+\s*Development/m);
  });

  it('documents Node 24, install, Playwright browsers and every script', () => {
    expect(dev).toMatch(/Node 24/);
    expect(dev).toContain('npm install');
    expect(dev).toContain('npx playwright install chromium');
    for (const cmd of ['dev', 'build', 'preview', 'check', 'lint', 'test', 'e2e']) {
      expect(dev).toContain(`npm run ${cmd}`);
    }
  });
});

describe('ESLint config', () => {
  const eslint = new ESLint({ cwd: fileURLToPath(root)});
  const lintAstro = async (code: string) => {
    const [result] = await eslint.lintText(code, { filePath: 'src/pages/__lint-fixture__.astro' });
    return result.messages;
  };

  it('accepts a clean page', async () => {
    const messages = await lintAstro('---\n---\n<h1>Hi</h1>\n');
    expect(messages.filter((m) => m.severity === 2)).toEqual([]);
  });

  it('errors on set:html', async () => {
    const messages = await lintAstro('---\nconst x = "<b>a</b>";\n---\n<div set:html={x} />\n');
    expect(messages).toContainEqual(
      expect.objectContaining({ ruleId: 'astro/no-set-html-directive', severity: 2 }),
    );
  });

  it('flags an image without alt via jsx-a11y', async () => {
    const messages = await lintAstro('---\n---\n<img src="/a.png" />\n');
    expect(messages.some((m) => m.ruleId?.endsWith('alt-text'))).toBe(true);
  });

  it('applies typescript-eslint rules', async () => {
    const [result] = await eslint.lintText('const x: any = 1;\nexport default x;\n', {
      filePath: 'src/__lint-fixture__.ts',
    });
    expect(result.messages.map((m) => m.ruleId)).toContain('@typescript-eslint/no-explicit-any');
  });

  it('ignores build and test output directories', async () => {
    for (const dir of ['dist', '.astro', 'playwright-report', 'test-results', 'node_modules']) {
      expect(await eslint.isPathIgnored(`${dir}/x.js`)).toBe(true);
    }
  });
});
