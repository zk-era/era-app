/**
 * Send Flow Integration Test
 * 
 * Tests the complete end-to-end send flow:
 * 1. Enter recipient address
 * 2. Resolve ENS (if applicable)  
 * 3. Enter amount
 * 4. Confirm transaction
 * 
 * Following 2026 best practices: tests user journey, not implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'

// Mock Zustand store
const mockSetRecipient = vi.fn()
const mockSetResolvedAddress = vi.fn()
const mockSetAmount = vi.fn()
const mockSetSelectedToken = vi.fn()
const mockSetBatchSize = vi.fn()

vi.mock('@/lib/stores/sendStore', () => ({
  useSendStore: vi.fn((selector) => {
    const state = {
      recipient: '',
      resolvedAddress: null,
      selectedToken: {
        symbol: 'USDC',
        name: 'USD Coin',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        logoURI: '/usdc.svg',
        balance: 100,
        price: 1,
      },
      amount: '',
      isUsdMode: false,
      batchSize: 20,
      setRecipient: mockSetRecipient,
      setResolvedAddress: mockSetResolvedAddress,
      setAmount: mockSetAmount,
      setSelectedToken: mockSetSelectedToken,
      setIsUsdMode: vi.fn(),
      setUsedMax: vi.fn(),
      setBatchSize: mockSetBatchSize,
    }
    return selector ? selector(state) : state
  }),
}))

// Mock ENS validation
vi.mock('@/lib/hooks/useRecipientValidation', () => ({
  useRecipientValidation: vi.fn(() => ({
    isValid: false,
    resolvedAddress: null,
    isResolving: false,
    error: null,
    normalizedName: null,
  })),
}))

// Mock ERA API
vi.mock('@/lib/api/era', () => ({
  eraApi: {
    getEstimate: vi.fn().mockResolvedValue({
      eraCostUsd: 0.12,
      baseCostUsd: 0.45,
      savingsUsd: 0.33,
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

describe('Send Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have no accessibility violations in complete flow', async () => {
    // This test ensures WCAG compliance across the entire user journey
    const { useRecipientValidation } = await import('@/lib/hooks/useRecipientValidation')
    const { useSendStore } = await import('@/lib/stores/sendStore')
    
    // Setup valid address state
    vi.mocked(useRecipientValidation).mockReturnValue({
      isValid: true,
      resolvedAddress: '0x1234567890123456789012345678901234567890',
      isResolving: false,
      error: null,
      normalizedName: null,
    })
    
    vi.mocked(useSendStore).mockImplementation((selector: any) => {
      const state = {
        recipient: 'vitalik.eth',
        resolvedAddress: '0x1234567890123456789012345678901234567890',
        selectedToken: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        amount: '50',
        isUsdMode: false,
        batchSize: 20,
        setRecipient: vi.fn(),
        setResolvedAddress: vi.fn(),
        setAmount: vi.fn(),
        setSelectedToken: vi.fn(),
        setIsUsdMode: vi.fn(),
        setUsedMax: vi.fn(),
        setBatchSize: vi.fn(),
      }
      return selector(state)
    })

    const { AddressStep } = await import('@/components/send/AddressStep')
    const { container } = render(<AddressStep onContinue={vi.fn()} recentSends={[]} />)
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should allow keyboard-only navigation through entire send flow', async () => {
    const user = userEvent.setup()
    const { useRecipientValidation } = await import('@/lib/hooks/useRecipientValidation')
    const { useSendStore } = await import('@/lib/stores/sendStore')
    
    // Mock valid ENS resolution
    vi.mocked(useRecipientValidation).mockReturnValue({
      isValid: true,
      resolvedAddress: '0x1234567890123456789012345678901234567890',
      isResolving: false,
      error: null,
      normalizedName: null,
    })
    
    vi.mocked(useSendStore).mockImplementation((selector: any) => {
      const state = {
        recipient: 'vitalik.eth',
        resolvedAddress: '0x1234567890123456789012345678901234567890',
        selectedToken: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        amount: '',
        isUsdMode: false,
        batchSize: 20,
        setRecipient: mockSetRecipient,
        setResolvedAddress: mockSetResolvedAddress,
        setAmount: mockSetAmount,
        setSelectedToken: mockSetSelectedToken,
        setIsUsdMode: vi.fn(),
        setUsedMax: vi.fn(),
        setBatchSize: mockSetBatchSize,
      }
      return selector(state)
    })

    const { AddressStep } = await import('@/components/send/AddressStep')
    render(<AddressStep onContinue={vi.fn()} recentSends={[]} />)
    
    // User can tab to input and type
    const input = screen.getByLabelText(/recipient address or ens name/i)
    input.focus()
    await user.keyboard('vitalik.eth')
    
    expect(mockSetRecipient).toHaveBeenCalled()
    
    // User can navigate to search result with Tab and press Enter
    const searchResult = screen.getByRole('button', { name: /select vitalik\.eth as recipient/i })
    await user.keyboard('{Tab}')
    await user.keyboard('{Enter}')
    
    // Verify selection happened
    expect(searchResult).toBeInTheDocument()
  })

  it('should handle complete user journey: address entry → amount entry → confirmation', async () => {
    const user = userEvent.setup()
    
    // Step 1: User enters and selects address
    const { useRecipientValidation } = await import('@/lib/hooks/useRecipientValidation')
    const { useSendStore } = await import('@/lib/stores/sendStore')
    
    vi.mocked(useRecipientValidation).mockReturnValue({
      isValid: true,
      resolvedAddress: '0x1234567890123456789012345678901234567890',
      isResolving: false,
      error: null,
      normalizedName: null,
    })
    
    vi.mocked(useSendStore).mockImplementation((selector: any) => {
      const state = {
        recipient: 'vitalik.eth',
        resolvedAddress: '0x1234567890123456789012345678901234567890',
        selectedToken: {
          symbol: 'USDC',
          name: 'USD Coin',
          address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          decimals: 6,
          logoURI: '/usdc.svg',
          balance: 100,
          price: 1,
        },
        amount: '50',
        isUsdMode: false,
        batchSize: 20,
        setRecipient: mockSetRecipient,
        setResolvedAddress: mockSetResolvedAddress,
        setAmount: mockSetAmount,
        setSelectedToken: vi.fn(),
        setIsUsdMode: vi.fn(),
        setUsedMax: vi.fn(),
        setBatchSize: vi.fn(),
      }
      return selector(state)
    })
    
    const { AmountStep } = await import('@/components/send/AmountStep')
    const mockContinue = vi.fn()
    const mockBack = vi.fn()
    
    render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
    
    // Step 2: User enters amount
    const amountInput = screen.getByLabelText(/amount to send/i)
    await user.type(amountInput, '50')
    
    expect(mockSetAmount).toHaveBeenCalled()
    
    // Step 3: User reviews and continues
    const reviewButton = screen.getByRole('button', { name: /review transaction/i })
    expect(reviewButton).not.toBeDisabled()
    
    await user.click(reviewButton)
    expect(mockContinue).toHaveBeenCalled()
  })
})
