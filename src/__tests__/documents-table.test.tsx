import '@testing-library/jest-dom'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { DocumentsTable } from '@/components/documents-table'
import { Document, DocumentRow } from '@/types/document'

// Mock Document data
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
    processingTime: 10,
    receivedAt: new Date('2023-01-01'),
    confidence: 0.9,
    payload: {},
    thumbnails: [],
    auditTimeline: [],
  },
  {
    id: '2',
    status: 'processing',
    type: 'invoice',
    documentNumber: 'DOC-002',
    amount: 200,
    currency: 'USD',
    supplier: 'Supplier B',
    channel: 'gmail',
    senderEmail: '',
    fileType: 'png',
    processingTime: 0,
    receivedAt: new Date('2023-01-02'),
    confidence: 0,
    payload: {},
    thumbnails: [],
    auditTimeline: [],
  }
]

// Match DocumentRow structure
const mockDocumentRows: DocumentRow[] = mockDocuments.map(doc => ({
  type: 'single',
  document: doc
}))

describe('DocumentsTable', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders correctly', () => {
    render(
      <DocumentsTable
        documentRows={mockDocumentRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        isLoading={false}
      />
    )
    expect(screen.getByText('DOC-001')).toBeDefined()
    expect(screen.getByText('Supplier A')).toBeDefined()
    expect(screen.getByText('DOC-002')).toBeDefined()
  })

  it('sorts rows when header is clicked', () => {
    render(
      <DocumentsTable
        documentRows={mockDocumentRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        isLoading={false}
      />
    )

    // Default sort is receivedAt desc. DOC-002 (Jan 2) should be before DOC-001 (Jan 1)
    let rows = screen.getAllByRole('row')
    // row[0] is header, row[1] is first data row
    expect(rows[1]).toHaveTextContent('DOC-002')
    expect(rows[2]).toHaveTextContent('DOC-001')

    // Click "ID" header to sort by documentNumber (desc by default for new field)
    const idHeader = screen.getByText('ID')
    fireEvent.click(idHeader)

    rows = screen.getAllByRole('row')
    // DOC-002 > DOC-001. Descending order.
    expect(rows[1]).toHaveTextContent('DOC-002')
    expect(rows[2]).toHaveTextContent('DOC-001')

    // Click "ID" header again to sort asc
    fireEvent.click(idHeader)

    rows = screen.getAllByRole('row')
    // DOC-001 < DOC-002. Ascending order.
    expect(rows[1]).toHaveTextContent('DOC-001')
    expect(rows[2]).toHaveTextContent('DOC-002')
  })
})
