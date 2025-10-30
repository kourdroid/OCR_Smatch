import React, { useState, useEffect, useCallback } from 'react'
import { Document, KPIData, DatabaseRow } from '@/types/document'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { mapRowToDocument } from '@/lib/document-mapper'

interface UseRealTimeOptions {
  documents: Document[]
  kpiData: KPIData
  onDocumentsUpdate: React.Dispatch<React.SetStateAction<Document[]>>
  onKPIUpdate: (kpi: KPIData) => void
}

export function useRealTime({ documents, kpiData, onDocumentsUpdate, onKPIUpdate }: UseRealTimeOptions) {
  const [isConnected, setIsConnected] = useState(true)
  
  // Initialize lastUpdate based on the most recent document's receivedAt time
  const [lastUpdate, setLastUpdate] = useState<Date>(() => {
    if (documents && documents.length > 0) {
      // Find the most recent document by receivedAt time
      const mostRecentDoc = documents.reduce((latest, current) => {
        return current.receivedAt > latest.receivedAt ? current : latest
      })
      return mostRecentDoc.receivedAt
    }
    return new Date()
  })
  
  const [newDocumentCount, setNewDocumentCount] = useState(0)





  // Supabase real-time subscription
  useEffect(() => {
    let channel: any = null
    
    const setupRealTimeSubscription = async () => {
      // Skip if Supabase is not available
      if (!isSupabaseAvailable() || !supabase) {
        console.warn('Supabase not available - real-time updates disabled')
        setIsConnected(false)
        return
      }

      try {
        // Subscribe to documents table changes
        channel = supabase
          .channel('documents-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'documents'
            },
            (payload) => {
              console.log('Real-time update received:', payload)
              
              try {
                if (payload.eventType === 'INSERT') {
                  // New document inserted
                  const newRow = payload.new as DatabaseRow
                  if (newRow) {
                    const newDoc = mapRowToDocument(newRow)
                    onDocumentsUpdate((prevDocs: Document[]) => [newDoc, ...prevDocs])
                    setNewDocumentCount(prev => prev + 1)
                    setLastUpdate(new Date())
                  }
                } else if (payload.eventType === 'UPDATE') {
                  // Document updated
                  const updatedRow = payload.new as DatabaseRow
                  if (updatedRow) {
                    const updatedDoc = mapRowToDocument(updatedRow)
                    onDocumentsUpdate((prevDocs: Document[]) => 
                      prevDocs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
                    )
                    setLastUpdate(new Date())
                  }
                } else if (payload.eventType === 'DELETE') {
                  // Document deleted
                  const deletedRow = payload.old as DatabaseRow
                  if (deletedRow) {
                    const deletedId = String(deletedRow.id ?? deletedRow.document_id)
                    onDocumentsUpdate((prevDocs: Document[]) => 
                      prevDocs.filter(doc => doc.id !== deletedId)
                    )
                    setLastUpdate(new Date())
                  }
                }
              } catch (error) {
                console.error('Error processing real-time update:', error, payload)
                // Don't crash the app, just log the error
              }
            }
          )
          .subscribe((status) => {
            console.log('Supabase subscription status:', status)
            if (status === 'SUBSCRIBED') {
              setIsConnected(true)
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              setIsConnected(false)
            }
          })
      } catch (error) {
        console.error('Failed to setup real-time subscription:', error)
        setIsConnected(false)
        // Connection will be handled by the fallback simulation
      }
    }

    setupRealTimeSubscription()

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [onDocumentsUpdate])

  // Simulate connection status changes (fallback when no real DB)
  useEffect(() => {
    const connectionInterval = setInterval(() => {
      // Occasionally simulate connection issues
      if (Math.random() < 0.05) {
        setIsConnected(false)
        setTimeout(() => setIsConnected(true), 2000)
      }
    }, 10000)

    return () => clearInterval(connectionInterval)
  }, [])



  // Update lastUpdate when documents array changes
  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDoc = documents.reduce((latest, current) => {
        return current.receivedAt > latest.receivedAt ? current : latest
      })
      setLastUpdate(mostRecentDoc.receivedAt)
    }
  }, [documents])

  // Reset new document count after a delay
  useEffect(() => {
    if (newDocumentCount > 0) {
      const timeout = setTimeout(() => {
        setNewDocumentCount(0)
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [newDocumentCount])

  return {
    isConnected,
    lastUpdate,
    newDocumentCount
  }
}