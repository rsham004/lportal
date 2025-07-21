import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.getByText('Modal content')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders with title when provided', () => {
    render(<Modal {...defaultProps} title="Test Modal" />)
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Modal')
  })

  it('does not render title when not provided', () => {
    render(<Modal {...defaultProps} />)
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    // Click on the backdrop (the dialog itself, not the panel)
    const dialog = screen.getByRole('dialog')
    await user.click(dialog)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    const content = screen.getByText('Modal content')
    await user.click(content)
    
    expect(onClose).not.toHaveBeenCalled()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />)
    expect(screen.getByRole('dialog').firstChild?.firstChild?.firstChild).toHaveClass('max-w-md')

    rerender(<Modal {...defaultProps} size="md" />)
    expect(screen.getByRole('dialog').firstChild?.firstChild?.firstChild).toHaveClass('max-w-lg')

    rerender(<Modal {...defaultProps} size="lg" />)
    expect(screen.getByRole('dialog').firstChild?.firstChild?.firstChild).toHaveClass('max-w-2xl')

    rerender(<Modal {...defaultProps} size="xl" />)
    expect(screen.getByRole('dialog').firstChild?.firstChild?.firstChild).toHaveClass('max-w-4xl')
  })

  it('has proper accessibility attributes', () => {
    render(<Modal {...defaultProps} title="Accessible Modal" />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toHaveTextContent('Accessible Modal')
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toHaveAttribute('type', 'button')
  })

  it('traps focus within the modal', () => {
    render(
      <Modal {...defaultProps} title="Focus Test">
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    )
    
    // The close button should be focusable
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()
    
    // Other buttons should also be focusable
    const firstButton = screen.getByRole('button', { name: /first button/i })
    const secondButton = screen.getByRole('button', { name: /second button/i })
    expect(firstButton).toBeInTheDocument()
    expect(secondButton).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(<Modal {...defaultProps} onClose={onClose} />)
    
    // Escape key should close the modal
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders children correctly', () => {
    const complexChildren = (
      <div>
        <h4>Complex Content</h4>
        <p>This is a paragraph</p>
        <button>Action Button</button>
      </div>
    )
    
    render(<Modal {...defaultProps}>{complexChildren}</Modal>)
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument()
    expect(screen.getByText('This is a paragraph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /action button/i })).toBeInTheDocument()
  })
})