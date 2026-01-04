"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth-store"
import { toast } from "sonner"

export default function SettingsPage() {
  const { profile, organization, updateOrganizationName } = useAuthStore()
  const [orgName, setOrgName] = useState(organization?.company_name || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name cannot be empty")
      return
    }

    if (orgName === organization?.company_name) {
      toast.info("No changes to save")
      return
    }

    setIsLoading(true)
    const success = await updateOrganizationName(orgName.trim())
    
    if (success) {
      toast.success("Organization name updated successfully")
    } else {
      toast.error("Failed to update organization name")
    }
    
    setIsLoading(false)
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <p className="text-center text-zinc-600">Please sign in to access settings</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-zinc-600">Manage your organization</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="h-[48px] rounded-lg bg-zinc-50"
            />
          </div>

          <div>
            <Label htmlFor="organization">Organization Name</Label>
            <Input
              id="organization"
              type="text"
              placeholder="Enter your organization name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="h-[48px] rounded-lg"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleUpdateOrganization} 
              className="h-[48px] px-4 rounded-lg bg-black text-white hover:bg-zinc-800" 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-zinc-600">
              Current organization: <span className="font-medium">{organization?.company_name || "Not set"}</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}