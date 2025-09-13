import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  it('has correct styling', () => {
    render(<LoadingSpinner />)

    const container = screen.getByTestId('loading-container')
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-[200px]')
  })
})
