import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DocumentReviewForm from '@/components/document-review-form'
import { Document } from '@/types/document'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/document-schema', () => ({
  documentSchemaService: {
    validateDocument: vi.fn(() => ({ missingRequired: [], invalidFields: [] })),
  },
}))

// Mock env
// We need to ensure process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL is set
// Vitest handles process.env automatically but we can force it
vi.stubEnv('NEXT_PUBLIC_N8N_WEBHOOK_URL', 'http://test-webhook.com')

describe('DocumentReviewForm', () => {
  const mockDocument: Document = {
    id: '1',
    status: 'needs review',
    type: 'invoice',
    documentNumber: 'DOC-123',
    amount: 100,
    currency: 'USD',
    supplier: 'Acme Corp',
    channel: 'gmail',
    senderEmail: 'test@example.com',
    fileType: 'pdf',
    processingTime: 1,
    receivedAt: new Date(),
    confidence: 0.9,
    payload: {},
    auditTimeline: [],
    thumbnails: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('shows loading state when submitting', async () => {
    // Mock fetch to take some time so we can check loading state
    let resolveFetch: (value: unknown) => void = () => {}
    (global.fetch as Mock).mockImplementation(() => new Promise(resolve => {
      resolveFetch = resolve
    }))

    render(<DocumentReviewForm document={mockDocument} />)

    const button = screen.getByText('Approve & Save')
    fireEvent.click(button)

    // Check if loading state is shown (button should be disabled)
    expect(button).toBeDisabled()

    // Resolve the fetch
    resolveFetch({ ok: true })

    // Wait for finish
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    // Button should be enabled again (unless the component unmounts or navigates, but here it stays)
    // Wait for button to be enabled
    await waitFor(() => expect(button).not.toBeDisabled())
  })
})
