'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Trash2, FileJson, Database, ArrowLeft, Loader2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OrganizationSchemasSheetProps {
  organizationId: string | null
  organizationName: string
  isOpen: boolean
  onClose: () => void
}

interface DocumentType {
  id: string
  name: string
  description: string | null
  created_at: string
  target_table: string | null
}

interface SchemaField {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required: boolean
}

export function OrganizationSchemasSheet({
  organizationId,
  organizationName,
  isOpen,
  onClose
}: OrganizationSchemasSheetProps) {
  const [schemas, setSchemas] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'list' | 'create'>('list')

  // Form state
  const [newSchemaName, setNewSchemaName] = useState('')
  const [newSchemaDesc, setNewSchemaDesc] = useState('')
  const [targetTable, setTargetTable] = useState('')
  const [jsonSchema, setJsonSchema] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchSchemas()
      setView('list')
      resetForm()
    }
  }, [isOpen, organizationId])

  const fetchSchemas = async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      if (!supabase) {
        toast.error('Supabase client not available')
        return
      }

      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchemas(data || [])
    } catch (error) {
      console.error('Error fetching schemas:', error)
      toast.error('Failed to load schemas')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewSchemaName('')
    setNewSchemaDesc('')
    setTargetTable('')
    setJsonSchema('')
  }

  const handleCreateSchema = async () => {
    if (!newSchemaName || !targetTable || !jsonSchema) {
      toast.error('Name, Target Table, and Schema are required')
      return
    }

    let parsedSchema;
    try {
      parsedSchema = JSON.parse(jsonSchema);
    } catch (e) {
      toast.error('Invalid JSON Schema');
      return;
    }

    try {
      setIsSubmitting(true)

      // Get session token for robust auth
      if (!supabase) {
        toast.error('Supabase client not initialized')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('You are not logged in!')
        return
      }

      const response = await fetch('/api/admin/create-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send token manually
        },
        body: JSON.stringify({
          name: newSchemaName,
          description: newSchemaDesc,
          targetTable: targetTable,
          organizationId: organizationId,
          schema: parsedSchema,
          color: 'bg-slate-100 text-slate-800', // Default
          icon: 'FileText' // Default
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create schema')
      }

      toast.success('Schema created successfully')
      fetchSchemas()
      setView('list')
      resetForm()
    } catch (error: any) {
      console.error('Error creating schema:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[500px] sm:w-[600px] flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Manage Schemas</SheetTitle>
          <SheetDescription>
            {organizationName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {view === 'list' ? (
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Document Types</h3>
                <Button onClick={() => setView('create')} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Schema
                </Button>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : schemas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                    <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No schemas defined for this organization.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-6">
                    {schemas.map((schema) => (
                      <Card key={schema.id}>
                        <CardHeader className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{schema.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {schema.description || 'No description'}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs">
                              {schema.target_table || 'No table'}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" onClick={() => setView('list')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-medium">Create New Schema</h3>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-6 pb-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Schema Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Invoice, Purchase Order"
                        value={newSchemaName}
                        onChange={(e) => setNewSchemaName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Brief description of this document type"
                        value={newSchemaDesc}
                        onChange={(e) => setNewSchemaDesc(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="table">Target Table Name</Label>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="table"
                          placeholder="e.g., org_invoices"
                          value={targetTable}
                          onChange={(e) => setTargetTable(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A dedicated table will be created to store data for this document type.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="jsonSchema">JSON Schema</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setJsonSchema(JSON.stringify({
                            type: "object",
                            required: ["invoice_number", "date", "total"],
                            properties: {
                              invoice_number: { type: "string" },
                              date: { type: "string", format: "date" },
                              total: { type: "number" },
                              items: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    description: { type: "string" },
                                    amount: { type: "number" }
                                  }
                                }
                              }
                            }
                          }, null, 2))
                        }}
                      >
                        Load Template
                      </Button>
                    </div>
                    <div className="relative">
                      <textarea
                        id="jsonSchema"
                        value={jsonSchema}
                        onChange={(e) => setJsonSchema(e.target.value)}
                        className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        placeholder='{ "type": "object", "properties": { ... } }'
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Define the extraction schema using JSON Schema format.
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="pt-6 mt-auto border-t">
                <Button
                  className="w-full"
                  onClick={handleCreateSchema}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Schema
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent >
    </Sheet >
  )
}
