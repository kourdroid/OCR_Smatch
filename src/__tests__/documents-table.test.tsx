import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '@/components/documents-table'
import { DocumentRow } from '@/types/document'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Mock Lucide icons
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
  Filter: () => <span data-testid="icon-filter" />,
  Loader2: () => <span className="lucide-loader-circle" />,
}))

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const mockGroupRow: DocumentRow = {
  type: 'group',
  group: {
    id: 'group-1',
    groupKey: 'Supplier A',
    documents: [
      {
        id: 'doc-1',
        status: 'extracted',
        type: 'invoice',
        documentNumber: 'INV-001',
        amount: 100,
        currency: 'USD',
        supplier: 'Supplier A',
        channel: 'gmail',
        senderEmail: 'supplier@example.com',
        fileType: 'pdf',
        processingTime: 1000,
        receivedAt: new Date('2023-10-26T10:00:00Z'),
        confidence: 0.95,
        payload: {},
        auditTimeline: [],
      }
    ],
    aggregateData: {
      count: 1,
      totalAmount: 100,
      currency: 'USD',
      status: 'extracted',
      avgConfidence: 0.95,
      latestReceivedAt: new Date('2023-10-26T10:00:00Z'),
    }
  }
}

describe('DocumentsTable Accessibility', () => {
  it('should have accessible group toggle buttons', () => {
    render(
      <DocumentsTable
        documentRows={[mockGroupRow]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // Find the button by its accessible name
    const expandButton = screen.getByRole('button', { name: /expand group/i })
    expect(expandButton).toBeInTheDocument()
    expect(expandButton).toHaveAttribute('aria-expanded', 'false')
    expect(expandButton).toHaveAttribute('title', 'Expand group')

    // Since it's collapsed, Collapse group should not be the name (though the same button changes name)
    expect(screen.queryByRole('button', { name: /collapse group/i })).not.toBeInTheDocument()
  })
})
