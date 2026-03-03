import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { toHaveNoViolations } from 'jest-axe'
import React from 'react'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: React.forwardRef((props: any, ref: any) => {
    return React.createElement('img', { ...props, ref })
  }),
}))

// Mock framer-motion for faster tests
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, prop) => {
      return React.forwardRef(({ children, ...props }: any, ref: any) => 
        React.createElement(prop as string, { ...props, ref }, children)
      )
    }
  }),
  AnimatePresence: ({ children }: any) => children,
}))
