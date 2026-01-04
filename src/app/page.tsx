import { DocumentsInterface } from '@/components/documents-interface'
import { ErrorBoundary } from '@/components/error-boundary'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { mapRowToDocument } from '@/lib/document-mapper'
import { Document } from '@/types/document'

export default async function Home() {
  const initial: Document[] = []

  return (
    <ErrorBoundary>
      <DocumentsInterface initialDocuments={initial} />
    </ErrorBoundary>
  )
}
