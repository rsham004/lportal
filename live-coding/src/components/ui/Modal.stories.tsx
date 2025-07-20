import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

const ModalWithTrigger = ({ title, size, children }: { title?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size={size}>
        {children}
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: () => (
    <ModalWithTrigger title="Default Modal">
      <p className="text-gray-600">
        This is a default modal with some content. You can put any React components here.
      </p>
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="outline">Cancel</Button>
        <Button>Confirm</Button>
      </div>
    </ModalWithTrigger>
  ),
}

export const Small: Story = {
  render: () => (
    <ModalWithTrigger title="Small Modal" size="sm">
      <p className="text-gray-600">This is a small modal.</p>
    </ModalWithTrigger>
  ),
}

export const Large: Story = {
  render: () => (
    <ModalWithTrigger title="Large Modal" size="lg">
      <p className="text-gray-600">
        This is a large modal with more content space. It can accommodate more complex layouts and longer content.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded">
          <h4 className="font-medium">Section 1</h4>
          <p className="text-sm text-gray-600">Some content here</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h4 className="font-medium">Section 2</h4>
          <p className="text-sm text-gray-600">More content here</p>
        </div>
      </div>
    </ModalWithTrigger>
  ),
}

export const WithoutTitle: Story = {
  render: () => (
    <ModalWithTrigger>
      <h3 className="text-lg font-medium mb-4">Custom Title</h3>
      <p className="text-gray-600">This modal doesn't use the title prop, so you can create your own header.</p>
    </ModalWithTrigger>
  ),
}