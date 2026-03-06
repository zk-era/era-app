import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { toHaveNoViolations } from 'jest-axe'
import React from 'react'

// Disable animations in test environment for reliable testing
process.env.FRAMER_MOTION_DISABLE_ANIMATIONS = 'true'

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
  MotionConfig: ({ children }: any) => children,
}))

// Mock NumberFlow component (used in SwapInputStep for animated numbers)
vi.mock('@number-flow/react', () => ({
  default: ({ children, ...props }: any) => React.createElement('span', props, children)
}))

// Mock react-use-measure hook (used in SwapInputStep for dynamic width measurements)
vi.mock('react-use-measure', () => ({
  default: () => [
    vi.fn(), 
    { width: 100, height: 20, top: 0, left: 0, bottom: 20, right: 100, x: 0, y: 0 }
  ]
}))
