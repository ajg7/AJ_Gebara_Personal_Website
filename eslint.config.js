import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';

export default [
  { ignores: ['dist/', '.astro/', 'playwright-report/', 'test-results/', 'node_modules/'] },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  ...eslintPluginAstro.configs['jsx-a11y-recommended'],
  { rules: { 'astro/no-set-html-directive': 'error' } },
];
