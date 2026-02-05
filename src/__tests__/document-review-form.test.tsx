import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import DocumentReviewForm from '@/components/document-review-form'
import { Document } from '@/types/document'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Mock icons
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader">Loading...</div>,
}))

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch
global.fetch = vi.fn()

// Mock env
const originalEnv = process.env
process.env = { ...originalEnv, NEXT_PUBLIC_N8N_WEBHOOK_URL: 'http://test-webhook' }

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const mockDocument: Document = {
  id: 'doc-123',
  status: 'needs review',
  type: 'invoice',
  documentNumber: 'INV-001',
  amount: 1000,
  currency: 'USD',
  supplier: 'Test Supplier',
  channel: 'gmail',
  senderEmail: 'test@example.com',
  fileType: 'pdf',
  processingTime: 1.5,
  receivedAt: new Date(),
  confidence: 0.85,
  payload: {
    document_number: 'INV-001',
    amount: 1000,
    currency: 'USD',
    supplier: 'Test Supplier',
  },
  auditTimeline: [],
}

describe('DocumentReviewForm', () => {
  it('renders form fields', () => {
    render(<DocumentReviewForm document={mockDocument} />)

    // Check initial values
    expect(screen.getByDisplayValue('INV-001')).toBeTruthy()
    expect(screen.getByDisplayValue('1000')).toBeTruthy()
    expect(screen.getByDisplayValue('USD')).toBeTruthy()
    expect(screen.getByDisplayValue('Test Supplier')).toBeTruthy()
  })

  it('renders approve button when status is "needs review"', () => {
    render(<DocumentReviewForm document={mockDocument} />)
    expect(screen.getByRole('button', { name: /Approve & Save/i })).toBeTruthy()
  })

  it('does not render approve button when status is "extracted"', () => {
    render(<DocumentReviewForm document={{ ...mockDocument, status: 'extracted' }} />)
    expect(screen.queryByRole('button', { name: /Approve & Save/i })).toBeNull()
  })

  it('shows loading state when submitting', async () => {
    // Delay fetch response to allow checking loading state
    (global.fetch as any).mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ ok: true }), 100)
    }))

    render(<DocumentReviewForm document={mockDocument} />)

    const button = screen.getByRole('button', { name: /Approve & Save/i })
    fireEvent.click(button)

    // Expect loader to be present (will fail initially)
    await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeTruthy()
    })
    expect(button).toBeDisabled()
  })

  it('associates labels with inputs', () => {
     render(<DocumentReviewForm document={mockDocument} />)

     // This verifies accessibility (will fail initially)
     expect(screen.getByLabelText('Document Number')).toHaveValue('INV-001')
     expect(screen.getByLabelText('Amount')).toHaveValue(1000)
     expect(screen.getByLabelText('Currency')).toHaveValue('USD')
     expect(screen.getByLabelText('Supplier')).toHaveValue('Test Supplier')
  })
})
