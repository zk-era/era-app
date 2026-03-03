/**
 * SendHeader Component Tests
 * 
 * Following 2026 industry standards:
 * - Vitest for test runner
 * - React Testing Library for user-centric testing  
 * - jest-axe for automated WCAG compliance
 * - @testing-library/user-event for realistic interactions
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { SendHeader } from '@/components/shared/SendHeader'

describe('SendHeader', () => {
  describe('Accessibility', () => {
    it('should have no WCAG violations', async () => {
      const { container } = render(<SendHeader />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible back button label when onBack provided', () => {
      const onBack = vi.fn()
      render(<SendHeader onBack={onBack} />)
      
      const backButton = screen.getByRole('button', { name: /go back to previous step/i })
      expect(backButton).toBeInTheDocument()
    })

    it('should have accessible back button label when onBack not provided', () => {
      render(<SendHeader />)
      
      const backButton = screen.getByRole('button', { name: /go back to home/i })
      expect(backButton).toBeInTheDocument()
    })

    it('should have accessible close button label when onClose provided', () => {
      const onClose = vi.fn()
      render(<SendHeader onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close send dialog/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should have accessible close button label when onClose not provided', () => {
      render(<SendHeader />)
      
      const closeButton = screen.getByRole('button', { name: /close and return to home/i })
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should activate back button with Enter key', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      render(<SendHeader onBack={onBack} />)
      
      const backButton = screen.getByRole('button', { name: /go back to previous step/i })
      await user.click(backButton)
      await user.keyboard('{Enter}')
      
      expect(onBack).toHaveBeenCalled()
    })

    it('should activate back button with Space key', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      render(<SendHeader onBack={onBack} />)
      
      const backButton = screen.getByRole('button', { name: /go back to previous step/i })
      backButton.focus()
      await user.keyboard(' ')
      
      expect(onBack).toHaveBeenCalled()
    })

    it('should activate close button with Escape key', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<SendHeader onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close send dialog/i })
      closeButton.focus()
      await user.keyboard('{Escape}')
      
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('User Interactions', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      render(<SendHeader onBack={onBack} />)
      
      const backButton = screen.getByRole('button', { name: /go back to previous step/i })
      await user.click(backButton)
      
      expect(onBack).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<SendHeader onClose={onClose} />)
      
      const closeButton = screen.getByRole('button', { name: /close send dialog/i })
      await user.click(closeButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visual Rendering', () => {
    it('should render interactive back button when onBack prop is provided', () => {
      const onBack = vi.fn()
      render(<SendHeader onBack={onBack} />)
      
      const backButton = screen.queryByRole('button', { name: /go back to previous step/i })
      expect(backButton).toBeInTheDocument()
    })

    it('should render link back button when onBack prop is undefined', () => {
      render(<SendHeader />)
      
      const backButton = screen.queryByRole('button', { name: /go back to home/i })
      expect(backButton).toBeInTheDocument()
    })

    it('should render interactive close button when onClose prop is provided', () => {
      const onClose = vi.fn()
      render(<SendHeader onClose={onClose} />)
      
      const closeButton = screen.queryByRole('button', { name: /close send dialog/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should render link close button when onClose prop is undefined', () => {
      render(<SendHeader />)
      
      const closeButton = screen.queryByRole('button', { name: /close and return to home/i })
      expect(closeButton).toBeInTheDocument()
    })
  })
})
