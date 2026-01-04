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
import { ProfileModal } from './profile-modal'
import { useLanguage } from '@/contexts/language-context'
import DashboardFilters from './dashboard-filters'
import OrganizationsView from './organizations-view'
import { AdminDashboard } from './admin/admin-dashboard'
import { ClientDetailView } from './admin/client-detail-view'
import { Document, FilterState, KPIData, DocumentRow, DocumentGroup, DatabaseRow, AuditEvent } from '@/types/document'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { documentSchemaService } from '@/lib/document-schema'
import { useRealTime } from '@/hooks/use-real-time'
import { useAuthStore } from '@/stores/auth-store'
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail
} from '@/components/ui/sidebar'
import { FileText, Clock, AlertTriangle, CheckCircle, BarChart3, Settings, Plus, AtSign, ChevronRight, ChevronDown, LayoutDashboard, User, UploadCloud, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DocumentsInterface({ initialDocuments }: { initialDocuments: Document[] }) {
  const router = useRouter()
  const { profile, organization, isAdmin, fetchProfile, signOut } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>(initialDocuments || [])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [kpiData, setKPIData] = useState<KPIData>({ documentsToday: 0, extractionRate: 0, avgProcessingTime: 0, valueProcessed: 0, documentsProcessed: 0, mismatchedDocuments: 0 })
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [, setIsSideSheetOpen] = useState(false)
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false)
  const [isConfidenceReviewOpen, setIsConfidenceReviewOpen] = useState(false)
  const [reviewDocument, setReviewDocument] = useState<Document | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  // Date range preset for segmented control in the header
  const [datePreset, setDatePreset] = useState<'last24h' | '7d' | '30d' | '90d'>('7d')
  // Active navigation (for sidebar)
  const [activeNav, setActiveNav] = useState<'dashboard' | 'all_documents' | 'document_types' | 'analytics' | 'organizations' | 'logs'>('dashboard')
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    channels: [],
    statuses: [],
    dateRange: {},
    amountRange: {},
    supplier: '',
    documentId: '',
    shipper: '',
    fileType: '',
    channelQuery: ''
  })

  const [documentTypes, setDocumentTypes] = useState<Array<{ name: string, displayName: string, icon: string }>>([]);
  const [isAddDocumentTypeModalOpen, setIsAddDocumentTypeModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)
  const { t } = useLanguage()

  // Initialize auth on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  // Auth guard: redirect to /login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!isSupabaseAvailable() || !supabase) return
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // Function to load documents from Supabase with server-side filtering and pagination
  const loadDocuments = async () => {
    setIsLoadingDocuments(true)
    if (!isSupabaseAvailable() || !supabase) {
      console.warn('Supabase not available - documents loading disabled')
      setIsLoadingDocuments(false)
      return
    }

    console.log('Loading documents...', { isAdmin, organizationId: organization?.id, page: currentPage, filters })

    try {
      let query = supabase
        .from('documents')
        .select('*, organization:organizations(id, company_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      // Apply Organization Filter
      if (!isAdmin) {
        if (organization?.id) {
          query = query.or(`organization_id.is.null,organization_id.eq.${organization.id}`)
        } else {
          query = query.is('organization_id', null)
        }
      }

      // Apply Search Filter
      if (filters.search) {
        query = query.textSearch('payload', filters.search)
      }

      // Apply Filters
      if (filters.types && filters.types.length > 0) {
        query = query.in('type', filters.types)
      }
      if (filters.channels && filters.channels.length > 0) {
        query = query.in('channel', filters.channels)
      }
      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }
      if (filters.supplier) {
        query = query.ilike('supplier', `%${filters.supplier}%`)
      }
      if (filters.documentId) {
        query = query.ilike('document_number', `%${filters.documentId}%`)
      }
      if (filters.fileType) {
        query = query.eq('file_type', filters.fileType)
      }

      // Date Range
      if (filters.dateRange.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString())
      }

      // Amount Range
      if (filters.amountRange.min) {
        query = query.gte('amount', filters.amountRange.min)
      }
      if (filters.amountRange.max) {
        query = query.lte('amount', filters.amountRange.max)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Supabase error loading documents:', error)
        return
      }

      if (count !== null) {
        setTotalCount(count)
      }

      const documents = (data || []).map((row: any) => ({
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
        organization: row.organization ? {
          id: row.organization.id,
          name: row.organization.company_name
        } : undefined
      }))

      setDocuments(documents)
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
    setIsLoadingDocuments(false)
  }

  // Initial load of documents when component mounts
  // Initial load handled by the consolidated effect below

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

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
        console.warn('Failed to initialize schema service:', error)
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

  // Dashboard dataset filtered by selected date range
  const filteredDocumentsDashboard = (documents || []).filter(doc => {
    if (filters.dateRange.from && doc.receivedAt < filters.dateRange.from) return false
    if (filters.dateRange.to && doc.receivedAt > filters.dateRange.to) return false
    return true
  })

  // Compute KPI from current documents using useMemo to avoid setState in useEffect
  const computedKPIData = useMemo(() => {
    const safeDocuments = filteredDocumentsDashboard || []
    const today = new Date()
    const docsToday = safeDocuments.filter(d => {
      const rd = d.receivedAt
      return rd.getDate() === today.getDate() && rd.getMonth() === today.getMonth() && rd.getFullYear() === today.getFullYear()
    })
    const extractedCount = safeDocuments.filter(d => d.status === 'extracted').length
    const avgProc = Math.round(
      safeDocuments.slice(0, 10).reduce((acc, d) => acc + (d.processingTime || 0), 0) / Math.max(1, Math.min(10, safeDocuments.length))
    )
    const totalValueProcessed = safeDocuments.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const documentsProcessed = safeDocuments.length
    const mismatchedDocuments = safeDocuments.filter(d => d.status === 'failed' || d.status === 'needs review').length
    return {
      documentsToday: docsToday.length,
      extractionRate: Math.round((extractedCount / Math.max(1, safeDocuments.length)) * 100),
      avgProcessingTime: avgProc,
      valueProcessed: totalValueProcessed,
      documentsProcessed,
      mismatchedDocuments
    }
  }, [filteredDocumentsDashboard])

  // Apply date preset to filters when it changes
  useEffect(() => {
    const now = new Date()
    let from = new Date(now)
    if (datePreset === 'last24h') {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else if (datePreset === '7d') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (datePreset === '30d') {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (datePreset === '90d') {
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    }
    setFilters((prev) => ({
      ...prev,
      dateRange: { from, to: now },
    }))
  }, [datePreset])

  // Update KPI data when computed values change
  useEffect(() => {
    setKPIData(prev => {
      const equal = prev.documentsToday === computedKPIData.documentsToday &&
        prev.extractionRate === computedKPIData.extractionRate &&
        prev.avgProcessingTime === computedKPIData.avgProcessingTime &&
        prev.valueProcessed === computedKPIData.valueProcessed &&
        prev.documentsProcessed === computedKPIData.documentsProcessed &&
        prev.mismatchedDocuments === computedKPIData.mismatchedDocuments
      return equal ? prev : computedKPIData
    })
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

  // Dark mode removed



  // Consolidated document loading effect
  useEffect(() => {
    const run = async () => {
      await loadDocuments()
    }

    // Debounce filter changes to avoid rapid requests during typing
    const timer = setTimeout(run, 300)

    return () => clearTimeout(timer)
  }, [
    currentPage,
    itemsPerPage,
    organization,
    isAdmin,
    filters.search,
    filters.types,
    filters.channels,
    filters.statuses,
    filters.dateRange,
    filters.amountRange,
    filters.supplier,
    filters.documentId,
    filters.shipper,
    filters.fileType
  ])

  const handleClearFilters = () => {
    setFilters({
      search: '',
      types: [],
      channels: [],
      statuses: [],
      dateRange: {},
      amountRange: {},
      supplier: '',
      documentId: '',
      shipper: '',
      fileType: '',
      channelQuery: ''
    })
    setDatePreset('90d')
  }

  // Export uses the current paginated documents for now
  // TODO: Implement server-side export for all matching documents
  const exportRows = documents.map((doc) => {
    const shipper = (doc.payload?.shipper || doc.payload?.carrier || doc.payload?.shipping_company || doc.payload?.Shipper) as string | undefined
    return {
      id: doc.documentNumber || doc.id,
      type: doc.type,
      amount: doc.amount,
      currency: doc.currency,
      supplier: doc.supplier,
      shipper: shipper || '',
      file: doc.fileType,
      channel: doc.channel,
      time: new Date(doc.receivedAt).toISOString(),
    }
  })

  const handleExport = (format: 'csv' | 'json') => {
    try {
      if (exportRows.length === 0) {
        // No-op if nothing to export
        return
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `documents_${exportRows.length}.json`
        a.click()
        URL.revokeObjectURL(url)
        return
      }

      // CSV
      const headers = ['ID', 'Document Type', 'Amount', 'Currency', 'Supplier', 'Shipper', 'File', 'Channel', 'Time']
      const escape = (val: unknown) => {
        const s = String(val ?? '')
        // Escape quotes and wrap in quotes if needed
        const needsQuotes = /[",\n]/.test(s)
        const escaped = s.replace(/"/g, '""')
        return needsQuotes ? `"${escaped}"` : escaped
      }
      const rows = exportRows.map(r => [r.id, r.type, r.amount, r.currency, r.supplier, r.shipper, r.file, r.channel, r.time].map(escape).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `documents_${exportRows.length}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }


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

  // Since filtering is now server-side, 'documents' already contains the filtered, paginated results
  const documentRowsAll = groupDocuments(documents)

  // For dashboard, we might need a separate strategy or just use the current page's data for now
  // Ideally, we should fetch dashboard stats separately
  const documentRowsDashboard = groupDocuments(documents)

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  // Latest 3 rows for dashboard view
  const latestThreeRows = [...documentRowsDashboard]
    .sort((a, b) => {
      const aValue = a.type === 'group' && a.group
        ? a.group.aggregateData.latestReceivedAt
        : a.document?.receivedAt
      const bValue = b.type === 'group' && b.group
        ? b.group.aggregateData.latestReceivedAt
        : b.document?.receivedAt
      const aTime = aValue ? new Date(aValue).getTime() : 0
      const bTime = bValue ? new Date(bValue).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 3)

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
        },
        // organizationId is handled by the backend based on the user's session
        // or passed explicitly if we are in "Super Admin" mode managing another org
      }

      // Send data to the new API route
      const response = await fetch('/api/admin/create-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Request failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Document type created successfully:', result)

      // Handle success response
      if (result.success) {
        // Import toast dynamically to avoid SSR issues
        const { toast } = await import('sonner')
        toast.success('Document Type Created Successfully!', {
          description: `Document type "${documentType.name}" has been created with ID: ${result.documentTypeId}. Table "${documentType.targetTable}" is ready to use.`,
          duration: 5000,
        })
      }

      // Log the complete response for debugging
      console.log('Document type created with details:', {
        id: result.documentTypeId,
        icon: result.icon, // API might not return icon/color, check this
        color: result.color,
        name: documentType.name,
        targetTable: documentType.targetTable
      })

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

  // File upload handler
  const handleFileUpload = async (file: File) => {
    if (!organization?.n8n_webhook_url) {
      const { toast } = await import('sonner')
      toast.error('Configuration Error', {
        description: 'No upload webhook configured for your organization. Please contact support.',
      })
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('organizationId', organization.id)
    formData.append('userId', profile?.id || '')

    try {
      const { toast } = await import('sonner')
      toast.info('Uploading Document...', {
        description: `Uploading ${file.name} for processing...`,
      })

      const response = await fetch(organization.n8n_webhook_url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      toast.success('Document Uploaded', {
        description: 'Your document has been sent for processing.',
      })

      // Refresh documents list after a short delay
      setTimeout(loadDocuments, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      const { toast } = await import('sonner')
      toast.error('Upload Failed', {
        description: 'Failed to upload document. Please try again.',
      })
    }
  }

  return (
    <SidebarProvider>
      <div
        className="min-h-screen bg-background flex mx-auto w-full"
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const files = Array.from(e.dataTransfer.files)
          if (files.length > 0) {
            handleFileUpload(files[0])
          }
        }}
      >
        <Sidebar collapsible="icon">
          <SidebarHeader className="bg-[#161616] text-white border-b border-[#161616] p-[28px_24px_10px_25px]">
            <div className="flex items-center justify-between gap-3">
              {/* Expanded brand tile (Group 27) */}
              <div className="group-data-[collapsible=icon]:hidden flex w-full">
                <div className="flex items-center rounded-[10px] bg-[#222222] px-[26px] py-[12px] w-full">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center rounded-[7px] bg-white w-[52px] h-[52px] shrink-0">
                      <span className="text-[#FFC30D] text-[42px] font-bold leading-[52px]">@</span>
                    </div>
                    <div className="flex flex-col ml-[14px]">
                      <span className="text-white text-[20px] font-semibold leading-[24px]">Smatch</span>
                      <span className="text-[#747474] text-[12px] font-light leading-[15px]">{organization?.company_name || 'OCR Platform'}</span>
                    </div>
                  </div>
                  <SidebarTrigger className="ml-auto shrink-0 text-[#747474]" />
                </div>
              </div>
              {/* Collapsed brand tile (Group 29) */}
              <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center w-full">
                <div className="flex items-center rounded-[10px] bg-[#222222] p-[12px]">
                  <div className="flex items-center justify-center rounded-[7px] bg-white w-[52px] h-[52px] shrink-0">
                    <span className="text-[#FFC30D] text-[42px] font-bold leading-[52px]">@</span>
                  </div>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-[#161616] text-white p-0">
            <SidebarGroup className="p-[28px_24px_31px_25px] group-data-[collapsible=icon]:p-[28px_15px_31px_25px]">
              {/* Hide the default group label per Figma */}
              {/* <SidebarGroupLabel className="text-white/90 font-medium">Menu</SidebarGroupLabel> */}
              <SidebarGroupContent>
                {/* Main menu with Figma spacing between items */}
                <SidebarMenu className="gap-[30px]">
                  <SidebarMenuItem className="w-[236px] h-[72px] group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mt-[48px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => setActiveNav('dashboard')}
                      isActive={activeNav === 'dashboard'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[72px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A] group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'dashboard' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[25px] w-[25px]" fill="currentColor">
                            <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                            <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                            <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                            <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[25px] w-[25px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                            <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                            <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                            <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                          </svg>
                        )}
                        <span className="text-[16px] whitespace-nowrap truncate group-data-[collapsible=icon]:hidden text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">{t('sidebar.dashboard')}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem className="w-[236px] h-[72px] group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mt-[41px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => setActiveNav('all_documents')}
                      isActive={activeNav === 'all_documents'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[72px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center data-[active=true]:group-data-[collapsible=icon]:w-[68px] data-[active=true]:group-data-[collapsible=icon]:h-[69px] data-[active=true]:group-data-[collapsible=icon]:rounded-[10px]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'all_documents' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[30px] w-[25px]" fill="currentColor">
                            <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                            <path d="M14 2v6h6"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[30px] w-[25px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                            <path d="M10 9H8"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                          </svg>
                        )}
                        <span className="text-[16px] whitespace-nowrap truncate group-data-[collapsible=icon]:hidden text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">{t('sidebar.allDocuments')}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Dedicated Document Types button (Group 11) */}
                  <SidebarMenuItem className="w-[236px] h-[72px] group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mt-[37px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => setActiveNav('document_types')}
                      isActive={activeNav === 'document_types'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[72px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A] group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'document_types' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[26px] w-[25px]" fill="currentColor">
                            <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                            <path d="M14 2v6h6"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[26px] w-[25px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                          </svg>
                        )}
                        <span className="text-[16px] whitespace-nowrap truncate group-data-[collapsible=icon]:hidden text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">{t('sidebar.documentTypes')}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>



                  <SidebarMenuItem className="w-[236px] h-[72px] group-data-[collapsible=icon]:mt-[58px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => setActiveNav('analytics')}
                      isActive={activeNav === 'analytics'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[72px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'analytics' ? (
                          <div className="flex items-start justify-between w-[25px] h-[25px]">
                            <div className="mt-[8px] w-[6px] h-[17px] bg-[var(--primary)]"></div>
                            <div className="w-[6px] h-[25px] bg-[var(--primary)]"></div>
                            <div className="mt-[14px] w-[6px] h-[11px] bg-[var(--primary)]"></div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between w-[25px] h-[25px]">
                            <div className="mt-[8px] w-[6px] h-[17px] border-2 border-white"></div>
                            <div className="w-[6px] h-[25px] border-2 border-white"></div>
                            <div className="mt-[14px] w-[6px] h-[11px] border-2 border-white"></div>
                          </div>
                        )}
                        <span className="text-[16px] whitespace-nowrap truncate text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">{t('sidebar.analytics')}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {isAdmin && (
                    <>
                      <SidebarMenuItem className="w-[236px] h-[72px]">
                        <SidebarMenuButton
                          onClick={() => setActiveNav('organizations')}
                          isActive={activeNav === 'organizations'}
                          className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[72px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                        >
                          <div className="flex items-center h-[36px] gap-[10px] w-full">
                            <User className="h-6 w-6" />
                            <span className="text-[14pt] group-data-[active=true]:text-[16pt] whitespace-nowrap truncate">{t('sidebar.organizations')}</span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem className="w-[236px] h-[72px]">
                        <SidebarMenuButton
                          onClick={() => setActiveNav('logs')}
                          isActive={activeNav === 'logs'}
                          className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[72px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                        >
                          <div className="flex items-center h-[36px] gap-[10px] w-full">
                            <Settings className="h-6 w-6" />
                            <span className="text-[14pt] group-data-[active=true]:text-[16pt] whitespace-nowrap truncate">{t('sidebar.systemLogs')}</span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {/* Removed old Document Types group in favor of collapsible item above */}
          </SidebarContent>

          <SidebarFooter className="bg-[#161616] text-white border-t border-[#161616] p-[28px_24px_31px_25px]">
            <div
              className="w-[236px] h-[82px] rounded-[10px] bg-[#222222] px-[14px] pr-[60px] py-[12px] flex items-center gap-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-auto cursor-pointer hover:bg-[#2A2A2A] transition-colors"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[8px] bg-yellow-400 text-black font-semibold shrink-0">
                {profile?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col flex-1 group-data-[collapsible=icon]:hidden">
                <span className="text-[20px] leading-[24px] truncate">{profile?.email?.split('@')[0] || 'Mehdi K.'}</span>
                <span className="text-xs text-zinc-400 mt-2">{t('profile.title')}</span>
              </div>
            </div>
          </SidebarFooter>
          {/* Rail provides a thin interactive area at the seam to toggle the sidebar */}
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col relative bg-white border-l-2 border-black">
          {/* Fixed overlay border frame - seamlessly integrated with sidebar */}
          {/* Viewport frame: fixed overlay border so the white content feels like a floating card while the frame stays at screen edges */}
          <div className="pointer-events-none fixed inset-0 border-[15px]  border-[#161616] bg-[#161616] z-0"></div>
          <div className="px-4 pt-3 pb-5 md:px-2 md:pr-4 bg-[#161616]">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden relative z-10">
              <TopBar
                title={
                  activeNav === 'dashboard' ? t('sidebar.dashboard') :
                    activeNav === 'all_documents' ? t('sidebar.allDocuments') :
                      activeNav === 'document_types' ? t('sidebar.documentTypes') :
                        activeNav === 'organizations' ? t('sidebar.organizations') :
                          activeNav === 'logs' ? t('sidebar.systemLogs') :
                            t('sidebar.analytics')
                }
                filters={filters}
                onFiltersChange={setFilters}
                onCommandBarOpen={() => setIsCommandBarOpen(true)}
                onFiltersToggle={activeNav === 'all_documents' ? () => setShowFilters(v => !v) : undefined}
                onExport={handleExport}
                showSearch={activeNav === 'all_documents'}
                showExport={activeNav === 'all_documents'}
                showTimePreset={activeNav === 'dashboard'}
                timePreset={datePreset}
                onTimePresetChange={(preset) => setDatePreset(preset)}
              />

              <main className="p-6 space-y-6">

                {activeNav === 'all_documents' && showFilters && (
                  <div className="mt-2">
                    {/* Dashboard Filters Row */}
                    {/* Component inserted below */}
                    <DashboardFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  </div>
                )}
                <div className="w-full space-y-6">
                  {activeNav === 'dashboard' && (
                    isAdmin ? (
                      <AdminDashboard
                        documents={documents}
                        isLoadingDocuments={isLoadingDocuments}
                        selectedDocument={selectedDocument}
                        onDocumentSelect={(doc) => {
                          setSelectedDocument(doc)
                          setIsSideSheetOpen(true)
                        }}
                        onConfidenceReview={(doc) => {
                          setReviewDocument(doc)
                          setIsConfidenceReviewOpen(true)
                        }}
                        onGroupToggle={(groupId) => {
                          // Handle group toggle if needed, or leave empty if handled internally by table
                        }}
                      />
                    ) : (
                      <>
                        <div className="mb-8">
                          <KPIRow data={kpiData} />
                        </div>
                        <div className="mb-8">
                          <RealTimeIndicator
                            isConnected={isConnected}
                            lastUpdate={lastUpdate || new Date()}
                            newDocumentCount={newDocumentCount}
                          />
                        </div>
                        {/* Upload Documents area */}
                        <section aria-label="Upload Documents" className="space-y-2">
                          <h2 className="text-base font-semibold text-gray-900">{t('dashboard.uploadTitle')}</h2>
                          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white">
                            <div className="flex flex-col items-center justify-center h-40 md:h-48 text-center">
                              <UploadCloud className="h-[61px] w-[61px] text-[#FFC30D] mb-2" />
                              <div className="text-sm text-gray-700 font-medium">{t('dashboard.dragDrop')}</div>
                              <div className="text-xs text-gray-500">{t('dashboard.formats')}</div>
                            </div>
                          </div>
                        </section>
                      </>
                    )
                  )}

                  {activeNav === 'document_types' && !isAdmin && (
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Document Types Management</h2>
                      <p className="text-gray-600 mb-6">Manage document categories and extraction schemas for your organization.</p>
                      <button
                        onClick={() => setIsAddDocumentTypeModalOpen(true)}
                        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        Add Document Type
                      </button>
                    </div>
                  )}

                  {activeNav === 'organizations' && isAdmin && (
                    selectedOrganizationId ? (
                      <ClientDetailView
                        organizationId={selectedOrganizationId}
                        onBack={() => setSelectedOrganizationId(null)}
                      />
                    ) : (
                      <OrganizationsView
                        onManage={(orgId) => setSelectedOrganizationId(orgId)}
                      />
                    )
                  )}

                  {activeNav === 'logs' && isAdmin && (
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">System Logs</h2>
                      <p className="text-gray-600 mb-6">View system activity and audit logs.</p>
                      <div className="bg-gray-100 rounded-lg p-6 max-w-2xl mx-auto">
                        <p className="text-sm text-gray-500">System logs will appear here...</p>
                      </div>
                    </div>
                  )}

                  {/* Real-time Indicator */}
                  {(activeNav === 'dashboard' || activeNav === 'all_documents') && (
                    <div className="px-6 py-4 border border-border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <RealTimeIndicator
                          isConnected={isConnected}
                          lastUpdate={lastUpdate || new Date()}
                          newDocumentCount={newDocumentCount}
                        />
                      </div>
                    </div>
                  )}

                  {(activeNav === 'dashboard' && !isAdmin) && (
                    <div className="flex items-center justify-between pt-2">
                      <h2 className="text-base font-semibold text-gray-900">{t('dashboard.latestDocuments')}</h2>
                      <button
                        className="flex items-center gap-2 text-[20px] font-medium text-[#161616]"
                        onClick={() => setActiveNav('all_documents')}
                      >
                        {t('dashboard.seeMore')}
                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left rotate-180">
                          <path d="m15 18-6-6 6-6"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                  {(activeNav === 'dashboard' || activeNav === 'all_documents') && (!isAdmin || activeNav === 'all_documents') && (
                    (activeNav === 'dashboard' ? documentRowsDashboard.length === 0 : documentRowsAll.length === 0) ? (
                      <EmptyState hasFilters={Object.values(filters).some(v =>
                        Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v
                      )} onClearFilters={handleClearFilters} />
                    ) : (
                      <DocumentsTable
                        documentRows={activeNav === 'dashboard' ? latestThreeRows : documentRowsAll}
                        onDocumentSelect={(doc) => {
                          console.log('onDocumentSelect - storing document:', doc)
                          try {
                            localStorage.setItem(`doc:${doc.id}`, JSON.stringify(doc))
                            console.log('onDocumentSelect - stored in localStorage')
                          } catch (e) {
                            console.error('onDocumentSelect - localStorage error:', e)
                          }
                          console.log('onDocumentSelect - navigating to:', `/documents/${doc.id}`)
                          window.location.href = `/documents/${doc.id}`
                        }}
                        selectedDocument={selectedDocument}
                        isLoading={isLoadingDocuments}
                        onConfidenceReview={handleConfidenceReview}
                        onGroupToggle={(groupId: string) => {
                          // Handle group toggle if needed
                          console.log('Group toggled:', groupId)
                        }}
                        itemsPerPage={activeNav === 'all_documents' ? 10 : undefined}
                        {...(activeNav === 'all_documents' && {
                          currentPage: currentPage,
                          totalPages: totalPages,
                          onPageChange: setCurrentPage,
                          totalCount: totalCount,
                        })}
                        isAdmin={isAdmin}
                        onOrganizationClick={(orgId) => {
                          setSelectedOrganizationId(orgId)
                          setActiveNav('organizations')
                        }}
                      />
                    )
                  )}
                </div>
              </main>
            </div>
          </div>

          {false && selectedDocument && (
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
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
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

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </SidebarProvider>
  )
}
