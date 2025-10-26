'use client'

import { useState, useEffect } from 'react'
import { Search, FileText, Download, X } from 'lucide-react'
import { Document } from '@/types/document'
import { cn, formatCurrency } from '@/lib/utils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Kbd } from '@/components/ui/kbd'

interface Command {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
}

type CommandResult = { resultType: 'command' } & Command
type DocumentResult = { resultType: 'document' } & Document
type SearchResult = CommandResult | DocumentResult

// Type guard functions
const isDocumentResult = (result: SearchResult): result is DocumentResult => {
  return result.resultType === 'document'
}

const isCommandResult = (result: SearchResult): result is CommandResult => {
  return result.resultType === 'command'
}

interface CommandBarProps {
  isOpen: boolean
  onClose: () => void
  documents: Document[]
  onDocumentSelect: (document: Document) => void
}

export function CommandBar({ isOpen, onClose, documents, onDocumentSelect }: CommandBarProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredDocuments = documents.filter(doc => {
    if (!query) return false
    const searchTerm = query.toLowerCase()
    return (
      doc.documentNumber.toLowerCase().includes(searchTerm) ||
      doc.supplier.toLowerCase().includes(searchTerm) ||
      doc.type.toLowerCase().includes(searchTerm) ||
      JSON.stringify(doc.payload).toLowerCase().includes(searchTerm)
    )
  }).slice(0, 10) // Limit to 10 results

  const commands = [
    {
      id: 'export-csv',
      title: 'Export to CSV',
      subtitle: 'Download all documents as CSV file',
      icon: Download,
      action: () => {
        // Export functionality would go here
        console.log('Exporting to CSV...')
        onClose()
      }
    }
  ]

  const allResults: SearchResult[] = [
    ...commands.map(cmd => ({ resultType: 'command' as const, ...cmd })),
    ...filteredDocuments.map(doc => ({ resultType: 'document' as const, ...doc }))
  ]

  // Reset selected index when query changes
  useEffect(() => {
    if (query !== '') {
      setSelectedIndex(0)
    }
  }, [query])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Use setTimeout to avoid cascading renders
      const timer = setTimeout(() => {
        setQuery('')
        setSelectedIndex(0)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          const selected = allResults[selectedIndex]
          if (selected) {
            if (selected.resultType === 'command') {
              selected.action()
            } else {
              onDocumentSelect(selected)
              onClose()
            }
          }
          break
        case 'Escape':
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allResults, onDocumentSelect, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            placeholder="Search documents and commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
          {allResults.length === 0 ? (
            <div className="py-6 text-center text-sm">
              {query ? (
                <div className="space-y-2">
                  <Search className="mx-auto h-8 w-8 opacity-50" />
                  <p className="text-muted-foreground">No results found</p>
                  <p className="text-xs text-muted-foreground">
                    Try searching for document numbers, suppliers, or types
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">Start typing to search</p>
                  <p className="text-xs text-muted-foreground">
                    Search for documents, suppliers, or use commands
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-1">
              {/* Commands Section */}
              {commands.some(cmd => allResults.some(r => r.resultType === 'command' && r.id === cmd.id)) && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Commands
                  </div>
                  {allResults
                    .filter(result => result.resultType === 'command')
                    .map((result, index) => {
                      const globalIndex = allResults.findIndex(r => r === result)
                      return (
                        <div
                          key={result.id}
                          className={cn(
                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                            globalIndex === selectedIndex
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                          onClick={() => {
                            result.action()
                          }}
                        >
                          <div className="mr-2 flex h-4 w-4 items-center justify-center">
                            <result.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{result.title}</div>
                            <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                          </div>
                        </div>
                      )
                    })}
                  {filteredDocuments.length > 0 && <Separator className="my-1" />}
                </>
              )}

              {/* Documents Section */}
              {filteredDocuments.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Documents ({filteredDocuments.length})
                  </div>
                  {allResults
                    .filter(isDocumentResult)
                    .map((result, index) => {
                      const globalIndex = allResults.findIndex(r => r === result)
                      return (
                        <div
                          key={result.id}
                          className={cn(
                            "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                            globalIndex === selectedIndex
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                          onClick={() => {
                            onDocumentSelect(result)
                            onClose()
                          }}
                        >
                          <div className="mr-2 flex h-4 w-4 items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{result.documentNumber}</span>
                              {result.amount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(result.amount, result.currency)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground truncate">
                                {result.supplier}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {result.type.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center border-t px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Kbd>↑↓</Kbd>
            <span>to navigate</span>
            <Kbd>↵</Kbd>
            <span>to select</span>
            <Kbd>esc</Kbd>
            <span>to close</span>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            Powered by OCR
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}