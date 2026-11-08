/**
 * Tests for the entry point's service worker callbacks
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
 * Run main.tsx in a fresh module graph, so that the logger it uses reads the environment
 * as it is now
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

/** Everything logged below warnings, as one string per call */
function captureInformation() {
  const lines: string[] = [];
  for (const method of ['log', 'info', 'debug'] as const) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      lines.push(args.join(' '));
    });
  }
  return lines;
}

/** Fire every callback main.tsx gives register(), as an install and then an update do */
function fireEvery(config: ServiceWorkerConfig) {
  config.onSuccess?.(registration);
  config.onOfflineReady?.();
  config.onUpdate?.(registration);
}

describe('main.tsx service worker callbacks', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('shows the update prompt for an update that is waiting', async () => {
    const config = await runMain();

    config.onUpdate?.(registration);

    expect(showUpdateNotification).toHaveBeenCalledWith(registration);
  });

  // register() only runs in production builds
  it('logs nothing below warnings in a production build', async () => {
    vi.stubEnv('DEV', false);
    const config = await runMain();
    const lines = captureInformation();

    fireEvery(config);

    expect(lines).toEqual([]);
  });

  it('does not ask for a refresh in development, as the update prompt does that', async () => {
    const config = await runMain();
    const lines = captureInformation();

    fireEvery(config);

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((line) => /refresh/i.test(line))).toEqual([]);
  });
});
