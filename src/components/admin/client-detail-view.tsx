'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Users, FileJson, FileText, Activity, Plus, Trash2, Database, Save, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DocumentsTable } from '@/components/documents-table'
import { groupDocuments } from '@/lib/document-utils'
import { useAuthStore } from '@/stores/auth-store'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Document } from '@/types/document'

interface ClientDetailViewProps {
  organizationId: string
  onBack: () => void
}

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  is_admin: boolean
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

export function ClientDetailView({ organizationId, onBack }: ClientDetailViewProps) {
  const [organization, setOrganization] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  // Users State
  const [users, setUsers] = useState<Profile[]>([])
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '' })
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  // Schemas State
  const [schemas, setSchemas] = useState<DocumentType[]>([])
  const [schemaView, setSchemaView] = useState<'list' | 'create'>('list')
  const [newSchemaName, setNewSchemaName] = useState('')
  const [newSchemaDesc, setNewSchemaDesc] = useState('')
  const [targetTable, setTargetTable] = useState('')
  const [jsonSchema, setJsonSchema] = useState('')
  const [isCreatingSchema, setIsCreatingSchema] = useState(false)

  const handleCreateSchema = async () => {
    try {
      if (!jsonSchema) return

      setIsCreatingSchema(true)

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

      let parsedSchema
      try {
        parsedSchema = JSON.parse(jsonSchema)
      } catch (e) {
        toast.error('Invalid JSON Schema')
        return
      }

      const response = await fetch('/api/admin/create-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send token manually
        },
        body: JSON.stringify({
          name: newSchemaName || parsedSchema.title || 'New Schema',
          description: newSchemaDesc || parsedSchema.description || '',
          color: '#000000',
          icon: 'FileText',
          targetTable: targetTable || (parsedSchema.title || 'new_table').toLowerCase().replace(/\s+/g, '_'),
          schema: parsedSchema,
          organizationId: organizationId // Use the prop
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create schema')
      }

      toast.success('Schema created successfully')
      setSchemaView('list')
      setNewSchemaName('')
      setNewSchemaDesc('')
      setTargetTable('')
      setJsonSchema('')
      fetchSchemas()
    } catch (error: any) {
      console.error('Error creating schema:', error)
      toast.error(error.message)
    } finally {
      setIsCreatingSchema(false)
    }
  }

  // Documents State
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)

  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!supabase) return
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      setOrganization(data)
      setIsLoading(false)
    }
    fetchOrgDetails()
  }, [organizationId])

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'schemas') {
      fetchSchemas()
    } else if (activeTab === 'documents') {
      fetchDocuments()
    }
  }, [activeTab, organizationId])

  const fetchUsers = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    setUsers(data || [])
  }

  const fetchSchemas = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('document_types')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    setSchemas(data || [])
  }

  const fetchDocuments = async () => {
    if (!supabase) return
    setIsLoadingDocuments(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const docs = (data || []).map((row: any) => ({
        id: String(row.id),
        status: row.status,
        type: row.type,
        documentNumber: String(row.document_number || ''),
        amount: Number(row.amount || 0),
        currency: String(row.currency || 'USD'),
        supplier: String(row.supplier || 'Unknown'),
        channel: row.channel,
        senderEmail: String(row.sender_email || ''),
        fileType: row.file_type,
        processingTime: Number(row.processing_time || 0),
        receivedAt: new Date(row.received_at || row.created_at),
        confidence: Number(row.confidence || 0.9),
        payload: row.payload || {},
        thumbnails: row.thumbnails || [],
        auditTimeline: row.document_events || [],
        downloadUrl: row.download_url
      })) as Document[]

      setDocuments(docs)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  const documentRows = useMemo(() => groupDocuments(documents), [documents])

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email and password are required')
      return
    }

    try {
      setIsCreatingUser(true)
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          organizationId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      toast.success('User created successfully')
      setIsAddUserOpen(false)
      setNewUser({ email: '', password: '', fullName: '' })
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message)
    } finally {
      setIsCreatingUser(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading client details...</div>
  }

  if (!organization) {
    return <div className="p-8 text-center">Organization not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{organization.company_name}</h1>
          <p className="text-muted-foreground text-sm">Client Management Console</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="schemas">Schemas</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                  <div className="text-lg">{organization.company_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created At</div>
                  <div className="text-lg">{new Date(organization.created_at).toLocaleDateString()}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm font-medium text-muted-foreground">Webhook URL</div>
                  <div className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all">
                    {organization.n8n_webhook_url || 'Not Configured'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage users for this organization.</CardDescription>
              </div>
              <Button onClick={() => setIsAddUserOpen(true)} className="bg-black text-white hover:bg-zinc-800">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Badge variant="secondary">Admin</Badge>
                          ) : (
                            <Badge variant="outline">Member</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schemas" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Document Schemas</CardTitle>
                  <CardDescription>Manage extraction schemas for this client.</CardDescription>
                </div>
                {schemaView === 'list' && (
                  <Button onClick={() => setSchemaView('create')} className="bg-black text-white hover:bg-zinc-800">
                    <Plus className="h-4 w-4 mr-2" />
                    New Schema
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {schemaView === 'list' ? (
                <div className="space-y-4">
                  {schemas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No schemas defined for this organization.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {schemas.map((schema) => (
                        <div key={schema.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{schema.name}</div>
                            <div className="text-sm text-muted-foreground">{schema.description}</div>
                          </div>
                          <Badge variant="outline" className="font-mono">
                            {schema.target_table}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setSchemaView('list')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to List
                    </Button>
                  </div>

                  <div className="grid gap-4 max-w-2xl">
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
                        placeholder="Brief description"
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

                    <Button
                      onClick={handleCreateSchema}
                      disabled={isCreatingSchema}
                      className="bg-black text-white hover:bg-zinc-800"
                    >
                      {isCreatingSchema ? (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Recent documents for this client.</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentsTable
                documentRows={documentRows}
                isLoading={isLoadingDocuments}
                onDocumentSelect={() => { }}
                selectedDocument={null}
                isAdmin={true}
                onOrganizationClick={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new user for this organization.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreatingUser}
              className="bg-black text-white hover:bg-zinc-800"
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
