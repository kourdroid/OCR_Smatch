import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '@/components/documents-table'
import { DocumentRow, Document } from '@/types/document'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Mock icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="icon-FileText" />,
  Receipt: () => <div data-testid="icon-Receipt" />,
  Ship: () => <div data-testid="icon-Ship" />,
  Award: () => <div data-testid="icon-Award" />,
  File: () => <div data-testid="icon-File" />,
  Mail: () => <div data-testid="icon-Mail" />,
  MessageSquare: () => <div data-testid="icon-MessageSquare" />,
  Send: () => <div data-testid="icon-Send" />,
  FileSpreadsheet: () => <div data-testid="icon-FileSpreadsheet" />,
  Image: () => <div data-testid="icon-Image" />,
  Download: () => <div data-testid="icon-Download" />,
  ChevronUp: () => <div data-testid="icon-ChevronUp" />,
  ChevronDown: () => <div data-testid="icon-ChevronDown" />,
  ChevronRight: () => <div data-testid="icon-ChevronRight" />,
  Package: () => <div data-testid="icon-Package" />,
  Filter: () => <div data-testid="icon-Filter" />,
}))

const mockDocuments: Document[] = [
  {
    id: '1',
    status: 'extracted',
    type: 'invoice',
    documentNumber: 'DOC-001',
    amount: 100,
    currency: 'USD',
    supplier: 'Supplier A',
    channel: 'gmail',
    senderEmail: 'test@example.com',
    fileType: 'pdf',
    processingTime: 1000,
    receivedAt: new Date('2023-01-01T10:00:00Z'),
    confidence: 0.9,
    payload: {},
    auditTimeline: []
  },
  {
    id: '2',
    status: 'extracted',
    type: 'invoice',
    documentNumber: 'DOC-002',
    amount: 200,
    currency: 'USD',
    supplier: 'Supplier B',
    channel: 'gmail',
    senderEmail: 'test@example.com',
    fileType: 'pdf',
    processingTime: 1000,
    receivedAt: new Date('2023-01-02T10:00:00Z'),
    confidence: 0.9,
    payload: {},
    auditTimeline: []
  }
]

const mockRows: DocumentRow[] = mockDocuments.map(doc => ({
  type: 'single',
  document: doc
}))

describe('DocumentsTable', () => {
  it('renders correctly', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )
    expect(screen.getByText('DOC-001')).toBeDefined()
    expect(screen.getByText('DOC-002')).toBeDefined()
  })

  it('sorts rows when header is clicked', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // Initial order (descending by receivedAt usually, or checking default)
    // The component defaults to: sortField='receivedAt', sortDirection='desc'
    // DOC-002 is newer (Jan 2), so it should be first.

    const rows = screen.getAllByRole('row')
    // Row 0 is header. Row 1 is first data row.
    // We expect DOC-002 first.
    expect(rows[1]).toHaveTextContent('DOC-002')
    expect(rows[2]).toHaveTextContent('DOC-001')

    // Click "Amount" header to sort by amount.
    // Default click sets sortField to 'amount' and direction to 'desc'.
    // DOC-002 (200) > DOC-001 (100). So DOC-002 first.

    const amountHeader = screen.getByText('Amount')
    fireEvent.click(amountHeader)

    // Still DOC-002 first.
    const rowsAfterClick = screen.getAllByRole('row')
    expect(rowsAfterClick[1]).toHaveTextContent('DOC-002')

    // Click "Amount" again to toggle to 'asc'.
    fireEvent.click(amountHeader)

    // Now DOC-001 (100) should be first.
    const rowsAfterToggle = screen.getAllByRole('row')
    expect(rowsAfterToggle[1]).toHaveTextContent('DOC-001')
    expect(rowsAfterToggle[2]).toHaveTextContent('DOC-002')
  })
})
