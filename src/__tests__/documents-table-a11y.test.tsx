import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { DocumentsTable } from '@/components/documents-table'
import { Document, DocumentRow } from '@/types/document'
import React from 'react'
import '@testing-library/jest-dom' // Ensure matchers are available

// Mock dependencies if needed, though DocumentsTable seems self-contained mostly
// We might need to mock lucide-react if icons cause issues, but usually they are fine.

const mockDocument: Document = {
  id: '1',
  status: 'extracted',
  type: 'invoice',
  documentNumber: 'DOC-001',
  amount: 1000,
  currency: 'USD',
  supplier: 'Acme Corp',
  channel: 'gmail',
  senderEmail: 'sender@example.com',
  fileType: 'pdf',
  processingTime: 10,
  receivedAt: new Date('2023-01-01'),
  confidence: 0.9,
  payload: {},
  auditTimeline: [],
  organization: { id: 'org1', name: 'Org 1' }
}

const mockRows: DocumentRow[] = [
  {
    type: 'single',
    document: mockDocument
  }
]

describe('DocumentsTable Accessibility', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders sortable headers with correct initial accessibility attributes', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    // Find the ID column header (th)
    // The current implementation puts the SortButton inside the th.
    // The th itself doesn't have aria-sort yet.

    // We can find the button by its text content "ID"
    const idButton = screen.getByRole('button', { name: /ID/i })
    expect(idButton).toBeInTheDocument()

    // Check if the th has aria-sort.
    // The button is inside the th. We can get the parent th.
    const th = idButton.closest('th')
    expect(th).toBeInTheDocument()

    // Initial state: sorted by 'receivedAt' descending (default in component).
    // So "ID" column should NOT be sorted.
    expect(th).not.toHaveAttribute('aria-sort')

    // The button should have a descriptive label
    // Current implementation: no aria-label, so it uses text content "ID"
    // We want it to be "Sort by ID descending" (since clicking it sorts desc)

    // Currently this expectation will fail (or pass if I assert it DOESN'T have it)
    // Let's assert what we WANT to see, so the test fails now.
    expect(idButton).toHaveAttribute('aria-label', expect.stringContaining('Sort by ID'))
  })

  it('updates aria-sort and aria-label when sorting changes', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    const idButton = screen.getByRole('button', { name: /ID/i })

    // Click to sort by ID
    fireEvent.click(idButton)

    // Now it should be sorted by ID descending (first click sets to desc)
    const th = idButton.closest('th')
    expect(th).toHaveAttribute('aria-sort', 'descending')

    // Button label should now suggest next action: ascending
    expect(idButton).toHaveAttribute('aria-label', expect.stringContaining('ascending'))

    // Click again to sort ascending
    fireEvent.click(idButton)
    expect(th).toHaveAttribute('aria-sort', 'ascending')
    expect(idButton).toHaveAttribute('aria-label', expect.stringContaining('descending'))
  })
})
