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

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'processed':
      return 'text-green-600 dark:text-green-400'
    case 'processing':
      return 'text-blue-600 dark:text-blue-400'
    case 'failed':
      return 'text-red-600 dark:text-red-400'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) {
    return 'text-green-600 dark:text-green-400'
  } else if (confidence >= 0.7) {
    return 'text-yellow-600 dark:text-yellow-400'
  } else {
    return 'text-red-600 dark:text-red-400'
  }
}
