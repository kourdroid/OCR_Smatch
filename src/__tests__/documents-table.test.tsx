import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentsTable } from '@/components/documents-table'
import { DocumentRow, DocumentGroup, Document } from '@/types/document'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect, afterEach, describe, it } from 'vitest'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

describe('DocumentsTable Accessibility', () => {
  const mockDate = new Date('2024-01-01T12:00:00Z')

  const mockDocument: Document = {
    id: 'doc-1',
    status: 'extracted',
    type: 'invoice',
    documentNumber: 'INV-001',
    amount: 100,
    currency: 'USD',
    supplier: 'Acme Corp',
    channel: 'gmail',
    senderEmail: 'sender@example.com',
    fileType: 'pdf',
    processingTime: 1.5,
    receivedAt: mockDate,
    confidence: 0.95,
    payload: {},
    auditTimeline: [],
    organization: { id: 'org-1', name: 'Test Org' },
    thumbnails: [],
    downloadUrl: 'http://example.com'
  }

  const mockGroup: DocumentGroup = {
    id: 'group-1',
    groupKey: 'Acme Corp',
    documents: [mockDocument],
    aggregateData: {
      count: 1,
      totalAmount: 100,
      currency: 'USD',
      status: 'extracted',
      avgConfidence: 0.95,
      latestReceivedAt: mockDate
    }
  }

  const mockRows: DocumentRow[] = [
    {
      type: 'group',
      group: mockGroup
    }
  ]

  it('renders group toggle button with accessible label and handles interaction', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // Verify the button exists with the correct initial label
    const expandButton = screen.getByLabelText('Expand group')
    expect(expandButton).toBeInTheDocument()
    expect(expandButton).toHaveAttribute('aria-expanded', 'false')

    // Click to expand
    fireEvent.click(expandButton)

    // Verify label and state change
    const collapseButton = screen.getByLabelText('Collapse group')
    expect(collapseButton).toBeInTheDocument()
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true')
  })
})
