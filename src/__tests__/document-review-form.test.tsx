import React from 'react'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import DocumentReviewForm from '@/components/document-review-form'

expect.extend(matchers)
import { Document } from '@/types/document'

// Mock environment variable
vi.stubEnv('NEXT_PUBLIC_N8N_WEBHOOK_URL', 'http://test-webhook.com')

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/document-schema', () => ({
  documentSchemaService: {
    validateDocument: vi.fn().mockReturnValue({ missingRequired: [], invalidFields: [] }),
  },
}))

// Mock Document
const mockDocument: Document = {
  id: '123',
  status: 'needs review',
  type: 'invoice',
  documentNumber: 'DOC-001',
  amount: 100,
  currency: 'USD',
  supplier: 'Test Supplier',
  channel: 'gmail',
  senderEmail: 'test@example.com',
  fileType: 'pdf',
  processingTime: 100,
  receivedAt: new Date(),
  confidence: 0.9,
  payload: {},
  auditTimeline: [],
  thumbnails: []
}

describe('DocumentReviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders correctly', () => {
    render(<DocumentReviewForm document={mockDocument} />)
    expect(screen.getByDisplayValue('DOC-001')).toBeInTheDocument()
    expect(screen.getByText('Approve & Save')).toBeInTheDocument()
  })

  it('calls fetch when approve is clicked', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true })

    render(<DocumentReviewForm document={mockDocument} />)

    const button = screen.getByText('Approve & Save')
    fireEvent.click(button)

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('http://test-webhook.com', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('DOC-001')
        }))
    })
  })
})
