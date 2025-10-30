'use client'

import { Badge } from '@/components/ui/badge'
import { documentSchemaService } from '@/lib/document-schema'
import { Document } from '@/types/document'
import { CheckCircle, AlertTriangle, XCircle, FileText, Receipt, Truck, Package, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface DocumentTypeBadgeProps {
  document: Document
  showValidation?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function DocumentTypeBadge({ document, showValidation = true, size = 'md' }: DocumentTypeBadgeProps) {
  // Memoize document type info with error handling
  const documentType = useMemo(() => {
    try {
      if (!document || !document.type) {
        console.warn('Invalid document provided to DocumentTypeBadge:', document)
        return {
          name: 'unknown',
          displayName: 'Unknown Type',
          icon: '📄',
          color: 'bg-gray-100 text-gray-800'
        }
      }
      return documentSchemaService.getDocumentTypeInfo(document.type)
    } catch (error) {
      console.error('Error getting document type info:', error)
      return {
        name: 'error',
        displayName: 'Error',
        icon: '❌',
        color: 'bg-red-100 text-red-800'
      }
    }
  }, [document?.type])

  // Memoize validation with error handling
  const validation = useMemo(() => {
    if (!showValidation || !document) return null
    
    try {
      return documentSchemaService.validateDocument(document.payload || {}, document.type || '')
    } catch (error) {
      console.error('Error validating document:', error)
      return {
        isValid: false,
        missingRequired: [],
        invalidFields: ['validation_error'],
        score: 0
      }
    }
  }, [document?.payload, document?.type, showValidation])
  
  // Get icon based on document type with error handling
  const getIcon = useMemo(() => {
    try {
      const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      
      if (!document?.type) {
        return <FileText className={iconSize} />
      }

      switch (document.type.toLowerCase()) {
        case 'invoice':
        case 'facture':
          return <Receipt className={iconSize} />
        case 'bl':
        case 'bon_de_livraison':
          return <Truck className={iconSize} />
        case 'bc':
        case 'bon_de_commande':
          return <Package className={iconSize} />
        case 'co':
        case 'bon_de_mouvement':
          return <Award className={iconSize} />
        default:
          return <FileText className={iconSize} />
      }
    } catch (error) {
      console.error('Error getting icon:', error)
      const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
      return <FileText className={iconSize} />
    }
  }, [document?.type, size])

  // Get validation icon with error handling
  const getValidationIcon = useMemo(() => {
    try {
      if (!validation || !showValidation) return null
      
      const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3 w-3'
      
      if (validation.isValid) {
        return <CheckCircle className={cn(iconSize, 'text-green-500')} />
      } else if (validation.missingRequired?.length > 0 || validation.invalidFields?.length > 0) {
        return <XCircle className={cn(iconSize, 'text-red-500')} />
      } else {
        return <AlertTriangle className={cn(iconSize, 'text-yellow-500')} />
      }
    } catch (error) {
      console.error('Error getting validation icon:', error)
      return null
    }
  }, [validation, showValidation, size])

  // Get badge variant based on validation status with error handling
  const getBadgeVariant = useMemo(() => {
    try {
      if (!validation || !showValidation) return 'secondary'
      
      if (validation.isValid) return 'default'
      if ((validation.missingRequired?.length || 0) > 0 || (validation.invalidFields?.length || 0) > 0) {
        return 'destructive'
      }
      return 'secondary'
    } catch (error) {
      console.error('Error getting badge variant:', error)
      return 'secondary'
    }
  }, [validation, showValidation])

  // Get badge size classes with error handling
  const getSizeClasses = useMemo(() => {
    try {
      switch (size) {
        case 'sm':
          return 'text-xs px-2 py-0.5'
        case 'lg':
          return 'text-sm px-3 py-1'
        default:
          return 'text-xs px-2 py-1'
      }
    } catch (error) {
      console.error('Error getting size classes:', error)
      return 'text-xs px-2 py-1'
    }
  }, [size])

  // Calculate total errors safely
  const totalErrors = useMemo(() => {
    try {
      if (!validation) return 0
      return (validation.missingRequired?.length || 0) + (validation.invalidFields?.length || 0)
    } catch (error) {
      console.error('Error calculating total errors:', error)
      return 0
    }
  }, [validation])

  // Safe render with comprehensive error boundaries
  try {
    return (
      <div className="flex items-center gap-1">
        <Badge 
          variant={getBadgeVariant}
          className={cn(
            'flex items-center gap-1.5',
            getSizeClasses,
            documentType?.color || 'bg-gray-100 text-gray-800'
          )}
          title={documentType?.displayName || 'Unknown Type'}
        >
          {getIcon}
          <span>{documentType?.displayName || 'Unknown Type'}</span>
        </Badge>
      </div>
    )
  } catch (error) {
    console.error('Error rendering DocumentTypeBadge:', error)
    // Fallback render
    return (
      <div className="flex items-center gap-1">
        <Badge variant="secondary" className="flex items-center gap-1.5 text-xs px-2 py-1 bg-gray-100 text-gray-800">
          <FileText className="h-4 w-4" />
          <span>Unknown Type</span>
        </Badge>
      </div>
    )
  }
}