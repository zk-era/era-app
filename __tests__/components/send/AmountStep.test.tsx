/**
 * AmountStep Component Tests
 * 
 * Testing accessibility, keyboard navigation, and amount validation
 * Following 2026 industry standards with Vitest + RTL + jest-axe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AmountStep } from '@/components/send/AmountStep'

// Mock Zustand store
vi.mock('@/lib/stores/sendStore', () => ({
  useSendStore: vi.fn((selector) => {
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
      setAmount: vi.fn(),
      setIsUsdMode: vi.fn(),
      setUsedMax: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

describe('AmountStep', () => {
  const mockContinue = vi.fn()
  const mockBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Accessibility', () => {
    it('should have no WCAG violations', async () => {
      const { container } = render(
        <AmountStep onContinue={mockContinue} onBack={mockBack} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible amount input label', () => {
      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const input = screen.getByLabelText(/amount to send in/i)
      expect(input).toBeInTheDocument()
    })

    it('should have accessible toggle button label', () => {
      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const toggleButton = screen.getByRole('button', { name: /toggle to usd mode/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should have accessible use max button label', () => {
      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const useMaxButton = screen.getByRole('button', { name: /use maximum balance/i })
      expect(useMaxButton).toBeInTheDocument()
    })

    it('should announce insufficient balance errors', async () => {
      const { useSendStore } = await import('@/lib/stores/sendStore')
      
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
            balance: 50,
            price: 1,
          },
          amount: '100', // More than balance
          isUsdMode: false,
          setAmount: vi.fn(),
          setIsUsdMode: vi.fn(),
          setUsedMax: vi.fn(),
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      // Check for aria-live region
      const liveRegion = screen.getByRole('alert')
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should allow typing numeric values', async () => {
      const user = userEvent.setup()
      const { useSendStore } = await import('@/lib/stores/sendStore')
      const setAmount = vi.fn()
      
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
          setAmount,
          setIsUsdMode: vi.fn(),
          setUsedMax: vi.fn(),
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const input = screen.getByLabelText(/amount to send/i)
      await user.type(input, '50')
      
      expect(setAmount).toHaveBeenCalled()
    })

    it('should activate use max button with Enter key', async () => {
      const user = userEvent.setup()
      const { useSendStore } = await import('@/lib/stores/sendStore')
      const setUsedMax = vi.fn()
      const setAmount = vi.fn()
      
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
          setAmount,
          setIsUsdMode: vi.fn(),
          setUsedMax,
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const useMaxButton = screen.getByRole('button', { name: /use maximum balance/i })
      useMaxButton.focus()
      await user.keyboard('{Enter}')
      
      expect(setUsedMax).toHaveBeenCalledWith(true)
      expect(setAmount).toHaveBeenCalled()
    })
  })

  describe('Amount Validation', () => {
    it('should show error when amount exceeds balance', async () => {
      const { useSendStore } = await import('@/lib/stores/sendStore')
      
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
            balance: 50,
            price: 1,
          },
          amount: '100',
          isUsdMode: false,
          setAmount: vi.fn(),
          setIsUsdMode: vi.fn(),
          setUsedMax: vi.fn(),
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      // Check that error message is displayed (use paragraph role to find the specific error text)
      const errorMessages = screen.getAllByText(/not enough usdc/i)
      expect(errorMessages.length).toBeGreaterThan(0)
      
      // Check that continue button is disabled with proper label
      const continueButton = screen.getByRole('button', { name: /cannot proceed.*insufficient usdc/i })
      expect(continueButton).toBeDisabled()
    })

    it('should disable continue button when amount is insufficient', async () => {
      const { useSendStore } = await import('@/lib/stores/sendStore')
      
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
            balance: 50,
            price: 1,
          },
          amount: '100',
          isUsdMode: false,
          setAmount: vi.fn(),
          setIsUsdMode: vi.fn(),
          setUsedMax: vi.fn(),
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const continueButton = screen.getByRole('button', { name: /cannot proceed/i })
      expect(continueButton).toBeDisabled()
    })
  })

  describe('USD/Token Toggle', () => {
    it('should toggle between USD and token mode', async () => {
      const user = userEvent.setup()
      const { useSendStore } = await import('@/lib/stores/sendStore')
      const setIsUsdMode = vi.fn()
      
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
          setAmount: vi.fn(),
          setIsUsdMode,
          setUsedMax: vi.fn(),
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const toggleButton = screen.getByRole('button', { name: /toggle to usd mode/i })
      await user.click(toggleButton)
      
      expect(setIsUsdMode).toHaveBeenCalled()
    })
  })

  describe('User Interactions', () => {
    it('should call onContinue when valid amount is entered', async () => {
      const user = userEvent.setup()
      const { useSendStore } = await import('@/lib/stores/sendStore')
      
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
          setAmount: vi.fn(),
          setIsUsdMode: vi.fn(),
          setUsedMax: vi.fn(),
        }
        return selector(state)
      })

      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const continueButton = screen.getByRole('button', { name: /review transaction/i })
      await user.click(continueButton)
      
      expect(mockContinue).toHaveBeenCalled()
    })

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      
      render(<AmountStep onContinue={mockContinue} onBack={mockBack} />)
      
      const backButton = screen.getByRole('button', { name: /go back to previous step/i })
      await user.click(backButton)
      
      expect(mockBack).toHaveBeenCalled()
    })
  })
})
