'use client'

import { Search, Filter, Download } from 'lucide-react'
import { FilterState } from '@/types/document'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  title?: string
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onCommandBarOpen: () => void
  onFiltersToggle?: () => void
  onExport?: (format: 'csv' | 'json') => void
  showSearch?: boolean
  showExport?: boolean
  showTimePreset?: boolean
  timePreset?: 'last24h' | '7d' | '30d' | '90d'
  onTimePresetChange?: (preset: 'last24h' | '7d' | '30d' | '90d') => void
}

export function TopBar({
  title,
  filters,
  onFiltersChange,
  onCommandBarOpen,
  onFiltersToggle,
  onExport,
  showSearch = true,
  showExport = true,
  showTimePreset = false,
  timePreset,
  onTimePresetChange,
}: TopBarProps) {
  const hasActiveFilters = Object.values(filters).some((v) =>
    Array.isArray(v)
      ? v.length > 0
      : v && typeof v === 'object'
      ? Object.keys(v).length > 0
      : !!v
  )

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Title */}
        <div className="flex items-center gap-3">
          {title && (
            <h1 className="text-2xl font-bold">{title}</h1>
          )}
        </div>

        {/* Search */}
        {showSearch && (
          <div className="ml-auto w-[640px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-10 pr-20 rounded-lg h-[52px]"
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
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 ml-4">
          {onFiltersToggle && (
            <Button
              onClick={onFiltersToggle}
              className="rounded-lg bg-black text-white hover:bg-zinc-800 h-[52px] px-4"
              aria-label={hasActiveFilters ? 'Filters active' : 'Toggle filters'}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          )}
          {showExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-lg h-[52px] px-4" aria-label="Export documents">
                  <Download className="mr-2 h-4 w-4" />
                  Export as
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport?.('csv')}>CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('json')}>JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showTimePreset && (
            <div className="flex items-center bg-white border border-[#D3D3D3] rounded-lg px-2 py-2 shadow-sm h-[52px]">
              {(
                [
                  { key: 'last24h', label: 'Last 24h' },
                  { key: '7d', label: '7 Days' },
                  { key: '30d', label: '30 Days' },
                  { key: '90d', label: '90 Days' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onTimePresetChange?.(opt.key)}
                  className={
                    `mx-0.5 h-[36px] px-3 rounded-lg text-sm font-medium transition-colors ` +
                    (timePreset === opt.key
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-800 hover:bg-gray-100')
                  }
                  aria-pressed={timePreset === opt.key}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
