"use client"

import React from "react"
import { FilterState } from "@/types/document"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  FileText,
  DollarSign,
  Building2,
  Hash,
  Truck,
  File as FileIcon,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function DashboardFilters({
  filters,
  onFiltersChange,
}: {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
}) {
  const setAmountText = (value: string) => {
    const parts = value.split(/-|to|–|—/i).map((p) => p.trim())
    const min = parts[0] ? Number(parts[0].replace(/[^0-9.]/g, "")) : undefined
    const max = parts[1] ? Number(parts[1].replace(/[^0-9.]/g, "")) : undefined
    onFiltersChange({
      ...filters,
      amountRange: {
        min: isFinite(min as number) ? (min as number) : undefined,
        max: isFinite(max as number) ? (max as number) : undefined,
      },
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-x-3 gap-y-4">
      {/* Date */}
      <div className="md:col-span-1">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={filters.dateRange.from ? new Date(filters.dateRange.from).toISOString().slice(0, 10) : ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, from: e.target.value ? new Date(e.target.value) : undefined },
              })
            }
            className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* Document Type */}
      <div className="md:col-span-1">
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            value={(filters.types && filters.types[0]) || ""}
            onValueChange={(val) => onFiltersChange({ ...filters, types: val ? [val] : [] })}
          >
          <SelectTrigger className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white">
            <SelectValue placeholder="Document Type" />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="BL">BL</SelectItem>
              <SelectItem value="BC">BC</SelectItem>
              <SelectItem value="CO">CO</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount range */}
      <div className="md:col-span-1">
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="e.g 100 - 300"
            defaultValue=""
            onBlur={(e) => setAmountText(e.target.value)}
            className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* Supplier */}
      <div className="md:col-span-1">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Supplier"
            value={filters.supplier || ""}
            onChange={(e) => onFiltersChange({ ...filters, supplier: e.target.value })}
            className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* Channel free text */}
      <div className="md:col-span-1">
        <div className="relative">
          <Input
            placeholder="e.g Gmail, Whatsapp"
            value={filters.channelQuery || ""}
            onChange={(e) => onFiltersChange({ ...filters, channelQuery: e.target.value })}
            className="pl-4 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* Amount range #2 (optional, keeping design symmetry) */}
      <div className="md:col-span-1">
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="e.g 1500 - 180,000"
            defaultValue=""
            onBlur={(e) => setAmountText(e.target.value)}
            className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* Document ID */}
      <div className="md:col-span-1">
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Document ID"
            value={filters.documentId || ""}
            onChange={(e) => onFiltersChange({ ...filters, documentId: e.target.value })}
            className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* Shipper */}
      <div className="md:col-span-1">
        <div className="relative">
          <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Shipper"
            value={filters.shipper || ""}
            onChange={(e) => onFiltersChange({ ...filters, shipper: e.target.value })}
            className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white"
          />
        </div>
      </div>

      {/* File Type */}
      <div className="md:col-span-1">
        <div className="relative">
          <FileIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Select
            value={filters.fileType || ""}
            onValueChange={(val) => onFiltersChange({ ...filters, fileType: val })}
          >
          <SelectTrigger className="pl-10 rounded-lg h-[52px] border border-[#D3D3D3] bg-white">
            <SelectValue placeholder="File" />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="xlsx">XLSX</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Apply button */}
      <div className="md:col-span-1 flex items-center">
        <Button className="w-full bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg h-[52px]">Apply</Button>
      </div>
    </div>
  )
}

export default DashboardFilters
