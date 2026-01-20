import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentsTable } from '@/components/documents-table'
import { Document, DocumentRow } from '@/types/document'

// Mock icons
vi.mock('lucide-react', async () => {
  return {
    FileText: () => <svg data-testid="icon-FileText" />,
    Receipt: () => <svg data-testid="icon-Receipt" />,
    Ship: () => <svg data-testid="icon-Ship" />,
    Award: () => <svg data-testid="icon-Award" />,
    File: () => <svg data-testid="icon-File" />,
    Mail: () => <svg data-testid="icon-Mail" />,
    MessageSquare: () => <svg data-testid="icon-MessageSquare" />,
    Send: () => <svg data-testid="icon-Send" />,
    FileSpreadsheet: () => <svg data-testid="icon-FileSpreadsheet" />,
    Image: () => <svg data-testid="icon-Image" />,
    Download: () => <svg data-testid="icon-Download" />,
    ChevronUp: () => <svg data-testid="icon-ChevronUp" />,
    ChevronDown: () => <svg data-testid="icon-ChevronDown" />,
    ChevronRight: () => <svg data-testid="icon-ChevronRight" />,
    Package: () => <svg data-testid="icon-Package" />,
  }
})

describe('DocumentsTable', () => {
  const mockDocuments: Document[] = [
    {
      id: '1',
      documentNumber: 'DOC-001',
      type: 'invoice',
      amount: 100,
      currency: 'USD',
      supplier: 'Supplier A',
      status: 'extracted',
      receivedAt: new Date('2023-01-01T10:00:00Z'),
      channel: 'gmail',
      senderEmail: 'a@example.com',
      fileType: 'pdf',
      processingTime: 10,
      confidence: 0.9,
      payload: {},
      thumbnails: [],
      auditTimeline: []
    },
    {
      id: '2',
      documentNumber: 'DOC-002',
      type: 'invoice', // Changed to invoice to match typeIcons or keep receipt
      amount: 200,
      currency: 'USD',
      supplier: 'Supplier B',
      status: 'needs review',
      receivedAt: new Date('2023-01-02T10:00:00Z'),
      channel: 'gmail',
      senderEmail: 'b@example.com',
      fileType: 'pdf',
      processingTime: 10,
      confidence: 0.8,
      payload: {},
      thumbnails: [],
      auditTimeline: []
    }
  ]

  const mockRows: DocumentRow[] = mockDocuments.map(doc => ({
    type: 'single',
    document: doc
  }))

  it('renders document rows', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        itemsPerPage={10}
      />
    )

    expect(screen.getByText('DOC-001')).toBeTruthy()
    expect(screen.getByText('DOC-002')).toBeTruthy()
    expect(screen.getByText('Supplier A')).toBeTruthy()
    expect(screen.getByText('Supplier B')).toBeTruthy()
  })

  it('sorts documents by date descending by default', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        itemsPerPage={10}
      />
    )

    const rows = screen.getAllByRole('row')
    // Row 0 is header.
    // Row 1 should be DOC-002 (later date)
    // Row 2 should be DOC-001

    expect(rows[1].textContent).toContain('DOC-002')
    expect(rows[2].textContent).toContain('DOC-001')
  })

  it('re-sorts when sort header is clicked', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        itemsPerPage={10}
      />
    )

    const amountHeader = screen.getByText('Amount')
    // Click 1: Sort by Amount Desc (default for new field)
    fireEvent.click(amountHeader)

    let rows = screen.getAllByRole('row')
    expect(rows[1].textContent).toContain('DOC-002') // 200

    // Click 2: Sort by Amount Asc
    fireEvent.click(amountHeader)

    rows = screen.getAllByRole('row')
    expect(rows[1].textContent).toContain('DOC-001') // 100
  })
})
