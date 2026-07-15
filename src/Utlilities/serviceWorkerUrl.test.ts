import { describe, expect, it } from '@jest/globals';
import { getServiceWorkerUrl } from './serviceWorkerUrl';

describe('service worker URL', () => {
  it('uses the base path and a cache-busting deployment version', () => {
    expect(getServiceWorkerUrl('/valgaron/', 'commit-123')).toBe(
      '/valgaron/sw.js?version=commit-123'
    );
    expect(getServiceWorkerUrl('/', 'version with spaces')).toBe(
      '/sw.js?version=version%20with%20spaces'
    );
  });

  it('uses a stable local fallback when no deployment version is provided', () => {
    expect(getServiceWorkerUrl('/', undefined)).toBe(
      '/sw.js?version=local-build'
    );
  });
});
