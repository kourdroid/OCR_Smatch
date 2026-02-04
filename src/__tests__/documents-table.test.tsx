import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '@/components/documents-table'

expect.extend(matchers)
import { DocumentRow, DocumentGroup } from '@/types/document'

// Mock icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right" />,
  ChevronDown: () => <span data-testid="chevron-down" />,
  ChevronUp: () => <span data-testid="chevron-up" />,
  FileText: () => <span />,
  Receipt: () => <span />,
  Ship: () => <span />,
  Award: () => <span />,
  File: () => <span />,
  Mail: () => <span />,
  MessageSquare: () => <span />,
  Send: () => <span />,
  FileSpreadsheet: () => <span />,
  Image: () => <span />,
  Download: () => <span />,
  Package: () => <span />,
  Filter: () => <span />,
  Loader2: () => <span className="lucide-loader-circle" />,
}))

// Mock format utils if needed, but they are imported from @/lib/utils
// We might need to mock @/lib/utils if it has complex logic, but it's probably fine.

describe('DocumentsTable', () => {
  it('renders loading skeletons when isLoading is true', () => {
    render(
      <DocumentsTable
        documentRows={[]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        isLoading={true}
      />
    )
    // 5 skeleton rows + 1 header row = 6 rows
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(6)
  })

  it('renders expand buttons with accessible labels', () => {
    const mockGroup: DocumentGroup = {
      id: 'group-1',
      groupKey: 'Test Supplier',
      documents: [
        {
          id: '1',
          status: 'extracted',
          type: 'invoice',
          documentNumber: 'DOC-001',
          amount: 100,
          currency: 'USD',
          supplier: 'Test Supplier',
          channel: 'gmail',
          senderEmail: 'test@example.com',
          fileType: 'pdf',
          processingTime: 1000,
          receivedAt: new Date(),
          confidence: 0.95,
          payload: {},
          auditTimeline: []
        }
      ],
      aggregateData: {
        count: 1,
        totalAmount: 100,
        currency: 'USD',
        status: 'extracted',
        avgConfidence: 0.95,
        latestReceivedAt: new Date()
      }
    }

    const rows: DocumentRow[] = [{ type: 'group', group: mockGroup }]

    render(
      <DocumentsTable
        documentRows={rows}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        isLoading={false}
      />
    )

    // This should fail initially because the button doesn't have an aria-label
    expect(screen.getByRole('button', { name: /Expand group Test Supplier/i })).toBeInTheDocument()
  })
})
