/**
 * Tests for the entry point: its service worker callbacks and its error handling
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ServiceWorkerConfig } from './utils/serviceWorkerRegistration';

const { register, showUpdateNotification } = vi.hoisted(() => ({
  register: vi.fn<(config?: ServiceWorkerConfig) => void>(),
  showUpdateNotification: vi.fn<(registration: ServiceWorkerRegistration) => void>(),
}));

vi.mock('./utils/serviceWorkerRegistration', () => ({ register }));
vi.mock('./utils/updatePrompt', () => ({ showUpdateNotification }));
// What main.tsx renders is not what these tests are about. A real root would also leave
// React's passive effects scheduled, and their flush reads window.event, so once the test
// environment is torn down it fails with "window is not defined".
vi.mock('./App.tsx', () => ({ default: () => null }));
vi.mock('react-dom/client', () => ({ createRoot: () => ({ render: () => {} }) }));

const registration = {} as ServiceWorkerRegistration;

/**
 * Run main.tsx in a fresh module graph, as a page that loads does: a module runs only the
 * first time it is imported
 * @returns The callbacks main.tsx gives register()
 */
async function runMain(): Promise<ServiceWorkerConfig> {
  vi.resetModules();
  register.mockClear();
  document.body.innerHTML = '<div id="root"></div>';
  await import('./main.tsx');
  const config = register.mock.lastCall?.[0];
  if (!config) throw new Error('main.tsx did not register the service worker');
  return config;
}

describe('main.tsx', () => {
  afterEach(async () => {
    // The handler main.tsx set up, in the module graph it ran in
    (await import('./utils/globalErrorHandler')).cleanupGlobalErrorHandler();
    vi.restoreAllMocks();
  });

  it('shows the update prompt for an update that is waiting', async () => {
    const config = await runMain();

    config.onUpdate?.(registration);

    expect(showUpdateNotification).toHaveBeenCalledWith(registration);
  });

  it('gives register() the update prompt as its one callback', async () => {
    // register() runs in production builds only, where the logger prints nothing below a
    // warning, so callbacks that only log would never be seen
    const config = await runMain();

    expect(config).toEqual({ onUpdate: showUpdateNotification });
  });

  it('sets up the global error handler', async () => {
    await runMain();

    const { isGlobalErrorHandlerInitialized } = await import('./utils/globalErrorHandler');
    expect(isGlobalErrorHandlerInitialized()).toBe(true);
  });
});
