'use client'

import { useState } from 'react'
import { Document } from '@/types/document'
import { cn } from '@/lib/utils'
import { AlertTriangle, CheckCircle, Edit3, Save, X, Eye, EyeOff } from 'lucide-react'

interface ConfidenceReviewProps {
  document: Document
  onSave: (updatedDocument: Document) => void
  onCancel: () => void
}

interface FieldWithConfidenceProps {
  label: string
  value: any
  fieldName: string
  type?: string
  onChange: (value: any) => void
  isEditing?: boolean
}

function FieldWithConfidence({ label, value, fieldName, type = "text", onChange, isEditing = false }: FieldWithConfidenceProps) {
  // Mock confidence for individual fields (in real app, this would come from the API)
  const fieldConfidence = Math.random() * 0.4 + 0.6 // Random between 0.6-1.0
  const confidenceColor = fieldConfidence >= 0.85 ? 'text-green-600' : fieldConfidence >= 0.7 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className={cn("text-xs font-medium", confidenceColor)}>
          {Math.round(fieldConfidence * 100)}%
        </span>
      </div>
      {isEditing ? (
        type === "number" ? (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : type === "textarea" ? (
          <textarea
            value={typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : (value || '')}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <input
            type="text"
            value={typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : (value || '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )
      ) : (
        <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
          {type === "number" ? (value || 0) : 
           typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : 
           (value || '—')}
        </div>
      )}
    </div>
  )
}

export function ConfidenceReview({ document, onSave, onCancel }: ConfidenceReviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDocument, setEditedDocument] = useState<Document>(document)
  const [showRawData, setShowRawData] = useState(false)
  const [activeTab, setActiveTab] = useState<'extracted' | 'metadata' | 'audit'>('extracted')

  const confidenceLevel = document.confidence >= 0.9 ? 'high' : document.confidence >= 0.7 ? 'medium' : 'low'
  const confidenceColor = confidenceLevel === 'high' ? 'text-green-600' : confidenceLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'

  const handleFieldChange = (field: string, value: any) => {
    setEditedDocument(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePayloadChange = (key: string, value: any) => {
    setEditedDocument(prev => ({
      ...prev,
      payload: {
        ...prev.payload,
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    const updatedDocument = {
      ...editedDocument,
      confidence: Math.min(0.99, editedDocument.confidence + 0.1), // Increase confidence after manual review
      auditTimeline: [
        ...editedDocument.auditTimeline,
        {
          timestamp: new Date(),
          event: 'reviewed' as const,
          details: 'Manual review and corrections applied',
          confidence: editedDocument.confidence + 0.1
        }
      ]
    }
    onSave(updatedDocument)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertTriangle className={cn("h-5 w-5", confidenceColor)} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Confidence Review</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Document requires manual review due to low confidence score
            </p>
          </div>
        </div>
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          confidenceLevel === 'low' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        )}>
          {Math.round(document.confidence * 100)}% Overall Confidence
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {!isEditing ? (
          <>
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Document</span>
            </button>
            <button 
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showRawData ? 'Hide' : 'Show'} Raw Data</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleSave} 
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </>
        )}
        <button 
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          Close Review
        </button>
      </div>

      {/* Tabs */}
      <div className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'extracted', label: 'Extracted Data' },
              { id: 'metadata', label: 'Document Metadata' },
              { id: 'audit', label: 'Audit Trail' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'extracted' && (
            <div className="space-y-6">
              {/* Core Document Fields */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Core Document Fields</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldWithConfidence
                    label="Document Number"
                    value={editedDocument.documentNumber}
                    fieldName="documentNumber"
                    onChange={(value) => handleFieldChange('documentNumber', value)}
                    isEditing={isEditing}
                  />
                  <FieldWithConfidence
                    label="Document Type"
                    value={editedDocument.type}
                    fieldName="type"
                    onChange={(value) => handleFieldChange('type', value)}
                    isEditing={isEditing}
                  />
                  <FieldWithConfidence
                    label="Supplier"
                    value={editedDocument.supplier}
                    fieldName="supplier"
                    onChange={(value) => handleFieldChange('supplier', value)}
                    isEditing={isEditing}
                  />
                  <FieldWithConfidence
                    label="Amount"
                    value={editedDocument.amount}
                    fieldName="amount"
                    type="number"
                    onChange={(value) => handleFieldChange('amount', value)}
                    isEditing={isEditing}
                  />
                </div>
              </div>

              {/* Extracted Payload Data */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Extracted Payload Data</h3>
                <div className="space-y-4">
                  {Object.entries(editedDocument.payload).map(([key, value]) => (
                    <FieldWithConfidence
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      value={value}
                      fieldName={key}
                      type={typeof value === 'object' ? 'textarea' : 'text'}
                      onChange={(newValue) => handlePayloadChange(key, newValue)}
                      isEditing={isEditing}
                    />
                  ))}
                </div>
              </div>

              {/* Raw Data */}
              {showRawData && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Raw JSON Data</h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-auto max-h-96 text-gray-900 dark:text-gray-100">
                    {JSON.stringify(editedDocument.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Document Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">{document.status}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Channel</label>
                  <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">{document.channel}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">File Type</label>
                  <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">{document.fileType}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Processing Time</label>
                  <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">{document.processingTime}ms</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Received At</label>
                  <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                    {document.receivedAt.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sender</label>
                  <div className="p-2 rounded border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">{document.senderEmail}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Audit Trail</h3>
              <div className="space-y-4">
                {editedDocument.auditTimeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex-shrink-0">
                      {event.event === 'extracted' || event.event === 'reviewed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{event.event}</p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {event.timestamp.toLocaleString()}
                        </span>
                      </div>
                      {event.details && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.details}</p>
                      )}
                      {event.confidence && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 mt-2">
                          {Math.round(event.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}