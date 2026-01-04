import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  organization_id: string
  organization_name?: string
  is_admin: boolean
  email: string
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  company_name: string
  n8n_webhook_url?: string
  created_at: string
  updated_at: string
}

interface AuthStore {
  profile: UserProfile | null
  organization: Organization | null
  isLoading: boolean
  isAdmin: boolean

  // Actions
  fetchProfile: () => Promise<void>
  fetchOrganization: () => Promise<void>
  ensureProfile: () => Promise<void>
  signOut: () => Promise<void>
  clearAuth: () => void
  updateOrganizationName: (name: string) => Promise<boolean>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  profile: null,
  organization: null,
  isLoading: true,
  isAdmin: false,

  fetchProfile: async () => {
    try {
      if (!supabase) {
        set({ profile: null, isAdmin: false, isLoading: false })
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ profile: null, isAdmin: false, isLoading: false })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        set({
          profile: profile as UserProfile,
          isAdmin: profile.is_admin,
          isLoading: false
        })

        // Fetch organization if profile exists
        await get().fetchOrganization()
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      set({ isLoading: false })
    }
  },

  fetchOrganization: async () => {
    const { profile } = get()
    if (!profile?.organization_id || !supabase) return

    try {
      const { data: organization } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (organization) {
        set({ organization: organization as Organization })
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  },

  updateOrganizationName: async (name: string) => {
    if (!supabase) return false

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Call the function to update organization name
      const { data, error } = await supabase
        .rpc('update_organization_name', {
          user_id: user.id,
          new_name: name
        })

      if (error) {
        console.error('Error updating organization name:', error)
        return false
      }

      // Refetch profile and organization to update local state
      await get().fetchProfile()
      return true
    } catch (error) {
      console.error('Error updating organization name:', error)
      return false
    }
  },

  ensureProfile: async () => {
    try {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (existing) return

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const organizationId = org?.id || null

      await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email || '', organization_id: organizationId, is_admin: false })
    } catch (error) {
      // silent
    }
  },

  signOut: async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    set({ profile: null, organization: null, isAdmin: false })
  },

  clearAuth: () => {
    set({ profile: null, organization: null, isAdmin: false, isLoading: false })
  }
}))
