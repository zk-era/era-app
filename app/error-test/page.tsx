"use client";

/**
 * Error Boundary Test Page
 * 
 * This page intentionally throws errors to demonstrate the ErrorBoundary.
 * Visit /error-test to see the error boundary in action.
 */

import { useState } from "react";

export default function ErrorTestPage() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    // Intentionally throw an error to trigger ErrorBoundary
    throw new Error("This is a test error to demonstrate ErrorBoundary!");
  }

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-6 px-4">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#303030]/50 bg-[#121212] p-8 text-center">
        <h1 className="text-2xl font-bold">Error Boundary Test</h1>
        
        <p className="text-sm text-[#7b7b7b]">
          Click the button below to trigger a React error and see the ErrorBoundary in action.
        </p>

        <button
          onClick={() => setShouldError(true)}
          className="mt-4 rounded-xl bg-red-600 px-6 py-3 font-semibold transition-colors hover:bg-red-700"
        >
          Trigger Error
        </button>

        <div className="mt-4 rounded-lg bg-[#1a1a1a] p-4 text-left text-xs text-[#7b7b7b]">
          <p className="mb-2 font-semibold text-white">What will happen:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>This component will throw a React error</li>
            <li>ErrorBoundary will catch it</li>
            <li>You&apos;ll see a graceful error UI</li>
            <li>Click &quot;Try again&quot; to reset</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
