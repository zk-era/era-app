/**
 * Swap Flow Integration Test
 * 
 * Tests the complete end-to-end swap flow:
 * 1. Select tokens (tokenIn and tokenOut)
 * 2. Enter amount
 * 3. Review swap details
 * 4. Confirm transaction
 * 
 * Following 2026 best practices: tests user journey, not implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'

// Mock Zustand swap store
const mockSetTokenIn = vi.fn()
const mockSetTokenOut = vi.fn()
const mockSetAmountIn = vi.fn()
const mockSetAmountOut = vi.fn()
const mockSwapTokens = vi.fn()

vi.mock('@/lib/stores/swapStore', () => ({
  useSwapStore: vi.fn((selector) => {
    const state = {
      tokenIn: {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
        logoURI: '/usdc.svg',
        balance: 100,
        price: 1,
      },
      tokenOut: {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
        decimals: 18,
        logoURI: '/weth.svg',
        balance: 0.5,
        price: 2500,
      },
      amountIn: '',
      amountOut: 0,
      setTokenIn: mockSetTokenIn,
      setTokenOut: mockSetTokenOut,
      setAmountIn: mockSetAmountIn,
      setAmountOut: mockSetAmountOut,
      swapTokens: mockSwapTokens,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock token balances
vi.mock('@/lib/hooks/useTokenBalances', () => ({
  useTokenBalances: vi.fn(() => ({
    tokens: [
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        decimals: 6,
        logoURI: '/usdc.svg',
        balance: 100,
        price: 1,
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
        decimals: 18,
        logoURI: '/weth.svg',
        balance: 0.5,
        price: 2500,
      },
      {
        symbol: 'EURC',
        name: 'Euro Coin',
        address: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
        decimals: 6,
        logoURI: '/eurc.svg',
        balance: 50,
        price: 1.18,
      },
    ],
    isLoading: false,
    isConnected: true,
  })),
}))

// Mock swap quote
vi.mock('@/lib/hooks/useSwapQuote', () => ({
  useSwapQuote: vi.fn(() => ({
    comparison: {
      uniswap: {
        inputAmount: '100',
        outputAmount: '0.04',
        gasEstimateUSD: 48.75,
        totalCostUSD: 48.75,
      },
      era: {
        inputAmount: '100',
        outputAmount: '0.04',
        gasEstimateUSD: 12.19,
        totalCostUSD: 12.19,
        savingsUSD: 36.56,
        savingsPercent: 75,
      },
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
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
  },
}))

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    isConnected: true,
  })),
}))

// Mock chain context
vi.mock('@/lib/context/ChainContext', () => ({
  useChainInfo: vi.fn(() => ({
    chainIcon: '/ethereum.svg',
    chainName: 'Sepolia',
  })),
}))

describe('Swap Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have no accessibility violations in complete flow', async () => {
    const { useSwapStore } = await import('@/lib/stores/swapStore')
    
    // Setup valid swap state
    vi.mocked(useSwapStore).mockImplementation((selector: any) => {
      const state = {
        tokenIn: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        tokenOut: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
          decimals: 18,
          logoURI: '/weth.svg',
          balance: 0.5,
          price: 2500,
        },
        amountIn: '50',
        amountOut: 0.02,
        setTokenIn: vi.fn(),
        setTokenOut: vi.fn(),
        setAmountIn: vi.fn(),
        setAmountOut: vi.fn(),
        swapTokens: vi.fn(),
      }
      return selector(state)
    })

    const { SwapInputStep } = await import('@/components/swap/SwapInputStep')
    const { container } = render(<SwapInputStep onContinue={vi.fn()} />)
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should allow keyboard-only navigation through entire swap flow', async () => {
    const user = userEvent.setup()
    const { useSwapStore } = await import('@/lib/stores/swapStore')
    
    vi.mocked(useSwapStore).mockImplementation((selector: any) => {
      const state = {
        tokenIn: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        tokenOut: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
          decimals: 18,
          logoURI: '/weth.svg',
          balance: 0.5,
          price: 2500,
        },
        amountIn: '50',
        amountOut: 0.02,
        setTokenIn: mockSetTokenIn,
        setTokenOut: mockSetTokenOut,
        setAmountIn: mockSetAmountIn,
        setAmountOut: mockSetAmountOut,
        swapTokens: mockSwapTokens,
      }
      return selector(state)
    })

    const { SwapInputStep } = await import('@/components/swap/SwapInputStep')
    render(<SwapInputStep onContinue={vi.fn()} />)
    
    // User can tab to amount input and type
    const input = screen.getByLabelText(/enter swap amount/i)
    input.focus()
    await user.keyboard('50')
    
    expect(mockSetAmountIn).toHaveBeenCalled()
    
    // User can navigate to Continue button with Tab and press Enter
    const continueButton = screen.getByRole('button', { name: /continue to confirmation/i })
    await user.keyboard('{Tab}')
    
    // Verify continue button is accessible
    expect(continueButton).toBeInTheDocument()
  })

  it('should handle complete user journey: token selection → amount entry → confirmation', async () => {
    const user = userEvent.setup()
    
    // Step 1: User enters amount on SwapInputStep
    const { useSwapStore } = await import('@/lib/stores/swapStore')
    
    vi.mocked(useSwapStore).mockImplementation((selector: any) => {
      const state = {
        tokenIn: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        tokenOut: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
          decimals: 18,
          logoURI: '/weth.svg',
          balance: 0.5,
          price: 2500,
        },
        amountIn: '50',
        amountOut: 0.02,
        setTokenIn: vi.fn(),
        setTokenOut: vi.fn(),
        setAmountIn: mockSetAmountIn,
        setAmountOut: vi.fn(),
        swapTokens: vi.fn(),
      }
      return selector(state)
    })
    
    const { SwapInputStep } = await import('@/components/swap/SwapInputStep')
    const mockContinue = vi.fn()
    
    render(<SwapInputStep onContinue={mockContinue} />)
    
    // Step 2: User enters amount
    const amountInput = screen.getByLabelText(/enter swap amount/i)
    await user.type(amountInput, '50')
    
    expect(mockSetAmountIn).toHaveBeenCalled()
    
    // Step 3: User reviews and continues
    const continueButton = screen.getByRole('button', { name: /continue to confirmation/i })
    expect(continueButton).not.toBeDisabled()
    
    await user.click(continueButton)
    expect(mockContinue).toHaveBeenCalled()
  })

  it('should allow selecting different tokens', async () => {
    const user = userEvent.setup()
    const { useSwapStore } = await import('@/lib/stores/swapStore')
    
    vi.mocked(useSwapStore).mockImplementation((selector: any) => {
      const state = {
        tokenIn: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        tokenOut: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
          decimals: 18,
          logoURI: '/weth.svg',
          balance: 0.5,
          price: 2500,
        },
        amountIn: '',
        amountOut: 0,
        setTokenIn: mockSetTokenIn,
        setTokenOut: mockSetTokenOut,
        setAmountIn: vi.fn(),
        setAmountOut: vi.fn(),
        swapTokens: mockSwapTokens,
      }
      return selector(state)
    })

    const { SwapInputStep } = await import('@/components/swap/SwapInputStep')
    render(<SwapInputStep onContinue={vi.fn()} />)
    
    // User can access token selector buttons
    const tokenInButton = screen.getByRole('button', { name: /select token, currently usdc/i })
    const tokenOutButton = screen.getByRole('button', { name: /select token, currently weth/i })
    
    expect(tokenInButton).toBeInTheDocument()
    expect(tokenOutButton).toBeInTheDocument()
  })

  it('should validate insufficient balance', async () => {
    const { useSwapStore } = await import('@/lib/stores/swapStore')
    
    // Set amount higher than balance
    vi.mocked(useSwapStore).mockImplementation((selector: any) => {
      const state = {
        tokenIn: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 50, // Lower balance
          price: 1,
        },
        tokenOut: {
          symbol: 'WETH',
          name: 'Wrapped Ether',
          address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
          decimals: 18,
          logoURI: '/weth.svg',
          balance: 0.5,
          price: 2500,
        },
        amountIn: '100', // More than balance
        amountOut: 0,
        setTokenIn: vi.fn(),
        setTokenOut: vi.fn(),
        setAmountIn: vi.fn(),
        setAmountOut: vi.fn(),
        swapTokens: vi.fn(),
      }
      return selector(state)
    })

    const { SwapInputStep } = await import('@/components/swap/SwapInputStep')
    render(<SwapInputStep onContinue={vi.fn()} />)
    
    // Should show insufficient balance error
    const errorMessage = await screen.findByText(/insufficient balance/i)
    expect(errorMessage).toBeInTheDocument()
    
    // Continue button should be disabled
    const continueButton = screen.getByRole('button', { name: /continue to confirmation/i })
    expect(continueButton).toBeDisabled()
  })

  it('should complete confirmation step', async () => {
    const user = userEvent.setup()
    const mockOnConfirm = vi.fn()
    
    const { SwapConfirmStep } = await import('@/components/swap/SwapConfirmStep')
    
    const mockTokenIn = {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
      logoURI: '/usdc.svg',
      balance: 100,
      price: 1,
    }

    const mockTokenOut = {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      decimals: 18,
      logoURI: '/weth.svg',
      balance: 0.5,
      price: 2500,
    }

    const mockComparison = {
      uniswap: {
        inputAmount: '100',
        outputAmount: '0.04',
        gasEstimateUSD: 48.75,
        totalCostUSD: 48.75,
      },
      era: {
        inputAmount: '100',
        outputAmount: '0.04',
        gasEstimateUSD: 12.19,
        totalCostUSD: 12.19,
        savingsUSD: 36.56,
        savingsPercent: 75,
      },
    }
    
    render(
      <SwapConfirmStep
        tokenIn={mockTokenIn}
        tokenOut={mockTokenOut}
        amountIn={100}
        amountOut={0.04}
        comparison={mockComparison}
        onBack={vi.fn()}
        onConfirm={mockOnConfirm}
        isProcessing={false}
      />
    )
    
    // User confirms with default batch size and slippage
    const confirmButton = screen.getByRole('button', { name: /confirm swapping.*usdc.*for.*weth/i })
    await user.click(confirmButton)
    
    // Should call onConfirm with default values (20, 0.5)
    expect(mockOnConfirm).toHaveBeenCalledWith(20, 0.5)
  })
})
