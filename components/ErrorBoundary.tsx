"use client";

/**
 * React Error Boundary for Web3 Operations
 *
 * Architecture Decision:
 * Web3 interactions (wallet connections, signing, RPC calls) can fail
 * unpredictably due to network issues, user rejection, or wallet bugs.
 * This boundary catches rendering errors and provides a recovery UI
 * instead of crashing the entire app.
 *
 * Placement: Wraps the main content in layout.tsx, inside Web3Provider
 * so wallet context remains available for retry attempts.
 */

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-medium text-white">Something went wrong</p>
          <p className="text-sm text-white/60">
            Please refresh the page or try again later.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
