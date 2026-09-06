import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type StaticWebAppConfig = {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; rewrite?: string; headers?: Record<string, string> }>;
  mimeTypes: Record<string, string>;
  responseOverrides: Record<string, { rewrite: string }>;
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

  it('serves the manifest with its registered media type', () => {
    expect(loadConfig().mimeTypes['.webmanifest']).toBe('application/manifest+json');
  });

  it('keeps app deep links while unknown paths use the designed 404 page', () => {
    const config = loadConfig();
    expect(config.routes.find((route) => route.route === '/demo')?.rewrite).toBe('/index.html');
    expect(config.routes.find((route) => route.route === '/demo/layout/*')?.rewrite).toBe('/index.html');
    expect(config.routes.find((route) => route.route === '/layout/*')?.rewrite).toBe('/index.html');
    expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  });
});

function loadConfig(): StaticWebAppConfig {
  return JSON.parse(readFileSync(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as StaticWebAppConfig;
}
