import { DocumentsInterface } from '@/components/documents-interface'
import { ErrorBoundary } from '@/components/error-boundary'
import { supabase } from '@/lib/supabase'
import { Document, DatabaseRow } from '@/types/document'

function mapRowToDocument(row: DatabaseRow): Document {
  const toUnion = <T extends string>(val: unknown, allowed: T[], fallback: T): T => {
    return allowed.includes(val as T) ? (val as T) : fallback
  }

  // Extract data from payload if available
  const payload = row.payload || {}
  
  // Helper function to safely extract values from payload
  const extractFromPayload = (keys: string[], fallback: unknown = '') => {
    for (const key of keys) {
      if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
        return payload[key]
      }
    }
    return fallback
  }

  // Extract document type from payload or file type
  const inferDocumentType = (): Document['type'] => {
    const payloadKeys = Object.keys(payload).join(' ').toLowerCase()
    const filename = String(row.file_type || row.fileType || '').toLowerCase()
    
    if (payloadKeys.includes('invoice') || payloadKeys.includes('facture') || filename.includes('invoice') || filename.includes('facture')) {
      return 'invoice'
    }
    if (payloadKeys.includes('bill_of_lading') || payloadKeys.includes('bl_') || filename.includes('bl')) {
      return 'BL'
    }
    if (payloadKeys.includes('certificate') || filename.includes('certificate')) {
      return 'BC'
    }
    if (payloadKeys.includes('origin') || filename.includes('origin')) {
      return 'CO'
    }
    return 'OTHER'
  }

  const status = toUnion<Document['status']>(row.status, ['extracted', 'needs review', 'failed'], 'extracted')
  const type = toUnion<Document['type']>(row.type || inferDocumentType(), ['invoice', 'BL', 'BC', 'CO', 'OTHER'], 'OTHER')
  const channel = toUnion<Document['channel']>(row.channel, ['gmail', 'whatsapp', 'telegram'], 'gmail')
  const fileType = toUnion<Document['fileType']>(row.file_type || row.fileType, ['pdf', 'xlsx', 'png', 'jpg'], 'pdf')

  // Extract document number from payload with multiple possible keys
  const documentNumber = String(
    row.document_number || 
    row.documentNumber || 
    row.number ||
    extractFromPayload([
      'invoice_number', 'facture_number', 'numero_facture',
      'bl_number', 'bill_of_lading_number',
      'certificate_number', 'cert_number',
      'document_number', 'doc_number', 'number'
    ]) || 
    `DOC-${row.id || 'UNKNOWN'}`
  )

  // Extract amount from payload with multiple possible keys
  const amount = Number(
    row.amount || 
    extractFromPayload([
      'total', 'total_amount', 'amount', 'montant_total', 'montant',
      'invoice_total', 'facture_total', 'grand_total', 'net_amount',
      'total_due', 'amount_due', 'final_amount'
    ]) || 
    0
  )

  // Extract currency from payload
  const currency = String(
    row.currency || 
    extractFromPayload(['currency', 'devise', 'currency_code']) || 
    'USD'
  )

  // Extract supplier/vendor information from payload
  const supplier = String(
    row.supplier || 
    row.vendor ||
    extractFromPayload([
      'supplier_name', 'vendor_name', 'company_name', 'fournisseur',
      'seller_name', 'from_company', 'issuer_name', 'shipper_name',
      'supplier', 'vendor', 'company', 'organization'
    ]) || 
    'Unknown'
  )

  // Extract sender email from payload
  const senderEmail = String(
    row.sender_email || 
    row.senderEmail ||
    extractFromPayload([
      'sender_email', 'from_email', 'email', 'contact_email',
      'supplier_email', 'vendor_email'
    ]) || 
    ''
  )

  // Extract processing time (convert to milliseconds if needed)
  const processingTime = Number(row.processing_time || row.processingTime || 0)

  // Create default audit timeline if none exists
  const receivedAt = new Date(row.received_at ?? row.created_at ?? Date.now())
  
  // Ensure receivedAt is a valid date
  if (isNaN(receivedAt.getTime())) {
    receivedAt.setTime(Date.now())
  }
  
  const defaultTimeline = [
    { 
      timestamp: new Date(receivedAt.getTime()), 
      event: 'arrived' as const,
      details: 'Document received and queued for processing'
    },
    { 
      timestamp: new Date(receivedAt.getTime() + Math.floor(processingTime * 0.2)), 
      event: 'classified' as const,
      confidence: Math.min(0.95, Number(row.confidence ?? 0.9) + 0.05),
      details: `Document classified as ${type.toUpperCase()}`
    },
    { 
      timestamp: new Date(receivedAt.getTime() + Math.floor(processingTime * 0.8)), 
      event: 'extracted' as const,
      confidence: Number(row.confidence ?? 0.9),
      details: status === 'extracted' ? 'Data extraction completed successfully' : 
               status === 'needs review' ? 'Data extraction completed, requires manual review' :
               'Data extraction failed'
    }
  ]

  // Add review event if status is 'needs review' or if there was a review
  if (status === 'needs review' || row.reviewed_at) {
    const reviewTimestamp = row.reviewed_at ? new Date(row.reviewed_at) : new Date(receivedAt.getTime() + processingTime)
    // Ensure review timestamp is valid
    if (isNaN(reviewTimestamp.getTime())) {
      reviewTimestamp.setTime(receivedAt.getTime() + processingTime)
    }
    
    defaultTimeline.push({
      timestamp: reviewTimestamp,
      event: 'reviewed' as const,
      details: 'Document flagged for manual review'
    })
  }

  const doc: Document = {
    id: String(row.id ?? row.document_id ?? crypto.randomUUID()),
    status,
    type,
    documentNumber,
    amount,
    currency,
    supplier,
    channel,
    senderEmail,
    fileType,
    processingTime,
    receivedAt,
    confidence: Number(row.confidence ?? 0.9),
    payload: payload,
    thumbnails: row.thumbnails ?? [],
    auditTimeline: row.document_events && row.document_events.length > 0 ? row.document_events : defaultTimeline,
    downloadUrl: row.file_url ?? row.downloadUrl ?? undefined,
    downloadExpiry: row.file_url_expiry ? new Date(row.file_url_expiry) : undefined,
  }
  return doc
}

export default async function Home() {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(25)

  const initial = (data || []).map(mapRowToDocument)

  return (
    <ErrorBoundary>
      <DocumentsInterface initialDocuments={initial} />
    </ErrorBoundary>
  )
}
