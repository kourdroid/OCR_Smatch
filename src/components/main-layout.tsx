'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'

interface MainLayoutProps {
  children: React.ReactNode
  activeNav?: string
  onNavChange?: (nav: string) => void
}

export function MainLayout({ children, activeNav = 'all_documents', onNavChange }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#161616]">
        <AppSidebar activeNav={activeNav} onNavChange={onNavChange} />

        <SidebarInset className="flex-1 flex flex-col relative bg-white border-l-2 border-black">
          {/* Fixed overlay border frame - seamlessly integrated with sidebar */}
          <div className="pointer-events-none fixed inset-0 border-[15px] border-[#161616] bg-[#161616] z-0"></div>

          <div className="px-4 pt-3 pb-5 md:px-2 md:pr-4 bg-[#161616] flex-1 flex flex-col h-screen overflow-hidden">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden relative z-10 flex-1 flex flex-col">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
