import { describe, it, expect } from 'vitest'
import { groupDocuments } from '../components/documents-interface'
import { Document } from '../types/document'

describe('DocumentsInterface Performance', () => {
  it('groupDocuments correctly groups documents by supplier and type', () => {
    const documents: Document[] = [
      {
        id: '1',
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
        receivedAt: new Date('2023-01-01'),
        confidence: 0.9,
        payload: {},
        auditTimeline: []
      },
      {
        id: '2',
        status: 'extracted',
        type: 'invoice',
        documentNumber: 'INV-002',
        amount: 200,
        currency: 'USD',
        supplier: 'Supplier A',
        channel: 'gmail',
        senderEmail: 'test@example.com',
        fileType: 'pdf',
        processingTime: 100,
        receivedAt: new Date('2023-01-02'),
        confidence: 0.9,
        payload: {},
        auditTimeline: []
      },
      {
        id: '3',
        status: 'extracted',
        type: 'BL',
        documentNumber: 'BL-001',
        amount: 300,
        currency: 'USD',
        supplier: 'Supplier A',
        channel: 'gmail',
        senderEmail: 'test@example.com',
        fileType: 'pdf',
        processingTime: 100,
        receivedAt: new Date('2023-01-03'),
        confidence: 0.9,
        payload: {},
        auditTimeline: []
      },
      {
        id: '4',
        status: 'extracted',
        type: 'invoice',
        documentNumber: 'INV-003',
        amount: 400,
        currency: 'USD',
        supplier: 'Supplier B',
        channel: 'gmail',
        senderEmail: 'test@example.com',
        fileType: 'pdf',
        processingTime: 100,
        receivedAt: new Date('2023-01-04'),
        confidence: 0.9,
        payload: {},
        auditTimeline: []
      }
    ]

    const result = groupDocuments(documents)

    // Expected:
    // 1 group for Supplier A - invoice (docs 1 & 2)
    // 1 single for Supplier A - BL (doc 3)
    // 1 single for Supplier B - invoice (doc 4)

    expect(result).toHaveLength(3)

    const group = result.find(r => r.type === 'group')
    expect(group).toBeDefined()
    expect(group?.group?.groupKey).toBe('Supplier A')
    expect(group?.group?.documents).toHaveLength(2)
    expect(group?.group?.aggregateData.totalAmount).toBe(300)

    const singles = result.filter(r => r.type === 'single')
    expect(singles).toHaveLength(2)
    const singleIds = singles.map(s => s.document?.id)
    expect(singleIds).toContain('3')
    expect(singleIds).toContain('4')
  })
})
