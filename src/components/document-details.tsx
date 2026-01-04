'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Document } from '@/types/document'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { JSONViewer } from '@/components/json-viewer'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, Download, Edit, Clock, Image as ImageIcon } from 'lucide-react'

export default function DocumentDetails({ document, documentId }: { document: Document | null, documentId?: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'json'>('json')
  const [isEditing, setIsEditing] = useState(false)
  const [editedPayload, setEditedPayload] = useState('')
  const [doc, setDoc] = useState<Document | null>(document)

  console.log('DocumentDetails - props received:', { document, documentId })
  console.log('DocumentDetails - component mounted')

  useEffect(() => {
    console.log('DocumentDetails - useEffect triggered:', { doc, documentId })
    if (!doc && documentId) {
      try {
        const raw = localStorage.getItem(`doc:${documentId}`)
        console.log('DocumentDetails - localStorage data:', raw)
        if (raw) {
          const parsed = JSON.parse(raw)
          console.log('DocumentDetails - parsed data:', parsed)
          setDoc(parsed)
        }
      } catch (error) {
        console.error('DocumentDetails - localStorage error:', error)
      }
    }
  }, [doc, documentId])

  const hoursUntilExpiry = useMemo(() => {
    const expiry = doc?.downloadExpiry
    if (!expiry || !(expiry instanceof Date) || isNaN(expiry.getTime())) return 0
    return Math.max(0, Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60)))
  }, [doc?.downloadExpiry])

  const startEditing = () => {
    setEditedPayload(JSON.stringify(doc?.payload ?? {}, null, 2))
    setIsEditing(true)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="h-[38px] px-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Document Details</h1>
        </div>
        {doc && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{doc.type.toUpperCase()}</Badge>
            <Badge 
              variant={doc.status === 'extracted' ? 'default' : doc.status === 'needs review' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {doc.status.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        {doc ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Document</p>
                <p className="text-sm font-medium">{doc.documentNumber || doc.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-sm font-medium">{doc.amount > 0 ? formatCurrency(doc.amount, doc.currency) : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="text-sm font-medium">{doc.supplier}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Channel</p>
                <p className="text-sm font-medium capitalize">{doc.channel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">File Type</p>
                <p className="text-sm font-medium uppercase">{doc.fileType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="text-sm text-muted-foreground">{formatRelativeTime(doc.receivedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Processing Time</p>
                <p className="text-sm text-muted-foreground">{doc.processingTime}ms</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Confidence</p>
                <Badge 
                  variant={doc.confidence >= 0.85 ? 'default' : doc.confidence >= 0.7 ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {Math.round(doc.confidence * 100)}%
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              {doc.downloadUrl && (
                <Button onClick={() => window.open(doc.downloadUrl!, '_blank')} className="w-full" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Original
                </Button>
              )}
              {hoursUntilExpiry > 0 && (
                <p className="text-xs text-muted-foreground text-center">Link expires in {hoursUntilExpiry}h</p>
              )}
              {doc.confidence < 0.85 && (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full border-amber-200 text-amber-700 hover:bg-amber-50" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Review & Edit
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Document Payload</h4>
                <Button onClick={startEditing} variant="outline" size="sm">Edit</Button>
              </div>
              {isEditing ? (
                <div className="space-y-4 h-full flex flex-col">
                  <textarea
                    value={editedPayload}
                    onChange={(e) => setEditedPayload(e.target.value)}
                    className="flex-1 w-full p-3 text-sm font-mono bg-muted border rounded-lg resize-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(false)} size="sm" className="flex-1">Approve</Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="flex-1">Cancel</Button>
                  </div>
                </div>
              ) : (
                <JSONViewer data={doc.payload} />
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">No document found.</p>
            <div className="mt-4">
              <Button onClick={() => router.back()} className="rounded-lg bg-black text-white hover:bg-zinc-800">Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}