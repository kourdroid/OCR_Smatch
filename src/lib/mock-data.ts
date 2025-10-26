import { Document, KPIData } from '@/types/document'

export const mockKPIData: KPIData = {
  documentsToday: 47,
  extractionRate: 94.2,
  avgProcessingTime: 1847 // ms
}

export const mockDocuments: Document[] = [
  {
    id: '1',
    status: 'extracted',
    type: 'invoice',
    documentNumber: 'INV-2024-001',
    amount: 15420.50,
    currency: 'USD',
    supplier: 'Acme Logistics Corp',
    channel: 'gmail',
    senderEmail: 'billing@acmelogistics.com',
    fileType: 'pdf',
    processingTime: 1250,
    receivedAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    confidence: 0.96,
    payload: {
      invoice_number: 'INV-2024-001',
      supplier_name: 'Acme Logistics Corp',
      total: 15420.50,
      currency: 'USD',
      incoterm: 'FOB',
      items: [
        { description: 'Container shipping', quantity: 1, unit_price: 15420.50 }
      ]
    },
    auditTimeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 15), event: 'arrived' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 14), event: 'classified', confidence: 0.98 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 13), event: 'extracted', confidence: 0.96 }
    ],
    downloadUrl: 'https://example.com/download/1',
    downloadExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours from now
  },
  {
    id: '2',
    status: 'needs review',
    type: 'BL',
    documentNumber: 'BL-2024-0089',
    amount: 8750.00,
    currency: 'EUR',
    supplier: 'Maritime Solutions Ltd',
    channel: 'whatsapp',
    senderEmail: '+1234567890',
    fileType: 'pdf',
    processingTime: 2100,
    receivedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    confidence: 0.78,
    payload: {
      bill_of_lading: 'BL-2024-0089',
      supplier_name: 'Maritime Solutions Ltd',
      total: 8750.00,
      currency: 'EUR',
      vessel: 'MSC Divina',
      port_of_loading: 'Hamburg',
      port_of_discharge: 'New York'
    },
    auditTimeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 45), event: 'arrived' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 43), event: 'classified', confidence: 0.89 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 41), event: 'extracted', confidence: 0.78 }
    ],
    downloadUrl: 'https://example.com/download/2',
    downloadExpiry: new Date(Date.now() + 1000 * 60 * 60 * 23) // 23 hours from now
  },
  {
    id: '3',
    status: 'failed',
    type: 'OTHER',
    documentNumber: 'DOC-2024-0156',
    amount: 0,
    currency: 'USD',
    supplier: 'Unknown Sender',
    channel: 'telegram',
    senderEmail: '@logistics_bot',
    fileType: 'png',
    processingTime: 890,
    receivedAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    confidence: 0.23,
    payload: {
      error: 'Unable to extract structured data',
      raw_text: 'Blurry image with handwritten notes'
    },
    auditTimeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 120), event: 'arrived' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 119), event: 'classified', confidence: 0.45 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 118), event: 'extracted', confidence: 0.23 }
    ],
    downloadUrl: 'https://example.com/download/3',
    downloadExpiry: new Date(Date.now() + 1000 * 60 * 60 * 22) // 22 hours from now
  },
  {
    id: '4',
    status: 'extracted',
    type: 'CO',
    documentNumber: 'CO-2024-0234',
    amount: 25600.75,
    currency: 'GBP',
    supplier: 'British Freight Services',
    channel: 'gmail',
    senderEmail: 'docs@britishfreight.co.uk',
    fileType: 'pdf',
    processingTime: 1680,
    receivedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    confidence: 0.92,
    payload: {
      certificate_number: 'CO-2024-0234',
      supplier_name: 'British Freight Services',
      total: 25600.75,
      currency: 'GBP',
      country_of_origin: 'United Kingdom',
      goods_description: 'Automotive parts and components'
    },
    auditTimeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 30), event: 'arrived' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 29), event: 'classified', confidence: 0.94 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 27), event: 'extracted', confidence: 0.92 }
    ],
    downloadUrl: 'https://example.com/download/4',
    downloadExpiry: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hours from now
  },
  {
    id: '5',
    status: 'extracted',
    type: 'BC',
    documentNumber: 'BC-2024-0445',
    amount: 12300.00,
    currency: 'USD',
    supplier: 'Global Customs Solutions',
    channel: 'gmail',
    senderEmail: 'processing@globalcustoms.com',
    fileType: 'xlsx',
    processingTime: 2250,
    receivedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    confidence: 0.89,
    payload: {
      customs_declaration: 'BC-2024-0445',
      supplier_name: 'Global Customs Solutions',
      total: 12300.00,
      currency: 'USD',
      hs_code: '8703.23.10',
      duty_rate: '2.5%'
    },
    auditTimeline: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60), event: 'arrived' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 58), event: 'classified', confidence: 0.91 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 56), event: 'extracted', confidence: 0.89 }
    ],
    downloadUrl: 'https://example.com/download/5',
    downloadExpiry: new Date(Date.now() + 1000 * 60 * 60 * 23) // 23 hours from now
  }
]