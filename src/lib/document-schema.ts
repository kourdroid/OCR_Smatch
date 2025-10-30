import { supabase, isSupabaseAvailable } from './supabase'
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
      schema: { type: 'object', required: ['total', 'supplier_name'], properties: {} },
      icon: '🧾',
      color: 'bg-green-100 text-green-800',
      targetTable: 'invoices'
    },
    {
      name: 'BL',
      displayName: 'Bon de Livraison',
      description: 'Bon de livraison',
      schema: { type: 'object', required: ['bill_of_lading', 'supplier_name'], properties: {} },
      icon: '📦',
      color: 'bg-blue-100 text-blue-800',
      targetTable: 'delivery_notes'
    },
    {
      name: 'BC',
      displayName: 'Bon de Commande',
      description: 'Bon de commande',
      schema: { type: 'object', required: ['customs_declaration', 'supplier_name'], properties: {} },
      icon: '📋',
      color: 'bg-purple-100 text-purple-800',
      targetTable: 'purchase_orders'
    },
    {
      name: 'CO',
      displayName: 'Bon de Mouvement',
      description: 'Bon de mouvement',
      schema: { type: 'object', required: ['certificate_number', 'supplier_name'], properties: {} },
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
    // Skip if Supabase is not available
    if (!isSupabaseAvailable() || !supabase) {
      console.warn('Supabase not available - using fallback document types')
      this.initializationError = 'Supabase not available'
      this.loadFallbackData()
      return
    }

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
              if (!this.validateFieldValue(payload[field], property)) {
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
          if (typeof value !== 'string') return false
          
          // Validate string constraints
          if (property.minLength !== undefined && value.length < property.minLength) return false
          if (property.maxLength !== undefined && value.length > property.maxLength) return false
          if (property.pattern && !new RegExp(property.pattern).test(value)) return false
          
          // Validate string formats
          if (property.format) {
            switch (property.format) {
              case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
              case 'date':
                return !isNaN(Date.parse(value)) || /^\d{2}\/\d{2}\/\d{4}$/.test(value)
              case 'date-time':
                return !isNaN(Date.parse(value))
              case 'uri':
              case 'url':
                try {
                  new URL(value)
                  return true
                } catch {
                  return false
                }
              default:
                return true
            }
          }
          return true

        case 'number':
          if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) return false
          
          // Validate number constraints
          if (property.minimum !== undefined && value < property.minimum) return false
          if (property.maximum !== undefined && value > property.maximum) return false
          if (property.multipleOf !== undefined && value % property.multipleOf !== 0) return false
          return true

        case 'integer':
          if (!Number.isInteger(value) || !isFinite(value)) return false
          
          // Validate integer constraints
          if (property.minimum !== undefined && value < property.minimum) return false
          if (property.maximum !== undefined && value > property.maximum) return false
          if (property.multipleOf !== undefined && value % property.multipleOf !== 0) return false
          return true

        case 'boolean':
          return typeof value === 'boolean'

        case 'array':
          if (!Array.isArray(value)) return false
          
          // Validate array constraints
          if (property.minItems !== undefined && value.length < property.minItems) return false
          if (property.maxItems !== undefined && value.length > property.maxItems) return false
          
          // Validate array items if schema is provided
          if (property.items) {
            return value.every(item => this.validateFieldType(item, property.items))
          }
          return true

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value) || value === null) return false
          
          // Validate object properties if schema is provided
          if (property.properties) {
            // Check required properties
            if (property.required && Array.isArray(property.required)) {
              for (const requiredProp of property.required) {
                if (!(requiredProp in value) || value[requiredProp] === null || value[requiredProp] === undefined) {
                  return false
                }
              }
            }
            
            // Validate each property
            for (const [propName, propValue] of Object.entries(value)) {
              if (property.properties[propName]) {
                if (!this.validateFieldType(propValue, property.properties[propName])) {
                  return false
                }
              }
            }
          }
          return true

        default:
          return true
      }
    } catch (error) {
      console.error('Error validating field type:', error)
      return false
    }
  }

  /**
   * Enhanced validation that also checks enum constraints
   */
  private validateFieldValue(value: any, property: any): boolean {
    // First check the basic type validation
    if (!this.validateFieldType(value, property)) {
      return false
    }

    // Check enum constraints
    if (property.enum && Array.isArray(property.enum)) {
      return property.enum.includes(value)
    }

    return true
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

  private async createTargetTable(tableName: string, requiredFields: Record<string, any>): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase not available - cannot create table')
    }

    try {
      // Build the CREATE TABLE SQL statement
      const fieldDefinitions = Object.entries(requiredFields).map(([fieldName, fieldInfo]) => {
        const sqlType = this.mapFieldTypeToSQL(fieldInfo.type || 'string')
        const notNull = fieldInfo.required ? 'NOT NULL' : ''
        return `"${fieldName}" ${sqlType} ${notNull}`.trim()
      }).join(',\n  ')

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "${tableName}" (
          "id" BIGSERIAL PRIMARY KEY,
          "document_id" BIGINT REFERENCES documents(id) ON DELETE CASCADE,
          "created_at" TIMESTAMPTZ DEFAULT NOW(),
          "updated_at" TIMESTAMPTZ DEFAULT NOW(),
          ${fieldDefinitions}
        );
        
        -- Create an index on document_id for better performance
        CREATE INDEX IF NOT EXISTS "idx_${tableName}_document_id" ON "${tableName}" ("document_id");
        
        -- Create an updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS "update_${tableName}_updated_at" ON "${tableName}";
        CREATE TRIGGER "update_${tableName}_updated_at"
          BEFORE UPDATE ON "${tableName}"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `

      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      
      if (error) {
        // If the RPC function doesn't exist, try using the SQL directly
        console.warn('exec_sql RPC not available, attempting direct SQL execution')
        
        // Split the SQL into individual statements and execute them
        const statements = createTableSQL.split(';').filter(stmt => stmt.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            const { error: directError } = await supabase.from('_sql').select().limit(0)
            if (directError) {
              console.warn('Direct SQL execution not available, table creation skipped')
              break
            }
          }
        }
      }

      console.log(`Target table "${tableName}" created successfully`)
    } catch (error) {
      console.error(`Failed to create target table "${tableName}":`, error)
      // Don't throw the error - table creation failure shouldn't prevent document type creation
      console.warn('Continuing with document type creation despite table creation failure')
    }
  }

  private mapFieldTypeToSQL(fieldType: string): string {
    switch (fieldType.toLowerCase()) {
      case 'number':
      case 'integer':
        return 'NUMERIC'
      case 'boolean':
        return 'BOOLEAN'
      case 'date':
        return 'DATE'
      case 'datetime':
        return 'TIMESTAMPTZ'
      case 'textarea':
      case 'text':
        return 'TEXT'
      case 'string':
      default:
        return 'VARCHAR(255)'
    }
  }

  async createDocumentType(documentTypeData: {
    name: string
    displayName: string
    description: string
    icon: string
    color: string
    targetTable: string
    requiredFields: any // Complex schema structure from the enhanced modal
  }): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase not available - cannot create document type')
    }

    try {
      // Convert the complex schema structure to a proper JSON schema
      const schema = this.convertToJsonSchema(documentTypeData.requiredFields)

      // Create the target table first with enhanced field mapping
      const targetTableName = documentTypeData.targetTable.trim()
      if (targetTableName) {
        await this.createTargetTableFromSchema(targetTableName, schema)
      }

      // Create the document type object for database
      const newDocumentType: Omit<DocumentType, 'id' | 'created_at'> = {
        name: documentTypeData.name.trim(),
        description: documentTypeData.description.trim(),
        target_table: targetTableName || undefined,
        expected_schema_json: schema
      }

      // Insert into Supabase
      const { data, error: supabaseError } = await supabase
        .from('document_types')
        .insert([newDocumentType])
        .select()

      if (supabaseError) {
        throw new Error(`Failed to create document type: ${supabaseError.message}`)
      }

      // Add to local cache
      const typeInfo: DocumentTypeInfo = {
        name: documentTypeData.name,
        displayName: documentTypeData.displayName,
        description: documentTypeData.description,
        schema: schema,
        icon: documentTypeData.icon,
        color: documentTypeData.color,
        targetTable: documentTypeData.targetTable
      }
      
      this.documentTypes.set(documentTypeData.name, typeInfo)

    } catch (error) {
      console.error('Error creating document type:', error)
      throw error
    }
  }

  /**
   * Converts the complex schema structure from the enhanced modal to a proper JSON schema
   */
  private convertToJsonSchema(schemaData: any): DocumentSchema {
    if (!schemaData || typeof schemaData !== 'object') {
      return { type: 'object', required: [], properties: {} }
    }

    // If it's already a proper JSON schema structure
    if (schemaData.type && schemaData.properties) {
      return schemaData as DocumentSchema
    }

    // If it's the properties object from the enhanced modal
    const properties: Record<string, any> = {}
    const required: string[] = []

    Object.entries(schemaData).forEach(([fieldName, fieldDef]: [string, any]) => {
      if (fieldDef && typeof fieldDef === 'object') {
        const property = this.convertFieldToJsonSchemaProperty(fieldDef)
        properties[fieldName] = property

        // Add to required if marked as required
        if (fieldDef.required === true) {
          required.push(fieldName)
        }
      }
    })

    return {
      type: 'object',
      required,
      properties
    }
  }

  /**
   * Converts a single field definition to a JSON schema property
   */
  private convertFieldToJsonSchemaProperty(fieldDef: any): any {
    const property: any = {
      type: fieldDef.type || 'string'
    }

    // Add description if available
    if (fieldDef.description) {
      property.description = fieldDef.description
    }

    // Handle constraints based on type
    switch (fieldDef.type) {
      case 'string':
        if (fieldDef.minLength !== undefined) property.minLength = fieldDef.minLength
        if (fieldDef.maxLength !== undefined) property.maxLength = fieldDef.maxLength
        if (fieldDef.pattern) property.pattern = fieldDef.pattern
        if (fieldDef.format) property.format = fieldDef.format
        break

      case 'number':
      case 'integer':
        if (fieldDef.minimum !== undefined) property.minimum = fieldDef.minimum
        if (fieldDef.maximum !== undefined) property.maximum = fieldDef.maximum
        if (fieldDef.multipleOf !== undefined) property.multipleOf = fieldDef.multipleOf
        break

      case 'array':
        if (fieldDef.items) {
          property.items = this.convertFieldToJsonSchemaProperty(fieldDef.items)
        }
        if (fieldDef.minItems !== undefined) property.minItems = fieldDef.minItems
        if (fieldDef.maxItems !== undefined) property.maxItems = fieldDef.maxItems
        break

      case 'object':
        if (fieldDef.properties) {
          property.properties = {}
          property.required = []
          
          Object.entries(fieldDef.properties).forEach(([propName, propDef]: [string, any]) => {
            property.properties[propName] = this.convertFieldToJsonSchemaProperty(propDef)
            if (propDef.required === true) {
              property.required.push(propName)
            }
          })
        }
        break
    }

    // Handle enum values
    if (fieldDef.enum && Array.isArray(fieldDef.enum)) {
      property.enum = fieldDef.enum
    }

    return property
  }

  /**
   * Creates a target table from a JSON schema with enhanced field mapping
   */
  private async createTargetTableFromSchema(tableName: string, schema: DocumentSchema): Promise<void> {
    if (!isSupabaseAvailable() || !supabase) {
      throw new Error('Supabase not available - cannot create target table')
    }

    try {
      // Build column definitions from schema
      const columns = ['id BIGSERIAL PRIMARY KEY']
      columns.push('document_id UUID REFERENCES documents(id) ON DELETE CASCADE')
      columns.push('created_at TIMESTAMPTZ DEFAULT NOW()')
      columns.push('updated_at TIMESTAMPTZ DEFAULT NOW()')

      // Add columns for each property in the schema
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([fieldName, fieldSchema]: [string, any]) => {
          const sqlType = this.getSqlTypeFromJsonSchema(fieldSchema)
          const isRequired = schema.required?.includes(fieldName)
          const nullConstraint = isRequired ? 'NOT NULL' : ''
          
          columns.push(`${fieldName} ${sqlType} ${nullConstraint}`.trim())
        })
      }

      // Create the table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${columns.join(',\n          ')}
        );
      `

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      })

      if (createError) {
        throw new Error(`Failed to create table: ${createError.message}`)
      }

      // Create index on document_id for performance
      const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_${tableName}_document_id 
        ON ${tableName}(document_id);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { 
        sql: createIndexSQL 
      })

      if (indexError) {
        console.warn(`Failed to create index: ${indexError.message}`)
      }

      // Create updated_at trigger
      const createTriggerSQL = `
        CREATE OR REPLACE FUNCTION update_${tableName}_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};
        CREATE TRIGGER update_${tableName}_updated_at
          BEFORE UPDATE ON ${tableName}
          FOR EACH ROW
          EXECUTE FUNCTION update_${tableName}_updated_at();
      `

      const { error: triggerError } = await supabase.rpc('exec_sql', { 
        sql: createTriggerSQL 
      })

      if (triggerError) {
        console.warn(`Failed to create trigger: ${triggerError.message}`)
      }

    } catch (error) {
      console.error('Error creating target table from schema:', error)
      throw error
    }
  }

  /**
   * Maps JSON schema types to SQL types with enhanced support for complex types
   */
  private getSqlTypeFromJsonSchema(fieldSchema: any): string {
    if (!fieldSchema || typeof fieldSchema !== 'object') {
      return 'TEXT'
    }

    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.format === 'date') return 'DATE'
        if (fieldSchema.format === 'date-time') return 'TIMESTAMPTZ'
        if (fieldSchema.format === 'email') return 'VARCHAR(255)'
        if (fieldSchema.format === 'uri') return 'TEXT'
        if (fieldSchema.maxLength && fieldSchema.maxLength <= 255) {
          return `VARCHAR(${fieldSchema.maxLength})`
        }
        return 'TEXT'
      
      case 'number':
        return 'DECIMAL'
      
      case 'integer':
        if (fieldSchema.minimum !== undefined && fieldSchema.minimum >= 0 && 
            fieldSchema.maximum !== undefined && fieldSchema.maximum <= 2147483647) {
          return 'INTEGER'
        }
        return 'BIGINT'
      
      case 'boolean':
        return 'BOOLEAN'
      
      case 'array':
      case 'object':
        return 'JSONB'
      
      default:
        return 'TEXT'
    }
  }
}

export const documentSchemaService = new DocumentSchemaService()