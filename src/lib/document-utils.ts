import { Document, DocumentRow, DocumentGroup } from '@/types/document'

export const groupDocuments = (docs: Document[]): DocumentRow[] => {
  const groups: { [key: string]: Document[] } = {}
  const singles: Document[] = []

  // Group documents by supplier + type combination
  docs.forEach(doc => {
    const groupKey = `${doc.supplier}-${doc.type}`
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(doc)
  })

  const documentRows: DocumentRow[] = []

  // Process groups
  Object.entries(groups).forEach(([groupKey, groupDocs]) => {
    if (groupDocs.length > 1) {
      // Create a group
      const totalAmount = groupDocs.reduce((sum, doc) => sum + doc.amount, 0)
      const avgConfidence = groupDocs.reduce((sum, doc) => sum + doc.confidence, 0) / groupDocs.length
      const latestReceivedAt = Math.max(...groupDocs.map(doc => new Date(doc.receivedAt).getTime()))

      // Determine group status
      const statuses = [...new Set(groupDocs.map(doc => doc.status))]
      let groupStatus: DocumentGroup['aggregateData']['status'] = 'mixed'

      if (statuses.length === 1) {
        // Cast to match DocumentGroup status type (which doesn't include 'processing' explicitly in some versions,
        // but we cast to satisfy the type system based on existing logic)
        groupStatus = statuses[0] as DocumentGroup['aggregateData']['status']
      }

      const group: DocumentGroup = {
        id: `group-${groupKey}`,
        groupKey: groupDocs[0].supplier,
        documents: groupDocs,
        aggregateData: {
          count: groupDocs.length,
          totalAmount,
          currency: groupDocs[0].currency,
          avgConfidence,
          status: groupStatus,
          latestReceivedAt: new Date(latestReceivedAt)
        }
      }

      documentRows.push({
        type: 'group',
        group
      })
    } else {
      // Single document
      singles.push(...groupDocs)
    }
  })

  // Add single documents
  singles.forEach(doc => {
    documentRows.push({
      type: 'single',
      document: doc
    })
  })

  return documentRows
}
