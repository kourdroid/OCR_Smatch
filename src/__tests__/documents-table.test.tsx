import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '@/components/documents-table'

expect.extend(matchers)
import { DocumentRow, DocumentGroup, Document } from '@/types/document'

// Manually cleanup after each test as per memory instructions
afterEach(() => {
  cleanup()
})

describe('DocumentsTable Accessibility', () => {
  const mockDocument: Document = {
    id: 'doc-1',
    status: 'extracted',
    type: 'invoice',
    documentNumber: 'INV-001',
    amount: 100,
    currency: 'USD',
    supplier: 'Supplier A',
    channel: 'gmail',
    senderEmail: 'test@example.com',
    fileType: 'pdf',
    processingTime: 1,
    receivedAt: new Date(),
    confidence: 0.9,
    payload: {},
    auditTimeline: [],
  }

  const mockGroup: DocumentGroup = {
    id: 'group-1',
    groupKey: 'Supplier A',
    documents: [mockDocument],
    aggregateData: {
      count: 1,
      totalAmount: 100,
      currency: 'USD',
      status: 'extracted',
      avgConfidence: 0.9,
      latestReceivedAt: new Date(),
    },
  }

  const mockRows: DocumentRow[] = [
    { type: 'group', group: mockGroup },
  ]

  it('renders sortable headers with aria-sort attributes', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    // Initially sorted by receivedAt desc (default)
    const timeHeader = screen.getByRole('columnheader', { name: /Time/i })
    expect(timeHeader).toHaveAttribute('aria-sort', 'descending')

    // Other headers should not have aria-sort or be undefined/none
    const amountHeader = screen.getByRole('columnheader', { name: /Amount/i })
    expect(amountHeader).not.toHaveAttribute('aria-sort')
  })

  it('renders group toggle button with aria-label', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    const rows = screen.getAllByRole('row')
    const groupRow = rows[1] // 0 is header, 1 is first data row

    // Find the toggle button inside the group row
    // It is the button with Chevron icon, which is icon-only currently
    const buttons = within(groupRow).getAllByRole('button')
    // The first button in the row is the expand button (based on component code)
    const toggleButton = buttons[0]

    // Check for accessibility attributes
    expect(toggleButton).toHaveAttribute('aria-label', 'Expand group')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')

    // Click to expand
    fireEvent.click(toggleButton)

    expect(toggleButton).toHaveAttribute('aria-label', 'Collapse group')
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
  })
})
