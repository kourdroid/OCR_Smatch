import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import DocumentReviewForm from '@/components/document-review-form'

afterEach(() => {
  cleanup()
})
import { Document } from '@/types/document'

// Mock the schema service
vi.mock('@/lib/document-schema', () => ({
  documentSchemaService: {
    validateDocument: vi.fn().mockReturnValue({ missingRequired: [], invalidFields: [] })
  }
}))

// Mock env
process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL = 'http://test-webhook'

const mockDocument: Document = {
  id: '123',
  documentNumber: 'DOC-001',
  amount: 100,
  currency: 'USD',
  supplier: 'Test Supplier',
  channel: 'email',
  fileType: 'pdf',
  status: 'needs review',
  type: 'invoice',
  receivedAt: new Date().toISOString(),
  payload: {},
  organizationId: 'org1',
  updatedAt: new Date().toISOString()
}

describe('DocumentReviewForm', () => {
  it('associates labels with inputs for accessibility', () => {
    render(<DocumentReviewForm document={mockDocument} />)

    const docNumberLabel = screen.getByText('Document Number')
    const docNumberInput = screen.getByDisplayValue('DOC-001')

    // Radix Label renders as a label element, so getAttribute('for') works
    const labelFor = docNumberLabel.getAttribute('for')
    const inputId = docNumberInput.getAttribute('id')

    expect(labelFor).toBeTruthy()
    expect(inputId).toBeTruthy()
    expect(labelFor).toBe(inputId)
  })

  it('shows loading state during submission', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ ok: true } as Response), 100))
    )

    render(<DocumentReviewForm document={mockDocument} />)

    const button = screen.getByText('Approve & Save')
    fireEvent.click(button)

    expect(screen.getByText('Saving...')).toBeTruthy()
    expect(button.hasAttribute('disabled')).toBe(true)

    await waitFor(() => {
      expect(screen.getByText('Approve & Save')).toBeTruthy()
    })

    expect(button.hasAttribute('disabled')).toBe(false)
  })
})
