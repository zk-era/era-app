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

// Mock wagmi hooks (Web3 functionality)
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
  }),
  useBalance: () => ({
    data: { value: BigInt('1000000000000000000'), formatted: '1.0', symbol: 'ETH' },
    isLoading: false,
  }),
  useChainId: () => 11155111, // Sepolia
  useConfig: () => ({}),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [],
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
  useSwitchChain: () => ({
    switchChain: vi.fn(),
  }),
}))

// Mock ERA API
vi.mock('@/lib/api/era', () => ({
  eraApi: {
    getEstimate: vi.fn().mockResolvedValue({
      eraCostUsd: '0.12',
      directL1CostUsd: '0.45',
      savingsUsd: '0.33',
      savingsPercent: 73,
    }),
    submitSwap: vi.fn().mockResolvedValue({ jobId: 'test-job-123' }),
    getStatus: vi.fn().mockResolvedValue({ status: 'completed' }),
  },
}))

// Mock Chain Context
vi.mock('@/lib/context/ChainContext', () => ({
  useChainInfo: () => ({
    chainIcon: '/ethereum.svg',
    chainName: 'Sepolia',
  }),
}))
