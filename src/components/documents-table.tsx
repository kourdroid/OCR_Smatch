'use client'

import React, { useState } from 'react'
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
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react'
import { Document, DocumentRow, DocumentGroup } from '@/types/document'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

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
  itemsPerPage?: number
  isLoading?: boolean
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  totalCount?: number
  isAdmin?: boolean
  onOrganizationClick?: (orgId: string) => void
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

export function DocumentsTable({
  documentRows,
  onDocumentSelect,
  selectedDocument,
  onConfidenceReview,
  onGroupToggle,
  itemsPerPage: itemsPerPageProp,
  isLoading,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalCount = 0
}: DocumentsTableProps) {
  const [sortField, setSortField] = useState<keyof Document>('receivedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const itemsPerPage = itemsPerPageProp ?? 10

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
  const sortedRows = [...documentRows].sort((a, b) => {
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

  // Use props for pagination if available, otherwise fallback (though we expect server-side mostly now)
  // If server-side, documentRows is already the current page.
  const paginatedRows = sortedRows

  const renderGroupRow = (group: DocumentGroup) => {
    const isSelected = group.documents.some((doc) => selectedDocument?.id === doc.id)
    const isExpanded = expandedGroups.has(group.id)
    const firstDoc = group.documents[0]
    const shipper = (firstDoc?.payload?.shipper || firstDoc?.payload?.carrier || firstDoc?.payload?.Shipper) as
      | string
      | undefined

    return (
      <TableRow
        key={group.id}
        onClick={() => toggleGroupExpansion(group.id)}
        className={cn('cursor-pointer transition-colors', isSelected && 'bg-muted/50')}
      >
        {/* ID */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{group.groupKey}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleGroupExpansion(group.id)
              }}
              aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </TableCell>

        {/* Document Type */}
        <TableCell>
          <Badge variant="outline" className="text-xs">
            GROUP
          </Badge>
        </TableCell>

        {/* Amount */}
        <TableCell>
          <div className="font-medium">
            {group.aggregateData.totalAmount > 0
              ? formatCurrency(group.aggregateData.totalAmount, group.aggregateData.currency)
              : '—'}
          </div>
        </TableCell>

        {/* Supplier */}
        <TableCell>
          <div className="max-w-[200px] truncate font-medium">{firstDoc?.supplier || '—'}</div>
        </TableCell>

        {/* Shipper */}
        <TableCell>
          <div className="max-w-[160px] truncate text-sm">{shipper || '—'}</div>
        </TableCell>

        {/* File */}
        <TableCell>
          <Badge variant="outline" className="text-xs">
            MULTI
          </Badge>
        </TableCell>

        {/* Action */}
        <TableCell>
          <span className="text-muted-foreground">—</span>
        </TableCell>

        {/* Channel */}
        <TableCell>
          <div className="text-sm">Multiple</div>
        </TableCell>

        {/* Time */}
        <TableCell>
          <div className="text-sm text-muted-foreground">{formatRelativeTime(group.aggregateData.latestReceivedAt)}</div>
        </TableCell>
      </TableRow>
    )
  }

  const renderDocumentRow = (document: Document, isSubRow = false) => {
    const ChannelIcon = channelIcons[document.channel as keyof typeof channelIcons] || Mail
    const FileIcon = fileTypeIcons[document.fileType as keyof typeof fileTypeIcons] || File
    const isSelected = selectedDocument?.id === document.id
    const typeDisplay: Record<string, string> = {
      invoice: 'Facture',
      BL: 'BL',
      BC: 'BC',
      CO: 'CO',
      OTHER: 'Other',
    }
    const shipper = (document.payload?.shipper || document.payload?.carrier || document.payload?.Shipper) as
      | string
      | undefined

    return (
      <TableRow
        key={document.id}
        onClick={() => onDocumentSelect(document)}
        className={cn('cursor-pointer transition-colors border-b border-[#EDEDED]', isSelected && 'bg-muted/50', isSubRow && 'bg-muted/20')}
        aria-selected={isSelected}
      >
        {/* ID */}
        <TableCell className="pl-[26px] text-black">
          <div className="font-medium">{document.documentNumber || document.id}</div>
        </TableCell>

        {/* Document Type */}
        <TableCell className="text-black">
          <div className="font-medium">{typeDisplay[document.type] || document.type}</div>
        </TableCell>

        {/* Amount */}
        <TableCell className="text-black">
          <div className="font-medium">
            {document.amount > 0 ? formatCurrency(document.amount, document.currency) : '—'}
          </div>
        </TableCell>

        {/* Supplier */}
        <TableCell className="text-black">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[200px] truncate font-medium">{document.supplier}</div>
            </TooltipTrigger>
            <TooltipContent>{document.supplier}</TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Shipper */}
        <TableCell className="text-black">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[160px] truncate text-sm">{shipper || '—'}</div>
            </TooltipTrigger>
            <TooltipContent>{shipper || '—'}</TooltipContent>
          </Tooltip>
        </TableCell>

        {/* File */}
        <TableCell className="text-black">
          <Badge variant="outline" className="text-xs uppercase">
            {document.fileType}
          </Badge>
        </TableCell>

        {/* Action */}
        <TableCell className="pr-[78px]">
          {document.status === 'processing' ? (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">
              Processing...
            </Badge>
          ) : document.status === 'failed' ? (
            <Badge variant="destructive">Failed</Badge>
          ) : (
            <Button
              className="rounded-full bg-black text-white hover:bg-zinc-800"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (document.downloadUrl) {
                  window.open(document.downloadUrl, '_blank')
                }
              }}
              disabled={!document.downloadUrl}
            >
              Download
            </Button>
          )}
        </TableCell>

        {/* Channel */}
        <TableCell>
          <div className="flex items-center gap-2">
            <ChannelIcon className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">{document.channel}</span>
          </div>
        </TableCell>

        {/* Time */}
        <TableCell>
          <div className="text-sm text-muted-foreground">{formatRelativeTime(document.receivedAt)}</div>
        </TableCell>
      </TableRow>
    )
  }



  return (
    <TooltipProvider>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-xl border">
            <Table>
              <TableHeader className="bg-[#FAFAFA] rounded-t-xl">
                <TableRow className="hover:bg-transparent">
                  <TableHead
                    className="text-[#7D7D7D] font-semibold pl-[26px]"
                    aria-sort={sortField === 'documentNumber' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <SortButton field="documentNumber" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                      ID
                    </SortButton>
                  </TableHead>
                  <TableHead
                    className="text-[#7D7D7D] font-semibold"
                    aria-sort={sortField === 'type' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <SortButton field="type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                      Document Type
                    </SortButton>
                  </TableHead>
                  <TableHead
                    className="w-[140px] text-[#7D7D7D] font-semibold"
                    aria-sort={sortField === 'amount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <SortButton field="amount" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                      Amount
                    </SortButton>
                  </TableHead>
                  <TableHead
                    className="text-[#7D7D7D] font-semibold"
                    aria-sort={sortField === 'supplier' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <SortButton field="supplier" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                      Supplier
                    </SortButton>
                  </TableHead>
                  <TableHead className="w-[160px] text-[#7D7D7D] font-semibold">Shipper</TableHead>
                  <TableHead className="w-[100px] text-[#7D7D7D] font-semibold">File</TableHead>
                  <TableHead className="w-[140px] text-[#7D7D7D] font-semibold">Action</TableHead>
                  <TableHead
                    className="w-[140px] text-[#7D7D7D] font-semibold"
                    aria-sort={sortField === 'channel' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <SortButton field="channel" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                      Channel
                    </SortButton>
                  </TableHead>
                  <TableHead
                    className="w-[120px] text-[#7D7D7D] font-semibold pr-[78px]"
                    aria-sort={sortField === 'receivedAt' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <SortButton field="receivedAt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                      Time
                    </SortButton>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-b border-[#EDEDED]">
                      <TableCell className="pl-[26px]"><div className="bg-muted h-4 w-24 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-20 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-16 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-32 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-28 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-12 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-8 w-24 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-20 rounded" /></TableCell>
                      <TableCell><div className="bg-muted h-4 w-16 rounded" /></TableCell>
                    </TableRow>
                  ))
                )}
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
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} rows
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
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
                        onClick={() => onPageChange?.(pageNumber)}
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
                        onClick={() => onPageChange?.(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
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
