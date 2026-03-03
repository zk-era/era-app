/**
 * AddressStep Component Tests
 * 
 * Testing accessibility, keyboard navigation, and ENS resolution
 * Following 2026 industry standards with Vitest + RTL + jest-axe
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AddressStep } from '@/components/send/AddressStep'
import type { RecentSend } from '@/lib/hooks/useRecentSends'

// Mock Zustand store
vi.mock('@/lib/stores/sendStore', () => ({
  useSendStore: vi.fn((selector) => {
    const state = {
      recipient: '',
      setRecipient: vi.fn(),
      setResolvedAddress: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

// Mock ENS validation hook
vi.mock('@/lib/hooks/useRecipientValidation', () => ({
  useRecipientValidation: vi.fn(() => ({
    isValid: false,
    resolvedAddress: null,
    isResolving: false,
    error: null,
    normalizedName: null,
  })),
}))

describe('AddressStep', () => {
  const mockContinue = vi.fn()
  const mockRecentSends: RecentSend[] = [
    {
      address: '0x1234567890123456789012345678901234567890',
      ensName: 'vitalik.eth',
      lastUsed: Date.now(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Accessibility', () => {
    it('should have no WCAG violations', async () => {
      const { container } = render(
        <AddressStep onContinue={mockContinue} recentSends={[]} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible input label', () => {
      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const input = screen.getByLabelText(/recipient address or ens name/i)
      expect(input).toBeInTheDocument()
    })

    it('should have accessible paste button', () => {
      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const pasteButton = screen.getByRole('button', { name: /paste address from clipboard/i })
      expect(pasteButton).toBeInTheDocument()
    })

    it('should announce ENS resolution status to screen readers', () => {
      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      // Check for aria-live region
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should allow typing in the input field', async () => {
      const user = userEvent.setup()
      const { useSendStore } = await import('@/lib/stores/sendStore')
      const setRecipient = vi.fn()
      
      vi.mocked(useSendStore).mockImplementation((selector: any) => {
        const state = {
          recipient: '',
          setRecipient,
          setResolvedAddress: vi.fn(),
        }
        return selector(state)
      })

      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const input = screen.getByLabelText(/recipient address or ens name/i)
      await user.type(input, 'vitalik.eth')
      
      expect(setRecipient).toHaveBeenCalled()
    })

    it('should activate paste button with Enter key', async () => {
      const user = userEvent.setup()
      
      // Mock clipboard API properly
      const mockReadText = vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          readText: mockReadText,
        },
        configurable: true,
      })

      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const pasteButton = screen.getByRole('button', { name: /paste address from clipboard/i })
      pasteButton.focus()
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockReadText).toHaveBeenCalled()
      })
    })

    it('should activate paste button with Space key', async () => {
      const user = userEvent.setup()
      
      // Mock clipboard API properly
      const mockReadText = vi.fn().mockResolvedValue('0x1234567890123456789012345678901234567890')
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          readText: mockReadText,
        },
        configurable: true,
      })

      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const pasteButton = screen.getByRole('button', { name: /paste address from clipboard/i })
      pasteButton.focus()
      await user.keyboard(' ')
      
      await waitFor(() => {
        expect(mockReadText).toHaveBeenCalled()
      })
    })
  })

  describe('Recent Sends', () => {
    it('should render recent sends list', () => {
      render(<AddressStep onContinue={mockContinue} recentSends={mockRecentSends} />)
      
      const recentAddress = screen.getByText('vitalik.eth')
      expect(recentAddress).toBeInTheDocument()
    })

    it('should have accessible labels for recent send items', () => {
      render(<AddressStep onContinue={mockContinue} recentSends={mockRecentSends} />)
      
      const selectButton = screen.getByRole('button', { name: /select vitalik.eth as recipient/i })
      expect(selectButton).toBeInTheDocument()
    })

    it('should select address when recent send is clicked', async () => {
      const user = userEvent.setup()
      const { useSendStore } = await import('@/lib/stores/sendStore')
      const setRecipient = vi.fn()
      
      vi.mocked(useSendStore).mockImplementation((selector: any) => {
        const state = {
          recipient: '',
          setRecipient,
          setResolvedAddress: vi.fn(),
        }
        return selector(state)
      })

      render(<AddressStep onContinue={mockContinue} recentSends={mockRecentSends} />)
      
      const selectButton = screen.getByRole('button', { name: /select vitalik.eth as recipient/i })
      await user.click(selectButton)
      
      // Should set recipient to ENS name or address
      expect(setRecipient).toHaveBeenCalledWith(expect.stringMatching(/vitalik\.eth|0x/))
    })
  })

  describe('Input Validation', () => {
    it('should show error for invalid address', async () => {
      const { useRecipientValidation } = await import('@/lib/hooks/useRecipientValidation')
      
      vi.mocked(useRecipientValidation).mockReturnValue({
        isValid: false,
        resolvedAddress: null,
        isResolving: false,
        error: 'Invalid Ethereum address',
        normalizedName: null,
      })

      const { useSendStore } = await import('@/lib/stores/sendStore')
      vi.mocked(useSendStore).mockImplementation((selector: any) => {
        const state = {
          recipient: '0xinvalid',
          setRecipient: vi.fn(),
          setResolvedAddress: vi.fn(),
        }
        return selector(state)
      })

      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const errorMessage = await screen.findByText(/invalid ethereum address/i)
      expect(errorMessage).toBeInTheDocument()
    })

    it('should link error message to input with aria-describedby', async () => {
      const { useRecipientValidation } = await import('@/lib/hooks/useRecipientValidation')
      
      vi.mocked(useRecipientValidation).mockReturnValue({
        isValid: false,
        resolvedAddress: null,
        isResolving: false,
        error: 'Invalid Ethereum address',
        normalizedName: null,
      })

      const { useSendStore } = await import('@/lib/stores/sendStore')
      vi.mocked(useSendStore).mockImplementation((selector: any) => {
        const state = {
          recipient: '0xinvalid',
          setRecipient: vi.fn(),
          setResolvedAddress: vi.fn(),
        }
        return selector(state)
      })

      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      const input = screen.getByLabelText(/recipient address or ens name/i)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'address-error')
    })
  })

  describe('User Interactions', () => {
    it('should call onContinue when search result is clicked', async () => {
      const user = userEvent.setup()
      const { useRecipientValidation } = await import('@/lib/hooks/useRecipientValidation')
      
      vi.mocked(useRecipientValidation).mockReturnValue({
        isValid: true,
        resolvedAddress: '0x1234567890123456789012345678901234567890',
        isResolving: false,
        error: undefined,
        normalizedName: undefined,
      })

      const { useSendStore } = await import('@/lib/stores/sendStore')
      const setResolvedAddress = vi.fn()
      
      vi.mocked(useSendStore).mockImplementation((selector: any) => {
        const state = {
          recipient: 'vitalik.eth',
          setRecipient: vi.fn(),
          setResolvedAddress,
        }
        return selector(state)
      })

      render(<AddressStep onContinue={mockContinue} recentSends={[]} />)
      
      // When valid address entered, search results show with clickable item
      const searchResult = screen.getByRole('button', { name: /select vitalik\.eth as recipient/i })
      await user.click(searchResult)
      
      expect(setResolvedAddress).toHaveBeenCalledWith('0x1234567890123456789012345678901234567890')
      expect(mockContinue).toHaveBeenCalled()
    })
  })
})
