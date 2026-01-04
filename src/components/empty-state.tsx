'use client'

import { FileText, Filter, Mail } from 'lucide-react'

interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters?: () => void
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-16 px-4"
        role="status"
        aria-live="polite"
      >
        <div 
          className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
          role="img"
          aria-label="Filter icon"
        >
          <Filter className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No documents match your filters
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Try adjusting your search terms or filters to find what you're looking for.
        </p>
        <button 
          className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
          aria-label="Clear all active filters"
          onClick={onClearFilters}
        >
          Clear all filters
        </button>
      </div>
    )
  }

  return (
    <div 
      className="flex flex-col items-center justify-center py-16 px-4"
      role="main"
      aria-labelledby="empty-state-title"
    >
      {/* Beautiful illustration placeholder */}
      <div 
        className="relative mb-8"
        role="img"
        aria-label="Document processing illustration with email integration"
      >
        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
          <div className="relative">
            <FileText className="w-16 h-16 text-blue-500" aria-hidden="true" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Mail className="w-3 h-3 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>
        {/* Floating elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-200 rounded-full opacity-60 animate-pulse" aria-hidden="true"></div>
        <div className="absolute -bottom-2 -right-6 w-6 h-6 bg-pink-200 rounded-full opacity-40 animate-pulse delay-300" aria-hidden="true"></div>
        <div className="absolute top-8 -right-8 w-4 h-4 bg-green-200 rounded-full opacity-50 animate-pulse delay-700" aria-hidden="true"></div>
      </div>

      <h2 
        id="empty-state-title"
        className="text-2xl font-bold text-gray-900 mb-3"
      >
        Your logistics documents appear here automatically
      </h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        Send a document to see the magic happen. Our AI will automatically classify, extract, and structure your data in seconds.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4" role="group" aria-label="Document upload actions">
        <button 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
          aria-label="Send document via email for processing"
        >
          <Mail className="w-4 h-4" aria-hidden="true" />
          <span>Send via Email</span>
        </button>
        <button 
          className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white"
          aria-label="View sample demo documents"
        >
          View Demo Documents
        </button>
      </div>

      {/* Supported formats */}
      <div className="mt-12 text-center" role="region" aria-labelledby="supported-formats-title">
        <p id="supported-formats-title" className="text-sm text-gray-500 mb-3">Supported formats</p>
        <div 
          className="flex items-center justify-center space-x-6 text-xs text-gray-400"
          role="list"
          aria-label="List of supported file formats"
        >
          <span className="flex items-center space-x-1" role="listitem">
            <div className="w-2 h-2 bg-red-400 rounded-full" aria-hidden="true"></div>
            <span>PDF</span>
          </span>
          <span className="flex items-center space-x-1" role="listitem">
            <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true"></div>
            <span>Excel</span>
          </span>
          <span className="flex items-center space-x-1" role="listitem">
            <div className="w-2 h-2 bg-blue-400 rounded-full" aria-hidden="true"></div>
            <span>Images</span>
          </span>
        </div>
      </div>
    </div>
  )
}