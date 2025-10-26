import React, { useState, useEffect, useCallback } from 'react'
import { Document, KPIData } from '@/types/document'
import { supabase } from '@/lib/supabase'

interface UseRealTimeOptions {
  documents: Document[]
  kpiData: KPIData
  onDocumentsUpdate: React.Dispatch<React.SetStateAction<Document[]>>
  onKPIUpdate: (kpi: KPIData) => void
}

export function useRealTime({ documents, kpiData, onDocumentsUpdate, onKPIUpdate }: UseRealTimeOptions) {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [newDocumentCount, setNewDocumentCount] = useState(0)





  // Supabase real-time subscription
  useEffect(() => {
    let channel: any = null
    
    const setupRealTimeSubscription = async () => {
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
              
              if (payload.eventType === 'INSERT') {
                // New document inserted
                const newDoc = payload.new as Document
                if (newDoc) {
                  onDocumentsUpdate((prevDocs: Document[]) => [newDoc, ...prevDocs])
                  setNewDocumentCount(prev => prev + 1)
                  setLastUpdate(new Date())
                }
              } else if (payload.eventType === 'UPDATE') {
                // Document updated
                const updatedDoc = payload.new as Document
                if (updatedDoc) {
                  onDocumentsUpdate((prevDocs: Document[]) => 
                    prevDocs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
                  )
                  setLastUpdate(new Date())
                }
              } else if (payload.eventType === 'DELETE') {
                // Document deleted
                const deletedDoc = payload.old as Document
                if (deletedDoc) {
                  onDocumentsUpdate((prevDocs: Document[]) => 
                    prevDocs.filter(doc => doc.id !== deletedDoc.id)
                  )
                  setLastUpdate(new Date())
                }
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
        // Connection will be handled by the fallback simulation
      }
    }

    setupRealTimeSubscription()

    return () => {
      if (channel) {
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