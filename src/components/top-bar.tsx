'use client'

import { Search, Filter, Moon, Sun, Command, Shield } from 'lucide-react'
import { FilterState } from '@/types/document'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Kbd } from '@/components/ui/kbd'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface TopBarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  isDarkMode: boolean
  onDarkModeToggle: (isDark: boolean) => void
  onCommandBarOpen: () => void
}

export function TopBar({ 
  filters, 
  onFiltersChange, 
  isDarkMode, 
  onDarkModeToggle,
  onCommandBarOpen 
}: TopBarProps) {
  const hasActiveFilters = Object.values(filters).some(v => 
    Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v
  )

  return (
    <TooltipProvider>
      <header 
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        role="banner"
        aria-label="Main navigation"
      >
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-3" role="img" aria-label="Smatch logo">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground" aria-hidden="true">S</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none">
                  Smatch
                </span>
                <span className="text-xs text-muted-foreground">
                  OCR Platform
                </span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-1 items-center justify-center px-6" role="search" aria-label="Document search">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-10 pr-20"
                aria-label="Search documents"
                aria-describedby="search-help"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCommandBarOpen}
                      className="h-6 px-2 text-xs text-muted-foreground"
                      aria-label="Press Cmd+K to open command palette"
                    >
                      <Command className="mr-1 h-3 w-3" aria-hidden="true" />
                      <Kbd className="text-xs">⌘K</Kbd>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open command palette</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div id="search-help" className="sr-only">
                Press Cmd+K to open command palette
              </div>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2" role="toolbar" aria-label="Application controls">
            {/* Secure mode indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary"
                  className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  role="status"
                  aria-label="Secure Mode"
                >
                  <Shield className="mr-1 h-3 w-3" aria-hidden="true" />
                  Secure
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Secure mode is active</p>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6" />

            {/* Filter button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "ghost"}
                  size="sm"
                  className="relative"
                  aria-label={hasActiveFilters ? "Filters active" : "Open filters"}
                >
                  <Filter className="h-4 w-4" aria-hidden="true" />
                  {hasActiveFilters && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -right-1 -top-1 h-2 w-2 p-0"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{hasActiveFilters ? "Filters are active" : "Open filters"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Dark mode toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDarkModeToggle(!isDarkMode)}
                  aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDarkMode ? "Switch to light mode" : "Switch to dark mode"}</p>
              </TooltipContent>
            </Tooltip>


          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}