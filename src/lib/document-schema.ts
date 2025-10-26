import { supabase } from './supabase'
import { DocumentType, DocumentSchema, DocumentTypeInfo, SchemaValidationResult } from '@/types/document-schema'

class DocumentSchemaService {
  private documentTypes: Map<string, DocumentTypeInfo> = new Map()
  private initialized = false
  private isLoading = false
  private initializationError: string | null = null
  private retryCount = 0
  private maxRetries = 3
  private retryDelay = 1000

  // Fallback document types for when Supabase is unavailable
  private fallbackDocumentTypes: DocumentTypeInfo[] = [
    {
      name: 'invoice',
      displayName: 'Facture',
      description: 'Document de facturation',
      schema: { type: 'object', required: ['amount', 'supplier'], properties: {} },
      icon: '🧾',
      color: 'bg-green-100 text-green-800',
      targetTable: 'invoices'
    },
    {
      name: 'BL',
      displayName: 'Bon de Livraison',
      description: 'Bon de livraison',
      schema: { type: 'object', required: ['items'], properties: {} },
      icon: '📦',
      color: 'bg-blue-100 text-blue-800',
      targetTable: 'delivery_notes'
    },
    {
      name: 'BC',
      displayName: 'Bon de Commande',
      description: 'Bon de commande',
      schema: { type: 'object', required: ['items'], properties: {} },
      icon: '📋',
      color: 'bg-purple-100 text-purple-800',
      targetTable: 'purchase_orders'
    },
    {
      name: 'CO',
      displayName: 'Bon de Mouvement',
      description: 'Bon de mouvement',
      schema: { type: 'object', required: ['items'], properties: {} },
      icon: '🔄',
      color: 'bg-orange-100 text-orange-800',
      targetTable: 'movement_orders'
    }
  ]

  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.isLoading) {
      // Wait for ongoing initialization
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    this.isLoading = true
    this.initializationError = null

    try {
      await this.initializeWithRetry()
    } catch (error) {
      console.error('Failed to initialize document schema service after retries:', error)
      this.initializationError = error instanceof Error ? error.message : 'Unknown error'
      this.loadFallbackData()
    } finally {
      this.isLoading = false
    }
  }

  private async initializeWithRetry(): Promise<void> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('document_types')
          .select('*')

        if (error) {
          throw new Error(`Supabase error: ${error.message}`)
        }

        if (data && Array.isArray(data)) {
          this.documentTypes.clear()
          data.forEach((docType: DocumentType) => {
            if (this.isValidDocumentType(docType)) {
              const typeInfo: DocumentTypeInfo = {
                name: docType.name,
                displayName: this.getDisplayName(docType.name),
                description: docType.description || '',
                schema: this.validateSchema(docType.expected_schema_json) || this.getDefaultSchema(),
                icon: this.getTypeIcon(docType.name),
                color: this.getTypeColor(docType.name),
                targetTable: docType.target_table || ''
              }
              this.documentTypes.set(docType.name, typeInfo)
            }
          })

          // If no valid document types were loaded, use fallback
          if (this.documentTypes.size === 0) {
            throw new Error('No valid document types found in database')
          }

          this.initialized = true
          this.retryCount = 0
          return
        } else {
          throw new Error('No data received from Supabase')
        }
      } catch (error) {
        this.retryCount = attempt + 1
        console.warn(`Initialization attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)))
        } else {
          throw error
        }
      }
    }
  }

  private loadFallbackData(): void {
    console.warn('Loading fallback document types due to initialization failure')
    this.documentTypes.clear()
    this.fallbackDocumentTypes.forEach(typeInfo => {
      this.documentTypes.set(typeInfo.name, typeInfo)
    })
    this.initialized = true
  }

  private isValidDocumentType(docType: any): boolean {
    return (
      docType &&
      typeof docType.name === 'string' &&
      docType.name.trim().length > 0 &&
      (docType.expected_schema_json === null || typeof docType.expected_schema_json === 'object')
    )
  }

  private validateSchema(schema: any): DocumentSchema | null {
    if (!schema || typeof schema !== 'object') return null
    
    try {
      return {
        type: schema.type || 'object',
        required: Array.isArray(schema.required) ? schema.required : [],
        properties: schema.properties && typeof schema.properties === 'object' ? schema.properties : {}
      }
    } catch {
      return null
    }
  }

  private getDefaultSchema(): DocumentSchema {
    return {
      type: 'object',
      required: [],
      properties: {}
    }
  }

  // Public getters for status
  getInitializationStatus(): { initialized: boolean; loading: boolean; error: string | null } {
    return {
      initialized: this.initialized,
      loading: this.isLoading,
      error: this.initializationError
    }
  }

  getDocumentType(typeName: string): DocumentTypeInfo | undefined {
    if (!typeName || typeof typeName !== 'string') {
      console.warn('Invalid typeName provided to getDocumentType:', typeName)
      return undefined
    }
    return this.documentTypes.get(typeName)
  }

  getAllDocumentTypes(): DocumentTypeInfo[] {
    try {
      return Array.from(this.documentTypes.values())
    } catch (error) {
      console.error('Error getting all document types:', error)
      return this.fallbackDocumentTypes
    }
  }

  detectDocumentType(payload: Record<string, any>): string | null {
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid payload provided to detectDocumentType:', payload)
      return null
    }

    try {
      for (const [typeName, typeInfo] of this.documentTypes) {
        if (this.matchesSchema(payload, typeInfo.schema)) {
          return typeName
        }
      }
      return null
    } catch (error) {
      console.error('Error detecting document type:', error)
      return null
    }
  }

  validateDocument(payload: Record<string, any>, typeName: string): SchemaValidationResult {
    // Input validation
    if (!payload || typeof payload !== 'object') {
      console.warn('Invalid payload provided to validateDocument:', payload)
      return this.getDefaultValidationResult()
    }

    if (!typeName || typeof typeName !== 'string') {
      console.warn('Invalid typeName provided to validateDocument:', typeName)
      return this.getDefaultValidationResult()
    }

    try {
      const typeInfo = this.documentTypes.get(typeName)
      if (!typeInfo) {
        console.warn(`Document type '${typeName}' not found`)
        return this.getDefaultValidationResult()
      }

      const schema = typeInfo.schema
      if (!schema) {
        console.warn(`No schema found for document type '${typeName}'`)
        return this.getDefaultValidationResult()
      }

      const missingRequired: string[] = []
      const invalidFields: string[] = []

      // Check required fields with error handling
      try {
        const requiredFields = Array.isArray(schema.required) ? schema.required : []
        requiredFields.forEach(field => {
          if (typeof field === 'string' && field.trim().length > 0) {
            if (!(field in payload) || payload[field] === null || payload[field] === undefined || payload[field] === '') {
              missingRequired.push(field)
            }
          }
        })
      } catch (error) {
        console.error('Error checking required fields:', error)
      }

      // Check field types and formats with error handling
      try {
        const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties : {}
        Object.entries(properties).forEach(([field, property]) => {
          if (typeof field === 'string' && field in payload) {
            try {
              if (!this.validateFieldType(payload[field], property)) {
                invalidFields.push(field)
              }
            } catch (error) {
              console.error(`Error validating field '${field}':`, error)
              invalidFields.push(field)
            }
          }
        })
      } catch (error) {
        console.error('Error checking field types:', error)
      }

      // Calculate score with safe math
      const totalFields = Math.max(1, Object.keys(schema.properties || {}).length)
      const validFields = Math.max(0, totalFields - invalidFields.length)
      const requiredFields = Math.max(0, (schema.required?.length || 0))
      const presentRequired = Math.max(0, requiredFields - missingRequired.length)

      // Calculate score: 70% for required fields, 30% for optional fields
      const requiredScore = requiredFields > 0 ? (presentRequired / requiredFields) * 70 : 70
      const optionalScore = totalFields > 0 ? (validFields / totalFields) * 30 : 30
      const score = Math.min(100, Math.max(0, Math.round(requiredScore + optionalScore)))

      return {
        isValid: missingRequired.length === 0 && invalidFields.length === 0,
        missingRequired,
        invalidFields,
        score
      }
    } catch (error) {
      console.error('Error validating document:', error)
      return this.getDefaultValidationResult()
    }
  }

  private getDefaultValidationResult(): SchemaValidationResult {
    return {
      isValid: false,
      missingRequired: [],
      invalidFields: [],
      score: 0
    }
  }

  private matchesSchema(payload: Record<string, any>, schema: DocumentSchema): boolean {
    if (!payload || typeof payload !== 'object' || !schema) {
      return false
    }

    try {
      // Check if at least 70% of required fields are present
      const requiredFields = Array.isArray(schema.required) ? schema.required : []
      if (requiredFields.length === 0) return true

      const presentRequired = requiredFields.filter(field => {
        if (typeof field !== 'string') return false
        return field in payload && 
               payload[field] !== null && 
               payload[field] !== undefined && 
               payload[field] !== ''
      })
      
      return presentRequired.length >= Math.ceil(requiredFields.length * 0.7)
    } catch (error) {
      console.error('Error matching schema:', error)
      return false
    }
  }

  private validateFieldType(value: any, property: any): boolean {
    if (value === null || value === undefined) return true
    if (!property || typeof property !== 'object') return true

    try {
      const type = property.type
      if (!type || typeof type !== 'string') return true

      switch (type.toLowerCase()) {
        case 'string':
          return typeof value === 'string'
        case 'number':
          return typeof value === 'number' && !isNaN(value) && isFinite(value)
        case 'integer':
          return Number.isInteger(value) && isFinite(value)
        case 'boolean':
          return typeof value === 'boolean'
        case 'array':
          return Array.isArray(value)
        case 'object':
          return typeof value === 'object' && !Array.isArray(value) && value !== null
        default:
          return true
      }
    } catch (error) {
      console.error('Error validating field type:', error)
      return false
    }
  }

  private getDisplayName(typeName: string): string {
    if (!typeName || typeof typeName !== 'string') {
      return 'Unknown Type'
    }

    try {
      const displayNames: Record<string, string> = {
        'facture': 'Facture',
        'invoice': 'Facture',
        'bon_de_livraison': 'Bon de Livraison',
        'BL': 'Bon de Livraison',
        'bon_de_commande': 'Bon de Commande',
        'BC': 'Bon de Commande',
        'bon_de_mouvement': 'Bon de Mouvement',
        'CO': 'Bon de Mouvement'
      }
      
      const cleanTypeName = typeName.trim().toLowerCase()
      return displayNames[cleanTypeName] || 
             displayNames[typeName] || 
             (typeName.charAt(0).toUpperCase() + typeName.slice(1))
    } catch (error) {
      console.error('Error getting display name:', error)
      return typeName || 'Unknown Type'
    }
  }

  private getTypeIcon(typeName: string): string {
    if (!typeName || typeof typeName !== 'string') {
      return '📄'
    }

    try {
      const icons: Record<string, string> = {
        'facture': '🧾',
        'invoice': '🧾',
        'bon_de_livraison': '📦',
        'BL': '📦',
        'bon_de_commande': '📋',
        'BC': '📋',
        'bon_de_mouvement': '🔄',
        'CO': '🔄'
      }
      
      const cleanTypeName = typeName.trim().toLowerCase()
      return icons[cleanTypeName] || icons[typeName] || '📄'
    } catch (error) {
      console.error('Error getting type icon:', error)
      return '📄'
    }
  }

  private getTypeColor(typeName: string): string {
    if (!typeName || typeof typeName !== 'string') {
      return 'bg-gray-100 text-gray-800'
    }

    try {
      const colors: Record<string, string> = {
        'facture': 'bg-green-100 text-green-800',
        'invoice': 'bg-green-100 text-green-800',
        'bon_de_livraison': 'bg-blue-100 text-blue-800',
        'BL': 'bg-blue-100 text-blue-800',
        'bon_de_commande': 'bg-purple-100 text-purple-800',
        'BC': 'bg-purple-100 text-purple-800',
        'bon_de_mouvement': 'bg-orange-100 text-orange-800',
        'CO': 'bg-orange-100 text-orange-800'
      }
      
      const cleanTypeName = typeName.trim().toLowerCase()
      return colors[cleanTypeName] || colors[typeName] || 'bg-gray-100 text-gray-800'
    } catch (error) {
      console.error('Error getting type color:', error)
      return 'bg-gray-100 text-gray-800'
    }
  }

  getDocumentTypeInfo(typeName: string): DocumentTypeInfo {
    if (!typeName || typeof typeName !== 'string') {
      return {
        name: 'unknown',
        displayName: 'Unknown Type',
        icon: '📄',
        color: 'bg-gray-100 text-gray-800',
        schema: this.getDefaultSchema()
      }
    }

    try {
      // Try to get from stored types first
      const storedType = this.documentTypes.get(typeName)
      if (storedType) {
        return storedType
      }

      // Fallback to generated info
      return {
        name: typeName,
        displayName: this.getDisplayName(typeName),
        icon: this.getTypeIcon(typeName),
        color: this.getTypeColor(typeName),
        schema: this.getDefaultSchema()
      }
    } catch (error) {
      console.error('Error getting document type info:', error)
      return {
        name: typeName,
        displayName: 'Unknown Type',
        icon: '📄',
        color: 'bg-gray-100 text-gray-800',
        schema: this.getDefaultSchema()
      }
    }
  }
}

export const documentSchemaService = new DocumentSchemaService()