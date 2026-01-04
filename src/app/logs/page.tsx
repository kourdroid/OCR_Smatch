'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, CheckCircle, Info, Filter, RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'

interface SystemLog {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
  context: any
  user_id: string | null
  organization_id: string | null
  created_at: string
  source: string
}

const LOG_LEVELS = {
  info: { color: 'bg-blue-100 text-blue-800', icon: Info },
  warning: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  error: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

export default function SystemLogsPage() {
  const { profile, organization, isAdmin } = useAuthStore()
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [levelFilter, sourceFilter, searchTerm, dateFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      if (!isSupabaseAvailable() || !supabase) {
        setLogs([])
        setLoading(false)
        return
      }
      
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply filters
      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter)
      }

      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter)
      }

      if (searchTerm) {
        query = query.ilike('message', `%${searchTerm}%`)
      }

      if (dateFilter) {
        const startDate = new Date(dateFilter)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
        query = query.gte('created_at', startDate.toISOString())
                  .lt('created_at', endDate.toISOString())
      }

      // If not admin, only show logs for user's organization
      if (!isAdmin && organization?.id) {
        query = query.eq('organization_id', organization.id)
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to fetch system logs')
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Source', 'Message', 'User ID', 'Organization ID'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toISOString(),
        log.level,
        log.source,
        `"${log.message.replace(/"/g, '""')}"`,
        log.user_id || '',
        log.organization_id || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setLevelFilter('all')
    setSourceFilter('all')
    setSearchTerm('')
    setDateFilter('')
  }

  const formatContext = (context: any) => {
    if (!context) return null
    try {
      return JSON.stringify(context, null, 2)
    } catch {
      return String(context)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            View and analyze system activity logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="level-filter">Log Level</Label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger id="level-filter">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-filter">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger id="source-filter">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const levelConfig = LOG_LEVELS[log.level]
                  const Icon = levelConfig.icon
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={levelConfig.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.message}</div>
                          {log.context && (
                            <details className="mt-1">
                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                View context
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-w-md">
                                {formatContext(log.context)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.user_id ? (
                          <Badge variant="secondary" className="text-xs">
                            {log.user_id.substring(0, 8)}...
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.organization_id ? (
                          <Badge variant="outline" className="text-xs">
                            {log.organization_id.substring(0, 8)}...
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Global</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {logs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}