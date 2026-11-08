/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 *
 * ErrorBoundary Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const tracker = vi.hoisted(() => ({
  captureReactError: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock('../utils/errorTracking', () => ({
  getErrorTracker: () => tracker,
}));

/** Whether Child throws while rendering */
let childThrows = true;

function Child() {
  if (childThrows) {
    throw new Error('Render failed');
  }
  return <p>Child content</p>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    childThrows = true;
    vi.clearAllMocks();
    // React and the boundary log each error they catch, and these errors are expected
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('renders its children while they render', () => {
    childThrows = false;

    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows its fallback when a child throws while rendering', () => {
    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('reports the error to the error tracker', () => {
    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );

    expect(tracker.captureReactError).toHaveBeenCalledTimes(1);
    expect(tracker.captureReactError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Render failed' }),
      expect.objectContaining({ componentStack: expect.stringContaining('Child') }),
      expect.objectContaining({ component: 'ErrorBoundary' })
    );
    expect(tracker.addBreadcrumb).toHaveBeenCalledWith(
      'React Error Boundary caught error',
      'error',
      { errorMessage: 'Render failed', errorName: 'Error' }
    );
  });

  it('renders the children again on Try Again', () => {
    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );
    childThrows = false;

    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows a custom fallback instead, which gets the error and a reset', () => {
    render(
      <ErrorBoundary
        fallback={(error, _errorInfo, reset) => (
          <button onClick={reset}>Reset after {error.message}</button>
        )}
      >
        <Child />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    childThrows = false;

    fireEvent.click(screen.getByRole('button', { name: 'Reset after Render failed' }));

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows the error details in development', () => {
    vi.stubEnv('DEV', true);

    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
    expect(screen.getByText('Error: Render failed')).toBeInTheDocument();
  });

  it('leaves the error details out of production builds', () => {
    vi.stubEnv('DEV', false);

    render(
      <ErrorBoundary>
        <Child />
      </ErrorBoundary>
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();
  });
});
