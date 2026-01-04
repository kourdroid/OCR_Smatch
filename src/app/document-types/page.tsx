'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Settings, Code } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentCategory {
  id: string
  name: string
  display_name: string
  description: string | null
  icon: string
  color: string
  target_table: string | null
  expected_schema_json: any
  organization_id: string | null
  created_at: string
}

interface ExtractionSchema {
  id: string
  schema_name: string
  target_table: string
  expected_schema_json: any
  is_active: boolean
  created_at: string
  category_id: string
}

export default function DocumentTypesPage() {
  const { profile, organization, isAdmin } = useAuthStore()
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [schemas, setSchemas] = useState<ExtractionSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: '📄',
    color: '#3B82F6',
    target_table: '',
    expected_schema_json: ''
  })
  const [newSchema, setNewSchema] = useState({
    schema_name: '',
    target_table: '',
    expected_schema_json: '',
    category_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!isSupabaseAvailable() || !supabase) {
        setCategories([])
        setSchemas([])
        setLoading(false)
        return
      }
      
      // Fetch document types
      let categoriesQuery = supabase
        .from('document_types')
        .select('*')
        .order('name')

      // If not admin, only show organization's categories
      if (!isAdmin && organization?.id) {
        categoriesQuery = categoriesQuery.eq('organization_id', organization.id)
      }

      const { data: categoriesData, error: categoriesError } = await categoriesQuery

      if (categoriesError) throw categoriesError

      // Fetch extraction schemas
      let schemasQuery = supabase
        .from('extraction_schemas')
        .select('*')
        .order('schema_name')

      // If not admin, only show organization's schemas
      if (!isAdmin && organization?.id) {
        schemasQuery = schemasQuery.eq('organization_id', organization.id)
      }

      const { data: schemasData, error: schemasError } = await schemasQuery

      if (schemasError) throw schemasError

      setCategories(categoriesData || [])
      setSchemas(schemasData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch document types')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      if (!isSupabaseAvailable() || !supabase) {
        toast.error('Supabase not configured')
        return
      }
      const expectedSchema = newCategory.expected_schema_json ? JSON.parse(newCategory.expected_schema_json) : null
      
      const { error } = await supabase
        .from('document_types')
        .insert({
          name: newCategory.name,
          display_name: newCategory.display_name,
          description: newCategory.description,
          icon: newCategory.icon,
          color: newCategory.color,
          target_table: newCategory.target_table || null,
          expected_schema_json: expectedSchema,
          organization_id: organization?.id || null
        })

      if (error) throw error

      toast.success('Document category created successfully')
      setIsCreateModalOpen(false)
      setNewCategory({
        name: '',
        display_name: '',
        description: '',
        icon: '📄',
        color: '#3B82F6',
        target_table: '',
        expected_schema_json: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create document category')
    }
  }

  const handleCreateSchema = async () => {
    try {
      if (!isSupabaseAvailable() || !supabase) {
        toast.error('Supabase not configured')
        return
      }
      const expectedSchema = newSchema.expected_schema_json ? JSON.parse(newSchema.expected_schema_json) : null
      
      const { error } = await supabase
        .from('extraction_schemas')
        .insert({
          schema_name: newSchema.schema_name,
          target_table: newSchema.target_table,
          expected_schema_json: expectedSchema,
          category_id: newSchema.category_id,
          organization_id: organization?.id || null,
          is_active: true
        })

      if (error) throw error

      toast.success('Extraction schema created successfully')
      setIsSchemaModalOpen(false)
      setNewSchema({
        schema_name: '',
        target_table: '',
        expected_schema_json: '',
        category_id: ''
      })
      fetchData()
    } catch (error) {
      console.error('Error creating schema:', error)
      toast.error('Failed to create extraction schema')
    }
  }

  const getSchemasForCategory = (categoryId: string) => {
    return schemas.filter(schema => schema.category_id === categoryId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Types</h1>
          <p className="text-muted-foreground">
            Manage document categories and extraction schemas for your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsSchemaModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schema
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => {
          const categorySchemas = getSchemasForCategory(category.id)
          
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle>{category.display_name || category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{categorySchemas.length} schemas</Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.target_table && (
                  <div className="mb-4">
                    <Label>Target Table</Label>
                    <p className="text-sm text-muted-foreground">{category.target_table}</p>
                  </div>
                )}
                
                {category.expected_schema_json && (
                  <div className="mb-4">
                    <Label>Expected Schema</Label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(category.expected_schema_json, null, 2)}
                    </pre>
                  </div>
                )}

                {categorySchemas.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Extraction Schemas</Label>
                    <div className="space-y-2">
                      {categorySchemas.map((schema) => (
                        <Card key={schema.id} className="bg-muted/50">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{schema.schema_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Table: {schema.target_table}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={schema.is_active ? "default" : "secondary"}>
                                  {schema.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {schema.expected_schema_json && (
                              <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
                                {JSON.stringify(schema.expected_schema_json, null, 2)}
                              </pre>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Category Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Document Category</DialogTitle>
            <DialogDescription>
              Add a new document category with its extraction schema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="invoice"
                />
              </div>
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={newCategory.display_name}
                  onChange={(e) => setNewCategory({ ...newCategory, display_name: e.target.value })}
                  placeholder="Invoice"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Document category description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="📄"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="target_table">Target Table (Optional)</Label>
              <Input
                id="target_table"
                value={newCategory.target_table}
                onChange={(e) => setNewCategory({ ...newCategory, target_table: e.target.value })}
                placeholder="facture"
              />
            </div>
            <div>
              <Label htmlFor="expected_schema_json">Expected Schema JSON (Optional)</Label>
              <Textarea
                id="expected_schema_json"
                value={newCategory.expected_schema_json}
                onChange={(e) => setNewCategory({ ...newCategory, expected_schema_json: e.target.value })}
                placeholder='{"fields": [{"name": "invoice_number", "type": "string"}]}'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schema Modal */}
      <Dialog open={isSchemaModalOpen} onOpenChange={setIsSchemaModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Extraction Schema</DialogTitle>
            <DialogDescription>
              Add a new extraction schema for document processing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schema_category">Document Category</Label>
              <select
                id="schema_category"
                className="w-full p-2 border rounded-md"
                value={newSchema.category_id}
                onChange={(e) => setNewSchema({ ...newSchema, category_id: e.target.value })}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.display_name || category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="schema_name">Schema Name</Label>
              <Input
                id="schema_name"
                value={newSchema.schema_name}
                onChange={(e) => setNewSchema({ ...newSchema, schema_name: e.target.value })}
                placeholder="Standard Invoice Schema"
              />
            </div>
            <div>
              <Label htmlFor="schema_target_table">Target Table</Label>
              <Input
                id="schema_target_table"
                value={newSchema.target_table}
                onChange={(e) => setNewSchema({ ...newSchema, target_table: e.target.value })}
                placeholder="facture"
              />
            </div>
            <div>
              <Label htmlFor="schema_expected_schema_json">Expected Schema JSON</Label>
              <Textarea
                id="schema_expected_schema_json"
                value={newSchema.expected_schema_json}
                onChange={(e) => setNewSchema({ ...newSchema, expected_schema_json: e.target.value })}
                placeholder='{"fields": [{"name": "invoice_number", "type": "string", "required": true}]}'
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSchemaModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchema}>Create Schema</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
