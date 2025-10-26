'use client'

import { useState, useMemo } from 'react'
import { X, Download, Edit, Check, Clock, FileText, Image as ImageIcon } from 'lucide-react'
import { Document } from '@/types/document'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface SideSheetProps {
  document: Document | null
  onClose: () => void
  onConfidenceReview?: (document: Document) => void
}

export function SideSheet({ document, onClose, onConfidenceReview }: SideSheetProps) {
  const [activeTab, setActiveTab] = useState<'json' | 'timeline' | 'thumbnails'>('json')
  const [isEditing, setIsEditing] = useState(false)
  const [editedPayload, setEditedPayload] = useState('')

  if (!document) return null

  const handleSave = () => {
    try {
      JSON.parse(editedPayload)
      // Here you would call the API to save changes
      setIsEditing(false)
    } catch (error) {
      alert('Invalid JSON format')
    }
  }

  const hoursUntilExpiry = useMemo(() => {
    const downloadExpiry = document?.downloadExpiry
    if (!downloadExpiry || !(downloadExpiry instanceof Date) || isNaN(downloadExpiry.getTime())) {
      return 0
    }
    return Math.max(0, Math.floor((downloadExpiry.getTime() - Date.now()) / (1000 * 60 * 60)))
  }, [document?.downloadExpiry])

  const startEditing = () => {
    setEditedPayload(JSON.stringify(document.payload, null, 2))
    setIsEditing(true)
  }

  return (
    <Sheet open={!!document} onOpenChange={() => onClose()}>
      <SheetContent className="w-[440px] sm:w-[540px] p-0 overflow-hidden">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Document DNA</SheetTitle>
          <SheetDescription>
            Everything our AI understood
          </SheetDescription>
        </SheetHeader>

        {/* Document Info */}
        <div className="p-6 border-b space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Document</p>
              <p className="text-sm font-medium">{document.documentNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <Badge variant="outline" className="text-xs">
                {document.type.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-sm font-medium">
                {document.amount > 0 ? formatCurrency(document.amount, document.currency) : '—'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Confidence</p>
              <Badge 
                variant={document.confidence >= 0.85 ? 'default' : 
                        document.confidence >= 0.7 ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {Math.round(document.confidence * 100)}%
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {document.downloadUrl && (
              <Button
                onClick={() => window.open(document.downloadUrl, '_blank')}
                className="w-full"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Original
              </Button>
            )}
            
            {hoursUntilExpiry > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Link expires in {hoursUntilExpiry}h
              </p>
            )}

            {document.confidence < 0.85 && onConfidenceReview && (
              <Button
                onClick={() => onConfidenceReview(document)}
                variant="outline"
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                size="sm"
              >
                <Edit className="mr-2 h-4 w-4" />
                Review & Edit
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
              <TabsTrigger value="json" className="rounded-none">JSON Data</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-none">Timeline</TabsTrigger>
              <TabsTrigger value="thumbnails" className="rounded-none">Preview</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="json" className="p-4 m-0 h-full">
                {isEditing ? (
                  <div className="space-y-4 h-full flex flex-col">
                    <textarea
                      value={editedPayload}
                      onChange={(e) => setEditedPayload(e.target.value)}
                      className="flex-1 w-full p-3 text-sm font-mono bg-muted border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Edit JSON document data..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm" className="flex-1">
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button 
                        onClick={() => setIsEditing(false)} 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Document Payload</h4>
                      <Button onClick={startEditing} variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words overflow-auto max-h-96">
                          {JSON.stringify(document.payload, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="p-4 m-0">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Processing Timeline</h4>
                  <div className="space-y-4">
                    {document.auditTimeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">{event.event}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(event.timestamp)}
                            </p>
                          </div>
                          {event.confidence && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(event.confidence * 100)}% confidence
                            </Badge>
                          )}
                          {event.details && (
                            <p className="text-xs text-muted-foreground">{event.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="thumbnails" className="p-4 m-0">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Document Preview</h4>
                  {document.thumbnails && document.thumbnails.length > 0 ? (
                    <div className="space-y-4">
                      {document.thumbnails.map((thumbnail, index) => (
                        <Card key={index}>
                          <CardContent className="p-0">
                            <img
                              src={thumbnail}
                              alt={`Document page ${index + 1} preview`}
                              className="w-full h-auto rounded-t-lg"
                            />
                            <div className="p-3 bg-muted/50">
                              <p className="text-xs text-muted-foreground">
                                Page {index + 1}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted mb-4">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No preview available</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Thumbnails will appear here when available
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}