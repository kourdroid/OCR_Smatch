// Group documents by supplier and type
const groupDocuments = (docs: Document[]): DocumentRow[] => {
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
      let groupStatus: 'extracted' | 'needs review' | 'failed' | 'mixed'
      if (statuses.length === 1) {
        groupStatus = statuses[0] as 'extracted' | 'needs review' | 'failed'
      } else {
        groupStatus = 'mixed'
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

export function DocumentsInterface({ initialDocuments }: { initialDocuments: Document[] }) {
