import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, AlertTriangle, Clock, Users, CheckCircle2, XCircle, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DocumentsTable } from '../documents-table'
import { Document, DocumentRow, DocumentGroup } from '@/types/document'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCompactNumber } from '@/lib/utils'

interface SystemStats {
  totalClients: number
  pendingDocuments: number
  errorRate24h: number
  systemStatus: 'operational' | 'degraded' | 'down'
}

interface AdminDashboardProps {
  documents: Document[]
  isLoadingDocuments: boolean
  selectedDocument: Document | null
  onDocumentSelect: (doc: Document) => void
  onConfidenceReview: (doc: Document) => void
  onGroupToggle: (groupId: string) => void
}

export function AdminDashboard({
  documents,
  isLoadingDocuments,
  selectedDocument,
  onDocumentSelect,
  onConfidenceReview,
  onGroupToggle
}: AdminDashboardProps) {
  const [stats, setStats] = useState<SystemStats>({
    totalClients: 0,
    pendingDocuments: 0,
    errorRate24h: 0,
    systemStatus: 'operational'
  })
  const [isLoading, setIsLoading] = useState(true)
  const formatter = new Intl.NumberFormat('en-US')

  // Helper to group documents for the table
  const groupDocuments = (docs: Document[]): DocumentRow[] => {
    const groups: { [key: string]: Document[] } = {}
    const singles: Document[] = []

    docs.forEach(doc => {
      const groupKey = `${doc.supplier}-${doc.type}`
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(doc)
    })

    const documentRows: DocumentRow[] = []

    Object.entries(groups).forEach(([groupKey, groupDocs]) => {
      if (groupDocs.length > 1) {
        const totalAmount = groupDocs.reduce((sum, doc) => sum + doc.amount, 0)
        const avgConfidence = groupDocs.reduce((sum, doc) => sum + doc.confidence, 0) / groupDocs.length
        const latestReceivedAt = Math.max(...groupDocs.map(doc => new Date(doc.receivedAt).getTime()))
        const statuses = [...new Set(groupDocs.map(doc => doc.status))]
        let groupStatus: 'extracted' | 'needs review' | 'failed' | 'mixed' = 'mixed'
        if (statuses.length === 1) {
          groupStatus = statuses[0] as any
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

        documentRows.push({ type: 'group', group })
      } else {
        singles.push(...groupDocs)
      }
    })

    singles.forEach(doc => {
      documentRows.push({ type: 'single', document: doc })
    })

    return documentRows
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!supabase) return

        // 1. Total Clients
        const { count: clientsCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })

        // 2. Pending Queue (processing or received)
        const { count: pendingCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('status', ['processing', 'received'])

        // 3. Error Rate (24h)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { count: total24h } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', oneDayAgo)

        const { count: failed24h } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'failed')
          .gte('created_at', oneDayAgo)

        const errorRate = total24h ? Math.round(((failed24h || 0) / total24h) * 100) : 0

        // 4. System Status (Mock check - could be real N8N health check)
        const status = (pendingCount || 0) > 100 ? 'degraded' : 'operational'

        setStats({
          totalClients: clientsCount || 0,
          pendingDocuments: pendingCount || 0,
          errorRate24h: errorRate,
          systemStatus: status
        })
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* System Status */}
        <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm h-[180px]">
          <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
            <div className="flex items-center gap-6">
              <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center shrink-0">
                <Activity className="h-[56px] w-[56px] text-black" />
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-[24px] font-extrabold text-black leading-tight capitalize">
                  {isLoading ? '...' : stats.systemStatus}
                </div>
                <div className="text-sm text-gray-700 mt-1">System Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm h-[180px]">
          <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
            <div className="flex items-center gap-6">
              <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-[56px] w-[56px] text-black" />
              </div>
              <div className="flex flex-col justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[48px] font-extrabold text-black leading-none">
                      {isLoading ? '...' : `${stats.errorRate24h}%`}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Failed extractions in last 24h</TooltipContent>
                </Tooltip>
                <div className="text-sm text-gray-700">Error Rate (24h)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Queue */}
        <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm h-[180px]">
          <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
            <div className="flex items-center gap-6">
              <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center shrink-0">
                <Clock className="h-[56px] w-[56px] text-black" />
              </div>
              <div className="flex flex-col justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[48px] font-extrabold text-black leading-none">
                      {isLoading ? '...' : formatCompactNumber(stats.pendingDocuments)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{formatter.format(stats.pendingDocuments)}</TooltipContent>
                </Tooltip>
                <div className="text-sm text-gray-700">Pending Queue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card className="relative overflow-hidden rounded-[28px] border border-[#D3D3D3] shadow-sm h-[180px]">
          <CardContent className="pt-[30px] pb-[30px] pl-[30px] pr-[30px]">
            <div className="flex items-center gap-6">
              <div className="h-[96px] w-[96px] rounded-[12px] bg-yellow-400 flex items-center justify-center shrink-0">
                <Users className="h-[56px] w-[56px] text-black" />
              </div>
              <div className="flex flex-col justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[48px] font-extrabold text-black leading-none">
                      {isLoading ? '...' : formatCompactNumber(stats.totalClients)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{formatter.format(stats.totalClients)}</TooltipContent>
                </Tooltip>
                <div className="text-sm text-gray-700">Total Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest documents processed across all organizations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DocumentsTable
            documentRows={groupDocuments(documents)}
            isLoading={isLoadingDocuments}
            selectedDocument={selectedDocument}
            onDocumentSelect={onDocumentSelect}
            onConfidenceReview={onConfidenceReview}
            onGroupToggle={onGroupToggle}
          />
        </CardContent>
      </Card>
    </div>
  )
}
