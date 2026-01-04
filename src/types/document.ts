export interface DatabaseRow {
  id?: string | number
  document_id?: string | number
  status?: string
  type?: string
  document_number?: string
  amount?: number | string
  currency?: string
  supplier?: string
  channel?: string
  sender_email?: string
  senderEmail?: string
  file_type?: string
  fileType?: string
  processing_time?: number
  processingTime?: number
  received_at?: string | Date
  created_at?: string | Date
  confidence?: number | string
  payload?: Record<string, unknown>
  document_events?: unknown[]
  reviewed_at?: string | Date
  thumbnails?: string[]
  download_url?: string
  downloadUrl?: string
  download_expiry?: string | Date
  downloadExpiry?: string | Date
}

export interface Document {
  id: string
  status: 'extracted' | 'needs review' | 'failed' | 'processing'
  type: 'invoice' | 'BL' | 'BC' | 'CO' | 'OTHER'
  documentNumber: string
  amount: number
  currency: string
  supplier: string
  channel: 'gmail' | 'whatsapp' | 'telegram'
  senderEmail: string
  fileType: 'pdf' | 'xlsx' | 'png' | 'jpg'
  processingTime: number
  receivedAt: Date
  confidence: number
  payload: Record<string, any>
  thumbnails?: string[]
  auditTimeline: AuditEvent[]
  downloadUrl?: string
  downloadExpiry?: Date
  organization?: {
    id: string
    name: string
  }
}

export interface AuditEvent {
  timestamp: Date
  event: 'arrived' | 'classified' | 'extracted' | 'reviewed' | 'corrected'
  details?: string
  confidence?: number
}

export interface KPIData {
  documentsToday: number
  extractionRate: number
  avgProcessingTime: number
  // New KPIs to match Figma design
  valueProcessed?: number
  documentsProcessed?: number
  mismatchedDocuments?: number
}

export interface FilterState {
  search: string
  types: string[]
  channels: string[]
  statuses: string[]
  dateRange: {
    from?: Date
    to?: Date
  }
  amountRange: {
    min?: number
    max?: number
  }
  // Extended filters for dashboard design
  supplier?: string
  documentId?: string
  shipper?: string
  fileType?: string
  channelQuery?: string
}

export interface SavedView {
  id: string
  name: string
  filters: FilterState
  isDefault?: boolean
}

export interface DocumentGroup {
  id: string
  groupKey: string // e.g., supplier + documentNumber prefix
  documents: Document[]
  aggregateData: {
    count: number
    totalAmount: number
    currency: string
    status: 'extracted' | 'needs review' | 'failed' | 'mixed'
    avgConfidence: number
    latestReceivedAt: Date
  }
  isExpanded?: boolean
}

export interface DocumentRow {
  type: 'single' | 'group'
  document?: Document
  group?: DocumentGroup
}
