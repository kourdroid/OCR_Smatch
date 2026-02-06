import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { DocumentsTable } from '@/components/documents-table'
import { Document, DocumentRow } from '@/types/document'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend expect with jest-dom matchers
expect.extend(matchers)

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="icon-file-text" />,
  Receipt: () => <span data-testid="icon-receipt" />,
  Ship: () => <span data-testid="icon-ship" />,
  Award: () => <span data-testid="icon-award" />,
  File: () => <span data-testid="icon-file" />,
  Mail: () => <span data-testid="icon-mail" />,
  MessageSquare: () => <span data-testid="icon-message-square" />,
  Send: () => <span data-testid="icon-send" />,
  FileSpreadsheet: () => <span data-testid="icon-file-spreadsheet" />,
  Image: () => <span data-testid="icon-image" />,
  Download: () => <span data-testid="icon-download" />,
  ChevronUp: () => <span data-testid="icon-chevron-up" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Package: () => <span data-testid="icon-package" />,
  Clock: () => <span data-testid="icon-clock" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
}))

afterEach(() => {
  cleanup()
})

const mockDocument: Document = {
  id: 'doc-1',
  status: 'extracted',
  type: 'invoice',
  documentNumber: 'INV-001',
  amount: 100,
  currency: 'USD',
  supplier: 'Supplier A',
  channel: 'gmail',
  senderEmail: 'sender@example.com',
  fileType: 'pdf',
  processingTime: 10,
  receivedAt: new Date('2023-01-01'),
  confidence: 0.95,
  payload: {},
  auditTimeline: [],
  downloadUrl: 'http://example.com/doc.pdf',
}

const mockRows: DocumentRow[] = [
  {
    type: 'single',
    document: mockDocument,
  },
]

describe('DocumentsTable', () => {
  it('renders document rows', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('Supplier A')).toBeInTheDocument()
  })
})
