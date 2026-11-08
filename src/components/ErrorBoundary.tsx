/**
 * DosKit - Cross-Platform DOS Emulator
 * Copyright (c) 2025 Cameron Rye
 * Licensed under the MIT License
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { getErrorTracker } from '../utils/errorTracking';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Shown instead of the default fallback. React renders it before componentDidCatch has
   * the error's component stack, so errorInfo is null at first.
   */
  fallback?: (error: Error, errorInfo: ErrorInfo | null, reset: () => void) => ReactNode;
  /** Called with each error it catches, once its children have been replaced */
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component catches React errors in child components
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // The tracker's report is the one line logged for the error: the console tracker logs it
    // with its component stack
    const tracker = getErrorTracker();
    tracker.captureReactError(error, errorInfo, {
      component: 'ErrorBoundary',
      userAction: 'React component error',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Add breadcrumb for debugging
    tracker.addBreadcrumb('React Error Boundary caught error', 'error', {
      errorMessage: error.message,
      errorName: error.name,
    });

    this.props.onError?.(error);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-message">
              We're sorry, but an unexpected error occurred. Please try refreshing the page.
            </p>

            <div className="error-boundary-actions">
              <button
                className="error-boundary-button primary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
              <button className="error-boundary-button secondary" onClick={this.handleReset}>
                Try Again
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <div className="error-boundary-stack">
                  <h3>Error Message:</h3>
                  <pre>{this.state.error.toString()}</pre>

                  {this.state.error.stack && (
                    <>
                      <h3>Stack Trace:</h3>
                      <pre>{this.state.error.stack}</pre>
                    </>
                  )}

                  {this.state.errorInfo && (
                    <>
                      <h3>Component Stack:</h3>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
