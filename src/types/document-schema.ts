export interface DocumentType {
  id: string
  name: string
  description?: string
  created_at?: string
  target_table?: string
  expected_schema_json?: Record<string, any>
}

export interface SchemaProperty {
  type: string
  format?: string
  enum?: string[]
  minimum?: number
  maximum?: number
  description?: string
  items?: SchemaProperty
  properties?: Record<string, SchemaProperty>
  required?: string[]
}

export interface DocumentSchema {
  type: string
  required: string[]
  properties: Record<string, SchemaProperty>
}

export interface SchemaValidationResult {
  isValid: boolean
  missingRequired: string[]
  invalidFields: string[]
  score: number // 0-100
}

export interface DocumentTypeInfo {
  name: string
  displayName: string
  description?: string
  schema: DocumentSchema
  icon?: string
  color?: string
  targetTable?: string
}