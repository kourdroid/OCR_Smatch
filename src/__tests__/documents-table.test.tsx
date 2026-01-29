import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { DocumentsTable } from '@/components/documents-table'
import { Document, DocumentGroup } from '@/types/document'

expect.extend(matchers)

// Mocks
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const mockDate = new Date('2024-01-01T12:00:00Z')

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
  processingTime: 1000,
  receivedAt: mockDate,
  confidence: 0.95,
  payload: {},
  auditTimeline: [],
  downloadUrl: 'https://example.com/doc.pdf',
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
    avgConfidence: 0.95,
    latestReceivedAt: mockDate,
  }
}

afterEach(() => {
  cleanup()
})

describe('DocumentsTable Accessibility', () => {
  it('headers should have aria-sort attributes', () => {
    render(
      <DocumentsTable
        documentRows={[]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // Default sort is receivedAt desc.
    // "Time" header should have aria-sort="descending"
    const headers = screen.getAllByRole('columnheader')
    const timeHeader = headers.find(h => h.textContent?.includes('Time'))

    expect(timeHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('sort buttons should have descriptive aria-labels', () => {
    render(
      <DocumentsTable
        documentRows={[]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // The button inside Time header should have an accessible name
    // We expect "Sort by Time descending" (or similar)
    const timeButton = screen.getByRole('button', { name: /Sort by Time/i })
    expect(timeButton).toBeInTheDocument()
  })

  it('group expand buttons should have aria-labels', () => {
    render(
      <DocumentsTable
        documentRows={[{ type: 'group', group: mockGroup }]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    // We expect it to have aria-label "Expand group Group Supplier"
    const expandBtn = screen.getByRole('button', { name: /Expand group Group Supplier/i })
    expect(expandBtn).toBeInTheDocument()
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('download buttons should have specific aria-labels', () => {
    render(
      <DocumentsTable
        documentRows={[{ type: 'single', document: mockDocument }]}
        onDocumentSelect={() => {}}
        selectedDocument={null}
      />
    )

    const downloadBtn = screen.getByRole('button', { name: /Download document INV-001/i })
    expect(downloadBtn).toBeInTheDocument()
  })
})
