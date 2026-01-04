'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { mapRowToDocument } from '@/lib/document-mapper'
import { Document } from '@/types/document'
import { MainLayout } from '@/components/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DocumentViewer from '@/components/document-viewer'
import DocumentReviewForm from '@/components/document-review-form'

export default function DocumentDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    const run = async () => {
      try {
        const cached = typeof window !== 'undefined' ? localStorage.getItem(`doc:${id}`) : null
        if (cached) {
          setDoc(JSON.parse(cached))
        }
        if (isSupabaseAvailable() && supabase) {
          const { data } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .limit(1)
            .maybeSingle()
          if (data) setDoc(mapRowToDocument(data as any))
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#161616]">
        <div className="px-4 pt-3 pb-5 md:px-2 md:pr-4 bg-[#161616]">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            <div className="p-6"><p className="text-sm text-muted-foreground">Loading document...</p></div>
          </div>
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#161616]">
        <div className="px-4 pt-3 pb-5 md:px-2 md:pr-4 bg-[#161616]">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            <div className="p-6"><p className="text-sm text-muted-foreground">No document found.</p></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MainLayout activeNav="all_documents">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">{doc.documentNumber || 'Untitled Document'}</h1>
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-500 uppercase">{doc.fileType}</Badge>
                <Badge
                  variant="outline"
                  className={`text-xs uppercase border-0 ${doc.status === 'processing' ? 'bg-yellow-50 text-yellow-700' :
                    doc.status === 'extracted' ? 'bg-green-50 text-green-700' :
                      doc.status === 'needs review' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                    }`}
                >
                  {doc.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">ID: {doc.id}</p>
            </div>
          </div>
          {doc.downloadUrl && (
            <Button
              onClick={() => window.open(doc.downloadUrl!, '_blank')}
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full"
            >
              Open Original
            </Button>
          )}
        </div>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6 bg-[#F9FAFB]">
          {/* Left: Viewer */}
          <div className="flex-1 bg-white rounded-[28px] overflow-hidden border border-gray-200 shadow-sm flex flex-col">
            <div className="flex-1 overflow-auto">
              <DocumentViewer url={doc.downloadUrl} type={doc.fileType} />
            </div>
          </div>

          {/* Right: Form */}
          <div className="w-[400px] bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <DocumentReviewForm document={doc} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
