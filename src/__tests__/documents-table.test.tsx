import { render, screen, cleanup } from '@testing-library/react'
import { DocumentsTable } from '../components/documents-table'
import { DocumentRow } from '../types/document'
import { vi, describe, it, expect, afterEach } from 'vitest'
// import '@testing-library/jest-dom' // This was causing the issue

// Setup matchers for Vitest
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

// Mock icons to avoid rendering issues if any
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
  }
})

const mockDocument: any = {
  id: '1',
  documentNumber: '123',
  type: 'invoice',
  amount: 100,
  currency: 'USD',
  supplier: 'Test Supplier',
  channel: 'gmail',
  fileType: 'pdf',
  receivedAt: new Date(),
  status: 'extracted',
  payload: {}
}

const mockRows: DocumentRow[] = [
  {
    type: 'single',
    document: mockDocument
  }
]

describe('DocumentsTable', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders sortable headers with correct aria-sort attributes', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    // Default sort is receivedAt (Time) descending
    const timeHeader = screen.getByRole('columnheader', { name: /Time/i })
    expect(timeHeader).toHaveAttribute('aria-sort', 'descending')

    // ID header should not be sorted
    const idHeader = screen.getByRole('columnheader', { name: /ID/i })
    expect(idHeader).not.toHaveAttribute('aria-sort')
  })

  it('renders sort buttons with aria-labels', () => {
    render(
      <DocumentsTable
        documentRows={mockRows}
        onDocumentSelect={vi.fn()}
        selectedDocument={null}
      />
    )

    // Time is sorted descending, so clicking should sort ascending
    const timeButton = screen.getByRole('button', { name: /Sort by Time ascending/i })
    expect(timeButton).toBeInTheDocument()

    // ID is not sorted, clicking should sort descending (default)
    const idButton = screen.getByRole('button', { name: /Sort by ID descending/i })
    expect(idButton).toBeInTheDocument()
  })
})
