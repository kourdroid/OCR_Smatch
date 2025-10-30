import { DocumentsInterface } from '@/components/documents-interface'
import { ErrorBoundary } from '@/components/error-boundary'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { mapRowToDocument } from '@/lib/document-mapper'
import { Document } from '@/types/document'

export default async function Home() {
  let initial: Document[] = []

  // Only try to fetch data if Supabase is properly configured
  if (isSupabaseAvailable() && supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)

      if (error) {
        // Silently handle Supabase errors in development
        if (process.env.NODE_ENV === 'development') {
          // Don't log connection errors in development
        } else {
          console.error('Supabase error:', error)
        }
      } else {
        initial = (data || []).map(mapRowToDocument)
      }
    } catch (err) {
      // Silently handle fetch failures in development
      if (process.env.NODE_ENV === 'development') {
        // Don't log fetch errors in development
      } else {
        console.error('Failed to fetch documents:', err)
      }
    }
  }

  return (
    <ErrorBoundary>
      <DocumentsInterface initialDocuments={initial} />
    </ErrorBoundary>
  )
}
