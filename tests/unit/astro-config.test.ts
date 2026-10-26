import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

describe('astro.config.mjs', () => {
  it('has an https site at the root path', () => {
    expect(config.site).toBeDefined();
    const url = new URL(config.site!);
    expect(url.protocol).toBe('https:');
    expect(url.pathname).toBe('/');
  });

  it('uses trailing slashes on every URL', () => {
    expect(config.trailingSlash).toBe('always');
  });
});
