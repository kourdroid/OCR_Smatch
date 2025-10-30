'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopBar } from './top-bar'
import { KPIRow } from './kpi-row'
import { DocumentsTable } from './documents-table'
import { SideSheet } from './side-sheet'
import { EmptyState } from './empty-state'
import { CommandBar } from './command-bar'
import { RealTimeIndicator } from './real-time-indicator'
import { ConfidenceReview } from './confidence-review'
import AddDocumentTypeModal from './add-document-type-modal'
import { Document, FilterState, KPIData, DocumentRow, DocumentGroup, DatabaseRow, AuditEvent } from '@/types/document'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { documentSchemaService } from '@/lib/document-schema'
import { useRealTime } from '@/hooks/use-real-time'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider 
} from '@/components/ui/sidebar'
import { FileText, Clock, AlertTriangle, CheckCircle, BarChart3, Settings, Plus } from 'lucide-react'

export function DocumentsInterface({ initialDocuments }: { initialDocuments: Document[] }) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments || [])
  const [kpiData, setKPIData] = useState<KPIData>({ documentsToday: 0, extractionRate: 0, avgProcessingTime: 0 })
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [, setIsSideSheetOpen] = useState(false)
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false)
  const [isConfidenceReviewOpen, setIsConfidenceReviewOpen] = useState(false)
  const [reviewDocument, setReviewDocument] = useState<Document | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    channels: [],
    statuses: [],
    dateRange: {},
    amountRange: {}
  })

  const [documentTypes, setDocumentTypes] = useState<Array<{name: string, displayName: string, icon: string}>>([]);
  const [isAddDocumentTypeModalOpen, setIsAddDocumentTypeModalOpen] = useState(false)

  // Real-time functionality
  const {
    isConnected,
    lastUpdate,
    newDocumentCount
  } = useRealTime({
    documents,
    kpiData,
    onDocumentsUpdate: setDocuments,
    onKPIUpdate: setKPIData
  })

  // Initialize document schema service with loading states
  useEffect(() => {
    const initializeSchema = async () => {
      try {
        await documentSchemaService.initialize()
        
        // Get available document types for sidebar
        const types = documentSchemaService.getAllDocumentTypes()
        setDocumentTypes(types.map(type => ({
          name: type.name || 'unknown',
          displayName: type.displayName || 'Unknown Type',
          icon: type.icon || '📄'
        })))
        
        // Check initialization status
        const status = documentSchemaService.getInitializationStatus()
        if (status.error) {
          console.warn('Schema service initialized with fallback data due to error:', status.error)
        }
      } catch (error) {
        console.error('Failed to initialize schema service:', error)
        // Set fallback document types
        setDocumentTypes([
          { name: 'invoice', displayName: 'Facture', icon: '🧾' },
          { name: 'BL', displayName: 'Bon de Livraison', icon: '📦' },
          { name: 'BC', displayName: 'Bon de Commande', icon: '📋' },
          { name: 'CO', displayName: 'Bon de Mouvement', icon: '🔄' }
        ])
      }
    }
    initializeSchema()
  }, [])

  // Compute KPI from current documents using useMemo to avoid setState in useEffect
  const computedKPIData = useMemo(() => {
    const safeDocuments = documents || []
    const today = new Date()
    const docsToday = safeDocuments.filter(d => {
      const rd = d.receivedAt
      return rd.getDate() === today.getDate() && rd.getMonth() === today.getMonth() && rd.getFullYear() === today.getFullYear()
    })
    const extractedCount = safeDocuments.filter(d => d.status === 'extracted').length
    const avgProc = Math.round(
      safeDocuments.slice(0, 10).reduce((acc, d) => acc + (d.processingTime || 0), 0) / Math.max(1, Math.min(10, safeDocuments.length))
    )
    return {
      documentsToday: docsToday.length,
      extractionRate: Math.round((extractedCount / Math.max(1, safeDocuments.length)) * 100),
      avgProcessingTime: avgProc
    }
  }, [documents])

  // Update KPI data when computed values change
  useEffect(() => {
    setKPIData(computedKPIData)
  }, [computedKPIData])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandBarOpen(true)
      }
      if (e.key === 'Escape') {
        setSelectedDocument(null)
        setIsCommandBarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])



  // Search in Supabase when search term changes
  useEffect(() => {
    const run = async () => {
      // Skip if Supabase is not available
      if (!isSupabaseAvailable() || !supabase) {
        console.warn('Supabase not available - search functionality disabled')
        return
      }

      const q = filters.search?.trim()
      if (!q) {
        // Reload first page when clearing search
        try {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(25)
          
          if (error) {
            console.error('Supabase error during reload:', error)
            return
          }

          setDocuments((data || []).map((row: DatabaseRow) => ({
            id: String(row.id ?? crypto.randomUUID()),
            status: (row.status ?? 'extracted') as Document['status'],
            type: (row.type ?? 'OTHER') as Document['type'],
            documentNumber: String(row.document_number ?? ''),
            amount: Number(row.amount ?? 0),
            currency: String(row.currency ?? 'USD'),
            supplier: String(row.supplier ?? 'Unknown'),
            channel: (row.channel ?? 'gmail') as Document['channel'],
            senderEmail: String(row.sender_email ?? ''),
            fileType: (row.file_type ?? 'pdf') as Document['fileType'],
            processingTime: Number(row.processing_time ?? 0),
            receivedAt: new Date(row.received_at ?? row.created_at ?? Date.now()),
            confidence: Number(row.confidence ?? 0.9),
            payload: row.payload ?? {},
            thumbnails: row.thumbnails ?? [],
            auditTimeline: (row.document_events ?? []) as AuditEvent[],
            downloadUrl: row.download_url ?? undefined,
          })))
        } catch (err) {
          console.error('Failed to reload documents:', err)
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .textSearch('payload', q)
          .order('created_at', { ascending: false })
          .range(0, 49)
        
        if (error) {
          console.error('Supabase error during search:', error)
          return
        }

        setDocuments((data || []).map((row: DatabaseRow) => ({
          id: String(row.id ?? crypto.randomUUID()),
          status: (row.status ?? 'extracted') as Document['status'],
          type: (row.type ?? 'OTHER') as Document['type'],
          documentNumber: String(row.document_number ?? ''),
          amount: Number(row.amount ?? 0),
          currency: String(row.currency ?? 'USD'),
          supplier: String(row.supplier ?? 'Unknown'),
          channel: (row.channel ?? 'gmail') as Document['channel'],
          senderEmail: String(row.sender_email ?? ''),
          fileType: (row.file_type ?? 'pdf') as Document['fileType'],
          processingTime: Number(row.processing_time ?? 0),
          receivedAt: new Date(row.received_at ?? row.created_at ?? Date.now()),
          confidence: Number(row.confidence ?? 0.9),
          payload: row.payload ?? {},
          thumbnails: row.thumbnails ?? [],
          auditTimeline: (row.document_events ?? []) as AuditEvent[],
          downloadUrl: row.download_url ?? undefined,
        })))
      } catch (err) {
        console.error('Failed to search documents:', err)
      }
    }
    const timer = setTimeout(run, 250)
    return () => {
      clearTimeout(timer)
    }
  }, [filters.search])

  const filteredDocuments = (documents || []).filter(doc => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const searchableText = [
        doc.documentNumber,
        doc.supplier,
        doc.senderEmail,
        JSON.stringify(doc.payload)
      ].join(' ').toLowerCase()
      
      if (!searchableText.includes(searchTerm)) return false
    }

    // Type filter
    if ((filters.types || []).length > 0 && !(filters.types || []).includes(doc.type)) return false

    // Channel filter
    if ((filters.channels || []).length > 0 && !(filters.channels || []).includes(doc.channel)) return false

    // Status filter
    if ((filters.statuses || []).length > 0 && !(filters.statuses || []).includes(doc.status)) return false

    // Date range filter
    if (filters.dateRange.from && doc.receivedAt < filters.dateRange.from) return false
    if (filters.dateRange.to && doc.receivedAt > filters.dateRange.to) return false

    // Amount range filter
    if (filters.amountRange.min && doc.amount < filters.amountRange.min) return false
    if (filters.amountRange.max && doc.amount > filters.amountRange.max) return false

    return true
  })

  // Group documents by supplier and type
  const groupDocuments = (docs: Document[]): DocumentRow[] => {
    const groups: { [key: string]: Document[] } = {}
    const singles: Document[] = []

    // Group documents by supplier + type combination
    docs.forEach(doc => {
      const groupKey = `${doc.supplier}-${doc.type}`
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(doc)
    })

    const documentRows: DocumentRow[] = []

    // Process groups
    Object.entries(groups).forEach(([groupKey, groupDocs]) => {
      if (groupDocs.length > 1) {
        // Create a group
        const totalAmount = groupDocs.reduce((sum, doc) => sum + doc.amount, 0)
        const avgConfidence = groupDocs.reduce((sum, doc) => sum + doc.confidence, 0) / groupDocs.length
        const latestReceivedAt = Math.max(...groupDocs.map(doc => new Date(doc.receivedAt).getTime()))
        
        // Determine group status
        const statuses = [...new Set(groupDocs.map(doc => doc.status))]
        let groupStatus: 'extracted' | 'needs review' | 'failed' | 'mixed'
        if (statuses.length === 1) {
          groupStatus = statuses[0] as 'extracted' | 'needs review' | 'failed'
        } else {
          groupStatus = 'mixed'
        }

        const group: DocumentGroup = {
          id: `group-${groupKey}`,
          groupKey: groupDocs[0].supplier,
          documents: groupDocs,
          aggregateData: {
            count: groupDocs.length,
            totalAmount,
            currency: groupDocs[0].currency,
            avgConfidence,
            status: groupStatus,
            latestReceivedAt: new Date(latestReceivedAt)
          }
        }

        documentRows.push({
          type: 'group',
          group
        })
      } else {
        // Single document
        singles.push(...groupDocs)
      }
    })

    // Add single documents
    singles.forEach(doc => {
      documentRows.push({
        type: 'single',
        document: doc
      })
    })

    return documentRows
  }

  const documentRows = groupDocuments(filteredDocuments)

  // Confidence review handlers
  const handleConfidenceReview = (document: Document) => {
    setReviewDocument(document)
    setIsConfidenceReviewOpen(true)
    setIsSideSheetOpen(false) // Close side sheet if open
  }

  const handleConfidenceReviewSave = (updatedDocument: Document) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === updatedDocument.id ? updatedDocument : doc
    ))
    setIsConfidenceReviewOpen(false)
    setReviewDocument(null)
  }

  const handleConfidenceReviewCancel = () => {
    setIsConfidenceReviewOpen(false)
    setReviewDocument(null)
  }

  // Document type management handlers
  const handleAddDocumentType = async (documentType: {
    name: string;
    description: string;
    color: string;
    icon: string;
    targetTable: string;
    requiredFields: Array<{
      name: string;
      displayLabel: string;
      type: string;
      required: boolean;
    }>;
  }) => {
    try {
      // Prepare data for n8n webhook
      const webhookData = {
        action: 'create_document_type',
        timestamp: new Date().toISOString(),
        data: {
          name: documentType.name,
          displayName: documentType.name,
          description: documentType.description,
          targetTable: documentType.targetTable,
          icon: documentType.icon,
          color: documentType.color,
          requiredFields: documentType.requiredFields.map(field => ({
            name: field.name,
            displayLabel: field.displayLabel,
            type: field.type === 'textarea' ? 'string' : field.type === 'number' ? 'integer' : field.type,
            required: field.required
          }))
        }
      }

      // Send data to n8n webhook
      const response = await fetch('https://n8n.srv1078911.hstgr.cloud/webhook/d0b95baf-39b1-4d77-92ac-1e75e1329306', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Document type sent to webhook successfully:', result)

      // Handle success response from n8n
      if (result.ok && result.documentTypeId) {
        // Import toast dynamically to avoid SSR issues
        const { toast } = await import('sonner')
        toast.success('Document Type Created Successfully!', {
          description: `Document type "${documentType.name}" has been created with ID: ${result.documentTypeId}. Table "${documentType.targetTable}" is ready to use.`,
          duration: 5000,
        })
        
        // Log the complete response for debugging
        console.log('Document type created with details:', {
          id: result.documentTypeId,
          icon: result.icon,
          color: result.color,
          name: documentType.name,
          targetTable: documentType.targetTable
        })
      } else if (result.ok) {
        // Handle partial success or other responses
        const { toast } = await import('sonner')
        toast.info('Document Type Submitted', {
          description: 'Your document type has been submitted for processing.',
          duration: 3000,
        })
      } else {
        // Handle non-ok responses
        const { toast } = await import('sonner')
        toast.warning('Document Type Processing', {
          description: 'Your document type is being processed. Please check back later.',
          duration: 4000,
        })
      }

    } catch (error) {
      console.error('Failed to send document type to webhook:', error)
      // Show error toast
      const { toast } = await import('sonner')
      toast.error('Failed to Create Document Type', {
        description: 'There was an error submitting your document type. Please try again.',
        duration: 5000,
      })
      throw error
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex mx-auto w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="font-semibold">OCR Platform</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Documents</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setFilters({ ...filters, statuses: [] })}
                      isActive={(filters.statuses || []).length === 0}
                    >
                      <FileText className="h-4 w-4" />
                      All Documents
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setFilters({ ...filters, statuses: ['extracted'] })}
                      isActive={(filters.statuses || []).includes('extracted')}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Extracted
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setFilters({ ...filters, statuses: ['needs review'] })}
                      isActive={(filters.statuses || []).includes('needs review')}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Needs Review
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setFilters({ ...filters, statuses: ['failed'] })}
                      isActive={(filters.statuses || []).includes('failed')}
                    >
                      <Clock className="h-4 w-4" />
                      Failed
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Document Types</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setIsAddDocumentTypeModalOpen(true)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border border-dashed border-blue-300 dark:border-blue-600 mb-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Document Type
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {documentTypes.map((docType) => (
                    <SidebarMenuItem key={docType.name}>
                      <SidebarMenuButton 
                        onClick={() => setFilters({ ...filters, types: [docType.name] })}
                        isActive={(filters.types || []).includes(docType.name)}
                      >
                        <span className="text-base mr-2">{docType.icon}</span>
                        {docType.displayName}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col relative">
          <TopBar 
            filters={filters}
            onFiltersChange={setFilters}
            isDarkMode={isDarkMode}
            onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
            onCommandBarOpen={() => setIsCommandBarOpen(true)}
          />
          
          <main className="pt-16 p-6 space-y-6 flex-1">
             <div className="w-full space-y-6">
               <KPIRow data={kpiData} />
               
               {/* Real-time Indicator */}
               <div className="px-6 py-4 border border-border rounded-lg bg-card">
                 <div className="flex items-center justify-between">
                   <RealTimeIndicator 
                     isConnected={isConnected}
                     lastUpdate={lastUpdate || new Date()}
                     newDocumentCount={newDocumentCount}
                   />
                 </div>
               </div>
              
              {documentRows.length === 0 ? (
                <EmptyState hasFilters={Object.values(filters).some(v => 
                  Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v
                )} />
              ) : (
                <DocumentsTable 
                  documentRows={documentRows}
                  onDocumentSelect={setSelectedDocument}
                  selectedDocument={selectedDocument}
                  onConfidenceReview={handleConfidenceReview}
                  onGroupToggle={(groupId: string) => {
                    // Handle group toggle if needed
                    console.log('Group toggled:', groupId)
                  }}
                />
              )}
            </div>
          </main>
          
          {selectedDocument && (
            <SideSheet 
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
              onConfidenceReview={handleConfidenceReview}
            />
          )}
        </SidebarInset>
      </div>

      {isConfidenceReviewOpen && reviewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <ConfidenceReview
                document={reviewDocument}
                onSave={handleConfidenceReviewSave}
                onCancel={handleConfidenceReviewCancel}
              />
            </div>
          </div>
        </div>
      )}

      <CommandBar 
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        documents={documents}
        onDocumentSelect={setSelectedDocument}
      />

      <AddDocumentTypeModal
        isOpen={isAddDocumentTypeModalOpen}
        onClose={() => setIsAddDocumentTypeModalOpen(false)}
        onAdd={handleAddDocumentType}
      />
    </SidebarProvider>
  )
}