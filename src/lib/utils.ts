import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  // Handle non-monetary values (quantities)
  if (currency.toLowerCase() === 'unit' || currency.toLowerCase() === 'units') {
    return `${amount} ${amount === 1 ? 'unit' : 'units'}`
  }
  
  // Handle standard currencies
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  } catch (error) {
    // Fallback for invalid currency codes
    return `${amount} ${currency}`
  }
}

export function formatRelativeTime(date: Date): string {
  // Handle undefined, null, or invalid dates
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'unknown'
  }
  
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    if (minutes === 1) {
      return '1 minute ago'
    } else {
      return `${minutes} minutes ago`
    }
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    if (hours === 1) {
      return '1 hour ago'
    } else {
      return `${hours} hours ago`
    }
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    if (days === 1) {
      return '1 day ago'
    } else {
      return `${days} days ago`
    }
  }
}

export function formatProcessingTime(milliseconds: number): string {
  if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

export function formatCompactNumber(value: number): string {
  if (value == null || isNaN(value)) return '0'
  const formatted = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
  return formatted.replace('K', 'k').replace('M', 'm').replace('B', 'b')
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'processed':
      return 'text-green-600'
    case 'processing':
      return 'text-blue-600'
    case 'failed':
      return 'text-red-600'
    case 'pending':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) {
    return 'text-green-600'
  } else if (confidence >= 0.7) {
    return 'text-yellow-600'
  } else {
    return 'text-red-600'
  }
}

export function getDocumentTypeAbbreviation(documentType: string): string {
  if (!documentType) return 'DOC'
  
  // Try to get the display name from the document schema service
  let displayName = documentType
  try {
    // Import the document schema service dynamically to avoid circular dependencies
    const { documentSchemaService } = require('./document-schema')
    const typeInfo = documentSchemaService.getDocumentTypeInfo(documentType)
    if (typeInfo && typeInfo.displayName) {
      displayName = typeInfo.displayName
    }
  } catch (error) {
    // If we can't get the display name, use the original type
    console.warn('Could not get document type display name:', error)
  }
  
  // If it's already short (3 characters or less), return as is
  if (displayName.length <= 3) {
    return displayName.toUpperCase()
  }
  
  // French document type mappings (common types from the sidebar)
  const frenchTypes: Record<string, string> = {
    'facture': 'FAC',
    'devis': 'DEV',
    'bon de livraison': 'BL',
    'bon de commande': 'BC',
    'bon de mouvement': 'BM',
    'bill of lading': 'BL',
    'pod': 'POD',
    'ggg': 'GGG'
  }
  
  // Common English document type mappings
  const commonTypes: Record<string, string> = {
    'invoice': 'INV',
    'bill_of_lading': 'BL',
    'bill of lading': 'BL',
    'booking_confirmation': 'BC',
    'booking confirmation': 'BC',
    'certificate_of_origin': 'CO',
    'certificate of origin': 'CO',
    'commercial_invoice': 'CI',
    'commercial invoice': 'CI',
    'packing_list': 'PL',
    'packing list': 'PL',
    'delivery_note': 'DN',
    'delivery note': 'DN',
    'purchase_order': 'PO',
    'purchase order': 'PO',
    'receipt': 'RCP',
    'contract': 'CTR',
    'agreement': 'AGR',
    'manifest': 'MAN',
    'customs_declaration': 'CD',
    'customs declaration': 'CD'
  }
  
  // Check if we have a predefined abbreviation (French first, then English)
  const lowerDisplayName = displayName.toLowerCase().replace(/[-_]/g, ' ')
  if (frenchTypes[lowerDisplayName]) {
    return frenchTypes[lowerDisplayName]
  }
  if (commonTypes[lowerDisplayName]) {
    return commonTypes[lowerDisplayName]
  }
  
  // Generate abbreviation from words
  const words = displayName.split(/[\s_-]+/).filter(word => word.length > 0)
  
  if (words.length === 1) {
    // Single word: take first 3 characters
    return words[0].substring(0, 3).toUpperCase()
  } else if (words.length === 2) {
    // Two words: take first 2 chars of first word + first char of second
    return (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase()
  } else {
    // Multiple words: take first character of each word (up to 3)
    return words.slice(0, 3).map(word => word.charAt(0)).join('').toUpperCase()
  }
}
