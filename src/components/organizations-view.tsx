'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Users, Building, Globe, Settings, MoreHorizontal, FileJson } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { OrganizationSchemasSheet } from './organization-schemas-sheet'

interface Organization {
  id: string
  company_name: string
  n8n_webhook_url: string | null
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  organization_id: string
  is_admin: boolean
  created_at: string
  email: string | null
  full_name: string | null
}

interface OrganizationsViewProps {
  onManage?: (orgId: string) => void
}

export default function OrganizationsView({ onManage }: OrganizationsViewProps) {
  const { isAdmin, isLoading: authLoading } = useAuthStore()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  // Schema Sheet state
  const [isSchemasSheetOpen, setIsSchemasSheetOpen] = useState(false)
  const [selectedOrgForSchemas, setSelectedOrgForSchemas] = useState<Organization | null>(null)

  const [newOrg, setNewOrg] = useState({
    company_name: '',
    n8n_webhook_url: ''
  })

  const [editOrg, setEditOrg] = useState({
    company_name: '',
    n8n_webhook_url: ''
  })

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchData()
    }
  }, [isAdmin, authLoading])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (!isSupabaseAvailable() || !supabase) {
        setOrganizations([])
        setProfiles([])
        setLoading(false)
        return
      }

      console.log('Fetching organizations...')
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('company_name')

      if (orgsError) throw orgsError

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at')

      if (profilesError) throw profilesError

      setOrganizations(orgsData || [])
      setProfiles(profilesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch organizations: ' + (error as any).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async () => {
    try {
      if (!isSupabaseAvailable() || !supabase) {
        toast.error('Supabase not configured')
        return
      }

      const { error } = await supabase
        .from('organizations')
        .insert({
          company_name: newOrg.company_name,
          n8n_webhook_url: newOrg.n8n_webhook_url || null
        })

      if (error) throw error

      toast.success('Organization created successfully')
      setIsCreateModalOpen(false)
      setNewOrg({ company_name: '', n8n_webhook_url: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization')
    }
  }

  const handleEditOrganization = async () => {
    try {
      if (!isSupabaseAvailable() || !supabase || !selectedOrg) {
        toast.error('Supabase not configured')
        return
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          company_name: editOrg.company_name,
          n8n_webhook_url: editOrg.n8n_webhook_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrg.id)

      if (error) throw error

      toast.success('Organization updated successfully')
      setIsEditModalOpen(false)
      setSelectedOrg(null)
      fetchData()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.error('Failed to update organization')
    }
  }

  const openEditModal = (org: Organization) => {
    setSelectedOrg(org)
    setEditOrg({
      company_name: org.company_name,
      n8n_webhook_url: org.n8n_webhook_url || ''
    })
    setIsEditModalOpen(true)
  }

  const openSchemasSheet = (org: Organization) => {
    setSelectedOrgForSchemas(org)
    setIsSchemasSheetOpen(true)
  }

  const getProfilesForOrganization = (orgId: string) => {
    return profiles.filter(profile => profile.organization_id === orgId)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. Only administrators can manage organizations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage organizations, members, and document schemas
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-black text-white hover:bg-zinc-800">
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="rounded-xl border">
            <Table>
              <TableHeader className="bg-[#FAFAFA] rounded-t-xl">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[#7D7D7D] font-semibold pl-[26px]">Company Name</TableHead>
                  <TableHead className="text-[#7D7D7D] font-semibold">Members</TableHead>
                  <TableHead className="text-[#7D7D7D] font-semibold">Webhook Status</TableHead>
                  <TableHead className="text-[#7D7D7D] font-semibold">Created At</TableHead>
                  <TableHead className="text-[#7D7D7D] font-semibold w-[100px] text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const orgProfiles = getProfilesForOrganization(org.id)
                  const memberCount = orgProfiles.length

                  return (
                    <TableRow key={org.id} className="border-b border-[#EDEDED]">
                      <TableCell className="pl-[26px] font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                            <Building className="h-4 w-4" />
                          </div>
                          {org.company_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.n8n_webhook_url ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not Configured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onManage?.(org.id)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Manage Client
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(org)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSchemasSheet(org)}>
                              <FileJson className="mr-2 h-4 w-4" />
                              Manage Schemas
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Delete Organization
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Organization Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org_name">Company Name</Label>
              <Input
                id="org_name"
                value={newOrg.company_name}
                onChange={(e) => setNewOrg({ ...newOrg, company_name: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="org_webhook">N8N Webhook URL</Label>
              <Input
                id="org_webhook"
                value={newOrg.n8n_webhook_url}
                onChange={(e) => setNewOrg({ ...newOrg, n8n_webhook_url: e.target.value })}
                placeholder="https://n8n.example.com/webhook/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrganization}>Create Organization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_name">Company Name</Label>
              <Input
                id="edit_name"
                value={editOrg.company_name}
                onChange={(e) => setEditOrg({ ...editOrg, company_name: e.target.value })}
                placeholder="Acme Corporation"
              />
            </div>
            <div>
              <Label htmlFor="edit_webhook">N8N Webhook URL</Label>
              <Input
                id="edit_webhook"
                value={editOrg.n8n_webhook_url}
                onChange={(e) => setEditOrg({ ...editOrg, n8n_webhook_url: e.target.value })}
                placeholder="https://n8n.example.com/webhook/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditOrganization}>Update Organization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Schemas Sheet */}
      <OrganizationSchemasSheet
        isOpen={isSchemasSheetOpen}
        onClose={() => setIsSchemasSheetOpen(false)}
        organizationId={selectedOrgForSchemas?.id || null}
        organizationName={selectedOrgForSchemas?.company_name || ''}
      />
    </div>
  )
}
