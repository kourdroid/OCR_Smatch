'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'
import { User, Settings, UploadCloud, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AppSidebarProps {
  activeNav?: string
  onNavChange?: (nav: string) => void
}

export function AppSidebar({ activeNav = 'all_documents', onNavChange }: AppSidebarProps) {
  const router = useRouter()
  const { profile, isAdmin } = useAuthStore()

  const handleNavClick = (nav: string) => {
    if (onNavChange) {
      onNavChange(nav)
    } else {
      // Default behavior: navigate to home (dashboard)
      // We could add query params here if we supported deep linking to tabs
      router.push('/')
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-[#161616] text-white" variant="sidebar">
      <SidebarHeader className="h-[80px] flex items-center justify-center bg-[#161616]">
        <div className="flex items-center gap-3 w-full px-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-black font-bold text-xl shrink-0">
            @
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-[18px] font-bold text-white leading-none">Smatch</span>
            <span className="text-[12px] text-zinc-500 font-medium mt-1">Admin Organization</span>
          </div>
          <div className="ml-auto text-zinc-600 group-data-[collapsible=icon]:hidden">
            «
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#161616] px-[12px]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-[8px]">
              <SidebarMenuItem className="w-[236px] h-[52px] group-data-[collapsible=icon]:w-auto">
                <SidebarMenuButton
                  size="lg"
                  onClick={() => handleNavClick('dashboard')}
                  isActive={activeNav === 'dashboard'}
                  className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                >
                  <div className="flex items-center h-[36px] gap-[10px] w-full">
                    {activeNav === 'dashboard' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
                        <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                        <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                        <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                        <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                        <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                        <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                        <rect width="7" height="5" x="3" y="16" rx="1"></rect>
                      </svg>
                    )}
                    <span className="text-[15px] whitespace-nowrap truncate group-data-[collapsible=icon]:hidden text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">Dashboard</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {!isAdmin && (
                <>
                  <SidebarMenuItem className="w-[236px] h-[52px] group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mt-[41px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => handleNavClick('all_documents')}
                      isActive={activeNav === 'all_documents'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center data-[active=true]:group-data-[collapsible=icon]:w-[68px] data-[active=true]:group-data-[collapsible=icon]:h-[69px] data-[active=true]:group-data-[collapsible=icon]:rounded-[10px]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'all_documents' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
                            <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                            <path d="M14 2v6h6"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                            <path d="M10 9H8"></path>
                            <path d="M16 13H8"></path>
                            <path d="M16 17H8"></path>
                          </svg>
                        )}
                        <span className="text-[15px] whitespace-nowrap truncate group-data-[collapsible=icon]:hidden text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">All Documents</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem className="w-[236px] h-[52px] group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:mt-[37px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => handleNavClick('document_types')}
                      isActive={activeNav === 'document_types'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A] group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'document_types' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
                            <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                            <path d="M14 2v6h6"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                          </svg>
                        )}
                        <span className="text-[15px] whitespace-nowrap truncate group-data-[collapsible=icon]:hidden text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">Document Types</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem className="w-[236px] h-[52px] group-data-[collapsible=icon]:mt-[58px]">
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => handleNavClick('analytics')}
                      isActive={activeNav === 'analytics'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        {activeNav === 'analytics' ? (
                          <div className="flex items-start justify-between w-[22px] h-[22px]">
                            <div className="mt-[8px] w-[5px] h-[14px] bg-[var(--primary)]"></div>
                            <div className="w-[5px] h-[22px] bg-[var(--primary)]"></div>
                            <div className="mt-[14px] w-[5px] h-[8px] bg-[var(--primary)]"></div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between w-[22px] h-[22px]">
                            <div className="mt-[8px] w-[5px] h-[14px] border-2 border-white"></div>
                            <div className="w-[5px] h-[22px] border-2 border-white"></div>
                            <div className="mt-[14px] w-[5px] h-[8px] border-2 border-white"></div>
                          </div>
                        )}
                        <span className="text-[15px] whitespace-nowrap truncate text-[#D3D3D3] font-normal peer-data-[active=true]/menu-button:text-[var(--primary)] peer-data-[active=true]/menu-button:font-medium">Analytics</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {isAdmin && (
                <>
                  <SidebarMenuItem className="w-[236px] h-[52px]">
                    <SidebarMenuButton
                      onClick={() => handleNavClick('organizations')}
                      isActive={activeNav === 'organizations'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        <User className="h-5 w-5" />
                        <span className="text-[15px] font-medium whitespace-nowrap truncate">Organizations</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem className="w-[236px] h-[52px]">
                    <SidebarMenuButton
                      onClick={() => handleNavClick('global_search')}
                      isActive={activeNav === 'global_search'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        <span className="text-[15px] font-medium whitespace-nowrap truncate">Global Search</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem className="w-[236px] h-[52px]">
                    <SidebarMenuButton
                      onClick={() => handleNavClick('logs')}
                      isActive={activeNav === 'logs'}
                      className="group text-white hover:bg-[#2A2A2A] hover:text-white transition-colors w-[236px] h-[52px] rounded-[10px] px-[18px] data-[active=true]:bg-[#222] data-[active=true]:text-[var(--primary)] data-[active=true]:before:hidden data-[state=open]:hover:bg-[#2A2A2A]"
                    >
                      <div className="flex items-center h-[36px] gap-[10px] w-full">
                        <Settings className="h-5 w-5" />
                        <span className="text-[15px] font-medium whitespace-nowrap truncate">System Logs</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[#161616] text-white border-t border-[#161616] p-[28px_24px_31px_25px]">
        <div className="w-[236px] h-[82px] rounded-[10px] bg-[#222222] px-[14px] pr-[60px] py-[12px] flex items-center gap-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-auto">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[8px] bg-yellow-400 text-black font-semibold shrink-0">
            {profile?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-[20px] leading-[24px] truncate">{profile?.email?.split('@')[0] || 'Mehdi K.'}</span>
            <button
              onClick={async () => {
                await supabase?.auth.signOut()
                router.push('/login')
              }}
              className="mt-2 text-xs text-zinc-400 hover:text-white transition-colors text-left"
            >
              Log out
            </button>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
