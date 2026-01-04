'use client'

import React, { useState, useMemo } from 'react'
import { 
  FileText, 
  Receipt, 
  Ship, 
  Award, 
  File, 
  Mail, 
  MessageSquare, 
  Send,
  FileSpreadsheet,
  Image,
  Download,
  ExternalLink,
  Clock,
  AlertTriangle,
  Edit3,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react'
import { Document, DocumentRow, DocumentGroup } from '@/types/document'
import { cn, formatCurrency, formatRelativeTime, formatProcessingTime, getStatusColor, getConfidenceColor } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { DocumentTypeBadge } from './document-type-badge'

// SortButton component moved outside to avoid creation during render
const SortButton = ({ 
  field, 
  children, 
  sortField, 
  sortDirection, 
  onSort 
}: { 
  field: keyof Document
  children: React.ReactNode
  sortField: keyof Document | null
  sortDirection: 'asc' | 'desc'
  onSort: (field: keyof Document) => void
}) => (
  <Button
    variant="ghost"
    size="sm"
    className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
    onClick={() => onSort(field)}
  >
    <span className="flex items-center gap-1">
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? 
          <ChevronUp className="h-3 w-3" /> : 
          <ChevronDown className="h-3 w-3" />
      )}
    </span>
  </Button>
)

interface DocumentsTableProps {
  documentRows: DocumentRow[]
  onDocumentSelect: (document: Document) => void
  selectedDocument: Document | null
  onConfidenceReview?: (document: Document) => void
  onGroupToggle?: (groupId: string) => void
}

const typeIcons = {
  invoice: Receipt,
  BL: Ship,
  BC: Award,
  CO: Award,
  OTHER: File
}

const channelIcons = {
  gmail: Mail,
  whatsapp: MessageSquare,
  telegram: Send
}

const fileTypeIcons = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  png: Image,
  jpg: Image
}

