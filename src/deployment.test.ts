import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type StaticWebAppConfig = {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; headers?: Record<string, string> }>;
};

describe('static deployment policy', () => {
  it('keeps app documents and the service worker update-checkable', () => {
    const config = loadConfig();
    expect(config.globalHeaders['Cache-Control']).toBe('public, max-age=30, must-revalidate');
  });

  it('makes Vite content-hashed JS and CSS immutable', () => {
    const config = loadConfig();
    const assetRoute = config.routes.find((route) => route.route === '/assets/index-*.{js,css}');
    expect(assetRoute?.headers?.['Cache-Control']).toBe('public, max-age=31536000, immutable');
  });

  it('has a CSP that permits only the local PWA shell and QR data image', () => {
    const policy = loadConfig().globalHeaders['Content-Security-Policy'];
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("img-src 'self' data:");
    expect(policy).toContain("script-src 'self'");
  });
});

function loadConfig(): StaticWebAppConfig {
  return JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as StaticWebAppConfig;
}
