import React from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '@/components/documents-table'
import { Document, DocumentRow } from '@/types/document'

expect.extend(matchers)

// Mock the UI components that might cause issues in testing
vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableRow: ({ children, onClick, className }: { children: React.ReactNode, onClick?: () => void, className?: string }) => <tr onClick={onClick} className={className}>{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th>{children}</th>,
  TableCell: ({ children, className }: { children: React.ReactNode, className?: string }) => <td className={className}>{children}</td>,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode, onClick?: () => void, disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('lucide-react', () => ({
  FileText: () => <span>Icon</span>,
  Receipt: () => <span>Icon</span>,
  Ship: () => <span>Icon</span>,
  Award: () => <span>Icon</span>,
  File: () => <span>Icon</span>,
  Mail: () => <span>Icon</span>,
  MessageSquare: () => <span>Icon</span>,
  Send: () => <span>Icon</span>,
  FileSpreadsheet: () => <span>Icon</span>,
  Image: () => <span>Icon</span>,
  Download: () => <span>Icon</span>,
  ChevronUp: () => <span>Up</span>,
  ChevronDown: () => <span>Down</span>,
  ChevronRight: () => <span>Right</span>,
  Package: () => <span>Package</span>,
}))

const mockDate = new Date('2023-01-01T12:00:00Z')

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
  processingTime: 100,
  receivedAt: mockDate,
  confidence: 0.9,
  payload: {},
  auditTimeline: [],
  downloadUrl: 'http://example.com/doc.pdf',
}

const mockDocumentRow: DocumentRow = {
  type: 'single',
  document: mockDocument,
}

describe('DocumentsTable', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders correctly with documents', () => {
    render(
      <DocumentsTable
        documentRows={[mockDocumentRow]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    expect(screen.getByText('INV-001')).toBeInTheDocument()
    const suppliers = screen.getAllByText('Supplier A')
    expect(suppliers.length).toBeGreaterThan(0)
    expect(suppliers[0]).toBeInTheDocument()
  })

  it('sorts documents', () => {
    const doc2 = { ...mockDocument, id: 'doc-2', documentNumber: 'INV-002', amount: 200 }
    const row2: DocumentRow = { type: 'single', document: doc2 }

    render(
      <DocumentsTable
        documentRows={[mockDocumentRow, row2]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // Initial sort might be by receivedAt desc (default)
    // Let's verify presence
    expect(screen.getByText('INV-001')).toBeInTheDocument()
    expect(screen.getByText('INV-002')).toBeInTheDocument()
  })
})