export function DocumentsTable({ documentRows, onDocumentSelect, selectedDocument, onConfidenceReview, onGroupToggle }: DocumentsTableProps) {
  const [sortField, setSortField] = useState<keyof Document>('receivedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const itemsPerPage = 25

  const handleSort = (field: keyof Document) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
    onGroupToggle?.(groupId)
  }

  // Sort document rows (groups by their aggregate data, singles by their document data)
  const sortedRows = useMemo(() => {
    return [...documentRows].sort((a, b) => {
      let aValue, bValue

      if (a.type === 'group' && a.group) {
        aValue = a.group.aggregateData.latestReceivedAt
      } else if (a.document) {
        aValue = a.document[sortField]
      }

      if (b.type === 'group' && b.group) {
        bValue = b.group.aggregateData.latestReceivedAt
      } else if (b.document) {
        bValue = b.document[sortField]
      }

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [documentRows, sortField, sortDirection])

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage)

  const { paginatedRows, startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = Math.min(start + itemsPerPage, sortedRows.length)
    return {
      paginatedRows: sortedRows.slice(start, end),
      startIndex: start,
      endIndex: end
    }
  }, [sortedRows, currentPage, itemsPerPage])

  const renderGroupRow = (group: DocumentGroup) => {
    const isSelected = group.documents.some(doc => selectedDocument?.id === doc.id)
    const needsReview = group.aggregateData.avgConfidence < 0.85
    const isExpanded = expandedGroups.has(group.id)
    
    return (
      <TableRow
        key={group.id}
        onClick={() => toggleGroupExpansion(group.id)}
        className={cn(
          "cursor-pointer transition-colors",
          isSelected && "bg-muted/50",
          needsReview && "border-l-4 border-l-amber-400"
        )}
      >
        {/* Status */}
        <TableCell>
          <div className="space-y-1">
            <Badge 
              variant={group.aggregateData.status === 'extracted' ? 'default' : 
                     group.aggregateData.status === 'needs review' ? 'secondary' : 
                     group.aggregateData.status === 'mixed' ? 'outline' : 'destructive'}
              className="text-xs"
            >
              {group.aggregateData.status}
            </Badge>
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs">
                {group.aggregateData.count} docs
              </Badge>
              {needsReview && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    group.aggregateData.avgConfidence < 0.7 ? "border-red-200 text-red-700" :
                    "border-amber-200 text-amber-700"
                  )}
                >
                  {Math.round(group.aggregateData.avgConfidence * 100)}%
                </Badge>
              )}
            </div>
          </div>
        </TableCell>

        {/* Document */}
        <TableCell>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="font-medium leading-none flex items-center space-x-2">
                <span>{group.groupKey}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleGroupExpansion(group.id)
                  }}
                >
                  {isExpanded ? 
                    <ChevronDown className="h-3 w-3" /> : 
                    <ChevronRight className="h-3 w-3" />
                  }
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                GROUP
              </Badge>
            </div>
          </div>
        </TableCell>

        {/* Amount */}
        <TableCell>
          <div className="font-medium">
            {group.aggregateData.totalAmount > 0 ? 
              formatCurrency(group.aggregateData.totalAmount, group.aggregateData.currency) : '—'}
          </div>
        </TableCell>

        {/* Supplier */}
        <TableCell>
          <div className="max-w-[200px] truncate font-medium">
            {group.documents[0]?.supplier || '—'}
          </div>
        </TableCell>

        {/* Channel */}
        <TableCell>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <div className="text-sm font-medium">
                Multiple
              </div>
              <div className="text-xs text-muted-foreground">
                {group.aggregateData.count} sources
              </div>
            </div>
          </div>
        </TableCell>

        {/* File */}
        <TableCell>
          <div className="flex items-center space-x-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs">
              MULTI
            </Badge>
          </div>
        </TableCell>

        {/* Processing Time */}
        <TableCell>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>—</span>
          </div>
        </TableCell>

        {/* Received */}
        <TableCell>
          <div className="text-sm text-muted-foreground">
            {formatRelativeTime(group.aggregateData.latestReceivedAt)}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const renderDocumentRow = (document: Document, isSubRow = false) => {
    const TypeIcon = typeIcons[document.type as keyof typeof typeIcons] || File
    const ChannelIcon = channelIcons[document.channel as keyof typeof channelIcons] || Mail
    const FileIcon = fileTypeIcons[document.fileType as keyof typeof fileTypeIcons] || File
    const isSelected = selectedDocument?.id === document.id
    const needsReview = document.confidence < 0.85

    return (
      <TableRow
        key={document.id}
        onClick={() => onDocumentSelect(document)}
        className={cn(
          "cursor-pointer transition-colors",
          isSelected && "bg-muted/50",
          needsReview && "border-l-4 border-l-amber-400",
          isSubRow && "bg-muted/20"
        )}
        aria-selected={isSelected}
      >
        {/* Status */}
        <TableCell>
          <div className="space-y-1">
            {isSubRow && <div className="w-4" />}
            <Badge 
              variant={document.status === 'extracted' ? 'default' : 
                     document.status === 'needs review' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {document.status}
            </Badge>
            {needsReview && (
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    document.confidence < 0.7 ? "border-red-200 text-red-700" :
                    document.confidence < 0.85 ? "border-amber-200 text-amber-700" :
                    "border-green-200 text-green-700"
                  )}
                >
                  {Math.round(document.confidence * 100)}%
                </Badge>
                {onConfidenceReview && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onConfidenceReview(document)
                        }}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Review and edit document</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </TableCell>

        {/* Document */}
        <TableCell>
          <div className="flex items-center space-x-3">
            {isSubRow && <div className="w-4 border-l border-muted-foreground/20 ml-2" />}
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <div className="font-medium leading-none">
                {document.documentNumber}
              </div>
              <DocumentTypeBadge document={document} size="sm" />
            </div>
          </div>
        </TableCell>

        {/* Amount */}
        <TableCell>
          <div className="font-medium">
            {document.amount > 0 ? formatCurrency(document.amount, document.currency) : '—'}
          </div>
        </TableCell>

        {/* Supplier */}
        <TableCell>
          <div className="max-w-[200px] truncate font-medium">
            {document.supplier}
          </div>
        </TableCell>

        {/* Channel */}
        <TableCell>
          <div className="flex items-center space-x-2">
            <ChannelIcon className="h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <div className="text-sm font-medium capitalize">
                {document.channel}
              </div>
              <div className="text-xs text-muted-foreground max-w-[120px] truncate">
                {document.senderEmail}
              </div>
            </div>
          </div>
        </TableCell>

        {/* File */}
        <TableCell>
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="text-xs uppercase">
              {document.fileType}
            </Badge>
            {document.downloadUrl && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(document.downloadUrl, '_blank')
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download document</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>

        {/* Processing Time */}
        <TableCell>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatProcessingTime(document.processingTime)}</span>
          </div>
        </TableCell>

        {/* Received */}
        <TableCell>
          <div className="text-sm text-muted-foreground">
            {formatRelativeTime(document.receivedAt)}
          </div>
        </TableCell>
      </TableRow>
    )
  }



  return (
    <TooltipProvider>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px]">
                    <SortButton field="status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Status</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="documentNumber" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Document</SortButton>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton field="amount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Amount</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="supplier" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Supplier</SortButton>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    <SortButton field="channel" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Channel</SortButton>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <SortButton field="fileType" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>File</SortButton>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton field="processingTime" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Processing</SortButton>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <SortButton field="receivedAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Received</SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.map((row) => {
                  if (row.type === 'group' && row.group) {
                    const isExpanded = expandedGroups.has(row.group.id)
                    return (
                      <React.Fragment key={row.group.id}>
                        {renderGroupRow(row.group)}
                        {isExpanded && row.group?.documents.map((doc: Document) => (
                          <React.Fragment key={doc.id}>
                            {renderDocumentRow(doc, true)}
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    )
                  } else if (row.document) {
                    return renderDocumentRow(row.document)
                  }
                  return null
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, documentRows.length)} of {documentRows.length} rows
          </div>
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}