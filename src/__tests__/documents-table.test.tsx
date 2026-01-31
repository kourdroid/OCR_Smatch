import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '../components/documents-table'

expect.extend(matchers)
import { DocumentRow } from '../types/document'

// Mock icons to avoid issues during render
vi.mock('lucide-react', () => ({
  FileText: () => <svg data-testid="icon-file-text" />,
  Filter: () => <svg data-testid="icon-filter" />,
  Receipt: () => <svg data-testid="icon-receipt" />,
  Ship: () => <svg data-testid="icon-ship" />,
  Award: () => <svg data-testid="icon-award" />,
  File: () => <svg data-testid="icon-file" />,
  Mail: () => <svg data-testid="icon-mail" />,
  MessageSquare: () => <svg data-testid="icon-message-square" />,
  Send: () => <svg data-testid="icon-send" />,
  FileSpreadsheet: () => <svg data-testid="icon-file-spreadsheet" />,
  Image: () => <svg data-testid="icon-image" />,
  Download: () => <svg data-testid="icon-download" />,
  ChevronUp: () => <svg data-testid="icon-chevron-up" />,
  ChevronDown: () => <svg data-testid="icon-chevron-down" />,
  ChevronRight: () => <svg data-testid="icon-chevron-right" />,
  Package: () => <svg data-testid="icon-package" />,
}))

describe('DocumentsTable UX', () => {
  it('has accessible group toggle buttons', () => {
    const groupRow: DocumentRow = {
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
            senderEmail: 'test@example.com',
            fileType: 'pdf',
            processingTime: 1000,
            receivedAt: new Date(),
            confidence: 0.9,
            payload: {},
            auditTimeline: []
          }
        ],
        aggregateData: {
          count: 1,
          totalAmount: 100,
          currency: 'USD',
          status: 'extracted',
          avgConfidence: 0.9,
          latestReceivedAt: new Date()
        }
      }
    }

    render(
      <DocumentsTable
        documentRows={[groupRow]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // Verify the button exists but has no accessible label
    // The button is inside the first cell, and has ChevronRight
    // Find the one that is NOT a column header (column headers usually have text)
    // The sort buttons have text "ID", "Document Type", etc.
    // The group toggle button has only the icon.

    // We can search for the icon and get parent
    const chevron = screen.getByTestId('icon-chevron-right')
    const button = chevron.closest('button')
    expect(button).toBeInTheDocument()

    // It should have aria-label
    expect(button).toHaveAttribute('aria-label', 'Expand group')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('has empty state', () => {
    render(
      <DocumentsTable
        documentRows={[]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
        isLoading={false}
      />
    )

    // Expect "No documents found" text (from EmptyState component with hasFilters={true})
    expect(screen.getByText(/No documents match your filters/i)).toBeInTheDocument()
  })
})
