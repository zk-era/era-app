/**
 * SwapConfirmStep Component Tests
 * 
 * Testing accessibility, keyboard navigation, dropdowns, and confirmation UI
 * Following 2026 industry standards with Vitest + RTL + jest-axe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { SwapConfirmStep } from '@/components/swap/SwapConfirmStep'

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

describe('SwapConfirmStep', () => {
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

  const defaultProps = {
    tokenIn: mockTokenIn,
    tokenOut: mockTokenOut,
    amountIn: 100,
    amountOut: 0.04,
    comparison: mockComparison,
    onBack: vi.fn(),
    onConfirm: vi.fn(),
    isProcessing: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Accessibility', () => {
    it('should have no WCAG violations', async () => {
      const { container } = render(<SwapConfirmStep {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible batch size dropdown', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const batchDropdown = screen.getByRole('button', { name: /select batch size/i })
      expect(batchDropdown).toBeInTheDocument()
      expect(batchDropdown).toHaveAttribute('aria-expanded', 'false')
      expect(batchDropdown).toHaveAttribute('aria-haspopup', 'true')
    })

    it('should have accessible slippage dropdown', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const slippageDropdown = screen.getByRole('button', { name: /select slippage tolerance/i })
      expect(slippageDropdown).toBeInTheDocument()
      expect(slippageDropdown).toHaveAttribute('aria-expanded', 'false')
      expect(slippageDropdown).toHaveAttribute('aria-haspopup', 'true')
    })

    it('should announce fee estimate loading to screen readers', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('should have accessible confirm button', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const confirmButton = screen.getByRole('button', { name: /confirm swapping.*usdc.*for.*weth/i })
      expect(confirmButton).toBeInTheDocument()
    })

    it('should have accessible back button', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const backButton = screen.getByRole('button', { name: /go back to edit amount/i })
      expect(backButton).toBeInTheDocument()
    })
  })

  describe('Token Display', () => {
    it('should display overlapping token icons', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const tokenInImage = screen.getByAltText('')
      expect(tokenInImage).toBeInTheDocument()
    })

    it('should display swap details', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      expect(screen.getByText(/confirm swap of usdc to weth/i)).toBeInTheDocument()
    })

    it('should display swap amounts', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      expect(screen.getByText(/swap usdc/i)).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText(/receive weth/i)).toBeInTheDocument()
      expect(screen.getByText('0.04')).toBeInTheDocument()
    })

    it('should display exchange rate', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      expect(screen.getByText(/rate/i)).toBeInTheDocument()
      expect(screen.getByText(/1 usdc = 0.000400 weth/i)).toBeInTheDocument()
    })
  })

  describe('Batch Size Dropdown', () => {
    it('should open batch size dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select batch size/i })
      await user.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /batch size options/i })).toBeInTheDocument()
      })
    })

    it('should display all batch size options', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select batch size/i })
      await user.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /set batch size to 20/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /set batch size to 50/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /set batch size to 100/i })).toBeInTheDocument()
      })
    })

    it('should select batch size when option clicked', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select batch size/i })
      await user.click(dropdown)
      
      const option50 = await screen.findByRole('menuitem', { name: /set batch size to 50/i })
      await user.click(option50)
      
      // Dropdown should close and show selected value
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })

    it('should navigate batch size options with arrow keys', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select batch size/i })
      dropdown.focus()
      
      // Arrow down should cycle through options
      await user.keyboard('{ArrowDown}')
      
      // Should show next option (50)
      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument()
      })
    })
  })

  describe('Slippage Dropdown', () => {
    it('should open slippage dropdown when clicked', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select slippage tolerance/i })
      await user.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByRole('menu', { name: /slippage tolerance options/i })).toBeInTheDocument()
      })
    })

    it('should display all slippage options', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select slippage tolerance/i })
      await user.click(dropdown)
      
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /set slippage tolerance to 0.1%/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /set slippage tolerance to 0.5%/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /set slippage tolerance to 1%/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /set slippage tolerance to 2%/i })).toBeInTheDocument()
      })
    })

    it('should select slippage when option clicked', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const dropdown = screen.getByRole('button', { name: /select slippage tolerance/i })
      await user.click(dropdown)
      
      const option1 = await screen.findByRole('menuitem', { name: /set slippage tolerance to 1%/i })
      await user.click(option1)
      
      // Dropdown should close and show selected value
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument()
        expect(screen.getByText('1%')).toBeInTheDocument()
      })
    })
  })

  describe('See Details Expansion', () => {
    it('should expand details when "See Details" clicked', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const detailsButton = screen.getByRole('button', { name: /see details/i })
      await user.click(detailsButton)
      
      // Should show expanded details
      await waitFor(() => {
        expect(screen.getByText(/route/i)).toBeInTheDocument()
        expect(screen.getByText(/uniswap v2/i)).toBeInTheDocument()
      })
    })

    it('should show ERA savings in expanded details', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const detailsButton = screen.getByRole('button', { name: /see details/i })
      await user.click(detailsButton)
      
      await waitFor(() => {
        expect(screen.getByText(/era savings/i)).toBeInTheDocument()
        expect(screen.getByText(/73% cheaper/i)).toBeInTheDocument()
      })
    })

    it('should collapse details when clicked again', async () => {
      const user = userEvent.setup()
      render(<SwapConfirmStep {...defaultProps} />)
      
      const detailsButton = screen.getByRole('button', { name: /see details/i })
      
      // Expand
      await user.click(detailsButton)
      await waitFor(() => {
        expect(screen.getByText(/route/i)).toBeInTheDocument()
      })
      
      // Collapse
      await user.click(detailsButton)
      await waitFor(() => {
        expect(screen.queryByText(/route/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Fee Estimate', () => {
    it('should display loading state initially', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      // Should show loading spinner
      const loadingSpinner = screen.getByRole('status')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('should display fee estimate after loading', async () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText('$0.12')).toBeInTheDocument()
      })
    })
  })

  describe('Confirmation Actions', () => {
    it('should call onBack when Edit Amount clicked', async () => {
      const user = userEvent.setup()
      const mockOnBack = vi.fn()
      
      render(<SwapConfirmStep {...defaultProps} onBack={mockOnBack} />)
      
      const backButton = screen.getByRole('button', { name: /go back to edit amount/i })
      await user.click(backButton)
      
      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should call onConfirm when Confirm clicked', async () => {
      const user = userEvent.setup()
      const mockOnConfirm = vi.fn()
      
      render(<SwapConfirmStep {...defaultProps} onConfirm={mockOnConfirm} />)
      
      const confirmButton = screen.getByRole('button', { name: /confirm swapping.*usdc.*for.*weth/i })
      await user.click(confirmButton)
      
      expect(mockOnConfirm).toHaveBeenCalledWith(20, 0.5) // Default batch size and slippage
    })

    it('should call onConfirm with default batch size and slippage', async () => {
      const user = userEvent.setup()
      const mockOnConfirm = vi.fn()
      
      render(<SwapConfirmStep {...defaultProps} onConfirm={mockOnConfirm} />)
      
      // Confirm with default values (20, 0.5)
      const confirmButton = screen.getByRole('button', { name: /confirm swapping.*usdc.*for.*weth/i })
      await user.click(confirmButton)
      
      expect(mockOnConfirm).toHaveBeenCalledWith(20, 0.5)
    })

    it('should disable buttons when processing', () => {
      render(<SwapConfirmStep {...defaultProps} isProcessing={true} />)
      
      const confirmButton = screen.getByRole('button', { name: /transaction processing/i })
      const backButton = screen.getByRole('button', { name: /go back to edit amount/i })
      
      expect(confirmButton).toBeDisabled()
      expect(backButton).toBeDisabled()
    })

    it('should show processing state in confirm button', () => {
      render(<SwapConfirmStep {...defaultProps} isProcessing={true} />)
      
      expect(screen.getByText(/processing/i)).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should allow focusing on back button', () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      const backButton = screen.getByRole('button', { name: /go back to edit amount/i })
      backButton.focus()
      
      expect(backButton).toHaveFocus()
    })

    it('should allow focusing on confirm button', async () => {
      render(<SwapConfirmStep {...defaultProps} />)
      
      // Wait for loading to complete
      const confirmButton = await screen.findByRole('button', { name: /confirm swapping.*usdc.*for.*weth/i })
      await waitFor(() => expect(confirmButton).not.toBeDisabled())
      
      confirmButton.focus()
      
      expect(confirmButton).toHaveFocus()
    })
  })
})
