import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '../components/documents-table'
import { DocumentRow, Document, DocumentGroup } from '../types/document'

expect.extend(matchers)

// Mock icons to avoid issues
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    ChevronRight: () => <span data-testid="chevron-right" />,
    ChevronDown: () => <span data-testid="chevron-down" />,
    ChevronUp: () => <span data-testid="chevron-up" />,
  }
})

const mockDocument: Document = {
  id: 'doc-1',
  status: 'extracted',
  type: 'invoice',
  documentNumber: 'INV-001',
  amount: 100,
  currency: 'USD',
  supplier: 'Test Supplier',
  channel: 'gmail',
  senderEmail: 'test@example.com',
  fileType: 'pdf',
  processingTime: 100,
  receivedAt: new Date('2023-01-01'),
  confidence: 0.9,
  payload: {},
  thumbnails: [],
  auditTimeline: [],
  downloadUrl: 'http://example.com/doc.pdf'
}

const mockGroup: DocumentGroup = {
  id: 'group-1',
  groupKey: 'Group Supplier',
  documents: [mockDocument],
  aggregateData: {
    count: 1,
    totalAmount: 100,
    currency: 'USD',
    status: 'extracted',
    avgConfidence: 0.9,
    latestReceivedAt: new Date('2023-01-01')
  }
}

const mockRows: DocumentRow[] = [
  { type: 'single', document: { ...mockDocument, id: 'doc-2', documentNumber: 'INV-002' } },
  { type: 'group', group: mockGroup }
]

describe('DocumentsTable', () => {
  it('renders document rows', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    // Use getAllByText and check existence
    expect(screen.getAllByText('INV-002')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Group Supplier')[0]).toBeInTheDocument()
  })

  it('renders group rows and expands them', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    // Find the group row by text 'Group Supplier'
    const groupNameElement = screen.getAllByText('Group Supplier')[0]
    const groupRow = groupNameElement.closest('tr')!

    // Find expand button within this row
    const expandButton = within(groupRow).getByRole('button', { name: '' }) // The button might not have aria-label, let's find by icon
    // Actually, simply clicking the row expands it too

    fireEvent.click(groupRow)

    // After click, it should show ChevronDown (globally or within row)
    // The component logic says: if expanded, ChevronDown is shown.
    expect(screen.getAllByTestId('chevron-down')[0]).toBeInTheDocument()

    // And the document inside the group should be visible (INV-001)
    expect(screen.getAllByText('INV-001')[0]).toBeInTheDocument()
  })

  it.skip('calls onDocumentSelect when a row is clicked', () => {
    const onSelect = vi.fn()
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={onSelect}
        selectedDocument={null}
      />
    )

    const element = screen.getAllByText('INV-002')[0]
    fireEvent.click(element)

    expect(onSelect).toHaveBeenCalled()
  })
})
